# Currency Module Migration Guide

Guide for integrating the Multi-Currency Service into existing Operate/CoachOS modules.

## Database Schema Updates

The following models already have `currency` fields and don't need changes:
- ✅ Organisation (has `currency`)
- ✅ Transaction (has `currency`)
- ✅ DeductionSuggestion (has `currency`)
- ✅ Invoice (has `currency`)
- ✅ Expense (has `currency`)

### Optional Enhancements

For models that handle currency conversion, consider adding these fields:

```prisma
model Invoice {
  // Existing fields
  totalAmount Decimal @db.Decimal(12, 2)
  currency    String  @default("EUR")

  // Optional: Add for audit trail of conversions
  exchangeRate       Decimal? @db.Decimal(10, 6)  // Rate used for conversion
  exchangeRateDate   DateTime? // When rate was fetched
  originalAmount     Decimal?  @db.Decimal(12, 2) // Amount before conversion
  originalCurrency   String?   // Currency before conversion
  convertedAmount    Decimal?  @db.Decimal(12, 2) // Amount after conversion
  convertedCurrency  String?   // Target currency

  // ... rest of fields
}
```

Example migration:
```prisma
-- Add optional conversion fields to Invoice
ALTER TABLE "Invoice" ADD COLUMN "exchangeRate" DECIMAL(10,6);
ALTER TABLE "Invoice" ADD COLUMN "exchangeRateDate" TIMESTAMP;
ALTER TABLE "Invoice" ADD COLUMN "originalAmount" DECIMAL(12,2);
ALTER TABLE "Invoice" ADD COLUMN "originalCurrency" VARCHAR(3);
ALTER TABLE "Invoice" ADD COLUMN "convertedAmount" DECIMAL(12,2);
ALTER TABLE "Invoice" ADD COLUMN "convertedCurrency" VARCHAR(3);

-- Add optional conversion fields to Expense
ALTER TABLE "Expense" ADD COLUMN "exchangeRate" DECIMAL(10,6);
ALTER TABLE "Expense" ADD COLUMN "exchangeRateDate" TIMESTAMP;
ALTER TABLE "Expense" ADD COLUMN "originalAmount" DECIMAL(12,2);
ALTER TABLE "Expense" ADD COLUMN "originalCurrency" VARCHAR(3);

-- Add optional conversion fields to Transaction
ALTER TABLE "Transaction" ADD COLUMN "exchangeRate" DECIMAL(10,6);
ALTER TABLE "Transaction" ADD COLUMN "originalAmount" DECIMAL(12,2);
ALTER TABLE "Transaction" ADD COLUMN "originalCurrency" VARCHAR(3);
```

## Module Integration

### 1. Import the Currency Module

```typescript
// apps/api/src/modules/invoice/invoice.module.ts
import { CurrencyModule } from '@/modules/currency';

@Module({
  imports: [
    CurrencyModule, // Add this
    // ... other imports
  ],
  // ...
})
export class InvoiceModule {}
```

### 2. Inject the Service

```typescript
// apps/api/src/modules/invoice/invoice.service.ts
import { MultiCurrencyService } from '@/modules/currency';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currencyService: MultiCurrencyService, // Add this
  ) {}

  async create(orgId: string, dto: CreateInvoiceDto) {
    // Validate currency
    this.currencyService.validateCurrencyCode(dto.currency);

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        orgId,
        currency: dto.currency,
        totalAmount: dto.totalAmount,
        // ... other fields
      },
    });

    return invoice;
  }
}
```

### 3. Format Amounts for Display

```typescript
async findOne(id: string) {
  const invoice = await this.prisma.invoice.findUnique({
    where: { id },
  });

  // Add formatted amount to response
  return {
    ...invoice,
    formattedAmount: this.currencyService.formatAmount(
      invoice.totalAmount,
      invoice.currency,
    ),
  };
}
```

### 4. Handle Currency Conversion

```typescript
async convertInvoice(
  invoiceId: string,
  targetCurrency: string,
  exchangeRate: number,
) {
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  // Convert amount
  const convertedAmount = this.currencyService.convert(
    invoice.totalAmount,
    invoice.currency,
    targetCurrency,
    exchangeRate,
  );

  // Update invoice with conversion details
  return this.prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      originalAmount: invoice.totalAmount,
      originalCurrency: invoice.currency,
      convertedAmount,
      convertedCurrency: targetCurrency,
      exchangeRate,
      exchangeRateDate: new Date(),
    },
  });
}
```

## DTOs Update

### Add Currency Validation to DTOs

```typescript
// apps/api/src/modules/invoice/dto/create-invoice.dto.ts
import { IsString, IsNumber, Length, Matches } from 'class-validator';

export class CreateInvoiceDto {
  @IsNumber()
  totalAmount: number;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  currency: string;

  // ... other fields
}
```

### Response DTOs with Formatted Amounts

```typescript
// apps/api/src/modules/invoice/dto/invoice-response.dto.ts
export class InvoiceResponseDto {
  id: string;
  totalAmount: number;
  currency: string;
  formattedAmount?: string; // Add this

  // Optional: conversion details
  convertedAmount?: number;
  convertedCurrency?: string;
  exchangeRate?: number;

  // ... other fields
}
```

## Controller Updates

### Add Currency Endpoints

```typescript
// apps/api/src/modules/invoice/invoice.controller.ts
@Get(':id/formatted')
async getFormattedInvoice(@Param('id') id: string) {
  const invoice = await this.invoiceService.findOne(id);

  return {
    ...invoice,
    formattedAmount: this.currencyService.formatAmount(
      invoice.totalAmount,
      invoice.currency,
    ),
  };
}

@Post(':id/convert')
async convertInvoiceCurrency(
  @Param('id') id: string,
  @Body() dto: ConvertInvoiceDto,
) {
  return this.invoiceService.convertInvoice(
    id,
    dto.targetCurrency,
    dto.exchangeRate,
  );
}
```

## Use Cases

### 1. Invoice Module

```typescript
// Validate currency when creating invoice
async createInvoice(orgId: string, dto: CreateInvoiceDto) {
  this.currencyService.validateCurrencyCode(dto.currency);

  // Round amount to currency decimals
  const roundedAmount = this.currencyService.roundToDecimals(
    dto.totalAmount,
    dto.currency,
  );

  const invoice = await this.prisma.invoice.create({
    data: {
      orgId,
      totalAmount: roundedAmount,
      currency: dto.currency,
      // ...
    },
  });

  return invoice;
}

// Format invoice for PDF
async generateInvoicePdf(invoiceId: string) {
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  const formattedAmount = this.currencyService.formatAmount(
    invoice.totalAmount,
    invoice.currency,
  );

  // Use formattedAmount in PDF template
  return this.pdfService.generate({
    amount: formattedAmount,
    // ...
  });
}
```

### 2. Expense Module

```typescript
// Parse amount from user input
async createExpense(orgId: string, dto: CreateExpenseDto) {
  // Parse amount (handles "$1,234.56" or "1.234,56 €")
  const amount = this.currencyService.parseAmount(
    dto.amountInput,
    dto.currency,
  );

  return this.prisma.expense.create({
    data: {
      orgId,
      amount,
      currency: dto.currency,
      // ...
    },
  });
}

// Convert expense to org currency
async getExpenseInOrgCurrency(expenseId: string) {
  const expense = await this.prisma.expense.findUnique({
    where: { id: expenseId },
    include: { organisation: true },
  });

  // Get exchange rate (from exchange-rate service)
  const rate = await this.exchangeRateService.getRate(
    expense.currency,
    expense.organisation.currency,
  );

  const convertedAmount = this.currencyService.convert(
    expense.amount,
    expense.currency,
    expense.organisation.currency,
    rate,
  );

  return {
    ...expense,
    convertedAmount,
    convertedCurrency: expense.organisation.currency,
  };
}
```

### 3. Payroll Module

```typescript
// Handle multi-currency salaries
async createSalary(employeeId: string, dto: CreateSalaryDto) {
  const employee = await this.prisma.employee.findUnique({
    where: { id: employeeId },
    include: { organisation: true },
  });

  // Validate salary currency
  this.currencyService.validateCurrencyCode(dto.currency);

  // If salary currency differs from org currency, convert
  let amount = dto.amount;
  if (dto.currency !== employee.organisation.currency) {
    const rate = await this.exchangeRateService.getRate(
      dto.currency,
      employee.organisation.currency,
    );

    amount = this.currencyService.convert(
      dto.amount,
      dto.currency,
      employee.organisation.currency,
      rate,
    );
  }

  return this.prisma.salary.create({
    data: {
      employeeId,
      amount,
      currency: employee.organisation.currency,
      originalAmount: dto.amount,
      originalCurrency: dto.currency,
    },
  });
}
```

### 4. Reporting Module

```typescript
// Generate multi-currency report
async generateFinancialReport(orgId: string, targetCurrency: string) {
  const org = await this.prisma.organisation.findUnique({
    where: { id: orgId },
  });

  const invoices = await this.prisma.invoice.findMany({
    where: { orgId },
  });

  // Convert all amounts to target currency
  const convertedInvoices = await Promise.all(
    invoices.map(async (invoice) => {
      if (invoice.currency === targetCurrency) {
        return { ...invoice, convertedAmount: invoice.totalAmount };
      }

      const rate = await this.exchangeRateService.getRate(
        invoice.currency,
        targetCurrency,
      );

      return {
        ...invoice,
        convertedAmount: this.currencyService.convert(
          invoice.totalAmount,
          invoice.currency,
          targetCurrency,
          rate,
        ),
      };
    }),
  );

  // Calculate totals
  const total = convertedInvoices.reduce(
    (sum, inv) => sum + inv.convertedAmount,
    0,
  );

  return {
    currency: targetCurrency,
    total,
    formattedTotal: this.currencyService.formatAmount(total, targetCurrency),
    invoices: convertedInvoices,
  };
}
```

## Frontend Integration (W20-T7)

The Currency Module provides formatted amounts for frontend display:

```typescript
// API Response
{
  id: "123",
  amount: 1234.56,
  currency: "USD",
  formattedAmount: "$1,234.56"
}

// Frontend can use formattedAmount directly
<div>Total: {invoice.formattedAmount}</div>
```

## Testing

Update existing tests to validate currency handling:

```typescript
describe('InvoiceService', () => {
  it('should validate currency code', async () => {
    await expect(
      service.create(orgId, { currency: 'XYZ', amount: 100 }),
    ).rejects.toThrow();
  });

  it('should round amount to currency decimals', async () => {
    const invoice = await service.create(orgId, {
      currency: 'JPY',
      amount: 1234.56, // Should round to 1235
    });
    expect(invoice.amount).toBe(1235);
  });

  it('should format amount for display', async () => {
    const invoice = await service.findOne(invoiceId);
    expect(invoice.formattedAmount).toContain('$');
  });
});
```

## Rollout Plan

1. ✅ **Phase 1**: Currency Module created (W20-T3)
2. **Phase 2**: Integration into existing modules
   - Invoice Module
   - Expense Module
   - Transaction Module
   - Payroll Module
3. **Phase 3**: Add Exchange Rate Service (W20-T4)
4. **Phase 4**: Frontend Currency Components (W20-T7)
5. **Phase 5**: Multi-currency reporting

## Best Practices

1. **Always validate currency codes** before saving to database
2. **Round amounts** to currency decimals before storage
3. **Store exchange rates** when converting for audit trail
4. **Format amounts** only for display, never store formatted strings
5. **Use Decimal type** in database for precision
6. **Handle timezone** when fetching exchange rates
7. **Cache formatted amounts** for performance in lists
8. **Provide fallbacks** for unsupported currencies

## Common Pitfalls

❌ **Don't do this**:
```typescript
// Storing formatted string
await prisma.invoice.create({
  data: { amount: "$1,234.56" } // WRONG!
});
```

✅ **Do this**:
```typescript
// Store number, format on read
await prisma.invoice.create({
  data: { amount: 1234.56, currency: "USD" }
});

const formatted = currencyService.formatAmount(invoice.amount, invoice.currency);
```

❌ **Don't do this**:
```typescript
// Hardcoded currency
const total = amount * 1.09; // WRONG!
```

✅ **Do this**:
```typescript
// Use service for conversion
const rate = await exchangeRateService.getRate('USD', 'EUR');
const total = currencyService.convert(amount, 'USD', 'EUR', rate);
```

## Questions?

Contact FORGE or check:
- `/apps/api/src/modules/currency/README.md` - Module documentation
- `/apps/api/src/modules/currency/__tests__/multi-currency.service.spec.ts` - Usage examples
