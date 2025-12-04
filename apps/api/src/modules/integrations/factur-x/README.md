# Factur-X Module (France)

France electronic invoicing integration using the **Factur-X** standard.

## Overview

Factur-X is the French implementation of the European e-invoicing standard EN 16931. It creates hybrid PDF/A-3 invoices with embedded structured XML data, enabling both human-readable and machine-processable invoices.

## Features

- ✅ **Generate Factur-X invoices** (PDF/A-3 with embedded XML)
- ✅ **Support all Factur-X profiles** (MINIMUM, BASIC, EN16931, EXTENDED)
- ✅ **EN 16931 compliance** (European e-invoicing standard)
- ✅ **Cross Industry Invoice (CII)** D16B XML format
- ✅ **French-specific validations** (SIRET, TVA, legal mentions)
- ✅ **Parse incoming Factur-X** documents
- ✅ **Peppol integration** for B2B transmission
- ✅ **Chorus Pro ready** for French B2G (public sector)
- ✅ **Compatible with ZUGFeRD** (German standard)

## Standards Compliance

- **EN 16931-1:2017** - European e-invoicing semantic model
- **UN/CEFACT CII D16B** - Cross Industry Invoice XML schema
- **PDF/A-3** (ISO 19005-3) - Archival PDF format
- **French Tax Code** (Code Général des Impôts)
- **SIRET/SIREN** validation (14/9 digit with Luhn algorithm)
- **French VAT (TVA)** validation and calculation

## Factur-X Profiles

| Profile | Description | Use Case |
|---------|-------------|----------|
| **MINIMUM** | Basic payment info only | Simple invoices, minimum data |
| **BASIC_WL** | Basic without line items | Summary invoices |
| **BASIC** | Standard with line items | Standard B2B invoices |
| **EN16931** | Full European standard | **Recommended** - Complete compliance |
| **EXTENDED** | Extended information | Complex invoices with additional data |

## Quick Start

### 1. Generate Factur-X Invoice

```typescript
import { FacturXService } from './integrations/factur-x';

// Inject the service
constructor(private facturXService: FacturXService) {}

// Generate invoice
const pdfBuffer = await this.facturXService.generateFacturXInvoice(
  {
    number: 'INV-2025-001',
    issueDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-15'),
    type: FrenchInvoiceType.COMMERCIAL,
    currency: 'EUR',
    seller: {
      name: 'ACME France SARL',
      address: {
        line1: '123 Rue de la République',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
      },
      identifiers: {
        siret: '12345678901234',
        tva: 'FR12345678901',
      },
    },
    buyer: {
      name: 'Client Company SAS',
      address: {
        line1: '456 Avenue des Champs',
        postalCode: '69001',
        city: 'Lyon',
        country: 'FR',
      },
      identifiers: {
        tva: 'FR98765432109',
      },
    },
    items: [
      {
        id: '1',
        description: 'Consulting services',
        quantity: 10,
        unit: 'C62',
        unitPrice: 100.0,
        netAmount: 1000.0,
        vat: {
          rate: 20,
          category: FrenchVATCategory.STANDARD,
          amount: 200.0,
        },
      },
    ],
    vatBreakdown: [
      {
        rate: 20,
        category: FrenchVATCategory.STANDARD,
        taxableAmount: 1000.0,
        vatAmount: 200.0,
      },
    ],
    subtotal: 1000.0,
    totalVAT: 200.0,
    totalAmount: 1200.0,
    paymentTerms: 'Paiement à 30 jours',
    paymentMeans: FrenchPaymentMeans.BANK_TRANSFER,
    bankAccount: {
      iban: 'FR7612345678901234567890123',
      bic: 'BNPAFRPPXXX',
    },
  },
  {
    profile: FacturXProfile.EN16931,
    validateSIRET: true,
    validateTVA: true,
  }
);

// Save or send the PDF
fs.writeFileSync('factur-x-invoice.pdf', pdfBuffer);
```

### 2. Parse Factur-X Invoice

```typescript
// Parse PDF
const parseResult = await this.facturXService.parseFacturXPdf(pdfBuffer);

if (parseResult.success) {
  console.log('Invoice:', parseResult.invoice);
  console.log('Profile:', parseResult.metadata.profile);
}
```

### 3. Validate Invoice

```typescript
const validation = await this.facturXService.validateInvoice(invoice);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}
```

### 4. Send via Peppol

```typescript
const result = await this.facturXService.sendViaPeppol(invoice, {
  sendViaPeppol: true,
  recipientParticipantId: '0002:98765432109876',
  recipientScheme: '0002', // SIRET scheme
  attachOriginalPdf: true,
});

console.log('Peppol Message ID:', result.peppolMessageId);
```

## REST API Endpoints

### Generate Factur-X Invoice
```http
POST /integrations/factur-x/generate
Content-Type: application/json

{
  "number": "INV-2025-001",
  "issueDate": "2025-01-15",
  "type": "380",
  "currency": "EUR",
  "seller": { ... },
  "buyer": { ... },
  "items": [ ... ],
  "subtotal": 1000.00,
  "totalVAT": 200.00,
  "totalAmount": 1200.00
}

Response: application/pdf (binary)
```

### Generate XML Only
```http
POST /integrations/factur-x/generate-xml
```

### Validate Invoice
```http
POST /integrations/factur-x/validate
```

### Parse PDF
```http
POST /integrations/factur-x/parse-pdf
Content-Type: multipart/form-data

file: [binary PDF]
```

### Send via Peppol
```http
POST /integrations/factur-x/send-peppol
```

## French Requirements

### SIRET Validation

SIRET is a 14-digit identifier for French businesses, validated using the Luhn algorithm:

```typescript
// Valid SIRET: 12345678901234
// First 9 digits = SIREN (company)
// Last 5 digits = NIC (establishment)
```

### TVA (VAT) Number

French TVA number format: `FRxx123456789`
- `FR` = Country code
- `xx` = 2 check digits (letters or numbers)
- `123456789` = 9-digit SIREN

### French VAT Rates (2025)

| Rate | Description | Category Code |
|------|-------------|---------------|
| **20%** | Standard rate (taux normal) | `S` |
| **10%** | Reduced rate (taux réduit) | `AA` |
| **5.5%** | Super-reduced rate | `AB` |
| **2.1%** | Special super-reduced rate | `AB` |
| **0%** | Zero-rated | `Z` |
| **Exempt** | VAT exempt | `E` |
| **Reverse charge** | Autoliquidation | `AE` |
| **Intra-EU** | Intracommunautaire | `K` |
| **Export** | Export hors UE | `G` |

### Legal Mentions

French invoices must include:

- **RCS registration** (if company): `Paris B 123 456 789`
- **Capital social**: `100000 EUR`
- **TVA exemption** (if applicable): `TVA non applicable, art. 293 B du CGI`
- **Reverse charge** (if applicable): `Autoliquidation`
- **Payment terms**: `Paiement à 30 jours`
- **Late payment penalties** (recommended): `En cas de retard...`

## Integration with Peppol

Factur-X invoices can be transmitted via the Peppol network:

```typescript
// 1. Generate Factur-X invoice
const invoice = { ... };

// 2. Send via Peppol
await facturXService.sendViaPeppol(invoice, {
  recipientParticipantId: '0002:12345678901234', // SIRET
  recipientScheme: '0002',
  sendViaPeppol: true,
});
```

**Note**: Peppol uses UBL format, not CII. The service handles the conversion automatically.

## Chorus Pro (French B2G)

For invoicing French public entities, use Chorus Pro:

```typescript
// Configuration in environment
CHORUS_PRO_ENABLED=true
CHORUS_PRO_URL=https://chorus-pro.gouv.fr/
CHORUS_PRO_CERT_PATH=/path/to/cert.pem
```

## File Structure

```
factur-x/
├── factur-x.module.ts           # Module definition
├── factur-x.service.ts          # Main service
├── factur-x.controller.ts       # REST API endpoints
├── services/
│   ├── factur-x-generator.service.ts   # XML generation (CII)
│   ├── factur-x-parser.service.ts      # XML parsing
│   ├── factur-x-validator.service.ts   # FR/EN validation
│   └── factur-x-pdf.service.ts         # PDF/A-3 generation
├── dto/
│   ├── generate-facturx.dto.ts         # Input DTOs
│   ├── send-facturx.dto.ts             # Peppol DTOs
│   └── parse-facturx.dto.ts            # Parser options
├── types/
│   └── factur-x.types.ts               # TypeScript types
└── templates/
    └── factur-x-en16931-template.xml   # Reference template
```

## Dependencies

```json
{
  "pdf-lib": "^1.17.1",
  "fast-xml-parser": "^4.3.2",
  "@nestjs/common": "^10.0.0",
  "@nestjs/swagger": "^7.0.0"
}
```

## Testing

```bash
# Run tests
npm test -- factur-x

# Test invoice generation
curl -X POST http://localhost:3000/integrations/factur-x/generate \
  -H "Content-Type: application/json" \
  -d @sample-invoice.json \
  --output invoice.pdf

# Validate PDF
curl -X POST http://localhost:3000/integrations/factur-x/validate-pdf \
  -F "file=@invoice.pdf"
```

## Resources

- [Factur-X Official](https://fnfe-mpe.org/factur-x/)
- [EN 16931 Standard](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/Electronic+Invoicing)
- [UN/CEFACT CII](https://unece.org/trade/uncefact/xml-schemas)
- [French Tax Code](https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069577/)
- [Chorus Pro Portal](https://chorus-pro.gouv.fr/)

## Support

For issues or questions:
- Check the [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- Review the [API documentation](http://localhost:3000/api-docs)
- Contact the development team

## License

Copyright © 2025 Operate/CoachOS. All rights reserved.
