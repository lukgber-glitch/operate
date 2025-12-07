# Tax Deduction Analyzer

**Status**: ✅ Complete
**Sprint**: Sprint 4 - Bank Intelligence
**Task**: S4-04 Tax Deduction Analyzer

## Overview

The Tax Deduction Analyzer calculates tax deductions correctly per German tax law. It analyzes each expense and calculates the tax-deductible amount based on German EÜR (Einnahmen-Überschuss-Rechnung) rules.

## Features

### Core Functionality

1. **Deduction Analysis**
   - Calculate deductible amount for each transaction
   - Apply correct deduction percentage (100%, 70%, 50%, etc.)
   - Extract and calculate VAT amounts
   - Determine VAT reclaimability
   - Map to EÜR form line numbers

2. **German Tax Compliance**
   - Full compliance with German EÜR tax law
   - Support for all major expense categories
   - Special rules: Bewirtung (70%), Telefon (50%), Geschenke (€35 limit)
   - VAT calculation: 7% (reduced) and 19% (standard)
   - Income tax brackets and solidarity surcharge

3. **Quarterly Summaries**
   - Aggregate deductions by quarter
   - Breakdown by tax category
   - EÜR form line summaries
   - VAT balance calculation

4. **Annual Tax Estimation**
   - Estimate annual income and expenses
   - Calculate taxable income
   - Estimate income tax liability
   - Calculate solidarity surcharge (Soli)
   - Effective tax rate calculation
   - Tax bracket determination

## Architecture

```
tax-deduction-analyzer.service.ts       # Main service
rules/german-tax-rules.ts               # German tax rules and calculations
rules/eur-line-mapping.ts               # EÜR form line mappings
types/tax-categories.types.ts           # Tax category enums
```

## Usage

### 1. Analyze Single Transaction

```typescript
import { TaxDeductionAnalyzerService } from './tax-deduction-analyzer.service';

// Transaction from bank
const transaction = {
  amount: -11900, // -119.00 EUR (including VAT)
  description: 'GitHub Pro Subscription',
  category: 'Software',
};

// Classification from classifier
const classification = await classifier.classifyTransaction(transaction);

// Analyze deduction
const deduction = await analyzer.analyzeDeduction(transaction, classification);

console.log({
  grossAmount: deduction.grossAmount / 100, // 119.00 EUR
  netAmount: deduction.netAmount / 100, // 100.00 EUR
  deductibleAmount: deduction.deductibleAmount / 100, // 100.00 EUR
  vatReclaimable: deduction.vatReclaimable / 100, // 19.00 EUR
  netTaxBenefit: deduction.netTaxBenefit / 100, // 61.00 EUR (42% tax + VAT)
  eurLineNumber: deduction.eurLineNumber, // 28 (Bürokosten)
});
```

### 2. Calculate Quarterly Deductions

```typescript
// Get Q1 2024 deductions
const quarterly = await analyzer.calculateQuarterlyDeductions(
  'org_123',
  1, // Q1
  2024,
);

console.log({
  totalExpenses: quarterly.totalExpenses / 100,
  totalDeductible: quarterly.totalDeductible / 100,
  vatReclaimable: quarterly.vatReclaimable / 100,
  transactionCount: quarterly.transactionCount,
});

// Breakdown by category
Object.entries(quarterly.byCategory).forEach(([category, data]) => {
  console.log(`${category}: ${data.deductible / 100} EUR`);
});

// EÜR form lines
Object.entries(quarterly.eurSummary).forEach(([line, amount]) => {
  console.log(`Line ${line}: ${amount / 100} EUR`);
});
```

### 3. Estimate Annual Tax

```typescript
const annual = await analyzer.estimateAnnualTaxSavings('org_123', 2024);

console.log({
  income: annual.estimatedIncome / 100,
  expenses: annual.estimatedExpenses / 100,
  deductions: annual.estimatedDeductions / 100,
  taxableIncome: annual.estimatedTaxableIncome / 100,
  incomeTax: annual.estimatedIncomeTax / 100,
  soli: annual.estimatedSoli / 100,
  totalTax: annual.estimatedTotalTax / 100,
  vatBalance: annual.estimatedVatBalance / 100,
  effectiveTaxRate: annual.effectiveTaxRate,
  taxBracket: annual.taxBracket,
});
```

### 4. Batch Analysis

```typescript
const transactions = [
  {
    amount: -11900,
    description: 'AWS',
    classification: await classifier.classifyTransaction(...),
  },
  {
    amount: -2900,
    description: 'Office supplies',
    classification: await classifier.classifyTransaction(...),
  },
];

const results = await analyzer.analyzeBatchDeductions(transactions);

results.forEach((result, idx) => {
  console.log(`${transactions[idx].description}:`);
  console.log(`  Deductible: ${result.deductibleAmount / 100} EUR`);
  console.log(`  Tax Benefit: ${result.netTaxBenefit / 100} EUR`);
});
```

## German Tax Rules

### Deduction Percentages

| Category | Deduction % | Notes |
|----------|-------------|-------|
| **100% Deductible** |
| Office Supplies | 100% | Full deduction with receipt |
| Software | 100% | Full deduction with invoice |
| Cloud Services | 100% | Full deduction with invoice |
| Professional Services | 100% | Lawyers, accountants, consultants |
| Office Rent | 100% | With rental contract |
| **Partial Deductions** |
| Business Meals | 70% | Bewirtungsbeleg required with guest names |
| Phone/Internet | 50% | Standard business share (100% with proof) |
| Home Office | Calculated | €1,260/year max or proportional rent |
| Car | Calculated | Fahrtenbuch or 1% rule |
| **Special Cases** |
| Gifts | 100% | Max €35 per person per year |
| Training | 100% | Professional development only |
| **Not Deductible** |
| Private Expenses | 0% | Not business related |
| Fines/Penalties | 0% | Even if business related |

### VAT Rates

- **Standard Rate (Regelsteuersatz)**: 19%
  - Most goods and services
  - Software, cloud services, consulting

- **Reduced Rate (Ermäßigter Steuersatz)**: 7%
  - Books, newspapers
  - Certain food items
  - Cultural events

- **Exempt (Steuerfrei)**: 0%
  - Export deliveries
  - Intra-community supplies
  - Small business exemption (€22k threshold)

### EÜR Form Lines

Key line numbers on the EÜR (Anlage EÜR) form:

- **Line 12**: Waren, Roh- und Hilfsstoffe
- **Line 13**: Bezogene Fremdleistungen
- **Line 14**: Personalkosten
- **Line 18**: Raumkosten (Miete)
- **Line 20**: Sonstige Betriebsausgaben
- **Line 22**: Abschreibungen (AfA)
- **Line 24**: Kfz-Kosten
- **Line 25**: Reisekosten
- **Line 26**: Bewirtungskosten (70%)
- **Line 27**: Telefon, Internet, Porto
- **Line 28**: Bürobedarf
- **Line 29**: Versicherungen
- **Line 30**: Werbung
- **Line 31**: Rechts- und Steuerberatung
- **Line 32**: Schuldzinsen

### Income Tax Brackets (2024)

| Taxable Income | Rate | Name |
|----------------|------|------|
| €0 - €11,604 | 0% | Grundfreibetrag |
| €11,605 - €17,005 | 14% - 24% | Progressionszone 1 |
| €17,006 - €66,760 | 24% - 42% | Progressionszone 2 |
| €66,761 - €277,825 | 42% | Spitzensteuersatz |
| €277,826+ | 45% | Reichensteuer |

**Solidarity Surcharge**: 5.5% on income tax (with allowances)

## Documentation Requirements

### Required Documents by Category

- **RECEIPT**: Simple purchase receipt (Beleg)
- **INVOICE**: Full invoice with VAT breakdown (Rechnung)
- **CONTRACT**: Service or rental contract (Vertrag)
- **BEWIRTUNGSBELEG**: Special hospitality receipt with:
  - Guest names
  - Business purpose
  - Location and date
  - Signature
- **FAHRTENBUCH**: Mileage log for car expenses
- **EIGENBELEG**: Self-created receipt for small amounts

## Special Cases

### 1. Business Meals (Bewirtung)

- Only **70% deductible**
- VAT **NOT reclaimable**
- Requires special Bewirtungsbeleg with:
  - Names of all guests
  - Business purpose
  - Date and location
  - Signature

### 2. Phone/Internet

- **50% default** business share
- **100% possible** with detailed call records (Einzelverbindungsnachweis)
- Alternative: €20/month flat rate without proof

### 3. Home Office

- **Pauschale**: €1,260/year (€6/day, max 210 days)
- **Proportional**: Based on square meters
- Requirements:
  - Office is center of work activity
  - Or: No other workplace available

### 4. Car Expenses

Two methods:
- **Fahrtenbuch** (Logbook): Actual costs × business %
- **1% Rule**: 1% of list price per month

### 5. Gifts

- Max **€35 per person per year**
- Must document recipient and business relationship
- Advertising costs (Werbekosten) have no limit

### 6. Low-Value Assets (GWG)

- **< €800** (net): Immediate expense
- **€800 - €1,000** (net): Pool depreciation over 5 years
- **> €1,000** (net): Normal depreciation (AfA)

## API Response Format

### DeductionAnalysis

```typescript
{
  deductible: true,
  grossAmount: 11900,        // What was paid (cents)
  netAmount: 10000,          // Excluding VAT (cents)
  deductibleAmount: 10000,   // Deductible amount (cents)
  deductionPercentage: 100,  // Percentage (0-100)
  vatReclaimable: 1900,      // VAT reclaimable (cents)
  vatRate: 0.19,             // VAT rate (19%)
  netTaxBenefit: 6100,       // Total benefit (cents)
  taxCategory: "BUEROKOSTEN",
  eurLineNumber: 28,
  eurDescription: "Bürobedarf, Fachliteratur, Fortbildung",
  documentationRequired: ["RECEIPT"],
  warnings: ["Belege aufbewahren"],
  rule: { /* DeductionRule object */ }
}
```

### QuarterlyDeductions

```typescript
{
  quarter: 1,
  year: 2024,
  totalExpenses: 50000000,      // 50,000 EUR in cents
  totalDeductible: 45000000,    // 45,000 EUR in cents
  vatReclaimable: 8000000,      // 8,000 EUR in cents
  transactionCount: 150,
  byCategory: {
    BUEROKOSTEN: {
      amount: 10000000,
      deductible: 10000000,
      vatReclaimable: 1900000,
      count: 25
    },
    // ...
  },
  eurSummary: {
    28: 10000000,  // Line 28: 10,000 EUR
    26: 5000000,   // Line 26: 5,000 EUR
    // ...
  }
}
```

### AnnualTaxEstimation

```typescript
{
  year: 2024,
  estimatedIncome: 10000000000,      // 100,000 EUR
  estimatedExpenses: 4000000000,     // 40,000 EUR
  estimatedDeductions: 3800000000,   // 38,000 EUR
  estimatedTaxableIncome: 6200000000, // 62,000 EUR
  estimatedIncomeTax: 2100000000,    // 21,000 EUR
  estimatedSoli: 115500000,          // 1,155 EUR
  estimatedTotalTax: 2215500000,     // 22,155 EUR
  estimatedVatBalance: 500000000,    // 5,000 EUR
  effectiveTaxRate: 35.73,           // 35.73%
  taxBracket: "Progressionszone 2",
  quarters: [ /* QuarterlyDeductions[] */ ]
}
```

## Integration

The Tax Deduction Analyzer integrates with:

1. **EnhancedTransactionClassifierService**: Gets tax category from classification
2. **EÜR Line Mapping**: Maps categories to form lines
3. **German Tax Rules**: Applies deduction rules and calculations
4. **Database (Prisma)**: Fetches transactions for quarterly/annual summaries

## Testing

Run tests:
```bash
npm test tax-deduction-analyzer.spec.ts
```

Run examples:
```bash
# In NestJS controller or script
import { runTaxDeductionExamples } from './tax-deduction-analyzer.example';

await runTaxDeductionExamples(classifier, analyzer);
```

## Best Practices

1. **Always classify first**: Use `EnhancedTransactionClassifierService` before analyzing deductions
2. **Store results**: Save deduction analysis in transaction metadata for reporting
3. **Review high-value**: Flag transactions > €5,000 for manual review
4. **Document everything**: Ensure proper documentation for each expense
5. **Quarterly reviews**: Review quarterly summaries with tax advisor
6. **VAT compliance**: Track VAT balance for quarterly filings

## Limitations

1. **Simplified tax calculation**: Actual German income tax uses complex polynomials
2. **Trade tax not included**: Gewerbesteuer calculation not implemented (only for Gewerbetreibende)
3. **Church tax not included**: Kirchensteuer not calculated
4. **No depreciation**: AfA (depreciation) schedules not implemented
5. **No multi-year**: Only single-year calculations

## Future Enhancements

- [ ] Implement precise German tax formula (polynomials)
- [ ] Add trade tax (Gewerbesteuer) calculation
- [ ] Add church tax option
- [ ] Implement depreciation schedules (AfA)
- [ ] Add multi-year tax planning
- [ ] Add tax optimization suggestions
- [ ] Generate EÜR form PDF
- [ ] Add tax deadline reminders
- [ ] Implement VAT return generation

## References

- [German EÜR Guidelines](https://www.bundesfinanzministerium.de)
- [Income Tax Law (EStG)](https://www.gesetze-im-internet.de/estg/)
- [VAT Law (UStG)](https://www.gesetze-im-internet.de/ustg_1980/)
- [AfA Tables](https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Steuern/Weitere_Steuerthemen/Betriebspruefung/AfA-Tabellen/afa-tabellen.html)

## Support

For questions or issues:
1. Check the examples in `tax-deduction-analyzer.example.ts`
2. Review the test cases in `tax-deduction-analyzer.spec.ts`
3. Consult `german-tax-rules.ts` for specific rules
4. Contact the ORACLE agent for AI/ML issues
