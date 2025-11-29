# ELSTER Integration Module

Complete ELSTER API integration for German tax filing (Einheitliche Schnittstelle für die elektronische Steuererklärung).

## Overview

This module provides a comprehensive integration with the German ELSTER system for electronic tax filing. It supports multiple tax return types including VAT returns, income tax returns, and employee tax reporting.

## Features

- **Certificate Authentication**: Secure PFX certificate handling with encryption
- **VAT Return Submission**: Umsatzsteuervoranmeldung (UStVA)
- **Income Tax Return**: Einkommensteuererklärung (ESt)
- **Employee Tax Reporting**: Lohnsteueranmeldung
- **Sandbox Support**: Test mode for development and testing
- **Error Handling**: Automatic retry logic with exponential backoff
- **Audit Trail**: Complete logging of all submissions
- **XML Generation**: ELSTER-compliant XML document generation

## Module Structure

```
elster/
├── elster.module.ts              # NestJS module configuration
├── elster.service.ts             # Core business logic
├── elster.controller.ts          # HTTP endpoints
├── index.ts                      # Public exports
├── interfaces/
│   ├── elster-config.interface.ts       # Configuration types
│   ├── elster-response.interface.ts     # Response types
│   └── elster-submission.interface.ts   # Submission types
├── dto/
│   ├── vat-return.dto.ts               # VAT return DTOs
│   ├── income-tax-return.dto.ts        # Income tax DTOs
│   └── employee-tax.dto.ts             # Employee tax DTOs
├── utils/
│   ├── elster-certificate.util.ts      # Certificate operations
│   └── elster-xml-builder.util.ts      # XML generation
└── __tests__/
    └── elster.service.spec.ts          # Unit tests
```

## Configuration

Set the following environment variables:

```env
# ELSTER API Configuration
ELSTER_API_URL=https://www.elster.de/elsterxml/submission/v1
ELSTER_VENDOR_ID=YOUR_VENDOR_ID
ELSTER_ENVIRONMENT=sandbox  # or 'production'

# Certificate Encryption
ELSTER_CERTIFICATE_ENCRYPTION_KEY=your-32-character-encryption-key

# Optional
ELSTER_ENABLE_LOGGING=true
```

## Usage Examples

### VAT Return Submission

```typescript
import { ElsterService } from '@/modules/integrations/elster';
import { VATReturnDto } from '@/modules/integrations/elster/dto';

// Submit VAT return
const vatReturn: VATReturnDto = {
  organizationId: 'org-123',
  taxId: '12/345/67890',
  taxYear: 2024,
  taxPeriod: 'Q1',
  periodType: 'quarterly',
  taxableSales19: 100000,
  vat19: 19000,
  taxableSales7: 50000,
  vat7: 3500,
  inputTaxDeduction: 15000,
  totalVat: 7500,
  testSubmission: true,
};

const response = await elsterService.submitVATReturn(vatReturn);
console.log('Transfer Ticket:', response.transferTicket);
```

### Income Tax Return Submission

```typescript
import { IncomeTaxReturnDto } from '@/modules/integrations/elster/dto';

const incomeTax: IncomeTaxReturnDto = {
  organizationId: 'org-123',
  taxYear: 2023,
  taxpayer: {
    firstName: 'Max',
    lastName: 'Mustermann',
    dateOfBirth: '1980-01-15',
    taxId: '12345678901',
    address: {
      street: 'Hauptstraße',
      houseNumber: '123',
      postalCode: '10115',
      city: 'Berlin',
    },
  },
  jointFiling: false,
  employmentIncome: 50000,
  churchTaxApplicable: true,
  testSubmission: true,
};

const response = await elsterService.submitIncomeTaxReturn(incomeTax);
```

### Employee Tax Submission

```typescript
import { EmployeeTaxDto } from '@/modules/integrations/elster/dto';

const employeeTax: EmployeeTaxDto = {
  organizationId: 'org-123',
  taxYear: 2024,
  taxPeriod: '03',
  employer: {
    companyName: 'Musterfirma GmbH',
    taxNumber: '12/345/67890',
    operatingNumber: '12345678',
  },
  totalGrossWages: 150000,
  totalWageTax: 25000,
  solidaritySurcharge: 1375,
  numberOfEmployees: 25,
  socialSecurityContributions: {
    healthInsurance: 5000,
    pensionInsurance: 8000,
    unemploymentInsurance: 2000,
    careInsurance: 1500,
  },
  testSubmission: true,
};

const response = await elsterService.submitEmployeeTax(employeeTax);
```

### Check Submission Status

```typescript
const status = await elsterService.checkSubmissionStatus('TRANSFER-TICKET-ID');
console.log('Status:', status.status);
console.log('Last Update:', status.lastUpdate);
```

## API Endpoints

### Submit VAT Return
```
POST /integrations/elster/vat-return
Content-Type: application/json
Authorization: Bearer {token}

Body: VATReturnDto
Response: VATReturnResponseDto
```

### Submit Income Tax Return
```
POST /integrations/elster/income-tax-return
Content-Type: application/json
Authorization: Bearer {token}

Body: IncomeTaxReturnDto
Response: IncomeTaxReturnResponseDto
```

### Submit Employee Tax
```
POST /integrations/elster/employee-tax
Content-Type: application/json
Authorization: Bearer {token}

Body: EmployeeTaxDto
Response: EmployeeTaxResponseDto
```

### Check Status
```
GET /integrations/elster/status/:transferTicket
Authorization: Bearer {token}

Response: ElsterSubmissionStatus
```

### Validate VAT Return
```
POST /integrations/elster/vat-return/validate
Content-Type: application/json
Authorization: Bearer {token}

Body: VATReturnDto
Response: VATReturnValidationDto
```

### Test Connection
```
GET /integrations/elster/test-connection/:organizationId
Authorization: Bearer {token}

Response: { success: boolean, certificate: {...} }
```

## Certificate Management

### Storing Certificates

Certificates are stored encrypted in the database. To store a new certificate:

1. Upload PFX certificate file
2. Certificate is encrypted using AES-256-GCM
3. Password is encrypted separately
4. Store in database with organization association

### Certificate Validation

The service automatically validates certificates:
- Expiration dates
- Issuer verification
- ELSTER-CA validation
- Expiration warnings (30 days)

## Security Features

1. **Encrypted Storage**: All certificates encrypted at rest
2. **Secure Transmission**: HTTPS with client certificate authentication
3. **Audit Trail**: All submissions logged with sanitized data
4. **No Sensitive Logging**: Tax data never logged in plain text
5. **Parameterized Queries**: SQL injection prevention

## Error Handling

The service handles various error scenarios:

- **Certificate Errors**: Invalid, expired, or missing certificates
- **Validation Errors**: Invalid tax data or calculations
- **Network Errors**: Automatic retry with exponential backoff
- **ELSTER Service Errors**: Proper error mapping and user feedback

## Testing

Run unit tests:
```bash
npm test -- elster.service.spec.ts
```

Run integration tests:
```bash
npm run test:e2e -- elster
```

## Supported Tax Forms

| Form Code | Name | Description | Frequency |
|-----------|------|-------------|-----------|
| UStVA | Umsatzsteuervoranmeldung | VAT Return | Monthly/Quarterly |
| ESt | Einkommensteuererklärung | Income Tax Return | Annual |
| Lohn | Lohnsteueranmeldung | Employee Tax | Monthly |

## Dependencies

- `@nestjs/common`: NestJS framework
- `@nestjs/config`: Configuration management
- `axios`: HTTP client for API calls
- `node-forge`: Certificate handling
- `xml2js`: XML generation
- `class-validator`: DTO validation
- `class-transformer`: DTO transformation

## TODO / Future Enhancements

- [ ] Implement actual ELSTER XML schema validation
- [ ] Add support for Trade Tax (Gewerbesteuererklärung)
- [ ] Add support for Corporate Tax (Körperschaftsteuererklärung)
- [ ] Implement certificate renewal notifications
- [ ] Add bulk submission support
- [ ] Implement ELSTER receipt validation
- [ ] Add support for attachments (supporting documents)
- [ ] Implement status polling with webhooks
- [ ] Add support for amendments/corrections
- [ ] Implement GoBD export integration

## References

- [ELSTER Developer Portal](https://www.elster.de/elsterweb/entwickler)
- [ELSTER XML Schema Documentation](https://www.elster.de/elsterxml/schema/)
- [German Tax Authority](https://www.bzst.de)

## Support

For issues or questions:
1. Check the ELSTER API documentation
2. Review error logs in the audit trail
3. Contact ELSTER support for API-specific issues
4. File internal issues for module bugs

## License

Internal use only - Operate/CoachOS Platform
