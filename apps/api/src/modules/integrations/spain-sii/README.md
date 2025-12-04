# Spain SII Integration

Real-time VAT reporting integration with Spanish Tax Agency (AEAT) SII system.

## Overview

The **SII (Suministro Inmediato de Información)** is a real-time VAT reporting system implemented by the Spanish Tax Agency (AEAT). This module provides a complete integration for submitting invoices, querying records, and managing VAT book entries.

## Features

- **Real-time Invoice Submission**: Submit invoices within 4-day legal window
- **All Book Types Supported**: A1-A3 (issued), B1-B4 (received)
- **Certificate Authentication**: TLS 1.3 with Spanish digital certificates
- **Retry Logic**: Exponential backoff for API failures
- **Error Handling**: Comprehensive SII-specific error codes
- **Redis Caching**: Submission status and audit trail
- **Validation**: NIF format, amounts, dates, submission windows

## Book Types

| Book | Type | Description |
|------|------|-------------|
| **A1** | Issued | Standard issued invoices (Facturas Emitidas) |
| **A2** | Issued | Rectifications of issued invoices |
| **A3** | Issued | Assets register (Bienes de Inversión) |
| **B1** | Received | Standard received invoices (Facturas Recibidas) |
| **B2** | Received | Corrections of received invoices |
| **B3** | Received | Intracommunity acquisitions |
| **B4** | Received | Import VAT |

## Requirements

### Digital Certificate

Spanish digital certificate required from:
- FNMT (Fábrica Nacional de Moneda y Timbre)
- Certificate authorities authorized by AEAT
- Must be in PEM format
- TLS 1.3 capable

### Environment Variables

```bash
# Environment
SII_ENVIRONMENT=test # or 'production'
SII_TIMEOUT=60000 # milliseconds

# Certificate paths (managed separately in W25-T5)
SII_CERTIFICATE_PATH=/path/to/certificate.pem
SII_CERTIFICATE_KEY_PATH=/path/to/key.pem
SII_CERTIFICATE_PASSWORD=optional_password
```

## Usage

### Submit Issued Invoice

```typescript
import { SiiService } from './integrations/spain-sii';

// Inject service
constructor(private readonly siiService: SiiService) {}

// Submit invoice
const result = await this.siiService.submitIssuedInvoice(
  {
    holder: { nif: 'A12345678', name: 'My Company SL' },
    fiscalYear: 2024,
    period: '01', // January
    invoiceNumber: 'INV-2024-001',
    issueDate: new Date('2024-01-15'),
    invoiceType: SiiInvoiceType.F1_STANDARD,
    issuer: { nif: 'A12345678', name: 'My Company SL' },
    recipient: { nif: 'B87654321', name: 'Customer Ltd' },
    operationType: SiiOperationType.A0,
    invoiceDescription: 'Professional services',
    totalInvoiceAmount: 121.00,
    vatLines: [
      {
        vatKey: SiiVatKey.GENERAL,
        taxableBase: 100.00,
        vatRate: 21.00,
        vatAmount: 21.00,
      },
    ],
  },
  '/path/to/cert.pem',
  '/path/to/key.pem',
  'cert_password',
);

console.log('Submission ID:', result.submissionId);
console.log('CSV Reference:', result.csvReference);
```

### Submit Received Invoice

```typescript
const result = await this.siiService.submitReceivedInvoice(
  {
    holder: { nif: 'A12345678', name: 'My Company SL' },
    fiscalYear: 2024,
    period: '01',
    invoiceNumber: 'SUP-001',
    issueDate: new Date('2024-01-10'),
    invoiceType: SiiInvoiceType.F1_STANDARD,
    issuer: { nif: 'B11111111', name: 'Supplier SA' },
    recipient: { nif: 'A12345678', name: 'My Company SL' },
    operationType: SiiOperationType.A0,
    invoiceDescription: 'Office supplies',
    totalInvoiceAmount: 242.00,
    vatLines: [
      {
        vatKey: SiiVatKey.GENERAL,
        taxableBase: 200.00,
        vatRate: 21.00,
        vatAmount: 42.00,
      },
    ],
    deductibleAmount: 42.00,
    deductionPercentage: 100,
  },
  '/path/to/cert.pem',
  '/path/to/key.pem',
);
```

### Query Invoices

```typescript
const result = await this.siiService.queryInvoices(
  {
    holder: { nif: 'A12345678', name: 'My Company SL' },
    fiscalYear: 2024,
    period: '01',
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-01-31'),
  },
  '/path/to/cert.pem',
  '/path/to/key.pem',
);

console.log('Found invoices:', result.invoices.length);
```

### Get Submission Status

```typescript
const status = await this.siiService.getSubmissionStatus({
  submissionId: 'SII-1234567890',
  holder: { nif: 'A12345678', name: 'My Company SL' },
});

console.log('Status:', status.status);
console.log('CSV Reference:', status.csvReference);
```

## Invoice Types

| Code | Description |
|------|-------------|
| **F1** | Standard invoice |
| **F2** | Simplified invoice (ticket) |
| **F3** | Invoice substituting simplified invoices |
| **F4** | Summary invoice |
| **F5** | Imports (DUA) |
| **R1** | Rectification: Error in basis |
| **R2** | Rectification: Art 80.1, 80.2, 80.6 LIVA |
| **R3** | Rectification: Bad debts |
| **R4** | Rectification: Other |
| **R5** | Rectification in bankruptcy proceedings |

## VAT Rates (Spain 2024)

| Type | Rate |
|------|------|
| General | 21% |
| Reduced | 10% |
| Super Reduced | 4% |
| Zero | 0% |

## Submission Window

- **Standard**: Invoices must be submitted within **4 days** of issue
- **Large Companies**: May have 8-day window (REDEME regime)
- Late submissions may be rejected or incur penalties

## Error Codes

### Authentication (1xxx)
- **1001**: Invalid certificate
- **1002**: Certificate expired
- **1003**: Certificate revoked
- **1004**: Unauthorized access

### Validation (2xxx)
- **2001**: Invalid NIF format
- **2002**: Invalid invoice number
- **2003**: Invalid date
- **2004**: Invalid amount
- **2005**: Duplicate invoice
- **2006**: Invoice not found
- **2007**: Invalid VAT key

### Business Logic (3xxx)
- **3001**: Outside submission window (>4 days)
- **3002**: Period closed
- **3003**: Rectification without original
- **3004**: Inconsistent data

### System (5xxx)
- **5001**: Service unavailable
- **5002**: Timeout
- **5003**: Internal error
- **5004**: Rate limit exceeded

## Best Practices

1. **Submit Promptly**: Don't wait until day 4 - submit within 1-2 days
2. **Validate First**: Use `errorHandler.validateInvoice()` before submission
3. **Handle Duplicates**: Check for duplicate errors and handle appropriately
4. **Monitor Status**: Poll submission status for async processing
5. **Cache Certificates**: Load certificates once, reuse for batch submissions
6. **Batch Submissions**: Group invoices by period for efficiency
7. **Test Environment**: Always test in sandbox before production

## Testing

```bash
# Run unit tests
npm test spain-sii

# Run with coverage
npm test spain-sii -- --coverage
```

## SII Documentation

- [AEAT SII Portal](https://www.agenciatributaria.es/AEAT.internet/SII.html)
- [Technical Specifications](https://www.agenciatributaria.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Modelos_y_formularios/Suministro_inmediato_informacion/Especificaciones_tecnicas_SII.pdf)
- [SOAP Web Services](https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd)

## Support

For issues related to:
- **SII system**: Contact AEAT support
- **Certificate issues**: Contact certificate provider (FNMT, etc.)
- **Integration bugs**: Create issue in project repository

## License

Part of Operate/CoachOS - Enterprise SaaS Platform
