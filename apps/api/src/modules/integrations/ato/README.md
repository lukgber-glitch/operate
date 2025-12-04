# ATO Integration Module

Complete integration with the Australian Taxation Office (ATO) for tax filing and business reporting.

## Features

### 1. Business Activity Statement (BAS) Filing
- GST reporting (G1-G11 labels)
- PAYG income tax instalments
- PAYG withholding
- FBT instalments
- Monthly, quarterly, and annual lodgement support
- Pre-fill data retrieval
- Obligation tracking

### 2. Single Touch Payroll (STP) Phase 2
- Pay event submission (real-time payroll reporting)
- Update event submission (corrections)
- Finalisation events (end of financial year)
- Full file replacement support
- Up to 1,000 employees per submission

### 3. Taxable Payments Annual Report (TPAR)
- Contractor payment reporting
- Industry-specific requirements
- Supports building, cleaning, courier, IT, security, and government sectors
- Due 28 August following financial year

### 4. Authentication & Security
- myGovID integration
- Relationship Authorisation Manager (RAM)
- OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- Machine-to-machine (M2M) credential support
- AES-256-GCM token encryption
- TLS 1.2+ for all communications

## Installation

The module is already integrated into the NestJS application. Ensure environment variables are configured:

```env
# ATO Configuration
ATO_ENVIRONMENT=sandbox # or 'production'
ATO_CLIENT_ID=your-client-id
ATO_CLIENT_SECRET=your-client-secret
ATO_ENCRYPTION_SECRET=your-encryption-secret
```

## Usage

### Initialize ATO Connection

```typescript
import { AtoService } from '@/modules/integrations/ato';

// Generate authorization URL
const authData = await atoService.initializeConnection({
  clientId: process.env.ATO_CLIENT_ID,
  clientSecret: process.env.ATO_CLIENT_SECRET,
  redirectUri: 'https://app.example.com/ato/callback',
  scope: ['bas', 'stp', 'tpar'],
  abn: '12345678901',
});

// Redirect user to authData.url
// Store authData.codeVerifier and authData.state for callback
```

### Complete Authorization

```typescript
// After user returns from myGovID
const token = await atoService.completeAuthorization(
  credentials,
  authorizationCode,
  codeVerifier,
);

// Token is now cached and can be used for API calls
```

### Submit Business Activity Statement

```typescript
const basRequest = {
  organizationId: 'org-123',
  abn: '12345678901',
  statement: {
    abn: '12345678901',
    period: '2024-Q2',
    periodType: 'QUARTERLY',
    dueDate: new Date('2024-07-28'),
    gst: {
      g1TotalSales: 110000,
      g2ExportSales: 0,
      g3OtherGstFreeSales: 10000,
      g4InputTaxedSales: 0,
      g10CapitalPurchases: 5000,
      g11NonCapitalPurchases: 40000,
    },
    paygWithholding: {
      w1TotalPayments: 50000,
      w2WithheldFromPayments: 10000,
    },
    declarationName: 'John Doe',
    declarationDate: new Date(),
  },
};

const response = await atoService.submitBas(basRequest, token);

console.log(`BAS submitted: ${response.filingId}`);
console.log(`Status: ${response.status}`);
console.log(`Receipt: ${response.receiptNumber}`);
```

### Submit STP Pay Event

```typescript
const stpSubmission = {
  abn: '12345678901',
  payPeriod: {
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-14'),
  },
  employees: [
    {
      employee: {
        tfn: '123456789',
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: new Date('1985-05-15'),
        address: {
          line1: '123 Main St',
          suburb: 'Sydney',
          state: 'NSW',
          postcode: '2000',
        },
      },
      employment: {
        employmentType: 'FULL_TIME',
        startDate: new Date('2020-01-01'),
        payrollId: 'PR001',
        taxTreatment: 'REGULAR',
        taxFileNumberProvided: true,
        claimsTaxFreeThreshold: true,
        hasHelpDebt: false,
        hasSfssDebt: false,
      },
      payPeriod: {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-14'),
        paymentDate: new Date('2024-06-14'),
      },
      income: {
        gross: 5000,
        paygWithholding: 1200,
      },
      superannuation: [
        {
          fund: {
            abn: '98765432101',
            name: 'Super Fund Pty Ltd',
          },
          ordinaryTime: 475,
          superGuarantee: 475,
        },
      ],
    },
  ],
};

const response = await atoService.submitStpPayEvent(
  'org-123',
  stpSubmission,
  token,
);
```

### Submit TPAR

```typescript
const tparSubmission = {
  abn: '12345678901',
  financialYear: '2023-2024',
  industryCode: 'BUILDING_CONSTRUCTION',
  payments: [
    {
      abn: '98765432101',
      contractorName: 'ABC Contracting Pty Ltd',
      address: {
        line1: '456 Builder St',
        suburb: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
      },
      totalPayments: 85000,
      gstIncluded: 7727.27,
    },
  ],
  declarationName: 'Jane Doe',
  declarationDate: new Date(),
};

const response = await atoService.submitTpar('org-123', tparSubmission, token);
```

### Get BAS Obligations

```typescript
const obligations = await atoService.getBasObligations(
  '12345678901',
  'org-123',
  token,
  new Date('2024-01-01'),
  new Date('2024-12-31'),
);

obligations.forEach((obligation) => {
  console.log(`Period: ${obligation.period}`);
  console.log(`Due: ${obligation.dueDate}`);
  console.log(`Status: ${obligation.status}`);
});
```

### ABN Lookup

```typescript
const abnDetails = await atoService.lookupAbn('12345678901');

console.log(`Entity Name: ${abnDetails.entityName}`);
console.log(`ABN Status: ${abnDetails.abnStatus}`);
console.log(`GST Registered: ${abnDetails.gstRegistered}`);
```

## BAS Label Codes

### GST Labels
- **G1**: Total sales
- **G2**: Export sales
- **G3**: Other GST-free sales
- **G4**: Input taxed sales
- **G9**: GST on sales (calculated automatically)
- **G10**: Capital purchases
- **G11**: Non-capital purchases
- **G20**: GST on purchases (calculated automatically)
- **G21**: Net GST (G9 - G20)

### PAYG Withholding Labels
- **W1**: Total salary, wages and other payments
- **W2**: Amounts withheld from payments
- **W3**: Amounts withheld where no ABN quoted
- **W4**: Amounts withheld from investment income
- **W5**: Total amounts withheld (calculated automatically)

### PAYG Instalments Labels
- **T1**: Instalment income
- **T2**: New varied rate
- **T4**: PAYG instalment amount

### FBT Labels
- **F1**: FBT instalment amount
- **F2**: Estimated total FBT liability

## STP Employment Types

- **F**: Full-time
- **P**: Part-time
- **C**: Casual
- **L**: Labour hire
- **D**: Death beneficiary
- **S**: Superannuation income stream

## STP Tax Treatment Codes

- **R**: Regular
- **B**: Back payment
- **C**: Commission
- **D**: Director
- **S**: Seasonal worker
- **H**: Working holiday maker
- **N**: No TFN provided
- **A**: Senior Australian

## TPAR Industry Codes

- `BUILDING_CONSTRUCTION`: Building and construction services
- `CLEANING`: Cleaning services
- `COURIER_FREIGHT`: Couriers and road freight services
- `IT_SERVICES`: Information technology services
- `SECURITY_INVESTIGATION`: Security, investigation or surveillance services
- `GOVERNMENT`: Government entities

## Important Dates

### BAS Lodgement
- **Monthly**: 21st of the following month
- **Quarterly**: 28th of the month following the quarter
  - Q1 (Jul-Sep): Due 28 Oct
  - Q2 (Oct-Dec): Due 28 Feb
  - Q3 (Jan-Mar): Due 28 Apr
  - Q4 (Apr-Jun): Due 28 Jul
- **Annual**: 31 October following the financial year

### STP
- **Pay Events**: On or before payment date
- **Finalisation**: By 14 July following the end of financial year

### TPAR
- **Lodgement**: By 28 August following the end of financial year

## Validation Rules

### ABN
- Must be exactly 11 digits
- Spaces are allowed and will be removed

### TFN
- Must be 8 or 9 digits
- Spaces are allowed and will be removed

### Amounts
- BAS: -999,999,999.99 to 999,999,999.99
- STP Gross: 0 to 999,999,999.99
- All amounts rounded to 2 decimal places

### STP Limits
- Maximum 1,000 employees per pay event
- Maximum file size: 50MB

## Error Handling

The module provides detailed error codes and messages:

```typescript
try {
  await atoService.submitBas(request, token);
} catch (error) {
  if (error.code === 'ATO_E104') {
    console.error('BAS validation failed:', error.errors);
  } else if (error.code === 'ATO_E002') {
    console.error('Token expired, please re-authenticate');
  }
}
```

### Error Codes

- **ATO_E001**: Invalid token
- **ATO_E002**: Token expired
- **ATO_E003**: Invalid credentials
- **ATO_E004**: RAM authentication failed
- **ATO_E101**: Invalid ABN
- **ATO_E102**: Invalid TFN
- **ATO_E103**: Invalid period
- **ATO_E104**: Invalid BAS data
- **ATO_E105**: Invalid STP data
- **ATO_E201**: Duplicate submission
- **ATO_E202**: Obligation not found
- **ATO_E204**: Already lodged
- **ATO_E301**: API unavailable
- **ATO_E302**: Rate limited

## Audit Logging

All submissions are automatically logged:

```typescript
const auditLogs = await atoService.getAuditLogs(
  'org-123',
  new Date('2024-01-01'),
  new Date('2024-12-31'),
);

auditLogs.forEach((log) => {
  console.log(`${log.timestamp}: ${log.action} - ${log.status}`);
  if (log.errors) {
    console.log('Errors:', log.errors);
  }
});
```

## Testing

Run the test suite:

```bash
npm test -- ato
```

The module includes comprehensive unit tests for:
- BAS label calculation
- STP validation
- Authentication and PKCE
- Token encryption/decryption
- ABN/TFN validation

## Security Considerations

1. **Token Storage**: Access tokens are encrypted with AES-256-GCM before storage
2. **TLS**: All API communications use TLS 1.2 or higher
3. **PKCE**: OAuth flow uses PKCE to prevent authorization code interception
4. **Secrets**: Never log or expose client secrets or access tokens
5. **Audit**: All API calls are logged for compliance

## API Documentation

Official ATO API documentation:
- [ATO Software Developers](https://www.ato.gov.au/business/software-developers/)
- [STP Phase 2](https://www.ato.gov.au/business/single-touch-payroll/)
- [BAS Information](https://www.ato.gov.au/business/business-activity-statements/)
- [TPAR Guide](https://www.ato.gov.au/business/reports-and-returns/taxable-payments-annual-report/)

## Support

For issues or questions:
1. Check the ATO's software developer resources
2. Review audit logs for detailed error information
3. Contact ATO support for API-specific issues
4. Refer to test cases for usage examples
