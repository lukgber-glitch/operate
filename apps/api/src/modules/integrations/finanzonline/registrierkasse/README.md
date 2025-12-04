# Registrierkasse Integration

Austrian Cash Register (Registrierkasse) integration with RKSV (Registrierkassensicherheitsverordnung) compliance.

## Overview

This integration provides full support for Austrian cash register requirements as mandated by the RKSV 2017 regulation. Since January 1, 2016, all Austrian businesses using cash registers must comply with RKSV requirements.

## Features

### Core Functionality
- Cash register registration with FinanzOnline
- RKSV-compliant receipt signing
- QR code generation for receipts
- OCR code generation (human-readable backup)
- Receipt chain validation
- DEP (Datenerfassungsprotokoll) export in DEP7 format

### Receipt Types
- **Standard Receipt** (Normalbeleg) - Regular sales receipt
- **Training Receipt** (Schulungsbeleg) - Training mode receipt
- **Void Receipt** (Stornierung) - Cancellation/void
- **Null Receipt** (Nullbeleg) - Zero-value receipt (required if no sales for 24h)
- **Start Receipt** (Startbeleg) - Initial receipt when cash register is activated
- **Daily Closing** (Tagesabschluss) - End of day summary
- **Monthly Closing** (Monatsabschluss) - End of month summary
- **Annual Closing** (Jahresabschluss) - End of year summary

### RKSV Compliance
- Digital signatures using certified devices
- Signature counter (Signaturzähler)
- Turnover counter (Umsatzzähler)
- Receipt chain with hash linking
- Tamper-proof audit trail

## Architecture

### Services

#### RegistrierkasseService
Main service handling cash register operations:
- `registerCashRegister()` - Register new cash register with FinanzOnline
- `signReceipt()` - Sign a receipt with RKSV signature
- `createStartReceipt()` - Create start receipt
- `createNullReceipt()` - Create null receipt
- `createClosingReceipt()` - Create daily/monthly/annual closing
- `verifyReceipt()` - Verify receipt signature

#### DEPExportService
Handles DEP (Datenerfassungsprotokoll) exports:
- `exportDEP()` - Export receipts in DEP7 format
- `exportDEPAsJSON()` - Export as JSON string
- `exportDEPAsSignedJSON()` - Export with checksum
- `validateDEPExport()` - Validate DEP export structure

## Usage Examples

### 1. Register a Cash Register

```typescript
import { RegistrierkasseService } from './registrierkasse/registrierkasse.service';

// Register cash register
const registration = await registrierkasseService.registerCashRegister({
  sessionId: 'fon-session-id',
  organizationId: 'org-123',
  cashRegister: {
    organizationId: 'org-123',
    cashRegisterId: 'KASSE001',
    type: CashRegisterType.INDIVIDUAL,
    serialNumber: 'SN123456',
    aesKey: 'base64-encoded-aes-key',
    taxNumber: '12-345/6789',
    vatId: 'ATU12345678',
    companyName: 'Example GmbH',
    locationName: 'Main Store',
    signatureDevice: {
      type: SignatureDeviceType.ATRUST,
      deviceSerial: 'ATRUST-001',
      algorithm: SignatureAlgorithm.ES256,
      certificateSerial: 'CERT123',
    },
    status: CashRegisterStatus.ACTIVE,
  },
});
```

### 2. Sign a Receipt

```typescript
// Prepare receipt data
const receiptData: ReceiptData = {
  cashRegisterId: 'KASSE001',
  receiptNumber: 0, // Auto-incremented by service
  dateTime: new Date(),
  type: ReceiptType.STANDARD,
  items: [
    {
      description: 'Coffee',
      quantity: 2,
      unitPrice: 290, // in cents
      vatRate: VATRate.STANDARD,
      totalAmount: 580,
    },
  ],
  totalAmount: 580,
  vatBreakdown: [
    {
      rate: VATRate.STANDARD,
      netAmount: 483,
      vatAmount: 97,
      grossAmount: 580,
    },
  ],
  paymentMethod: PaymentMethod.CASH,
  currency: 'EUR',
  trainingMode: false,
};

// Sign receipt
const signedReceipt = await registrierkasseService.signReceipt({
  cashRegisterId: 'KASSE001',
  receiptData,
});

console.log('Receipt ID:', signedReceipt.id);
console.log('Receipt Number:', signedReceipt.receiptNumber);
console.log('QR Code:', signedReceipt.qrCode);
console.log('JWS Signature:', signedReceipt.signature.jws);
```

### 3. Create Null Receipt

```typescript
// Create null receipt (required if no sales for 24 hours)
const nullReceipt = await registrierkasseService.createNullReceipt({
  cashRegisterId: 'KASSE001',
  organizationId: 'org-123',
});
```

### 4. Create Daily Closing

```typescript
// Create daily closing receipt
const closing = await registrierkasseService.createClosingReceipt({
  cashRegisterId: 'KASSE001',
  organizationId: 'org-123',
  closingType: ReceiptType.DAILY_CLOSING,
  periodStart: new Date('2024-01-01T00:00:00Z'),
  periodEnd: new Date('2024-01-01T23:59:59Z'),
});
```

### 5. Export DEP

```typescript
import { DEPExportService } from './registrierkasse/dep-export.service';

// Export DEP for a period
const depExport = await depExportService.exportDEP({
  cashRegisterId: 'KASSE001',
  organizationId: 'org-123',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
});

// Export as JSON
const json = await depExportService.exportDEPAsJSON({
  cashRegisterId: 'KASSE001',
  organizationId: 'org-123',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
});

// Export with checksum
const signed = await depExportService.exportDEPAsSignedJSON({
  cashRegisterId: 'KASSE001',
  organizationId: 'org-123',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
});

console.log('DEP JSON:', signed.data);
console.log('Checksum:', signed.checksum);
```

### 6. Verify Receipt

```typescript
// Verify receipt signature
const verification = await registrierkasseService.verifyReceipt(signedReceipt);

console.log('Valid:', verification.valid);
console.log('JWS Valid:', verification.details.jwsValid);
console.log('Certificate Valid:', verification.details.certificateValid);
console.log('Chain Valid:', verification.details.chainValid);
```

## RKSV Requirements

### Signature Creation Device

The RKSV regulation requires a certified signature creation device:

1. **Hardware Security Module (HSM)** - Dedicated hardware device
2. **A-Trust Signature Card** - Certified smart card from A-Trust
3. **Software Signature** - Only for testing, NOT production-compliant

### Receipt Signature Format

Receipts are signed using JSON Web Signature (JWS) format:

```
Header.Payload.Signature
```

**Header:**
```json
{
  "alg": "ES256",
  "typ": "JWT"
}
```

**Payload includes:**
- Cash register ID
- Receipt number
- Date and time
- Total amount
- Signature counter
- Turnover counter
- Previous receipt hash

### QR Code Format

The QR code on receipts contains:
```
_R1-KASSE001_12345_2024-01-15T10:30:00Z_580_eyJhbGc...
```

Components:
- `_R1` - Version identifier
- Cash register ID
- Receipt number
- Date/time
- Total amount
- JWS signature

### OCR Code Format

Human-readable backup code:
```
KASSE001-12345-240115-1030-0000000580-A3F2
```

Components:
- Cash register ID
- Receipt number
- Date code (YYMMDD)
- Time code (HHMM)
- Amount code
- Signature checksum

## DEP Export Format

DEP7 format structure:

```json
{
  "version": "DEP7",
  "cashRegisterId": "KASSE001",
  "companyName": "Example GmbH",
  "taxNumber": "12-345/6789",
  "vatId": "ATU12345678",
  "periodStart": "2024-01-01T00:00:00Z",
  "periodEnd": "2024-01-31T23:59:59Z",
  "certificateSerial": "CERT123",
  "receipts": [
    {
      "id": "receipt-uuid",
      "receiptNumber": 1,
      "dateTime": "2024-01-15T10:30:00Z",
      "type": "STANDARD",
      "totalAmount": 580,
      "vatBreakdown": [...],
      "jws": "eyJhbGc...",
      "certificateSerial": "CERT123",
      "signatureCounter": 1,
      "turnoverCounter": 580,
      "trainingMode": false
    }
  ],
  "metadata": {
    "totalReceipts": 1,
    "totalTurnover": 580,
    "firstReceiptNumber": 1,
    "lastReceiptNumber": 1,
    "format": "DEP7",
    "softwareVersion": "1.0.0",
    "softwareManufacturer": "CoachOS/Operate"
  },
  "exportedAt": "2024-02-01T00:00:00Z"
}
```

## VAT Rates (Austria)

Supported Austrian VAT rates:

| Rate | Percentage | Usage |
|------|------------|-------|
| STANDARD | 20% | Most goods and services |
| REDUCED_1 | 10% | Food, books, certain services |
| REDUCED_2 | 13% | Specific products |
| SPECIAL | 19% | Agricultural products |
| ZERO | 0% | Exports, certain services |

## Counters

### Receipt Counter
- Sequential number per cash register
- Starts at 1
- Never resets
- Max: 999,999,999

### Signature Counter
- Increments with each signed receipt
- Starts at 0
- Never resets
- Max: 999,999,999

### Turnover Counter
- Cumulative turnover in cents
- Starts at 0
- Never resets
- Used for tamper detection

## Receipt Chain

Each receipt is linked to the previous receipt via hash:
```
Receipt 1 → Hash1 → Receipt 2 → Hash2 → Receipt 3 → ...
```

This creates a tamper-proof chain. Any modification breaks the chain.

## Legal Requirements

### Null Receipts (Nullbeleg)
- Required if no receipts created for 24 hours
- Contains zero turnover
- Maintains signature counter continuity

### Closing Receipts
- **Daily Closing** - Required at least once per 24 hours
- **Monthly Closing** - Required at month end
- **Annual Closing** - Required at year end

### Data Retention
- DEP exports must be kept for 7 years
- Receipts must be available for tax audit
- Cannot delete or modify historical receipts

## Integration with FinanzOnline

Cash registers must be registered with FinanzOnline:

1. Create FinanzOnline session
2. Register cash register with `registerCashRegister()`
3. Receive confirmation number
4. Cash register is active and compliant

## Security Considerations

### Encryption
- AES-256 key for signature creation
- Credentials encrypted in Redis
- TLS for all API communication

### Signature Device
- Must be certified by Austrian authorities
- Private key never leaves device
- HSM or A-Trust card required for production

### Audit Trail
- All operations logged
- Receipt chain immutable
- Tamper detection via counters

## Error Codes

| Code | Description |
|------|-------------|
| RK001 | Invalid cash register ID |
| RK002 | Cash register not found |
| RK003 | Cash register already registered |
| RK004 | Invalid signature |
| RK005 | Signature device error |
| RK006 | Invalid receipt data |
| RK007 | Receipt chain broken |
| RK008 | Counter overflow |
| RK009 | Invalid VAT breakdown |
| RK010 | DEP export error |
| RK011 | Registration failed |
| RK012 | Cash register inactive |
| RK013 | Invalid closing period |
| RK014 | Missing null receipt |
| RK015 | Invalid QR code |

## Testing

### Test Mode
- Use `trainingMode: true` for test receipts
- Training receipts marked with "SCHULUNG"
- Not counted in official statistics
- Still signed and numbered

### Mock Signature Device
- For development/testing only
- Uses software-based signatures
- NOT compliant for production use
- Replace with HSM/A-Trust for production

## Production Deployment

### Prerequisites
1. Certified signature creation device (HSM or A-Trust)
2. FinanzOnline credentials
3. Valid tax number and VAT ID
4. Redis for caching
5. Database for receipt storage

### Configuration
```env
FON_ENVIRONMENT=production
FON_ENCRYPTION_KEY=your-secure-key
RK_SIGNATURE_DEVICE_TYPE=ATRUST
RK_SIGNATURE_DEVICE_HOST=signature-device-host
RK_SIGNATURE_DEVICE_PORT=443
RK_SIGNATURE_DEVICE_CERT=/path/to/cert.pem
```

### Certification
Before production use:
1. Obtain software certification from BMF
2. Update `SOFTWARE_INFO.CERTIFICATION_NUMBER`
3. Register all cash registers with FinanzOnline
4. Perform compliance testing

## Resources

- [BMF RKSV Information](https://www.bmf.gv.at/themen/steuern/elektronische-aufzeichnungspflichten.html)
- [RKSV 2017 Regulation](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20009390)
- [DEP7 Format Specification](https://www.bmf.gv.at/dam/jcr:...)
- [A-Trust Signature Services](https://www.a-trust.at/)
- [FinanzOnline Documentation](https://finanzonline.bmf.gv.at/)

## Support

For questions or issues:
1. Check BMF documentation
2. Contact A-Trust for signature device support
3. Consult with Austrian tax advisor
4. Review error logs and validation results

## License

This integration is part of the Operate/CoachOS platform.
