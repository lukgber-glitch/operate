# Wise Integration - Code Examples

## TypeScript Usage Examples

### 1. Inject Services

```typescript
import { Injectable } from '@nestjs/common';
import {
  WiseService,
  WiseTransferService,
  WiseBalanceService,
} from './modules/integrations/wise';

@Injectable()
export class PaymentService {
  constructor(
    private readonly wiseService: WiseService,
    private readonly wiseTransferService: WiseTransferService,
    private readonly wiseBalanceService: WiseBalanceService,
  ) {}
}
```

---

## Transfer Examples

### Example 1: Pay International Supplier

```typescript
async paySupplier(
  supplierId: string,
  amount: number,
  currency: string,
  invoiceNumber: string,
) {
  try {
    // 1. Get supplier's Wise recipient ID
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      include: { wiseRecipient: true },
    });

    if (!supplier.wiseRecipient) {
      throw new Error('Supplier does not have Wise account configured');
    }

    // 2. Create quote
    const quote = await this.wiseTransferService.createQuote({
      sourceCurrency: 'EUR',
      targetCurrency: currency,
      sourceAmount: amount,
    });

    // 3. Check if we have sufficient balance
    const hasBalance = await this.wiseBalanceService.hasSufficientBalance(
      'EUR',
      amount + quote.fee,
    );

    if (!hasBalance) {
      throw new Error('Insufficient balance');
    }

    // 4. Execute transfer
    const result = await this.wiseTransferService.executeTransfer({
      sourceCurrency: 'EUR',
      targetCurrency: currency,
      sourceAmount: amount,
      targetAccount: supplier.wiseRecipient.recipientId,
      customerTransactionId: `INV-${invoiceNumber}`,
      details: {
        reference: `Invoice ${invoiceNumber}`,
        transferPurpose: 'verification.transfers.purpose.invoice.payment',
        sourceOfFunds: 'verification.source.of.funds.business',
      },
    });

    // 5. Save to database
    await this.prisma.payment.create({
      data: {
        supplierId,
        invoiceNumber,
        amount,
        currency,
        wiseTransferId: result.transfer.id,
        wiseQuoteId: result.quote.id,
        status: 'processing',
        exchangeRate: result.quote.rate,
        fee: result.quote.fee,
      },
    });

    return result;
  } catch (error) {
    this.logger.error(`Failed to pay supplier ${supplierId}`, error);
    throw error;
  }
}
```

### Example 2: Pay Freelancer

```typescript
async payFreelancer(
  freelancerId: string,
  amount: number,
  projectId: string,
) {
  const freelancer = await this.prisma.freelancer.findUnique({
    where: { id: freelancerId },
    include: { wiseRecipient: true },
  });

  if (!freelancer.wiseRecipient) {
    // Create recipient if doesn't exist
    const recipient = await this.wiseTransferService.createRecipient({
      currency: freelancer.currency,
      type: freelancer.accountType, // 'iban', 'aba', etc.
      details: {
        accountHolderName: freelancer.fullName,
        legalType: 'PRIVATE',
        iban: freelancer.iban, // or other account details
      },
    });

    // Save recipient ID
    await this.prisma.freelancer.update({
      where: { id: freelancerId },
      data: {
        wiseRecipient: {
          create: {
            recipientId: recipient.id,
            currency: recipient.currency,
          },
        },
      },
    });

    freelancer.wiseRecipient = { recipientId: recipient.id };
  }

  // Execute payment
  return this.wiseTransferService.executeTransfer({
    sourceCurrency: 'EUR',
    targetCurrency: freelancer.currency,
    sourceAmount: amount,
    targetAccount: freelancer.wiseRecipient.recipientId,
    customerTransactionId: `PROJ-${projectId}`,
    details: {
      reference: `Project ${projectId}`,
      transferPurpose: 'verification.transfers.purpose.salary.payment',
      sourceOfFunds: 'verification.source.of.funds.business',
    },
  });
}
```

### Example 3: Batch Payments

```typescript
async processBatchPayments(payments: PaymentRequest[]) {
  const results = {
    successful: [],
    failed: [],
  };

  for (const payment of payments) {
    try {
      // 1. Create quote
      const quote = await this.wiseTransferService.createQuote({
        sourceCurrency: payment.sourceCurrency,
        targetCurrency: payment.targetCurrency,
        sourceAmount: payment.amount,
      });

      // 2. Create transfer (don't fund yet)
      const transfer = await this.wiseTransferService.createTransfer({
        targetAccount: payment.recipientId,
        quoteUuid: quote.id,
        customerTransactionId: payment.referenceId,
        details: {
          reference: payment.description,
        },
      });

      results.successful.push({
        paymentId: payment.id,
        transferId: transfer.id,
        quoteId: quote.id,
      });
    } catch (error) {
      results.failed.push({
        paymentId: payment.id,
        error: error.message,
      });
    }
  }

  // Fund all successful transfers
  for (const success of results.successful) {
    try {
      await this.wiseTransferService.fundTransfer(success.transferId);
    } catch (error) {
      this.logger.error(`Failed to fund transfer ${success.transferId}`, error);
      // Move to failed
      results.failed.push({
        paymentId: success.paymentId,
        error: error.message,
      });
      results.successful = results.successful.filter(
        (s) => s.paymentId !== success.paymentId,
      );
    }
  }

  return results;
}
```

---

## Balance Examples

### Example 4: Check Balance Before Payment

```typescript
async canMakePayment(amount: number, currency: string): Promise<boolean> {
  try {
    const available = await this.wiseBalanceService.getAvailableBalance(currency);
    return available >= amount;
  } catch (error) {
    this.logger.error(`Failed to check balance for ${currency}`, error);
    return false;
  }
}
```

### Example 5: Get All Balances

```typescript
async getAccountBalances() {
  const balances = await this.wiseBalanceService.getBalances();

  return balances.flatMap((balance) =>
    balance.balances.map((b) => ({
      currency: b.currency,
      amount: b.amount.value,
      reserved: b.reservedAmount.value,
      available: b.amount.value - b.reservedAmount.value,
      bankDetails: b.bankDetails,
    })),
  );
}
```

### Example 6: Convert Currency

```typescript
async hedgeCurrency(
  fromCurrency: string,
  toCurrency: string,
  amount: number,
) {
  try {
    // Check if we have sufficient balance
    const hasBalance = await this.wiseBalanceService.hasSufficientBalance(
      fromCurrency,
      amount,
    );

    if (!hasBalance) {
      throw new Error(`Insufficient ${fromCurrency} balance`);
    }

    // Execute conversion
    const result = await this.wiseBalanceService.convertCurrency(
      fromCurrency,
      toCurrency,
      amount,
    );

    // Log for accounting
    await this.prisma.currencyConversion.create({
      data: {
        fromCurrency,
        toCurrency,
        fromAmount: amount,
        toAmount: result.quote.targetAmount,
        rate: result.quote.rate,
        fee: result.quote.fee,
        wiseConversionId: result.conversion.id,
      },
    });

    return result;
  } catch (error) {
    this.logger.error('Currency conversion failed', error);
    throw error;
  }
}
```

---

## Statement Examples

### Example 7: Download Monthly Statement

```typescript
async downloadMonthlyStatement(currency: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const statement = await this.wiseBalanceService.getStatement(
    currency,
    startDate,
    endDate,
  );

  // Save to database or export
  return {
    currency,
    period: `${year}-${month.toString().padStart(2, '0')}`,
    transactions: statement.transactions.length,
    totalDebits: statement.transactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount.value, 0),
    totalCredits: statement.transactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount.value, 0),
    endingBalance: statement.endOfStatementBalance.value,
  };
}
```

### Example 8: Reconcile Transactions

```typescript
async reconcileTransactions(currency: string, date: Date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const statement = await this.wiseBalanceService.getStatement(
    currency,
    startDate,
    endDate,
  );

  for (const transaction of statement.transactions) {
    // Match to existing records
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        wiseTransferId: parseInt(transaction.referenceNumber),
      },
    });

    if (existingPayment) {
      // Update status
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: 'completed',
          completedAt: new Date(transaction.date),
        },
      });
    } else {
      this.logger.warn(
        `Unmatched Wise transaction: ${transaction.referenceNumber}`,
      );
    }
  }
}
```

---

## Webhook Examples

### Example 9: Handle Transfer State Change

```typescript
// In a service that processes webhooks
async handleTransferCompleted(transferId: number) {
  // Update payment status
  await this.prisma.payment.updateMany({
    where: { wiseTransferId: transferId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });

  // Get payment details
  const payment = await this.prisma.payment.findFirst({
    where: { wiseTransferId: transferId },
    include: { supplier: true, invoice: true },
  });

  if (payment) {
    // Mark invoice as paid
    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Send notification
    await this.notificationService.sendEmail({
      to: payment.supplier.email,
      subject: `Payment Received - Invoice ${payment.invoiceNumber}`,
      template: 'payment-confirmation',
      data: {
        amount: payment.amount,
        currency: payment.currency,
        invoiceNumber: payment.invoiceNumber,
      },
    });
  }
}
```

### Example 10: Handle Transfer Failure

```typescript
async handleTransferFailed(transferId: number) {
  // Get transfer details
  const transfer = await this.wiseTransferService.getTransfer(transferId);

  // Update payment status
  await this.prisma.payment.updateMany({
    where: { wiseTransferId: transferId },
    data: {
      status: 'failed',
      failureReason: transfer.status,
    },
  });

  // Alert finance team
  await this.notificationService.sendAlert({
    type: 'PAYMENT_FAILED',
    severity: 'HIGH',
    message: `Wise transfer ${transferId} failed with status: ${transfer.status}`,
    data: { transferId, status: transfer.status },
  });

  // Optionally retry or refund
  if (transfer.status === 'bounced_back') {
    // Balance should be automatically refunded by Wise
    this.logger.log(`Transfer ${transferId} bounced back, funds refunded`);
  }
}
```

---

## Recipient Management

### Example 11: Create Multiple Recipients

```typescript
interface RecipientData {
  name: string;
  email: string;
  currency: string;
  accountDetails: any;
}

async createRecipients(recipients: RecipientData[]) {
  const results = [];

  for (const recipient of recipients) {
    try {
      const wiseRecipient = await this.wiseTransferService.createRecipient({
        currency: recipient.currency,
        type: this.determineAccountType(recipient.accountDetails),
        details: {
          accountHolderName: recipient.name,
          legalType: 'BUSINESS',
          ...recipient.accountDetails,
        },
      });

      results.push({
        success: true,
        email: recipient.email,
        recipientId: wiseRecipient.id,
      });
    } catch (error) {
      results.push({
        success: false,
        email: recipient.email,
        error: error.message,
      });
    }
  }

  return results;
}

private determineAccountType(details: any): string {
  if (details.iban) return 'iban';
  if (details.abartn) return 'aba';
  if (details.sortCode) return 'sort_code';
  if (details.bsbCode) return 'bsb_code';
  throw new Error('Unknown account type');
}
```

---

## Error Handling

### Example 12: Comprehensive Error Handling

```typescript
async makePaymentWithErrorHandling(
  recipientId: number,
  amount: number,
  currency: string,
) {
  try {
    const result = await this.wiseTransferService.executeTransfer({
      sourceCurrency: 'EUR',
      targetCurrency: currency,
      sourceAmount: amount,
      targetAccount: recipientId,
      details: {
        reference: 'Payment',
      },
    });

    return { success: true, transfer: result };
  } catch (error) {
    // Handle specific errors
    if (error.status === 400) {
      return {
        success: false,
        error: 'Invalid payment details',
        details: error.message,
      };
    } else if (error.status === 401) {
      return {
        success: false,
        error: 'Authentication failed',
        details: 'Please check Wise API token',
      };
    } else if (error.status === 403) {
      return {
        success: false,
        error: 'Insufficient permissions',
        details: 'API token does not have required permissions',
      };
    } else if (error.status === 429) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        details: 'Please try again later',
      };
    } else {
      return {
        success: false,
        error: 'Payment failed',
        details: error.message,
      };
    }
  }
}
```

---

## Scheduled Tasks

### Example 13: Daily Balance Sync

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class WiseSyncService {
  constructor(
    private readonly wiseBalanceService: WiseBalanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncBalances() {
    this.logger.log('Starting daily balance sync');

    try {
      const balances = await this.wiseBalanceService.getBalances();

      for (const balanceAccount of balances) {
        for (const balance of balanceAccount.balances) {
          await this.prisma.wiseBalance.upsert({
            where: {
              currency: balance.currency,
            },
            create: {
              currency: balance.currency,
              amount: balance.amount.value,
              reservedAmount: balance.reservedAmount.value,
              lastSyncedAt: new Date(),
            },
            update: {
              amount: balance.amount.value,
              reservedAmount: balance.reservedAmount.value,
              lastSyncedAt: new Date(),
            },
          });
        }
      }

      this.logger.log('Balance sync completed');
    } catch (error) {
      this.logger.error('Balance sync failed', error);
    }
  }
}
```

---

## Testing

### Example 14: Unit Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { WiseTransferService } from './wise-transfer.service';
import { WiseService } from './wise.service';

describe('WiseTransferService', () => {
  let service: WiseTransferService;
  let wiseService: WiseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WiseTransferService,
        {
          provide: WiseService,
          useValue: {
            getBusinessProfileId: jest.fn().mockResolvedValue(12345678),
            getApiClient: jest.fn().mockReturnValue({
              post: jest.fn(),
              get: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WiseTransferService>(WiseTransferService);
    wiseService = module.get<WiseService>(WiseService);
  });

  it('should create a quote', async () => {
    const mockQuote = {
      id: 'quote-123',
      rate: 1.0955,
      sourceAmount: 100,
      targetAmount: 109.55,
    };

    jest.spyOn(wiseService.getApiClient(), 'post').mockResolvedValue({
      data: mockQuote,
    });

    const result = await service.createQuote({
      sourceCurrency: 'EUR',
      targetCurrency: 'USD',
      sourceAmount: 100,
    });

    expect(result).toEqual(mockQuote);
  });
});
```

---

## Best Practices

1. **Always check balance before transfer**
2. **Use customer transaction IDs for idempotency**
3. **Handle webhook events asynchronously**
4. **Store transfer IDs in your database**
5. **Implement retry logic for failed transfers**
6. **Log all operations for audit trail**
7. **Use environment-based configuration**
8. **Encrypt sensitive data before storage**
9. **Validate recipient details before creation**
10. **Monitor rate limits and implement backoff**
