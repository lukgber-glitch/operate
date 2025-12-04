# JP-PINT (Japan Peppol International) Connector

## Overview

The JP-PINT connector extends the Operate/CoachOS Peppol Access Point to support Japanese e-invoicing through the Peppol network. Japan joined the Peppol network and uses JP-PINT (Peppol International) format based on UBL 2.1.

## Features

- **JP-PINT UBL 2.1 Document Format**: Compliant with Japanese Peppol specifications
- **Corporate Number (法人番号) Validation**: 13-digit identifier with check digit algorithm
- **Invoice Registry Number Support**: T+13 digits format (適格請求書発行事業者登録番号)
- **Japanese Tax Handling**: Standard rate (10%) and reduced rate (8%)
- **TLS 1.3 Enforcement**: Secure communications as required by Japanese regulations
- **Japanese Address Format**: Support for postal codes, prefectures, and local addressing

## Architecture

```
jp-pint/
├── jp-pint.service.ts      # Main service orchestrating JP-PINT operations
├── jp-pint.validator.ts    # Japanese business identifier validation
├── jp-pint.mapper.ts       # DTO to UBL XML mapping
├── jp-pint.types.ts        # TypeScript type definitions
├── jp-pint.constants.ts    # Japanese-specific constants
└── tests/
    └── jp-pint.service.spec.ts
```

## Usage

### Sending a JP-PINT Invoice

```typescript
import { JPPINTService } from './modules/integrations/peppol/jp-pint';

// Inject the service
constructor(private readonly jpPintService: JPPINTService) {}

// Send invoice
const result = await jpPintService.sendJPPINTInvoice({
  organizationId: 'org-123',
  documentType: 'Invoice',
  invoiceNumber: 'INV-2025-001',
  issueDate: '2025-01-15',
  currency: 'JPY',
  timestamp: '2025-01-15T10:30:00Z',
  supplier: {
    participantId: {
      scheme: '9912',
      identifier: '1234567890128', // Corporate Number
    },
    name: '株式会社テスト商事',
    corporateNumber: '1234567890128',
    invoiceRegistryNumber: 'T1234567890128',
    address: {
      postalCode: '100-0001',
      prefecture: '東京都',
      city: '千代田区',
      addressLine1: '丸の内1-1-1',
      countryCode: 'JP',
    },
  },
  customer: {
    // ... customer details
  },
  lines: [
    {
      id: '1',
      quantity: 10,
      unitCode: 'EA',
      description: 'テスト商品',
      priceAmount: 1000,
      lineExtensionAmount: 10000,
      taxCategory: 'S', // Standard rate 10%
      taxPercent: 10.0,
      taxAmount: 1000,
    },
  ],
  taxTotal: 1000,
  totalAmount: 11000,
});
```

### Validating Corporate Number

```typescript
const validation = jpPintService.validateCorporateNumber('1234567890128');

if (validation.valid) {
  console.log('Corporate number is valid');
} else {
  console.error(validation.error);
}
```

### Validating Invoice Registry Number

```typescript
const validation = jpPintService.validateInvoiceRegistryNumber('T1234567890128');

if (validation.valid) {
  console.log('Invoice registry number is valid');
  console.log('Corporate number:', validation.details.corporateNumber);
}
```

## Corporate Number Algorithm

The Corporate Number (法人番号) is a 13-digit identifier assigned by Japan's National Tax Agency. The first digit is a check digit calculated using the following algorithm:

1. Take the last 12 digits (excluding the first check digit position)
2. Multiply each digit by alternating weights: 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2
3. For products >= 10, sum the individual digits
4. Sum all results
5. Calculate: `check_digit = 9 - (sum % 9)`
6. If result is 9, check digit is 0

Example: `1234567890128`
- Check digit: `1`
- Base number: `234567890128`
- Calculation validates to check digit `1`

## Invoice Registry Number

The Invoice Registry Number (適格請求書発行事業者登録番号) is used for qualified invoice issuers:

- Format: `T` + 13-digit Corporate Number
- Example: `T1234567890128`
- Required for suppliers issuing qualified invoices

## Tax Categories

| Category | Description | Rate |
|----------|-------------|------|
| S | Standard rate | 10% |
| AA | Reduced rate (food & beverages) | 8% |
| E | Exempt | 0% |
| Z | Zero-rated | 0% |
| AE | Reverse charge | - |

## Configuration

Environment variables:

```bash
# JP-PINT specific
JP_PINT_STRICT_VALIDATION=true
JP_PINT_REQUIRE_INVOICE_REGISTRY=true

# Peppol base configuration
PEPPOL_ACCESS_POINT_URL=https://ap.peppol.jp/as4
PEPPOL_PARTICIPANT_ID=9912:1234567890128
PEPPOL_ENVIRONMENT=production
PEPPOL_MOCK_MODE=false
```

## Dependencies

The JP-PINT connector depends on:

- Base Peppol Service (W24-T1)
- PeppolMessageService (AS4 messaging)
- PeppolParticipantService (SMP lookup)
- PeppolCertificateService (Digital signatures)

## Standards Compliance

- **JP-PINT 1.0**: Based on Peppol International (PINT)
- **UBL 2.1**: Universal Business Language
- **EN 16931**: European e-invoicing standard
- **TLS 1.3**: Transport Layer Security
- **ISO/IEC 6523**: Participant identifiers (scheme 9912)

## Testing

Run unit tests:

```bash
npm test -- jp-pint.service.spec.ts
```

Test coverage includes:
- Corporate Number validation
- Invoice Registry Number validation
- Japanese address validation
- Tax category validation
- UBL XML generation
- End-to-end invoice sending

## Error Codes

| Code | Description |
|------|-------------|
| JP_PINT_001 | Invalid Corporate Number |
| JP_PINT_002 | Invalid Invoice Registry Number |
| JP_PINT_003 | Check digit mismatch |
| JP_PINT_004 | Invalid tax category |
| JP_PINT_005 | Missing timestamp |
| JP_PINT_006 | Invalid participant scheme |

## References

- [Peppol Japan](https://peppol.jp/)
- [National Tax Agency - Corporate Number](https://www.houjin-bangou.nta.go.jp/)
- [JP-PINT Specifications](https://docs.peppol.eu/poacc/billing/3.0/japan/)
- [UBL 2.1 Documentation](http://docs.oasis-open.org/ubl/UBL-2.1.html)

## Support

For issues or questions:
- Internal: Contact BRIDGE agent (integrations specialist)
- External: Japan Peppol Authority support channels
