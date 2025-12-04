# GST Invoice Registration Portal (IRP) Integration

Comprehensive integration with India's GST e-invoicing system for B2B invoice registration.

## Overview

This module provides complete integration with the GST Invoice Registration Portal (IRP), enabling:
- **IRN Generation**: Generate Invoice Reference Numbers (64-character SHA-256 hash)
- **E-Invoice Registration**: Submit invoices to IRP for government compliance
- **Digital Signatures**: Support for Class 2/3 Digital Signature Certificates
- **QR Code Generation**: Generate signed QR codes for invoice verification
- **IRN Cancellation**: Cancel IRNs within 24-hour window
- **Bulk Processing**: Process multiple invoices in batches
- **Audit Logging**: Complete audit trail of all IRP operations
- **Rate Limiting**: Compliance with NIC rate limits
- **TLS 1.3 Security**: Secure communication with GSP APIs

## Features

### 🔐 Security
- TLS 1.3 minimum encryption
- Digital signature support (DSC)
- AES-256-GCM credential encryption
- Audit logging for compliance
- Rate limiting to prevent abuse

### 📊 Compliance
- GST JSON schema validation
- E-invoice format compliance
- 24-hour cancellation window enforcement
- State code validation
- GSTIN checksum validation
- HSN code validation

### ⚡ Performance
- Automatic token refresh
- Connection pooling
- Retry mechanism with exponential backoff
- Bulk invoice processing
- Rate limit management

## Installation

The module is already integrated. Just configure environment variables:

```bash
# Copy example configuration
cp .env.example .env

# Edit .env with your GSP credentials
nano .env
```

## Configuration

### Environment Variables

```env
# Required
GST_IRP_ENVIRONMENT=sandbox|production
GST_IRP_GSTIN=29AABCT1332L000
GST_IRP_USERNAME=your_username
GST_IRP_PASSWORD=your_password
GST_IRP_CLIENT_ID=your_client_id
GST_IRP_CLIENT_SECRET=your_client_secret

# Optional
GST_IRP_API_URL=https://custom-gsp-url.com/api
GST_IRP_CERTIFICATE_PATH=/path/to/cert.p12
GST_IRP_CERTIFICATE_PASSWORD=cert_password
GST_IRP_TIMEOUT=30000
GST_IRP_MAX_RETRIES=3
```

### GSP Providers

Choose from multiple GSP (GST Suvidha Provider) options:
- **Adaequare Technologies** (default)
- **Tera Software**
- **Iris Business Services**
- **ClearTax**

## Usage

### Import Module

```typescript
import { Module } from '@nestjs/common';
import { GstIrpModule } from '@/modules/integrations/gst-irp';

@Module({
  imports: [GstIrpModule],
})
export class AppModule {}
```

### Generate IRN

```typescript
import { Injectable } from '@nestjs/common';
import { GstIrpService } from '@/modules/integrations/gst-irp';

@Injectable()
export class InvoiceService {
  constructor(private readonly gstIrpService: GstIrpService) {}

  async registerInvoice(invoiceData: any) {
    // Generate IRN
    const response = await this.gstIrpService.generateIrn({
      version: '1.1',
      tranDtls: {
        taxSch: 'GST',
        supTyp: 'B2B',
      },
      docDtls: {
        typ: 'INV',
        no: 'INV/2024/001',
        dt: '01/01/2024',
      },
      sellerDtls: {
        gstin: '29AABCT1332L000',
        legalName: 'Your Company Pvt Ltd',
        address: {
          pincode: '560001',
          stateCode: '29',
        },
      },
      buyerDtls: {
        gstin: '29AABCT1332L001',
        legalName: 'Buyer Company Pvt Ltd',
        address: {
          pincode: '560002',
          stateCode: '29',
        },
      },
      itemList: [
        {
          slNo: '1',
          productDescription: 'Software License',
          isService: 'Y',
          hsnCode: '998314',
          quantity: 1,
          unit: 'NOS',
          unitPrice: 10000,
          totAmount: 10000,
          assAmount: 10000,
          gstRate: 18,
          cgstAmount: 900,
          sgstAmount: 900,
          totItemValue: 11800,
        },
      ],
      valDtls: {
        assVal: 10000,
        cgstVal: 900,
        sgstVal: 900,
        totInvVal: 11800,
      },
    });

    console.log('IRN:', response.irn);
    console.log('Acknowledgement No:', response.ackNo);

    // Generate QR code
    const qrCode = await this.gstIrpService.generateQrCode(response, invoiceData);

    return { ...response, qrCode };
  }
}
```

### Cancel IRN

```typescript
async cancelInvoice(irn: string) {
  // Check if cancellation is allowed
  const canCancel = await this.gstIrpService.canCancelIrn(irn);

  if (!canCancel) {
    throw new Error('Cancellation window expired or IRN already cancelled');
  }

  // Cancel IRN
  const response = await this.gstIrpService.cancelIrn({
    irn,
    cnlRsn: '2', // Data entry mistake
    cnlRem: 'Incorrect amount entered',
  });

  return response;
}
```

### Fetch IRN Details

```typescript
async getInvoiceDetails(irn: string) {
  const details = await this.gstIrpService.getIrnByIrn(irn);
  return details;
}

async getInvoiceByDocument(docType: string, docNo: string, docDate: string) {
  const details = await this.gstIrpService.getIrnByDocumentDetails(
    docType,
    docNo,
    docDate,
  );
  return details;
}
```

### Bulk Processing

```typescript
async processMultipleInvoices(invoices: any[]) {
  const result = await this.gstIrpService.generateBulkIrn({
    invoices,
  });

  const successCount = result.results.filter(r => r.status === 'success').length;
  const errorCount = result.results.filter(r => r.status === 'error').length;

  console.log(`Processed: ${successCount} success, ${errorCount} errors`);

  return result;
}
```

## API Reference

### GstIrpService

#### Methods

- **`generateIrn(invoiceData: IrpEInvoiceRequest): Promise<IrpIrnResponse>`**
  Generate IRN for e-invoice

- **`generateIrnHash(input: IrnHashInput): string`**
  Generate SHA-256 hash for IRN

- **`cancelIrn(request: IrpCancelRequest): Promise<IrpCancelResponse>`**
  Cancel IRN within 24 hours

- **`getIrnByIrn(irn: string): Promise<IrpIrnDetailsResponse>`**
  Fetch IRN details by IRN

- **`getIrnByDocumentDetails(docType, docNo, docDate): Promise<IrpIrnDetailsResponse>`**
  Fetch IRN by document details

- **`generateQrCode(irnResponse, invoiceData): Promise<string>`**
  Generate QR code from IRN response

- **`generateBulkIrn(bulkRequest: IrpBulkRequest): Promise<IrpBulkResponse>`**
  Process bulk invoices (max 100)

- **`validateInvoice(invoiceData): ValidationResult`**
  Validate e-invoice structure

- **`canCancelIrn(irn: string): Promise<boolean>`**
  Check if IRN can be cancelled

- **`getHealthStatus(): Promise<object>`**
  Get service health status

## Data Structures

### Invoice Types

- **INV**: Invoice
- **CRN**: Credit Note
- **DBN**: Debit Note

### Supply Types

- **B2B**: Business to Business
- **B2C**: Business to Consumer
- **SEZWP**: SEZ with payment
- **SEZWOP**: SEZ without payment
- **EXPWP**: Export with payment
- **EXPWOP**: Export without payment

### GST Rates

0%, 0.1%, 0.25%, 1%, 1.5%, 3%, 5%, 6%, 7.5%, 12%, 18%, 28%

## Validation

The module performs comprehensive validation:

✅ GSTIN format and checksum
✅ State code validation
✅ HSN/SAC code format
✅ Date format (DD/MM/YYYY)
✅ Invoice calculations
✅ Tax calculations (CGST + SGST = IGST)
✅ Item-level validations
✅ Document number format

## Error Handling

Common error codes:

| Code | Description |
|------|-------------|
| 2150 | Invalid GSTIN |
| 2283 | Duplicate IRN |
| 2271 | Invalid JSON |
| 2001 | Authentication failed |
| 2999 | Rate limit exceeded |
| 2280 | Invoice not found |
| 2284 | Cancellation not allowed |
| 2003 | Invalid signature |

## Rate Limits

Per NIC guidelines:
- 10 requests/second
- 500 requests/minute
- 10,000 requests/hour
- 100,000 requests/day

The client automatically manages rate limits.

## Audit Logging

All operations are logged:
- IRN generation
- IRN cancellation
- IRN fetching
- Authentication
- Errors

Access audit logs:
```typescript
const logs = await auditService.getAuditLogs('29AABCT1332L000', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  operation: 'generate',
});
```

## Testing

Run unit tests:
```bash
npm test gst-irp.service.spec.ts
```

## Security Notes

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Enable digital signatures** in production
4. **Monitor audit logs** regularly
5. **Rotate credentials** periodically
6. **Use TLS 1.3** minimum
7. **Encrypt database** containing credentials

## Compliance

This implementation follows:
- **GST e-Invoice Schema v1.1**
- **NIC IRP API Specifications**
- **GST Rules 2017**
- **Digital Signature Standards**
- **GoBD Compliance** (when used with document storage)

## Support

For GST IRP specific issues:
- GST Helpdesk: 1800-103-4786
- Email: einvoicehelpdesk@gst.gov.in
- Portal: https://einvoice.nat.gov.in/

## References

- [GST E-Invoice Portal](https://einvoice.nat.gov.in/)
- [API Documentation](https://einvoice.nat.gov.in/docs/)
- [GSP List](https://einvoice.nat.gov.in/gsp.html)
- [Schema Specification](https://einvoice.nat.gov.in/schema.html)

## License

Part of Operate/CoachOS - Internal Use Only
