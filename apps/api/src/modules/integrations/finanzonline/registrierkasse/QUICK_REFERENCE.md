# Registrierkasse Quick Reference

## Quick Start

### 1. Register Cash Register
```typescript
const result = await registrierkasseService.registerCashRegister({
  sessionId: 'fon-session-id',
  organizationId: 'org-123',
  cashRegister: {
    cashRegisterId: 'KASSE001',
    type: CashRegisterType.INDIVIDUAL,
    aesKey: 'base64-key',
    taxNumber: '12-345/6789',
    companyName: 'My Company',
    signatureDevice: {
      type: SignatureDeviceType.ATRUST,
      deviceSerial: 'DEVICE-001',
      algorithm: SignatureAlgorithm.ES256,
    },
  },
});
```

### 2. Sign a Receipt
```typescript
const receipt = await registrierkasseService.signReceipt({
  cashRegisterId: 'KASSE001',
  receiptData: {
    dateTime: new Date(),
    type: ReceiptType.STANDARD,
    items: [{
      description: 'Product',
      quantity: 1,
      unitPrice: 1000, // cents
      vatRate: VATRate.STANDARD,
      totalAmount: 1000,
    }],
    totalAmount: 1000,
    vatBreakdown: [{
      rate: VATRate.STANDARD,
      netAmount: 833,
      vatAmount: 167,
      grossAmount: 1000,
    }],
    paymentMethod: PaymentMethod.CASH,
  },
});
```

### 3. Export DEP
```typescript
const dep = await depExportService.exportDEPAsJSON({
  cashRegisterId: 'KASSE001',
  organizationId: 'org-123',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
});
```

## Receipt Types

| Type | Code | When to Use |
|------|------|-------------|
| Standard | `ReceiptType.STANDARD` | Normal sales |
| Training | `ReceiptType.TRAINING` | Training mode |
| Void | `ReceiptType.VOID` | Cancellations |
| Null | `ReceiptType.NULL` | No sales for 24h |
| Daily Closing | `ReceiptType.DAILY_CLOSING` | End of day |
| Monthly Closing | `ReceiptType.MONTHLY_CLOSING` | End of month |
| Annual Closing | `ReceiptType.ANNUAL_CLOSING` | End of year |

## VAT Rates

| Rate | Percentage | Code |
|------|------------|------|
| Standard | 20% | `VATRate.STANDARD` |
| Reduced 1 | 10% | `VATRate.REDUCED_1` |
| Reduced 2 | 13% | `VATRate.REDUCED_2` |
| Special | 19% | `VATRate.SPECIAL` |
| Zero | 0% | `VATRate.ZERO` |

## Payment Methods

```typescript
PaymentMethod.CASH
PaymentMethod.DEBIT_CARD
PaymentMethod.CREDIT_CARD
PaymentMethod.TRANSFER
PaymentMethod.ONLINE
PaymentMethod.VOUCHER
PaymentMethod.OTHER
```

## Signature Device Types

```typescript
SignatureDeviceType.HSM      // Production: Hardware Security Module
SignatureDeviceType.ATRUST   // Production: A-Trust signature card
SignatureDeviceType.SOFTWARE // Testing only - NOT production compliant
```

## Common Operations

### Create Null Receipt
```typescript
await registrierkasseService.createNullReceipt({
  cashRegisterId: 'KASSE001',
  organizationId: 'org-123',
});
```

### Create Daily Closing
```typescript
await registrierkasseService.createClosingReceipt({
  cashRegisterId: 'KASSE001',
  organizationId: 'org-123',
  closingType: ReceiptType.DAILY_CLOSING,
  periodStart: new Date('2024-01-01T00:00:00'),
  periodEnd: new Date('2024-01-01T23:59:59'),
});
```

### Verify Receipt
```typescript
const verification = await registrierkasseService.verifyReceipt(receipt);
console.log('Valid:', verification.valid);
```

## Important Constants

```typescript
// Receipt number range
RECEIPT_NUMBER_FORMAT.MIN = 1
RECEIPT_NUMBER_FORMAT.MAX = 999999999

// Signature counter
SIGNATURE_COUNTER_LIMITS.INITIAL = 0
SIGNATURE_COUNTER_LIMITS.MAX = 999999999

// Turnover counter
TURNOVER_COUNTER_LIMITS.INITIAL = 0

// DEP export limits
DEP_EXPORT_LIMITS.MAX_RECEIPTS = 100000
DEP_EXPORT_LIMITS.MAX_PERIOD_DAYS = 366
```

## Error Handling

```typescript
try {
  const receipt = await registrierkasseService.signReceipt(request);
} catch (error) {
  if (error.code === 'RK002') {
    // Cash register not found
  } else if (error.code === 'RK006') {
    // Invalid receipt data
  } else if (error.code === 'RK007') {
    // Receipt chain broken
  }
}
```

## Testing vs Production

### Testing
```typescript
{
  trainingMode: true,  // Marks as training receipt
  signatureDevice: {
    type: SignatureDeviceType.SOFTWARE  // Mock signatures
  }
}
```

### Production
```typescript
{
  trainingMode: false,
  signatureDevice: {
    type: SignatureDeviceType.ATRUST,  // Real signature device
    certificateSerial: 'REAL-CERT-123',
    connection: {
      host: 'signature.example.com',
      port: 443,
      apiKey: 'api-key'
    }
  }
}
```

## VAT Calculation Example

```typescript
// Item: €10.00 with 20% VAT
const gross = 1000;  // cents
const vatRate = 20;  // percent
const net = Math.round(gross / (1 + vatRate / 100));
const vat = gross - net;

const vatBreakdown: VATBreakdown = {
  rate: VATRate.STANDARD,
  netAmount: net,      // 833 cents
  vatAmount: vat,      // 167 cents
  grossAmount: gross,  // 1000 cents
};
```

## Cache Keys

```typescript
// Cash register data
`rk:register:${organizationId}:${cashRegisterId}`

// Counters
`rk:counter:receipt:${cashRegisterId}`
`rk:counter:signature:${cashRegisterId}`
`rk:counter:turnover:${cashRegisterId}`

// Last receipt hash
`rk:hash:last:${cashRegisterId}`
```

## File Exports

### Generate DEP Filename
```typescript
const filename = depExportService.generateFilename(
  'KASSE001',
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
// Returns: "DEP_KASSE001_20240101_20240131.json"
```

### DEP with Checksum
```typescript
const { data, checksum } = await depExportService.exportDEPAsSignedJSON({
  cashRegisterId: 'KASSE001',
  organizationId: 'org-123',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
});

// Save to file with checksum
fs.writeFileSync('dep.json', data);
fs.writeFileSync('dep.json.sha256', checksum);
```

## Compliance Checklist

- [ ] Cash register registered with FinanzOnline
- [ ] Certified signature device configured
- [ ] Start receipt created
- [ ] Receipts signed with RKSV signature
- [ ] Null receipts created when required (no sales 24h)
- [ ] Daily closing created every 24 hours
- [ ] Monthly closing created at month end
- [ ] Annual closing created at year end
- [ ] DEP exports stored for 7 years
- [ ] Receipt chain unbroken
- [ ] Counters never overflow
- [ ] QR codes on all receipts
- [ ] Software certified by BMF

## Resources

- Full documentation: `README.md`
- Type definitions: `registrierkasse.types.ts`
- Constants: `registrierkasse.constants.ts`
- BMF Information: https://www.bmf.gv.at/
