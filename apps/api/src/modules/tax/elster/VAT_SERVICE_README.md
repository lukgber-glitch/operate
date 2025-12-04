# ELSTER VAT Service Implementation

## Overview

The ELSTER VAT Service (`ElsterVatService`) implements German VAT return (UStVA - Umsatzsteuervoranmeldung) submission capabilities using the tigerVAT API integration.

## Files Created

### 1. Types (`types/elster-vat.types.ts`)
Comprehensive TypeScript types for VAT filing:
- `UStVAData` - VAT return data structure (all amounts in cents)
- `TaxPeriod` - Period specification (monthly/quarterly/annual)
- `ElsterSubmissionResult` - Submission response
- `ValidationResult` - Validation errors and warnings
- `ElsterFiling` - Filing record interface
- Custom error types (`ElsterVATError`, `ElsterVATErrorCode`)

### 2. Service (`services/elster-vat.service.ts`)
Main service with the following methods:

#### Public Methods
- **`submitUStVA()`** - Submit VAT return to ELSTER via tigerVAT
  - Validates data
  - Checks for duplicates
  - Auto-calculates from invoices (optional)
  - Submits to tigerVAT API
  - Creates filing record

- **`getSubmissionStatus()`** - Get status of submitted filing

- **`calculateVATFromInvoices()`** - Calculate VAT amounts from invoices and expenses
  - Fetches invoices for period
  - Fetches expenses for period
  - Calculates revenue by VAT rate (19%, 7%, 0%)
  - Handles EU deliveries and acquisitions
  - Calculates input tax
  - Returns complete calculation with totals

- **`validateUStVA()`** - Validate UStVA data
  - Tax number format (XXX/XXX/XXXXX)
  - VAT ID format (DE + 9 digits)
  - Period validity
  - Amount non-negativity
  - Warning for large amounts
  - Warning for zero revenue

- **`getFilingHistory()`** - Retrieve filing history
  - Filter by year, period type, status
  - Pagination support

- **`createDraft()`** - Save draft without submitting

- **`testConnection()`** - Test tigerVAT API connectivity

### 3. Unit Tests (`services/__tests__/elster-vat.service.spec.ts`)
Comprehensive test suite covering:
- Validation logic (all scenarios)
- Submission flow
- Dry run mode
- Certificate requirements
- Duplicate detection
- VAT calculation from invoices
- Draft creation
- Filing history retrieval
- Connection testing

### 4. Database Schema
Added `ElsterFiling` model to Prisma schema:
```prisma
model ElsterFiling {
  id              String   @id @default(cuid())
  organisationId  String
  organisation    Organisation @relation(...)

  type            String   // USTVA, ZM, UST
  year            Int
  period          Int      // Month (1-12) or Quarter (1-4)
  periodType      String   // MONTHLY, QUARTERLY, ANNUAL

  status          String   // DRAFT, SUBMITTED, ACCEPTED, REJECTED, ERROR
  submissionId    String?
  transferTicket  String?
  submittedAt     DateTime?
  responseAt      DateTime?

  data            Json     // UStVA data
  response        Json?
  errors          Json?

  certificateId   String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String

  @@unique([organisationId, type, year, period])
  @@index([organisationId, status])
}
```

### 5. Module Configuration
Updated `ElsterModule` to include:
- HttpModule for tigerVAT API calls
- ElsterVatService provider
- Service exports

## UStVA Data Structure

### Revenue Fields (Kennzahlen)
- **Kennzahl 81** (`domesticRevenue19`): 19% domestic revenue
- **Kennzahl 86** (`domesticRevenue7`): 7% reduced rate revenue
- **Kennzahl 48** (`taxFreeRevenue`): Tax-free with input tax deduction
- **Kennzahl 41** (`euDeliveries`): Intra-EU deliveries (tax-free)
- **Kennzahl 89** (`euAcquisitions19`): Intra-EU acquisitions (19%)
- **Kennzahl 93** (`euAcquisitions7`): Intra-EU acquisitions (7%)
- **Kennzahl 60** (`reverseChargeRevenue`): Reverse charge §13b

### Input Tax Fields
- **Kennzahl 66** (`inputTax`): Deductible input tax
- **Kennzahl 62** (`importVat`): Import VAT
- **Kennzahl 61** (`euAcquisitionsInputTax`): Input tax from EU acquisitions

### Calculated Fields
- `outputVat`: Total output VAT
- `totalInputTax`: Sum of all input tax
- `vatPayable`: VAT payable/refundable (output - input)

**Important**: All amounts are stored in **cents** to avoid floating-point precision issues.

## Environment Variables

```bash
# Certificate encryption
ELSTER_CERT_ENCRYPTION_KEY=<32+ character key>

# tigerVAT API
TIGERVAT_BASE_URL=https://sandbox.tigervat.de/v1
TIGERVAT_API_KEY=<your-api-key>
TIGERVAT_TEST_MODE=true
```

## Usage Examples

### 1. Submit VAT Return
```typescript
const result = await elsterVatService.submitUStVA(
  'org-123',
  {
    period: { year: 2024, month: 1 },
    taxNumber: '123/456/78901',
    vatId: 'DE123456789',
    domesticRevenue19: 100000, // €1,000 in cents
    domesticRevenue7: 50000,   // €500 in cents
    taxFreeRevenue: 0,
    euDeliveries: 0,
    euAcquisitions19: 0,
    euAcquisitions7: 0,
    reverseChargeRevenue: 0,
    inputTax: 10000,          // €100 in cents
    importVat: 0,
    euAcquisitionsInputTax: 0,
  },
  {
    autoCalculate: true,  // Calculate from invoices
    testMode: true,       // Submit to sandbox
    dryRun: false,        // Actually submit
  }
);

console.log(result.transferTicket); // ELSTER transfer ticket
```

### 2. Calculate VAT from Invoices
```typescript
const calculation = await elsterVatService.calculateVATFromInvoices(
  'org-123',
  { year: 2024, month: 1 }
);

console.log(calculation.domesticRevenue19);  // Revenue at 19%
console.log(calculation.outputVat);          // Total output VAT
console.log(calculation.vatPayable);         // Amount to pay/refund
console.log(calculation.invoiceCount);       // Number of invoices
```

### 3. Validate Before Submitting
```typescript
const validation = await elsterVatService.validateUStVA(data);

if (!validation.isValid) {
  console.error(validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn(validation.warnings);
}
```

### 4. Create Draft
```typescript
const draft = await elsterVatService.createDraft('org-123', data);
console.log(draft.id); // Filing ID
console.log(draft.status); // DRAFT
```

### 5. Get Filing History
```typescript
const history = await elsterVatService.getFilingHistory('org-123', {
  year: 2024,
  status: ElsterFilingStatus.SUBMITTED,
  limit: 10,
});
```

## Integration with tigerVAT

The service integrates with tigerVAT REST API:

1. **Authentication**: API key in Authorization header
2. **Endpoint**: `POST /vat/submit`
3. **Request**: Organisation ID, certificate ID, UStVA data, test mode flag
4. **Response**: Transfer ticket, status, errors/warnings

### API Request Structure
```typescript
{
  organisationId: string;
  certificateId: string;
  data: UStVAData;
  testMode: boolean;
}
```

### API Response Structure
```typescript
{
  transferTicket: string;
  status: string;
  errors?: string[];
  warnings?: string[];
}
```

## Filing Periods

### Monthly Returns
- Required if VAT liability > €7,500/year
- Period: `{ year: 2024, month: 1 }` through `month: 12`

### Quarterly Returns
- Allowed if VAT liability €1,000-€7,500/year
- Period: `{ year: 2024, quarter: 1 }` through `quarter: 4`
  - Q1: Jan-Mar
  - Q2: Apr-Jun
  - Q3: Jul-Sep
  - Q4: Oct-Dec

### Annual Returns
- For businesses with VAT liability < €1,000/year
- Period: `{ year: 2024 }`

## Error Handling

Custom error type `ElsterVATError` with error codes:
- `VALIDATION_FAILED` - Data validation failed
- `SUBMISSION_FAILED` - tigerVAT submission failed
- `CERTIFICATE_NOT_FOUND` - No active certificate
- `CERTIFICATE_EXPIRED` - Certificate expired
- `INVALID_PERIOD` - Invalid period specification
- `DUPLICATE_SUBMISSION` - Period already submitted
- `CALCULATION_ERROR` - VAT calculation error
- `CONNECTION_ERROR` - tigerVAT API unreachable
- `API_ERROR` - tigerVAT API error
- `UNAUTHORIZED` - Invalid credentials

## Dependencies

- `@nestjs/common` - NestJS core
- `@nestjs/config` - Configuration
- `@nestjs/axios` - HTTP client
- `rxjs` - Observable utilities
- `@prisma/client` - Database access
- `ElsterCertificateService` - Certificate management

## Next Steps

1. **Migration**: Run Prisma migration to create `ElsterFiling` table
   ```bash
   npx prisma migrate dev --name add_elster_filing
   ```

2. **Testing**: Run tests
   ```bash
   npm test elster-vat.service
   ```

3. **Integration**: Create controller endpoints for VAT submission

4. **API Key**: Obtain tigerVAT API key and configure environment

5. **Certificate**: Upload ELSTER certificate using `ElsterCertificateService`

## Notes

- All monetary amounts MUST be in cents (e.g., €100.00 = 10000 cents)
- Tax number format: `XXX/XXX/XXXXX`
- VAT ID format: `DE` + 9 digits
- Duplicate submissions are prevented (one per period/type)
- Draft filings can be created without submission
- Auto-calculation from invoices is optional
- Test mode submits to tigerVAT sandbox environment

## Security Considerations

1. **Certificate Security**: Certificates are encrypted using `ElsterCertificateService`
2. **API Keys**: Store in environment variables, never commit
3. **Audit Logging**: All submissions are logged in `ElsterFiling` table
4. **Validation**: Comprehensive validation before submission
5. **Duplicate Prevention**: Unique constraint prevents double filing

## License

Part of Operate/CoachOS - Enterprise SaaS for SME business operations
