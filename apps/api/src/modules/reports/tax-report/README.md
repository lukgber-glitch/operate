# Tax Report Module

Comprehensive tax reporting module for German and Austrian tax compliance, including income tax, VAT/USt, and trade tax (Gewerbesteuer) calculations.

## Features

### 📊 Tax Summary Report
- **Income Tax (Einkommensteuer)**: Progressive tax brackets, deductions, credits
- **VAT/USt (Umsatzsteuer)**: Output tax, input tax, net position, intra-EU
- **Trade Tax (Gewerbesteuer)**: Germany-specific business tax with municipal multipliers
- **Quarterly Estimates**: Automated quarterly payment calculations
- **Tax Deadlines**: Country-specific filing and payment deadlines

### 🇩🇪 Germany Support
- **Income Tax Brackets (2024)**:
  - €0 - €11,604: 0% (Grundfreibetrag)
  - €11,604 - €17,005: 14%
  - €17,005 - €66,760: 24%
  - €66,760 - €277,825: 42%
  - €277,825+: 45% (Reichensteuer)

- **VAT Rates**:
  - Standard: 19%
  - Reduced: 7%

- **Trade Tax**: 3.5% base rate × municipal multiplier (Hebesatz)

- **ELSTER Export**: XML format for electronic submission to Finanzamt

### 🇦🇹 Austria Support
- **Income Tax Brackets (2024)**:
  - €0 - €12,816: 0%
  - €12,816 - €20,818: 20%
  - €20,818 - €34,513: 30%
  - €34,513 - €66,612: 40%
  - €66,612 - €99,266: 48%
  - €99,266 - €1,000,000: 50%
  - €1,000,000+: 55% (Millionaire's tax)

- **VAT Rates**:
  - Standard: 20%
  - Reduced: 10%
  - Super-reduced: 13%

- **FinanzOnline Export**: XML format for Austrian tax authorities

## API Endpoints

### Tax Summary
```http
GET /reports/tax/summary?organizationId={id}&taxYear={year}&country={DE|AT}
```
Generates comprehensive tax summary with income tax, VAT, trade tax, and deadlines.

**Query Parameters**:
- `organizationId` (required): Organization identifier
- `taxYear` (required): Tax year (e.g., 2024)
- `country` (optional): DE or AT (default: DE)
- `includeDeductions` (optional): Include deductions breakdown (default: true)
- `includeVat` (optional): Include VAT report (default: true)
- `includeAuditTrail` (optional): Include audit trail (default: false)

**Response**:
```json
{
  "reportId": "TR-1234567890-ABCD1234",
  "organizationId": "org-123",
  "taxYear": 2024,
  "country": "DE",
  "generatedAt": "2024-12-04T10:00:00Z",
  "incomeTax": {
    "grossRevenue": 150000,
    "totalDeductions": 30000,
    "taxableIncome": 120000,
    "taxLiability": 35000,
    "netTaxDue": 35000,
    "effectiveTaxRate": 23.33,
    "bracketBreakdown": [...],
    "deductions": [...]
  },
  "vat": {
    "totalVatCollected": 28500,
    "totalVatPaid": 5700,
    "netVatPosition": 22800,
    "rateBreakdown": [...]
  },
  "tradeTax": {
    "tradeTaxBase": 120000,
    "municipalMultiplier": 400,
    "tradeTaxLiability": 16800
  },
  "quarterlyEstimates": [...],
  "upcomingDeadlines": [...]
}
```

### VAT Report
```http
GET /reports/tax/vat?organizationId={id}&startDate={date}&endDate={date}&country={DE|AT}
```
Generates VAT report for specific period.

**Query Parameters**:
- `organizationId` (required): Organization identifier
- `startDate` (required): Period start (YYYY-MM-DD)
- `endDate` (required): Period end (YYYY-MM-DD)
- `country` (required): DE or AT
- `includeIntraEu` (optional): Include EU transactions (default: true)

### Income Tax Report
```http
GET /reports/tax/income?organizationId={id}&taxYear={year}&country={DE|AT}
```
Generates income tax report with deductions and quarterly estimates.

### Deductions Analysis
```http
GET /reports/tax/deductions?organizationId={id}&taxYear={year}
```
Analyzes all deductible expenses and identifies potential savings.

**Response**:
```json
{
  "organizationId": "org-123",
  "taxYear": 2024,
  "deductions": [
    {
      "category": "HOME_OFFICE",
      "description": "Home Office Deduction",
      "amount": 1260,
      "itemCount": 210,
      "documentIds": [...]
    }
  ],
  "totalDeductions": 30000,
  "potentialDeductions": [...],
  "estimatedSavings": 5000
}
```

### ELSTER Export (Germany)
```http
GET /reports/tax/export/elster?organizationId={id}&taxYear={year}
```
Generates ELSTER-compatible XML for electronic submission to German tax authorities.

**Query Parameters**:
- `taxOfficeNumber` (optional): Finanzamtnummer
- `taxIdentifier` (optional): Steuernummer

### FinanzOnline Export (Austria)
```http
GET /reports/tax/export/finanzonline?organizationId={id}&taxYear={year}
```
Generates FinanzOnline-compatible XML for Austrian tax authorities.

### Tax Deadlines
```http
GET /reports/tax/deadlines?country={DE|AT}&taxYear={year}
```
Retrieves upcoming tax filing and payment deadlines.

**Response**:
```json
[
  {
    "description": "Einkommensteuererklärung (Income Tax Return)",
    "dueDate": "2025-07-31T00:00:00Z",
    "taxType": "INCOME",
    "isOverdue": false,
    "daysUntilDue": 239
  },
  {
    "description": "Umsatzsteuer-Voranmeldung (Monthly VAT Return)",
    "dueDate": "2025-01-10T00:00:00Z",
    "taxType": "VAT",
    "isOverdue": false,
    "daysUntilDue": 37
  }
]
```

### Quarterly Estimates
```http
GET /reports/tax/quarterly-estimates?annualTaxLiability={amount}&taxYear={year}
```
Calculates quarterly estimated tax payments.

### Effective Tax Rate
```http
GET /reports/tax/effective-rate?taxPaid={amount}&grossIncome={amount}
```
Calculates effective tax rate percentage.

## Deduction Categories

The system automatically categorizes expenses into deductible categories:

- **Business Expenses**: General operating expenses
- **Depreciation**: Asset depreciation schedules
- **Home Office**: Home office deduction (max €1,260 DE, €1,200 AT)
- **Travel**: Business travel and transportation
- **Entertainment**: Meals & entertainment (70% DE, 50% AT)
- **Professional Development**: Training, courses, certifications
- **Insurance**: Business insurance premiums
- **Retirement**: Retirement plan contributions
- **Vehicle**: Vehicle expenses and mileage
- **Utilities**: Business utilities
- **Rent**: Business rent payments
- **Interest**: Business loan interest
- **Other**: Miscellaneous deductible expenses

## Tax Calculation Logic

### Income Tax Calculation
1. Calculate gross revenue from all income transactions
2. Identify and categorize deductible expenses
3. Apply category-specific deduction limits
4. Calculate taxable income (revenue - deductions)
5. Apply progressive tax brackets
6. Calculate total tax liability
7. Apply tax credits and prepayments
8. Determine net tax due or refund

### VAT Calculation
1. Separate income (output tax) and expenses (input tax)
2. Calculate VAT collected at applicable rates
3. Calculate VAT paid on business expenses
4. Identify reverse charge and intra-EU transactions
5. Calculate net VAT position (collected - paid)
6. Generate rate-specific breakdowns

### Trade Tax (Germany)
1. Start with taxable income
2. Apply add-backs and deductions per tax law
3. Calculate trade tax base (Gewerbeertrag)
4. Apply 3.5% base rate (Steuermesszahl)
5. Multiply by municipal multiplier (Hebesatz)
6. Calculate trade tax credit against income tax

## File Exports

### ELSTER (Germany)
ELSTER (ELektronische STeuerERklärung) XML format includes:
- Transfer header with verification codes
- Income tax declaration (Einkommensteuererklärung)
- VAT declaration (Umsatzsteuererklärung)
- Digital signature support
- Tax office routing

### FinanzOnline (Austria)
FinanzOnline XML format includes:
- Message specification with tax ID
- Income tax return data
- VAT return data
- Rate-specific breakdowns
- Electronic submission metadata

## Security & Compliance

- **RBAC**: Role-based access (OWNER, ADMIN, ACCOUNTANT only)
- **Audit Trail**: Complete change history for all tax data
- **Data Retention**: Tax reports stored for 10+ years
- **Encryption**: All tax data encrypted at rest
- **GoBD Compliance**: German tax data retention requirements
- **GDPR**: Personal data protection and privacy

## Usage Examples

### TypeScript/NestJS
```typescript
import { TaxReportService } from '@/modules/reports/tax-report';

// Generate tax summary
const summary = await taxReportService.generateTaxSummary({
  organizationId: 'org-123',
  taxYear: 2024,
  country: TaxReportCountry.GERMANY,
  includeDeductions: true,
  includeVat: true,
});

// Calculate tax liability
const { taxLiability, bracketBreakdown } = taxReportService.calculateTaxLiability(
  120000,
  germanTaxBrackets,
);

// Generate ELSTER export
const elsterXml = await taxReportService.generateElsterExport({
  organizationId: 'org-123',
  taxYear: 2024,
  format: TaxExportFormat.ELSTER_XML,
  taxOfficeNumber: '9198',
});
```

### cURL
```bash
# Get tax summary
curl -X GET "http://localhost:3000/api/reports/tax/summary?organizationId=org-123&taxYear=2024&country=DE" \
  -H "Authorization: Bearer {token}"

# Get VAT report
curl -X GET "http://localhost:3000/api/reports/tax/vat?organizationId=org-123&startDate=2024-01-01&endDate=2024-01-31&country=DE" \
  -H "Authorization: Bearer {token}"

# Export ELSTER
curl -X GET "http://localhost:3000/api/reports/tax/export/elster?organizationId=org-123&taxYear=2024" \
  -H "Authorization: Bearer {token}" \
  -o elster_export.xml
```

## Testing

```bash
# Run tests
npm test tax-report.service.spec.ts

# Run with coverage
npm test -- --coverage tax-report.service.spec.ts
```

## Future Enhancements

- [ ] Additional EU countries support
- [ ] Corporate tax (Körperschaftsteuer) calculations
- [ ] Church tax (Kirchensteuer) integration
- [ ] Solidarity surcharge (Solidaritätszuschlag)
- [ ] Real-time tax authority API integration
- [ ] AI-powered deduction recommendations
- [ ] Multi-year tax planning
- [ ] Tax optimization suggestions
- [ ] Estimated vs. actual comparisons
- [ ] Tax loss carryforward tracking

## References

- [German Tax Law (EStG)](https://www.gesetze-im-internet.de/estg/)
- [ELSTER Documentation](https://www.elster.de/)
- [Austrian Tax Law](https://www.bmf.gv.at/)
- [FinanzOnline](https://finanzonline.bmf.gv.at/)
- [EU VAT Directives](https://ec.europa.eu/taxation_customs/business/vat_en)
