# Receipt Scanner - Quick Start Guide

Quick reference for using the Receipt Scanner module.

## Installation

### 1. Database Migration

```bash
cd packages/database

# Create migration
npx prisma migrate dev --name add-receipt-scan-model

# Generate Prisma client
npx prisma generate
```

### 2. Module Import

The module is already registered in `AiModule`. No additional setup needed.

## Basic Usage

### Scan a Receipt

```typescript
import { ReceiptScannerService } from '@/modules/ai/receipt-scanner';

@Injectable()
class YourService {
  constructor(
    private readonly receiptScanner: ReceiptScannerService
  ) {}

  async uploadReceipt(file: Express.Multer.File, userId: string, orgId: string) {
    const result = await this.receiptScanner.scanReceipt({
      organisationId: orgId,
      file: file.buffer,
      mimeType: file.mimetype,
      userId: userId,
      fileName: file.originalname,
      autoApprove: true, // Use automation settings
    });

    return result;
  }
}
```

### Get Scan History

```typescript
async getScanHistory(orgId: string) {
  const history = await this.receiptScanner.getScanHistory(orgId, {
    page: 1,
    pageSize: 20,
    status: 'needs_review', // Optional filter
  });

  return history;
}
```

### Create Expense from Scan

```typescript
async approveAndCreateExpense(scanId: string, orgId: string, userId: string) {
  const expenseId = await this.receiptScanner.createExpenseFromScan({
    organisationId: orgId,
    scanId: scanId,
    userId: userId,
    autoApprove: false, // Manual approval
  });

  return { expenseId };
}
```

## Response Format

### Successful Scan (Auto-Approved)

```json
{
  "id": "scan_abc123",
  "status": "completed",
  "ocrData": {
    "merchantName": "ACME Corp",
    "totalAmount": 119.99,
    "currency": "EUR",
    "date": "2024-01-15T00:00:00.000Z",
    "confidence": 0.95
  },
  "classification": {
    "category": "office_supplies",
    "subcategory": "equipment",
    "taxDeductible": true,
    "confidence": 0.92,
    "reasoning": "Office equipment purchase"
  },
  "autoApproval": {
    "eligible": true,
    "approved": true,
    "reason": "Meets confidence threshold and amount limit"
  },
  "expenseId": "exp_xyz789",
  "scannedAt": "2024-01-15T14:30:00.000Z",
  "processedAt": "2024-01-15T14:30:05.000Z"
}
```

### Needs Review

```json
{
  "id": "scan_abc123",
  "status": "needs_review",
  "ocrData": { /* ... */ },
  "classification": {
    "category": "meals_business",
    "confidence": 0.65, // Below threshold
    "reasoning": "Low confidence classification"
  },
  "autoApproval": {
    "eligible": false,
    "approved": false,
    "reason": "Confidence below threshold (65% < 80%)"
  },
  "expenseId": null,
  "scannedAt": "2024-01-15T14:30:00.000Z",
  "processedAt": "2024-01-15T14:30:05.000Z"
}
```

## WebSocket Events

Subscribe to real-time updates:

```typescript
// Client-side (React/Next.js)
socket.on('automation:auto_approved', (payload) => {
  if (payload.entityType === 'receipt_scan') {
    console.log('Receipt auto-approved:', payload.entityId);
    console.log('Expense created:', payload.metadata.expenseId);
  }
});

socket.on('automation:classification_complete', (payload) => {
  if (payload.entityType === 'receipt_scan') {
    console.log('Receipt needs review:', payload.entityId);
  }
});
```

## Automation Settings

Control auto-approval behavior per organization:

```typescript
// Get current settings
const settings = await automationSettingsService.getSettings(orgId);

console.log(settings.expenseApproval); // 'FULL_AUTO' | 'SEMI_AUTO' | 'MANUAL'
console.log(settings.expenseConfidenceThreshold); // 80
console.log(settings.maxAutoApproveAmount); // 500.00

// Update settings
await automationSettingsService.updateSettings(orgId, {
  expenseApproval: 'FULL_AUTO',
  expenseConfidenceThreshold: 85,
  maxAutoApproveAmount: 1000,
});
```

## Decision Flow

```
Receipt Upload
    ↓
autoApprove = true?
    ↓ No → NEEDS_REVIEW
    ↓ Yes
    ↓
mode = MANUAL?
    ↓ Yes → NEEDS_REVIEW
    ↓ No
    ↓
confidence >= threshold?
    ↓ No → NEEDS_REVIEW
    ↓ Yes
    ↓
amount <= maxAutoApproveAmount?
    ↓ No → NEEDS_REVIEW
    ↓ Yes
    ↓
AUTO_APPROVED ✓
(Expense Created)
```

## Common Patterns

### Controller Endpoint

```typescript
@Post('receipts/scan')
@UseInterceptors(FileInterceptor('file'))
async scanReceipt(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: User,
  @Query('autoApprove') autoApprove?: boolean,
) {
  return this.receiptScanner.scanReceipt({
    organisationId: user.orgId,
    file: file.buffer,
    mimeType: file.mimetype,
    userId: user.id,
    fileName: file.originalname,
    autoApprove: autoApprove ?? true,
  });
}
```

### Error Handling

```typescript
try {
  const result = await this.receiptScanner.scanReceipt({...});
  return result;
} catch (error) {
  if (error instanceof BadRequestException) {
    // Invalid file or OCR failed
    return { error: error.message };
  }
  throw error;
}
```

### Pagination

```typescript
async getAllScans(orgId: string, page: number = 1) {
  const result = await this.receiptScanner.getScanHistory(orgId, {
    page,
    pageSize: 20,
  });

  return {
    scans: result.data,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / result.pageSize),
    },
  };
}
```

## Testing

### Mock OCR Service (Development)

The service includes a mock OCR result for development:

```typescript
// Current implementation (temporary)
const ocrResult = this.mockOcrResult();

// Replace with actual Mindee when available
const ocrResult = await this.mindeeService.parseReceipt({
  file,
  mimeType,
});
```

### Test Data

```typescript
const testFile = Buffer.from('fake-image-data');
const testMimeType = 'image/jpeg';

const result = await receiptScanner.scanReceipt({
  organisationId: 'test-org',
  file: testFile,
  mimeType: testMimeType,
  userId: 'test-user',
  fileName: 'test-receipt.jpg',
  autoApprove: true,
});
```

## Troubleshooting

### Scans Always Need Review

Check automation settings:
```typescript
const settings = await automationSettingsService.getSettings(orgId);

if (settings.expenseApproval === 'MANUAL') {
  // Change to SEMI_AUTO or FULL_AUTO
  await automationSettingsService.updateSettings(orgId, {
    expenseApproval: 'FULL_AUTO',
  });
}
```

### Low Confidence Scores

Review confidence threshold:
```typescript
await automationSettingsService.updateSettings(orgId, {
  expenseConfidenceThreshold: 70, // Lower from 80
});
```

### Expenses Not Created

Check for errors in scan record:
```typescript
const scan = await receiptScanner.getScanById(scanId);
if (scan.status === 'FAILED') {
  console.error('Scan failed:', scan.errorMessage);
}
```

## Performance Tips

1. **Async Processing**: Use WebSocket events instead of polling
2. **Pagination**: Always use `pageSize` parameter
3. **Filtering**: Use `status` and `fromDate`/`toDate` filters
4. **Caching**: Cache automation settings per request

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Review [SCHEMA_ADDITIONS.md](./SCHEMA_ADDITIONS.md) for database schema
- Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details

## Support

For issues or questions:
1. Check console logs for errors
2. Review scan status and error messages
3. Verify automation settings
4. Test with mock data first
