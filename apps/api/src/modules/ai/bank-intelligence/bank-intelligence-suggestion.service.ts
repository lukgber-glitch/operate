import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/modules/database/prisma.service';
import { InvoiceMatcherService } from './invoice-matcher.service';
import { BillMatcherService } from './bill-matcher.service';
import { TransactionClassifiedEvent } from '@/modules/finance/banking/transaction-pipeline.service';
import { SuggestionType, SuggestionPriority, SuggestionStatus } from '@prisma/client';
import { PaymentInput } from './types/invoice-matching.types';
import { OutgoingPaymentInput } from './types/bill-matching.types';

/**
 * Bank Intelligence Suggestion Service
 * Listens to transaction classification events and creates chat suggestions
 * for invoice/bill matching and reconciliation
 */
@Injectable()
export class BankIntelligenceSuggestionService {
  private readonly logger = new Logger(BankIntelligenceSuggestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceMatcherService: InvoiceMatcherService,
    private readonly billMatcherService: BillMatcherService,
  ) {}

  /**
   * Listen for transaction.classified events
   * Triggered when TransactionPipelineService classifies a transaction
   */
  @OnEvent('transaction.classified')
  async handleTransactionClassified(event: TransactionClassifiedEvent): Promise<void> {
    this.logger.log(
      `Transaction ${event.transactionId} classified as ${event.category} with ${event.confidence} confidence`,
    );

    try {
      // Get the transaction details
      const transaction = await this.prisma.bankTransactionNew.findUnique({
        where: { id: event.transactionId },
        include: {
          bankAccount: {
            include: {
              bankConnection: true,
            },
          },
        },
      });

      if (!transaction) {
        this.logger.warn(`Transaction ${event.transactionId} not found`);
        return;
      }

      const amount = transaction.amount.toNumber();
      const isCredit = amount > 0;
      const isDebit = amount < 0;

      // Process CREDIT transactions (incoming payments) - match to invoices
      if (isCredit) {
        await this.processIncomingPayment(transaction, event.orgId);
      }

      // Process DEBIT transactions (outgoing payments) - match to bills
      if (isDebit) {
        await this.processOutgoingPayment(transaction, event.orgId);
      }
    } catch (error) {
      this.logger.error(
        `Error processing transaction ${event.transactionId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process incoming payment (CREDIT) - match to invoices
   */
  private async processIncomingPayment(transaction: any, orgId: string): Promise<void> {
    this.logger.log(`Processing incoming payment: ${transaction.id}`);

    // Build payment input for invoice matcher
    const payment: PaymentInput = {
      amount: Math.abs(transaction.amount.toNumber()),
      counterparty: transaction.merchantName || transaction.counterpartyName || undefined,
      description: transaction.description,
      date: transaction.bookingDate,
      reference: transaction.reference || undefined,
    };

    // Try to match to invoice
    const matchResult = await this.invoiceMatcherService.matchPaymentToInvoice(payment, orgId);

    if (matchResult.matched && matchResult.confidence > 50) {
      // Create suggestion for the match
      await this.createInvoiceMatchSuggestion(transaction, matchResult, orgId);
    } else {
      this.logger.log(`No invoice match found for transaction ${transaction.id}`);
    }
  }

  /**
   * Process outgoing payment (DEBIT) - match to bills
   */
  private async processOutgoingPayment(transaction: any, orgId: string): Promise<void> {
    this.logger.log(`Processing outgoing payment: ${transaction.id}`);

    // Build payment input for bill matcher
    const payment: OutgoingPaymentInput = {
      amount: Math.abs(transaction.amount.toNumber()),
      counterparty: transaction.merchantName || transaction.counterpartyName || undefined,
      description: transaction.description,
      date: transaction.bookingDate,
      reference: transaction.reference || undefined,
    };

    // Try to match to bill
    const matchResult = await this.billMatcherService.matchPaymentToBill(payment, orgId);

    if (matchResult.matched && matchResult.confidence > 50) {
      // Create suggestion for the match
      await this.createBillMatchSuggestion(transaction, matchResult, orgId);
    } else {
      this.logger.log(`No bill match found for transaction ${transaction.id}`);
    }
  }

  /**
   * Create suggestion for invoice match
   */
  private async createInvoiceMatchSuggestion(
    transaction: any,
    matchResult: any,
    orgId: string,
  ): Promise<void> {
    // Check if suggestion already exists for this transaction
    const existing = await this.prisma.suggestion.findFirst({
      where: {
        orgId,
        entityType: 'transaction',
        entityId: transaction.id,
        status: { in: [SuggestionStatus.PENDING, SuggestionStatus.VIEWED] },
      },
    });

    if (existing) {
      this.logger.debug(`Suggestion already exists for transaction ${transaction.id}`);
      return;
    }

    const invoice = matchResult.invoice;
    const isAutoReconcile = matchResult.suggestedAction === 'AUTO_RECONCILE';
    const isPartial = matchResult.suggestedAction === 'PARTIAL_PAYMENT';
    const isMultiInvoice = matchResult.suggestedAction === 'MULTI_INVOICE';

    let title: string;
    let description: string;
    let actionLabel: string;
    let priority: SuggestionPriority;
    let actionType: string;
    let actionParams: any;

    if (isAutoReconcile) {
      title = `Auto-reconcile payment to Invoice ${invoice.number}`;
      description = `Incoming payment of €${Math.abs(transaction.amount.toNumber())} matches Invoice ${invoice.number} for ${invoice.customerName} with ${matchResult.confidence}% confidence. Reasons: ${matchResult.matchReasons.join(', ')}`;
      actionLabel = 'Auto-Reconcile';
      priority = SuggestionPriority.HIGH;
      actionType = 'auto_reconcile_invoice';
      actionParams = {
        transactionId: transaction.id,
        invoiceId: invoice.id,
      };
    } else if (isPartial) {
      title = `Partial payment for Invoice ${invoice.number}`;
      description = `Incoming payment of €${Math.abs(transaction.amount.toNumber())} appears to be a partial payment for Invoice ${invoice.number} (Total: €${invoice.totalAmount}). Remaining: €${matchResult.amountRemaining}. Reasons: ${matchResult.matchReasons.join(', ')}`;
      actionLabel = 'Record Partial Payment';
      priority = SuggestionPriority.MEDIUM;
      actionType = 'partial_payment_invoice';
      actionParams = {
        transactionId: transaction.id,
        invoiceId: invoice.id,
        amount: Math.abs(transaction.amount.toNumber()),
      };
    } else if (isMultiInvoice) {
      const invoices = matchResult.invoices || [];
      title = `Payment matches ${invoices.length} invoices`;
      description = `Incoming payment of €${Math.abs(transaction.amount.toNumber())} matches ${invoices.length} invoices: ${invoices.map((inv: any) => inv.number).join(', ')}. Reasons: ${matchResult.matchReasons.join(', ')}`;
      actionLabel = 'Review Multi-Invoice Match';
      priority = SuggestionPriority.MEDIUM;
      actionType = 'review_multi_invoice';
      actionParams = {
        transactionId: transaction.id,
        invoiceIds: invoices.map((inv: any) => inv.id),
      };
    } else {
      title = `Review payment match for Invoice ${invoice.number}`;
      description = `Incoming payment of €${Math.abs(transaction.amount.toNumber())} may match Invoice ${invoice.number} for ${invoice.customerName} (${matchResult.confidence}% confidence). Reasons: ${matchResult.matchReasons.join(', ')}`;
      actionLabel = 'Review Match';
      priority = SuggestionPriority.MEDIUM;
      actionType = 'review_invoice_match';
      actionParams = {
        transactionId: transaction.id,
        invoiceId: invoice.id,
      };
    }

    // Create the suggestion
    await this.prisma.suggestion.create({
      data: {
        orgId,
        userId: null, // Org-wide suggestion
        type: SuggestionType.INVOICE_REMINDER,
        priority,
        title,
        description,
        actionLabel,
        entityType: 'transaction',
        entityId: transaction.id,
        data: {
          transactionId: transaction.id,
          invoiceId: invoice?.id,
          invoiceIds: matchResult.invoices?.map((inv: any) => inv.id),
          matchType: matchResult.matchType,
          confidence: matchResult.confidence,
          matchReasons: matchResult.matchReasons,
        },
        actionType,
        actionParams,
        status: SuggestionStatus.PENDING,
        showAfter: new Date(),
        confidence: matchResult.confidence / 100, // Convert to 0-1 scale
      },
    });

    this.logger.log(`Created invoice match suggestion for transaction ${transaction.id}`);
  }

  /**
   * Create suggestion for bill match
   */
  private async createBillMatchSuggestion(
    transaction: any,
    matchResult: any,
    orgId: string,
  ): Promise<void> {
    // Check if suggestion already exists for this transaction
    const existing = await this.prisma.suggestion.findFirst({
      where: {
        orgId,
        entityType: 'transaction',
        entityId: transaction.id,
        status: { in: [SuggestionStatus.PENDING, SuggestionStatus.VIEWED] },
      },
    });

    if (existing) {
      this.logger.debug(`Suggestion already exists for transaction ${transaction.id}`);
      return;
    }

    const bill = matchResult.bill;
    const isAutoReconcile = matchResult.suggestedAction === 'AUTO_RECONCILE';
    const isPartial = matchResult.suggestedAction === 'PARTIAL_PAYMENT';
    const isMultiBill = matchResult.suggestedAction === 'MULTI_BILL';

    let title: string;
    let description: string;
    let actionLabel: string;
    let priority: SuggestionPriority;
    let actionType: string;
    let actionParams: any;

    if (isAutoReconcile) {
      title = `Auto-reconcile payment to Bill ${bill.billNumber || bill.id}`;
      description = `Outgoing payment of €${Math.abs(transaction.amount.toNumber())} matches Bill ${bill.billNumber || bill.id} for ${bill.vendorName} with ${matchResult.confidence}% confidence. Reasons: ${matchResult.matchReasons.join(', ')}`;
      actionLabel = 'Auto-Reconcile';
      priority = SuggestionPriority.HIGH;
      actionType = 'auto_reconcile_bill';
      actionParams = {
        transactionId: transaction.id,
        billId: bill.id,
      };
    } else if (isPartial) {
      title = `Partial payment for Bill ${bill.billNumber || bill.id}`;
      description = `Outgoing payment of €${Math.abs(transaction.amount.toNumber())} appears to be a partial payment for Bill ${bill.billNumber || bill.id} (Total: €${bill.totalAmount}). Remaining: €${matchResult.amountRemaining}. Reasons: ${matchResult.matchReasons.join(', ')}`;
      actionLabel = 'Record Partial Payment';
      priority = SuggestionPriority.MEDIUM;
      actionType = 'partial_payment_bill';
      actionParams = {
        transactionId: transaction.id,
        billId: bill.id,
        amount: Math.abs(transaction.amount.toNumber()),
      };
    } else if (isMultiBill) {
      const bills = matchResult.bills || [];
      title = `Payment matches ${bills.length} bills`;
      description = `Outgoing payment of €${Math.abs(transaction.amount.toNumber())} matches ${bills.length} bills from ${bill.vendorName}. Reasons: ${matchResult.matchReasons.join(', ')}`;
      actionLabel = 'Review Multi-Bill Match';
      priority = SuggestionPriority.MEDIUM;
      actionType = 'review_multi_bill';
      actionParams = {
        transactionId: transaction.id,
        billIds: bills.map((b: any) => b.id),
      };
    } else {
      title = `Review payment match for Bill ${bill.billNumber || bill.id}`;
      description = `Outgoing payment of €${Math.abs(transaction.amount.toNumber())} may match Bill ${bill.billNumber || bill.id} for ${bill.vendorName} (${matchResult.confidence}% confidence). Reasons: ${matchResult.matchReasons.join(', ')}`;
      actionLabel = 'Review Match';
      priority = SuggestionPriority.MEDIUM;
      actionType = 'review_bill_match';
      actionParams = {
        transactionId: transaction.id,
        billId: bill.id,
      };
    }

    // Create the suggestion
    await this.prisma.suggestion.create({
      data: {
        orgId,
        userId: null, // Org-wide suggestion
        type: SuggestionType.EXPENSE_ANOMALY,
        priority,
        title,
        description,
        actionLabel,
        entityType: 'transaction',
        entityId: transaction.id,
        data: {
          transactionId: transaction.id,
          billId: bill?.id,
          billIds: matchResult.bills?.map((b: any) => b.id),
          matchType: matchResult.matchType,
          confidence: matchResult.confidence,
          matchReasons: matchResult.matchReasons,
        },
        actionType,
        actionParams,
        status: SuggestionStatus.PENDING,
        showAfter: new Date(),
        confidence: matchResult.confidence / 100, // Convert to 0-1 scale
      },
    });

    this.logger.log(`Created bill match suggestion for transaction ${transaction.id}`);
  }
}
