# Tax Liability Tracker Service

Real-time tax liability tracking and estimates for German freelancers and small businesses using EÜR (Einnahmen-Überschuss-Rechnung).

## Overview

The Tax Liability Tracker Service provides comprehensive tax calculations including:

- **Income Tax (Einkommensteuer)**: Progressive tax calculation based on German tax brackets
- **Solidarity Surcharge (Solidaritätszuschlag)**: 5.5% surcharge on income tax (with thresholds)
- **VAT (Umsatzsteuer)**: Net VAT calculation (collected - paid) with monthly/quarterly/yearly periods
- **Tax Deductions**: Detailed breakdown by EÜR category with deduction rates
- **Tax Alerts**: Proactive notifications for upcoming deadlines and payments

## Features

### 1. Full Tax Liability Calculation

Calculate complete tax liability for any year with breakdown of:
- Total revenue and deductions
- Income tax with progressive brackets
- Solidarity surcharge
- VAT collected and paid
- Already paid vs still owed amounts
- Next payment due date and amount

### 2. Quarterly Estimates

Get detailed estimates for each quarter (Q1-Q4) including:
- Revenue and expenses
- Net profit
- Estimated income tax
- VAT collected and paid
- Status (completed/in_progress/projected)

### 3. VAT Summary

Track VAT by period (monthly/quarterly/yearly) with:
- Invoices issued and VAT collected
- Expenses claimed and VAT paid
- Net VAT due or refund
- Submission deadlines
- Period status (submitted/due/upcoming)

### 4. Deductions Summary

Analyze tax deductions by category with:
- Total deductions by EÜR line
- Deduction rate per category
- Special items (home office, business meals, etc.)
- Limits and remaining amounts

### 5. Tax Alerts

Receive proactive alerts for:
- VAT submission deadlines (10th of following month/quarter)
- Income tax prepayment deadlines (March 10, June 10, Sept 10, Dec 10)
- Annual tax return deadline (July 31)
- Quarterly estimate reminders

## Usage

### Basic Tax Liability Calculation

```typescript
import { TaxLiabilityTrackerService } from './tax-liability-tracker.service';

// Inject the service
constructor(private readonly taxTracker: TaxLiabilityTrackerService) {}

// Calculate tax liability for current year
const liability = await this.taxTracker.calculateTaxLiability(orgId);

console.log(`Total Tax: €${liability.total.estimatedTotalTax / 100}`);
console.log(`Still Owed: €${liability.total.stillOwed / 100}`);
console.log(`Effective Rate: ${(liability.incomeTax.effectiveRate * 100).toFixed(1)}%`);
```

### Quarterly Estimates

```typescript
// Get quarterly breakdown
const quarters = await this.taxTracker.getQuarterlyEstimates(orgId, 2025);

for (const q of quarters) {
  console.log(`Q${q.quarter}: €${q.netProfit / 100} profit, €${q.estimatedIncomeTax / 100} tax`);
}
```

### VAT Summary

```typescript
// Get quarterly VAT summary
const vat = await this.taxTracker.getVatSummary(orgId, 'quarterly', 2025);

console.log(`Total VAT Due: €${vat.netDue / 100}`);
console.log(`Next Deadline: ${vat.nextDeadline?.toLocaleDateString('de-DE')}`);
console.log(`Next Amount: €${vat.nextAmount / 100}`);
```

### Deductions Analysis

```typescript
// Get deductions breakdown
const deductions = await this.taxTracker.getDeductionsSummary(orgId, 2025);

console.log(`Total Deductions: €${deductions.totalDeductions / 100}`);

for (const cat of deductions.categories) {
  console.log(`${cat.category}: €${cat.effectiveDeduction / 100} (${(cat.deductionRate * 100).toFixed(0)}%)`);
}
```

### Tax Alerts

```typescript
// Get current tax alerts
const alerts = await this.taxTracker.getTaxAlerts(orgId);

for (const alert of alerts) {
  console.log(`${alert.severity.toUpperCase()}: ${alert.title}`);
  console.log(`  ${alert.message}`);
  console.log(`  Action: ${alert.actionRequired}`);
}
```

## German Tax Rules Implementation

### Income Tax Brackets (2024/2025)

| Taxable Income | Rate | Name |
|---------------|------|------|
| €0 - €11,604 | 0% | Grundfreibetrag |
| €11,605 - €17,005 | 14% - 24% | Progressionszone 1 |
| €17,006 - €66,760 | 24% - 42% | Progressionszone 2 |
| €66,761 - €277,826 | 42% | Spitzensteuersatz |
| €277,827+ | 45% | Reichensteuer |

### VAT Rates

- **Standard Rate**: 19% (most goods and services)
- **Reduced Rate**: 7% (food, books, newspapers)
- **Exempt**: Medical, education, insurance

### VAT Submission Deadlines

- **Monthly**: 10th of following month (if annual VAT > €7,500)
- **Quarterly**: 10th of month after quarter end
- **Yearly**: July 31 of following year

### Income Tax Prepayments

Quarterly prepayments required if annual tax > €400:
- **Q1**: March 10
- **Q2**: June 10
- **Q3**: September 10
- **Q4**: December 10

### Special Deduction Limits

- **Business Gifts (Geschenke)**: €35 per person per year
- **Business Meals (Bewirtung)**: 70% deductible
- **Home Office (Arbeitszimmer)**: €1,260/year flat rate or proportional rent
- **Phone/Internet**: 50% if mixed use or €20/month flat
- **Mileage**: €0.30/km (first 20km), €0.38/km (21km+)

## Options

### TaxCalculationOptions

```typescript
interface TaxCalculationOptions {
  year?: number;                      // Default: current year
  includeGewerbeSteuer?: boolean;     // Include trade tax (for Gewerbetreibende)
  hebesatz?: number;                  // Municipality tax rate
  isMarried?: boolean;                // Affects Soli threshold
  isKleinunternehmer?: boolean;       // Small business VAT exempt
  vatFrequency?: 'monthly' | 'quarterly' | 'yearly';
  confirmedOnly?: boolean;            // Only confirmed transactions
}
```

### Example with Kleinunternehmer

```typescript
const liability = await this.taxTracker.calculateTaxLiability(orgId, 2025, {
  isKleinunternehmer: true,  // VAT exempt
  vatFrequency: 'yearly',
});

// VAT will be €0
console.log(`VAT: €${liability.vat.netVatDue / 100}`); // €0
```

## Data Sources

The service aggregates data from:

1. **Invoices**: Revenue and VAT collected
2. **Transactions**: Expenses and VAT paid (with tax classification)
3. **Transaction Metadata**: Deduction amounts and VAT reclaimable
4. **Prepayments**: Already paid income tax and VAT

## Integration with Existing Services

The Tax Liability Tracker integrates with:

- **TaxDeductionAnalyzerService**: For detailed deduction calculations
- **TransactionClassifierService**: For expense categorization
- **Invoice/Bill Models**: For revenue and expense data

## Testing

Run the test suite:

```bash
npm test tax-liability-tracker.spec.ts
```

See `tax-liability-tracker.example.ts` for comprehensive usage examples.

## API Reference

### calculateTaxLiability()

```typescript
async calculateTaxLiability(
  organizationId: string,
  year?: number,
  options?: TaxCalculationOptions
): Promise<TaxLiability>
```

Calculate full tax liability including income tax, solidarity surcharge, and VAT.

### getQuarterlyEstimates()

```typescript
async getQuarterlyEstimates(
  organizationId: string,
  year?: number
): Promise<QuarterlyEstimate[]>
```

Get tax estimates for all 4 quarters of the year.

### getVatSummary()

```typescript
async getVatSummary(
  organizationId: string,
  period: 'monthly' | 'quarterly' | 'yearly',
  year?: number
): Promise<VatSummary>
```

Get VAT summary by period with submission deadlines.

### getDeductionsSummary()

```typescript
async getDeductionsSummary(
  organizationId: string,
  year?: number
): Promise<DeductionsSummary>
```

Get detailed breakdown of tax deductions by category.

### getTaxAlerts()

```typescript
async getTaxAlerts(
  organizationId: string
): Promise<TaxAlert[]>
```

Get current tax alerts and upcoming deadlines.

## Return Types

All monetary amounts are in **cents** (not euros) to avoid floating-point issues.

Example:
```typescript
const liability = await tracker.calculateTaxLiability(orgId);

// Convert to euros for display
const taxInEuros = liability.incomeTax.estimatedTax / 100;
console.log(`Tax: €${taxInEuros.toFixed(2)}`);
```

## Notes

- All calculations follow German tax law (EStG, UStG)
- Progressive tax calculation uses simplified formula (actual formula is more complex)
- Confidence score based on data completeness (0-1)
- Notes array provides context for estimates
- Dates use German locale (DD.MM.YYYY)

## Future Enhancements

- [ ] Support for Gewerbesteuer (trade tax) calculation
- [ ] Integration with ELSTER API for direct submission
- [ ] Multi-year tax planning and projections
- [ ] Tax optimization suggestions
- [ ] Support for different business types (GmbH, UG, etc.)
- [ ] Historical tax comparison and trends
- [ ] Export to EÜR PDF format
- [ ] Integration with tax advisor workflow

## References

- [German Tax Law (EStG)](https://www.gesetze-im-internet.de/estg/)
- [VAT Law (UStG)](https://www.gesetze-im-internet.de/ustg_1980/)
- [EÜR Form (Anlage EÜR)](https://www.formulare-bfinv.de/)
- [ELSTER (Electronic Tax Return)](https://www.elster.de/)

## Support

For questions or issues, please contact the development team or refer to the comprehensive examples in `tax-liability-tracker.example.ts`.
