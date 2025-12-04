# Integration Example: Using SKR Mapping with DATEV Export

This document shows how to integrate the SKR mapping service with the existing DATEV export service.

## Step 1: Update DatevExportService to Use SKR Mapping

### Import the Mapping Service

```typescript
// In datev-export.service.ts
import {
  SKRMappingService,
  SKRType,
  AccountCategory
} from './account-mapping';
```

### Inject the Service

```typescript
@Injectable()
export class DatevExportService {
  private readonly logger = new Logger(DatevExportService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private skrMapping: SKRMappingService, // Add this
  ) {
    // ...
  }
}
```

## Step 2: Update Account Determination Methods

### Replace Simple Account Mapping

**Before:**
```typescript
private determineAccountNumber(tx: any, config: DatevConfig): string {
  const skr = config.companyConfig.skrType;

  if (skr === DatevSKRType.SKR03) {
    return '1000'; // Default: Cash account
  } else {
    return '1600'; // SKR04: Cash account
  }
}
```

**After:**
```typescript
private determineAccountNumber(tx: any, config: DatevConfig): string {
  const skr = config.companyConfig.skrType === DatevSKRType.SKR03
    ? SKRType.SKR03
    : SKRType.SKR04;

  // Try to classify transaction
  const internalCode = this.classifyTransaction(tx);

  // Map to appropriate SKR account
  const accountNumber = skr === SKRType.SKR03
    ? this.skrMapping.mapToSKR03(internalCode)
    : this.skrMapping.mapToSKR04(internalCode);

  // Fallback to default cash account if no mapping found
  if (!accountNumber) {
    this.logger.warn(`No account mapping for ${internalCode}, using default`);
    return skr === SKRType.SKR03 ? '1000' : '1600';
  }

  return accountNumber;
}

/**
 * Classify transaction to internal account code
 */
private classifyTransaction(tx: any): string {
  // Check transaction metadata or category
  if (tx.category) {
    const categoryMap: Record<string, string> = {
      'cash': 'CASH',
      'bank': 'BANK',
      'revenue': 'REVENUE_19',
      'expense': 'COGS',
      'salary': 'SALARIES',
      'rent': 'RENT',
      'vehicle': 'VEHICLE_COSTS',
    };

    return categoryMap[tx.category.toLowerCase()] || 'BANK';
  }

  // Try AI classification or keyword matching
  const suggestion = this.skrMapping.suggestAccount(
    tx.description || '',
    SKRType.SKR03 // Use SKR03 for suggestion, will be converted later
  );

  if (suggestion && suggestion.confidence > 0.8) {
    this.logger.debug(
      `Suggested account: ${suggestion.accountNumber} (${suggestion.reason})`
    );
  }

  // Default to bank
  return 'BANK';
}
```

### Update Offset Account Method

**Before:**
```typescript
private determineOffsetAccount(tx: any, config: DatevConfig): string {
  const skr = config.companyConfig.skrType;

  if (skr === DatevSKRType.SKR03) {
    return '8400'; // Default: Revenue account
  } else {
    return '5000'; // SKR04: Revenue account
  }
}
```

**After:**
```typescript
private determineOffsetAccount(tx: any, config: DatevConfig): string {
  const skr = config.companyConfig.skrType === DatevSKRType.SKR03
    ? SKRType.SKR03
    : SKRType.SKR04;

  // Determine if this is revenue or expense
  const amount = parseFloat(tx.amount?.toString() || '0');

  if (amount > 0) {
    // Revenue transaction - use revenue account
    const revenueAccount = skr === SKRType.SKR03
      ? this.skrMapping.mapToSKR03('REVENUE_19')
      : this.skrMapping.mapToSKR04('REVENUE_19');
    return revenueAccount || (skr === SKRType.SKR03 ? '8100' : '4100');
  } else {
    // Expense transaction - use expense account
    const expenseAccount = skr === SKRType.SKR03
      ? this.skrMapping.mapToSKR03('COGS')
      : this.skrMapping.mapToSKR04('COGS');
    return expenseAccount || (skr === SKRType.SKR03 ? '4400' : '5400');
  }
}
```

### Update Tax Key Determination

**Before:**
```typescript
private determineTaxKey(invoice: any): string {
  if (!invoice.vatRate) return '';

  const vatRate = parseFloat(invoice.vatRate.toString());

  if (vatRate === 19) return '3'; // 19% standard rate
  if (vatRate === 7) return '2'; // 7% reduced rate
  if (vatRate === 0) return '8'; // Tax-free

  return '';
}
```

**After:**
```typescript
private determineTaxKey(invoice: any): string {
  if (!invoice.vatRate) return '';

  const vatRate = parseFloat(invoice.vatRate.toString());
  const taxKey = this.skrMapping.getTaxKey(vatRate, 'output');

  if (!taxKey) {
    this.logger.warn(`No tax key found for VAT rate: ${vatRate}%`);
    return '';
  }

  return taxKey;
}
```

## Step 3: Enhanced Invoice Mapping

Update the invoice to booking entry conversion:

```typescript
private invoiceToBookingEntry(
  invoice: any,
  config: DatevConfig,
): DatevBookingEntry {
  const totalAmount = parseFloat(invoice.totalAmount.toString());
  const vatRate = parseFloat(invoice.vatRate?.toString() || '19');

  const skr = config.companyConfig.skrType === DatevSKRType.SKR03
    ? SKRType.SKR03
    : SKRType.SKR04;

  // Map receivables account
  const receivablesAccount = skr === SKRType.SKR03
    ? this.skrMapping.mapToSKR03('RECEIVABLES')
    : this.skrMapping.mapToSKR04('RECEIVABLES');

  // Map revenue account based on VAT rate
  let revenueAccountCode = 'REVENUE_19';
  if (vatRate === 7) {
    revenueAccountCode = 'REVENUE_7';
  } else if (vatRate === 0) {
    revenueAccountCode = 'REVENUE_TAX_FREE';
  }

  const revenueAccount = skr === SKRType.SKR03
    ? this.skrMapping.mapToSKR03(revenueAccountCode)
    : this.skrMapping.mapToSKR04(revenueAccountCode);

  return {
    amount: totalAmount,
    debitCredit: 'S', // Invoices are always debit
    currency: invoice.currency || 'EUR',
    accountNumber: receivablesAccount || '1400', // Receivables
    offsetAccount: revenueAccount || '8100', // Revenue
    taxKey: this.skrMapping.getTaxKey(vatRate, 'output'),
    bookingDate: DatevEncodingUtil.formatDate(new Date(invoice.issueDate)),
    documentNumber: invoice.number,
    postingText: DatevEncodingUtil.sanitizeText(
      `Rechnung ${invoice.number}`,
    ),
    documentDate: DatevEncodingUtil.formatDate(
      new Date(invoice.issueDate),
      'TTMMJJ',
    ),
  };
}
```

## Step 4: Enhanced Account Labels Generation

Update account labels to use mapping service:

```typescript
private async generateAccountLabels(config: DatevConfig): Promise<string> {
  const lines: string[] = [];

  // Header
  const header = this.generateDATEVHeader(
    config,
    DatevDataCategory.KONTENBESCHRIFTUNG,
  );
  lines.push(this.formatHeaderLine(header));

  // Column names
  lines.push(
    DatevEncodingUtil.formatCsvLine([
      'Konto',
      'Kontenbeschriftung',
      'Sprach-ID',
    ]),
  );

  const skr = config.companyConfig.skrType === DatevSKRType.SKR03
    ? SKRType.SKR03
    : SKRType.SKR04;

  // Get all account mappings
  const mappings = this.skrMapping.getAllMappings();

  // Generate labels for all mapped accounts
  for (const mapping of mappings) {
    const accountNumber = skr === SKRType.SKR03
      ? mapping.skr03Account
      : mapping.skr04Account;

    const accountName = this.skrMapping.getAccountName(skr, accountNumber);

    if (accountName) {
      lines.push(
        DatevEncodingUtil.formatCsvLine([
          accountNumber,
          accountName,
          'de-DE',
        ]),
      );
    }
  }

  return lines.join('\r\n') + '\r\n';
}
```

## Step 5: Module Configuration

Update the compliance module to provide the SKR mapping service:

```typescript
// In compliance.module.ts
import { SKRMappingService } from './exports/datev/account-mapping';

@Module({
  imports: [
    // ... other imports
  ],
  providers: [
    ComplianceService,
    DatevExportService,
    SKRMappingService, // Add this
    // ... other providers
  ],
  exports: [
    ComplianceService,
    SKRMappingService, // Export for use in other modules
  ],
})
export class ComplianceModule {}
```

## Step 6: Usage in Controllers

Example controller endpoint using the mapping:

```typescript
@Get('accounts/:skrType')
@ApiOperation({ summary: 'Get available accounts for SKR type' })
async getAccounts(
  @Param('skrType') skrType: 'SKR03' | 'SKR04',
) {
  const type = skrType === 'SKR03' ? SKRType.SKR03 : SKRType.SKR04;

  const accounts = {
    revenue: this.skrMapping.getAccountsByCategory(
      AccountCategory.REVENUE,
      type
    ),
    expenses: this.skrMapping.getAccountsByCategory(
      AccountCategory.EXPENSES,
      type
    ),
    assets: this.skrMapping.getAccountsByCategory(
      AccountCategory.ASSETS,
      type
    ),
  };

  return accounts;
}

@Post('suggest-account')
@ApiOperation({ summary: 'Suggest account for transaction description' })
async suggestAccount(
  @Body() dto: { description: string; skrType: 'SKR03' | 'SKR04' },
) {
  const type = dto.skrType === 'SKR03' ? SKRType.SKR03 : SKRType.SKR04;
  return this.skrMapping.suggestAccount(dto.description, type);
}
```

## Benefits of Using SKR Mapping Service

1. **Centralized Account Management**: All account mappings in one place
2. **Type Safety**: TypeScript interfaces ensure correct usage
3. **Easy Maintenance**: Add new accounts or mappings without touching export logic
4. **Intelligent Suggestions**: Automatic account classification based on descriptions
5. **Tax Compliance**: Correct tax key mapping for German VAT rates
6. **Flexibility**: Easy to switch between SKR03 and SKR04
7. **Testability**: Service can be easily mocked and tested

## Testing

Example test:

```typescript
describe('DATEV Export with SKR Mapping', () => {
  let service: DatevExportService;
  let skrMapping: SKRMappingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DatevExportService,
        SKRMappingService,
        // ... other providers
      ],
    }).compile();

    service = module.get<DatevExportService>(DatevExportService);
    skrMapping = module.get<SKRMappingService>(SKRMappingService);
  });

  it('should use correct SKR03 accounts for invoice', async () => {
    const invoice = {
      totalAmount: 119,
      vatRate: 19,
      currency: 'EUR',
      issueDate: new Date(),
      number: 'INV-001',
    };

    const config = {
      companyConfig: {
        skrType: DatevSKRType.SKR03,
      },
    };

    const entry = service['invoiceToBookingEntry'](invoice, config);

    expect(entry.accountNumber).toBe('1400'); // Receivables
    expect(entry.offsetAccount).toBe('8100'); // Revenue 19%
    expect(entry.taxKey).toBe('3'); // 19% output tax
  });
});
```

## Next Steps

1. Test the integration with sample data
2. Add logging for account mapping decisions
3. Consider adding account mapping analytics
4. Implement custom account mapping rules per organization
5. Add validation for account numbers before export
