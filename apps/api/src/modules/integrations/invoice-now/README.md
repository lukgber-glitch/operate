# InvoiceNow Integration

Singapore's nationwide e-invoicing network integration based on Peppol.

## Overview

InvoiceNow is Singapore's implementation of the Peppol network, regulated by the Info-communications Media Development Authority (IMDA). This integration provides comprehensive support for sending and receiving e-invoices in Singapore using the Peppol BIS Billing 3.0 standard with Singapore-specific customizations (PINT-SG).

## Features

- **Peppol BIS Billing 3.0 (PINT-SG)** - Full support for Singapore's Peppol International Model
- **UEN Validation** - Singapore Unique Entity Number validation with checksum verification
- **GST Compliance** - Support for Singapore GST rates (8% as of 2024) and tax categories
- **Document Types**:
  - Standard Invoice
  - Credit Note
  - Debit Note
  - Self-billed Invoice
- **Payment Methods** - Including PayNow (Singapore's instant payment system)
- **AS4 Protocol** - Secure message exchange via Peppol AS4 protocol
- **SMP Lookup** - Automatic participant discovery via Peppol SMP

## Architecture

```
invoice-now/
├── invoice-now.module.ts           # NestJS module
├── invoice-now.service.ts          # Main service orchestrator
├── invoice-now-peppol.client.ts    # Peppol AS4 client for Singapore
├── invoice-now.mapper.ts           # UBL document mapper
├── invoice-now-uen.validator.ts    # UEN validation service
├── invoice-now.controller.ts       # REST API controller
├── invoice-now.types.ts            # Service-specific types
├── invoice-now.constants.ts        # Singapore constants and codes
├── dto/                            # Data Transfer Objects
└── __tests__/                      # Unit tests
```

## Configuration

Add the following environment variables:

```bash
# InvoiceNow Configuration
INVOICENOW_ENABLED=true
INVOICENOW_ENVIRONMENT=test  # or 'production'
INVOICENOW_MOCK_MODE=false
INVOICENOW_PARTICIPANT_UEN=201234567A
INVOICENOW_SML_DOMAIN=test-sml.peppol.sg  # or 'sml.peppol.sg' for production
INVOICENOW_VALIDATE_UEN=true
INVOICENOW_VALIDATE_GST=true
INVOICENOW_AUTO_ACKNOWLEDGE=true
INVOICENOW_RETRY_ATTEMPTS=3
INVOICENOW_RETRY_DELAY=1000

# Peppol Configuration (inherited from Peppol module)
PEPPOL_ACCESS_POINT_URL=https://your-access-point.example.com
PEPPOL_CERTIFICATE_PATH=/path/to/certificate.pem
PEPPOL_PRIVATE_KEY_PATH=/path/to/private-key.pem
PEPPOL_CERTIFICATE_PASSWORD=your-password
```

## Usage

### Send Invoice

```typescript
import { InvoiceNowService } from './modules/integrations/invoice-now';
import { InvoiceNowDocumentType, SingaporeGstCategory } from '@operate/shared/types/integrations/invoice-now.types';

const result = await invoiceNowService.sendDocument({
  organizationId: 'org-123',
  document: {
    documentType: InvoiceNowDocumentType.INVOICE,
    invoiceNumber: 'INV-2024-001',
    issueDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    currency: 'SGD',
    supplier: {
      uen: '201234567A',
      scheme: '0195',
      participantId: '0195:201234567A',
      name: 'Your Company Pte Ltd',
      address: {
        streetName: '123 Business Street',
        cityName: 'Singapore',
        postalCode: '018956',
        countryCode: 'SG',
      },
      gstRegistrationNumber: 'M12345678X',
    },
    customer: {
      uen: '202345678B',
      scheme: '0195',
      participantId: '0195:202345678B',
      name: 'Customer Company Pte Ltd',
      address: {
        cityName: 'Singapore',
        postalCode: '098765',
        countryCode: 'SG',
      },
    },
    lines: [
      {
        id: '1',
        description: 'Consulting Services',
        quantity: 10,
        unitCode: 'HUR',
        unitPrice: 100,
        lineExtensionAmount: 1000,
        taxCategory: SingaporeGstCategory.STANDARD_RATED,
        taxPercent: 8,
        taxAmount: 80,
      },
    ],
    taxTotal: 80,
    totalAmount: 1080,
    paymentTerms: 'Net 30',
    paymentMeans: {
      paymentMeansCode: '42', // PayNow
      payNowUen: '201234567A',
    },
  },
});

console.log('Invoice sent:', result.messageId);
```

### Validate UEN

```typescript
const validation = await invoiceNowService.validateParticipant({
  uen: '201234567A',
  validateGst: true,
});

if (validation.isValid && validation.registered) {
  console.log('UEN is valid and registered in InvoiceNow network');
}
```

### REST API Endpoints

```bash
# Send invoice
POST /integrations/invoice-now/send
Content-Type: application/json
Authorization: Bearer <token>

# Validate UEN
POST /integrations/invoice-now/validate-uen
Content-Type: application/json

# Get transmissions
GET /integrations/invoice-now/transmissions?limit=50
Authorization: Bearer <token>

# Get transmission by message ID
GET /integrations/invoice-now/transmissions/:messageId
Authorization: Bearer <token>

# Health check
GET /integrations/invoice-now/health
```

## Singapore UEN Format

### Business Registration (ROB)
Format: 9 digits + 1 check letter
Example: `53012345D`

### Local Company (ROC)
Format: 8 digits + 1 check letter
Example: `201234567A`

### Foreign Company (RFC)
Format: T/S/R + 2 digits + 2 letters + 4 digits + 1 check letter
Example: `T08PQ1234A`

## GST Tax Categories

- **SR (Standard Rated)** - 8% (as of 2024)
- **ZR (Zero Rated)** - 0% for exports and international services
- **E (Exempt)** - Exempt supplies (financial services, residential property)
- **OS (Out of Scope)** - Non-business transactions
- **DS (Deemed)** - Deemed supplies

## Payment Means Codes

- **30** - Credit Transfer (Bank Transfer)
- **42** - PayNow (Singapore's instant payment system)
- **48** - Credit Card
- **49** - Direct Debit
- **10** - Cash
- **20** - Cheque

## Standards Compliance

- **Peppol BIS Billing 3.0** - Core Peppol invoice specification
- **PINT-SG** - Peppol International Model for Singapore
- **UBL 2.1** - Universal Business Language
- **AS4 Profile** - CEF eDelivery AS4 protocol
- **ISO/IEC 6523** - Participant ID scheme (0195 for Singapore)
- **EN 16931** - European e-invoicing standard
- **IMDA** - Singapore regulatory compliance

## Validation Rules

The integration validates documents against PINT-SG rules:

- **PINT-SG-R001** - Invoice number is required
- **PINT-SG-R002** - Issue date is mandatory
- **PINT-SG-R003** - Currency must be ISO 4217
- **PINT-SG-R004** - Supplier UEN is required
- **PINT-SG-R005** - Customer UEN is required
- **PINT-SG-R006** - At least one invoice line required
- **PINT-SG-R007** - GST calculation must be accurate
- **PINT-SG-R008** - Total amount must match
- **PINT-SG-R009** - UEN format must be valid
- **PINT-SG-R010** - GST number format must be valid
- **PINT-SG-R011** - Payment means must be valid
- **PINT-SG-R012** - Postal code must be 6 digits

## Testing

Run unit tests:

```bash
npm test invoice-now
```

Run specific test suites:

```bash
# UEN validation tests
npm test invoice-now-uen.validator.spec

# Mapper tests
npm test invoice-now.mapper.spec
```

## Troubleshooting

### Common Issues

1. **UEN Validation Fails**
   - Ensure UEN is in correct format
   - Check checksum calculation
   - Verify UEN is registered with ACRA

2. **Participant Not Found**
   - Confirm recipient is registered in InvoiceNow network
   - Check SML domain configuration (test vs production)
   - Verify Peppol participant ID format (0195:UEN)

3. **GST Calculation Errors**
   - Ensure tax amounts match line item totals
   - Verify GST rate is 8% (as of 2024)
   - Check for rounding errors (use 2 decimal places)

4. **Certificate Issues**
   - Ensure Peppol certificate is valid and not expired
   - Check certificate path and password configuration
   - Verify TLS 1.3 support

## References

- [InvoiceNow Official Website](https://www.imda.gov.sg/invoicenow)
- [Peppol BIS Billing 3.0](https://docs.peppol.eu/poacc/billing/3.0/)
- [PINT-SG Specification](https://www.imda.gov.sg/invoicenow/resources)
- [Singapore UEN Guidelines](https://www.uen.gov.sg/)
- [IRAS GST Information](https://www.iras.gov.sg/taxes/goods-services-tax-(gst))

## License

Copyright © 2024 Operate/CoachOS
