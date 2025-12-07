# VAT Return Module

Backend service for generating VAT return previews and handling the approval workflow before ELSTER submission.

## Overview

This module provides comprehensive VAT return functionality for German businesses, supporting:
- Monthly, quarterly, and yearly VAT return periods
- German VAT rates (19%, 7%, 0%)
- Output VAT calculation from invoices
- Input VAT calculation from expenses
- Approval workflow
- ELSTER submission tracking

## Architecture

### Services

#### `VatReturnPreviewService`
Generates VAT return previews without saving to database:
- Parses period formats (YYYY-QN, YYYY-MM, YYYY)
- Aggregates invoices and expenses by VAT rate
- Calculates net VAT position
- Generates warnings and missing data alerts
- Calculates due dates according to German regulations

#### `VatReturnService`
Main service for VAT return lifecycle management:
- Create draft from preview
- Submit for approval
- Approve returns
- Track ELSTER submission status
- Manage history
- Update preview data
- Delete drafts/rejected returns

### Data Models

#### `VatReturn` (Prisma)
```prisma
model VatReturn {
  id             String          @id @default(uuid())
  organisationId String
  period         String          // "2025-Q1", "2025-01", "2025"
  periodType     String          // "monthly" | "quarterly" | "yearly"
  periodStart    DateTime
  periodEnd      DateTime
  outputVat      Decimal         // VAT on sales
  inputVat       Decimal         // VAT on purchases
  netVat         Decimal         // outputVat - inputVat
  status         VatReturnStatus
  transferTicket String?         // ELSTER ticket
  receiptId      String?         // ELSTER receipt
  submittedAt    DateTime?
  approvedBy     String?
  approvedAt     DateTime?
  previewData    Json            // Full preview snapshot
  // ... timestamps
}
```

#### Status Flow
```
DRAFT → PENDING_APPROVAL → APPROVED → SUBMITTED → ACCEPTED/REJECTED
```

## API Endpoints

### Preview & Creation

**GET /tax/vat-return/preview**
Generate preview without saving
- Query: `organizationId`, `period`
- Returns: Full preview with breakdown by VAT rate

**POST /tax/vat-return**
Create draft from preview
- Body: `CreateVatReturnDto`
- Returns: Created VAT return record

### Retrieval

**GET /tax/vat-return/history**
Get history for organization
- Query: `organizationId`, `year` (optional)
- Returns: Array of VAT returns

**GET /tax/vat-return/:id**
Get by ID
- Param: `id`
- Returns: VAT return record

**GET /tax/vat-return/period/:organizationId/:period**
Get by organization and period
- Params: `organizationId`, `period`
- Returns: VAT return record or null

### Workflow

**POST /tax/vat-return/:id/submit-for-approval**
Submit for approval
- Param: `id`
- Status: DRAFT → PENDING_APPROVAL

**POST /tax/vat-return/:id/approve**
Approve return
- Param: `id`
- Body: `ApproveVatReturnDto` (userId, notes)
- Status: PENDING_APPROVAL → APPROVED

**POST /tax/vat-return/:id/submit**
Mark as submitted to ELSTER
- Param: `id`
- Body: `SubmitVatReturnDto` (transferTicket, receiptId)
- Status: APPROVED → SUBMITTED

**POST /tax/vat-return/:id/accept**
Mark as accepted by ELSTER
- Param: `id`
- Status: SUBMITTED → ACCEPTED

**POST /tax/vat-return/:id/reject**
Mark as rejected by ELSTER
- Param: `id`
- Body: `RejectVatReturnDto` (reason, errorCode)
- Status: SUBMITTED → REJECTED

### Management

**PUT /tax/vat-return/:id/preview**
Update preview data
- Param: `id`
- Only for DRAFT or PENDING_APPROVAL status

**DELETE /tax/vat-return/:id**
Delete return
- Param: `id`
- Only for DRAFT or REJECTED status

## VAT Calculation

### Output VAT (from Invoices)
- Includes all non-DRAFT, non-CANCELLED invoices in period
- Excludes reverse charge invoices
- Grouped by VAT rate (19%, 7%, 0%)
- Tracks: invoice number, customer, amounts

### Input VAT (from Expenses)
- Includes APPROVED and PAID expenses only
- Only deductible expenses with VAT amount
- Grouped by VAT rate (19%, 7%)
- Tracks: description, vendor, amounts

### Net VAT Position
```
Net VAT = Output VAT - Input VAT
```
- Positive: VAT payment due
- Negative: VAT refund expected

## Due Dates (German Regulations)

- **Monthly**: 10th of following month
- **Quarterly**: 10th of month following quarter end
- **Yearly**: May 31st of following year

## Warnings & Validation

The system generates warnings for:
- Invoices without VAT rate
- Expenses without VAT where expected
- Unusual VAT rates (not 19% or 7%)
- High-value invoices without customer VAT ID

Missing data flags:
- No invoices or expenses in period

## Usage Example

### 1. Generate Preview
```typescript
GET /tax/vat-return/preview?organizationId=org_123&period=2025-Q1
```

### 2. Create Draft
```typescript
POST /tax/vat-return
{
  "organizationId": "org_123",
  "period": "2025-Q1"
}
```

### 3. Submit for Approval
```typescript
POST /tax/vat-return/abc123/submit-for-approval
```

### 4. Approve
```typescript
POST /tax/vat-return/abc123/approve
{
  "userId": "user_456",
  "notes": "Reviewed and approved"
}
```

### 5. Submit to ELSTER (external process)
After ELSTER submission:
```typescript
POST /tax/vat-return/abc123/submit
{
  "transferTicket": "TT-2025-001-ABC",
  "receiptId": "REC-2025-001"
}
```

### 6. Mark Result
```typescript
POST /tax/vat-return/abc123/accept
// or
POST /tax/vat-return/abc123/reject
{
  "reason": "Invalid tax number",
  "errorCode": "ERR_TAX_NUMBER"
}
```

## Integration Points

### With ELSTER Module
- VAT return data can be used to generate ELSTER XML
- Transfer ticket and receipt ID stored after submission
- Acceptance/rejection status tracked

### With Invoice Module
- Reads invoices by period
- Filters by status (excludes DRAFT, CANCELLED)
- Respects reverse charge flag

### With Expense Module
- Reads expenses by period
- Filters by status (APPROVED, PAID only)
- Respects deductible flag

## Database Migration

Run Prisma migration to add VatReturn model:
```bash
cd packages/database
npx prisma migrate dev --name add_vat_return_model
```

## Testing

Key test scenarios:
1. Preview generation with mixed VAT rates
2. Period parsing (quarterly, monthly, yearly)
3. Status transitions and validation
4. Approval workflow
5. Warning generation
6. Due date calculation

## Security

- All endpoints require JWT authentication
- User ID tracked for approvals
- Audit trail via previewData snapshot
- Status transitions validated

## Auto-Generation Services (NEW)

### VatCalculationService

Automatically calculates VAT from transactions with enhanced features:

```typescript
import { VatCalculationService } from './vat-calculation.service';

const calculation = await vatCalculationService.calculateVat(
  organizationId,
  '2025-Q1'
);

// Result includes:
// - umsaetze (output VAT): 19%, 7%, tax-free, EU deliveries, reverse charge
// - vorsteuer (input VAT): deductible, EU acquisitions, import
// - zahllast: net VAT payable
// - confidence: data quality score (0-100)
// - warnings: data quality warnings
```

**Features:**
- EU VAT ID validation
- Automatic EU delivery detection
- Reverse charge handling
- Confidence scoring
- Warning generation
- Text summary export

### ElsterXmlGeneratorService

Generates ELSTER-compatible XML for submission:

```typescript
import { ElsterXmlGeneratorService } from './elster-xml-generator.service';

const xml = elsterXmlGenerator.generateUstVaXml(
  calculation,
  {
    taxNumber: '123/456/78901',
    vatId: 'DE123456789',
    taxOfficeId: '1234',
    name: 'My Company GmbH',
  },
  { testMode: true }
);

// Validate before submission
const validation = elsterXmlGenerator.validateXml(xml);
```

**Features:**
- ERiC XML schema compliance
- Automatic Kennzahlen mapping
- Period format conversion
- XML validation
- Test mode support
- Transfer ticket generation

### ELSTER Kennzahlen Reference

| Field | Description | Amount in Cents |
|-------|-------------|-----------------|
| KZ 81 | Steuerpflichtige Umsätze 19% | Net revenue |
| KZ 86 | Steuerpflichtige Umsätze 7% | Net revenue |
| KZ 43 | Steuerfreie Umsätze | Net amount |
| KZ 41 | Innergemeinschaftliche Lieferungen | Net amount |
| KZ 60 | Reverse Charge Umsätze (§13b UStG) | Net amount |
| KZ 66 | Vorsteuerbeträge | VAT amount |
| KZ 61 | Innergemeinschaftliche Erwerbe Vorsteuer | VAT amount |
| KZ 62 | Einfuhrumsatzsteuer | VAT amount |
| KZ 83 | Verbleibende Umsatzsteuer-Vorauszahlung | Net VAT |

### Integration Example

```typescript
// 1. Calculate VAT
const calculation = await vatCalculationService.calculateVat(orgId, '2025-Q1');

// 2. Check confidence
if (calculation.confidence < 70) {
  console.warn('Low confidence:', calculation.warnings);
}

// 3. Generate XML
const xml = await vatReturnPreviewService.generateElsterXml(orgId, '2025-Q1');

// 4. Submit via existing ELSTER service
await elsterVatService.submitUStVA(orgId, calculation);
```

### Confidence Scoring

- **100%**: Perfect data quality
- **90-99%**: Minor issues (few invoices/expenses)
- **70-89%**: Some missing data
- **<70%**: Significant data quality issues

**Deductions:**
- -30% if no invoices
- -20% if no expenses
- -2% per invoice without VAT amount
- -2% per expense without VAT info

### Period Formats

**Input formats:**
- Monthly: `"2025-01"` to `"2025-12"`
- Quarterly: `"2025-Q1"` to `"2025-Q4"`

**ELSTER Zeitraum codes:**
- Monthly: `"01"` to `"12"`
- Quarterly: `"41"` (Q1), `"42"` (Q2), `"43"` (Q3), `"44"` (Q4)

### EU VAT Handling

**EU Deliveries (KZ 41):**
- Customer has valid EU VAT ID
- VAT ID starts with EU country code (not DE)
- 0% VAT charged
- Tax-free intra-community supply

**EU Acquisitions (KZ 61):**
- Expense from EU supplier
- Supplier has valid EU VAT ID
- Input VAT deductible

**Supported EU countries:**
AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MT, NL, PL, PT, RO, SK, SI, ES, SE

### XML Structure Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://www.elster.de/elsterxml/schema/v11">
  <TransferHeader version="11">
    <Verfahren>ElsterAnmeldung</Verfahren>
    <DatenArt>UStVA</DatenArt>
    <Vorgang>send-NoSig</Vorgang>
    <TransferTicket>ABC123...</TransferTicket>
    <Testmerker>700000004</Testmerker>
  </TransferHeader>
  <DatenTeil>
    <Nutzdatenblock>
      <Nutzdaten>
        <Anmeldungssteuern art="UStVA" version="202401">
          <Steuernummer>123/456/78901</Steuernummer>
          <Jahr>2025</Jahr>
          <Zeitraum>41</Zeitraum>
          <Kz81>1000000</Kz81>
          <Kz66>200000</Kz66>
          <Kz83>800000</Kz83>
        </Anmeldungssteuern>
      </Nutzdaten>
    </Nutzdatenblock>
  </DatenTeil>
</Elster>
```

## Future Enhancements

- [x] Automatic VAT calculation from transactions
- [x] ELSTER XML generation
- [x] EU VAT handling
- [x] Confidence scoring
- [ ] Automatic reconciliation with bank transactions
- [ ] Email notifications for approvals
- [ ] PDF export of VAT return summary
- [ ] Integration with payment processing
- [ ] Multi-currency support
- [ ] VIES API integration for VAT ID validation
- [ ] OSS/MOSS support for EU VAT
