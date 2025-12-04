# Receipt Scanner Module

AI-powered receipt scanning with OCR (Mindee) integration, automatic classification, and expense creation.

## Overview

The Receipt Scanner module combines OCR technology with AI classification to automatically process receipt images and create expenses. It integrates with:

- **Mindee OCR** (via BRIDGE) - Extracts structured data from receipt images
- **Classification Service** - AI-powered categorization and tax analysis
- **Automation System** - Auto-approval based on confidence and rules
- **Expense Management** - Automatic expense creation

## Features

### 1. OCR Processing
- Extracts merchant name, address, VAT ID
- Parses receipt number, date, time
- Identifies amounts (total, subtotal, tax)
- Extracts line items with quantities and prices
- Detects payment method

### 2. AI Classification
- Automatically categorizes expenses
- Determines tax deductibility
- Suggests accounting codes
- Calculates confidence scores
- Provides reasoning for classifications

### 3. Automation Integration
- Checks automation settings per organization
- Evaluates auto-approval eligibility
- Respects confidence thresholds
- Honors amount limits
- Creates audit trail

### 4. Real-time Updates
- WebSocket events for scan progress
- Notifications on completion
- Live status updates
- Error reporting

## Architecture

```
┌─────────────────┐
│  File Upload    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create Scan    │  (Status: PENDING)
│  Record         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mindee OCR     │  (Status: PROCESSING)
│  Processing     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI             │
│  Classification │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auto-Approval  │
│  Evaluation     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────┐  ┌─────────┐
│Auto │  │ Needs   │
│Create│  │ Review  │
│Expense│ │         │
└─────┘  └─────────┘
```

## Service Methods

### `scanReceipt(params)`

Main method to scan a receipt.

**Parameters:**
```typescript
{
  organisationId: string;
  file: Buffer;
  mimeType: string;
  userId: string;
  fileName?: string;
  autoApprove?: boolean;
}
```

**Returns:**
```typescript
ReceiptScanResult {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'needs_review';
  ocrData: ReceiptParseResult;
  classification: ReceiptClassificationResult;
  autoApproval: {
    eligible: boolean;
    approved: boolean;
    reason: string;
  };
  expenseId?: string;
  scannedAt: Date;
  processedAt?: Date;
}
```

**Example:**
```typescript
const result = await receiptScannerService.scanReceipt({
  organisationId: 'org_123',
  file: fileBuffer,
  mimeType: 'image/jpeg',
  userId: 'user_456',
  fileName: 'receipt.jpg',
  autoApprove: true,
});

console.log(result.status); // 'completed' or 'needs_review'
if (result.expenseId) {
  console.log('Expense created:', result.expenseId);
}
```

### `classifyReceipt(ocrResult)`

Classify a receipt using AI.

**Parameters:**
```typescript
ocrResult: ReceiptParseResult
```

**Returns:**
```typescript
ReceiptClassificationResult {
  category: string;
  subcategory?: string;
  taxDeductible: boolean;
  taxDeductionPercentage?: number;
  suggestedAccount?: string;
  confidence: number;
  reasoning: string;
}
```

### `createExpenseFromScan(params)`

Create an expense from an existing scan.

**Parameters:**
```typescript
{
  organisationId: string;
  scanId: string;
  userId: string;
  autoApprove?: boolean;
}
```

**Returns:** `string` (expenseId)

**Use case:** When a scan was marked as "needs_review" but is later approved manually.

### `getScanHistory(organisationId, filters?)`

Get scan history with pagination and filters.

**Filters:**
```typescript
{
  status?: 'pending' | 'completed' | 'failed' | 'needs_review';
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
}
```

**Returns:**
```typescript
{
  data: ReceiptScan[];
  total: number;
  page: number;
  pageSize: number;
}
```

## Integration with Automation

The Receipt Scanner respects organization automation settings:

### Auto-Approval Rules

1. **Automation Mode Check**
   - FULL_AUTO: Automatically create and approve
   - SEMI_AUTO: Create but mark for review
   - MANUAL: Always require review

2. **Confidence Threshold**
   - Uses `expenseConfidenceThreshold` from automation settings
   - Default: 80%
   - Only auto-approves if classification confidence ≥ threshold

3. **Amount Limits**
   - Checks `maxAutoApproveAmount` setting
   - No auto-approval for expenses above limit
   - Null = no limit

### Example Decision Flow

```typescript
// Get automation settings
const settings = await automationSettingsService.getSettings(orgId);

// settings.expenseApproval = 'FULL_AUTO'
// settings.expenseConfidenceThreshold = 85
// settings.maxAutoApproveAmount = 500.00

// Scan with confidence 90%, amount €250
// Result: AUTO-APPROVED ✓

// Scan with confidence 75%, amount €250
// Result: NEEDS_REVIEW (confidence too low)

// Scan with confidence 90%, amount €750
// Result: NEEDS_REVIEW (amount too high)
```

## WebSocket Events

The module emits real-time events via EventsGateway:

### Events

1. **AutomationEvent.AUTO_APPROVED**
   - Emitted when receipt is auto-approved
   - Creates expense automatically

2. **AutomationEvent.CLASSIFICATION_COMPLETE**
   - Emitted when classification is done
   - Marked for review (not auto-approved)

### Event Payload

```typescript
{
  organizationId: string;
  entityType: 'receipt_scan';
  entityId: string; // scan ID
  feature: 'receipt_scanner';
  action: 'AUTO_APPROVED' | 'NEEDS_REVIEW';
  timestamp: Date;
  autoApproved: boolean;
  metadata: {
    expenseId?: string;
  };
}
```

## Database Schema

See [SCHEMA_ADDITIONS.md](./SCHEMA_ADDITIONS.md) for Prisma schema details.

### Key Fields

- **ocrData** (JSON): Complete OCR result from Mindee
- **ocrConfidence** (Float): OCR confidence score
- **category/subcategory** (String): AI classification
- **taxDeductible** (Boolean): Tax deductibility flag
- **status** (Enum): Processing status
- **expenseId** (String): Linked expense (if created)

## OCR Data Structure

The `ocrData` field contains structured information extracted by Mindee:

```typescript
{
  // Vendor
  merchantName: "ACME Corp",
  merchantAddress: "123 Main St, Berlin",
  merchantVatId: "DE123456789",

  // Receipt
  receiptNumber: "INV-2024-001",
  date: "2024-01-15",
  time: "14:30",

  // Amounts
  totalAmount: 119.00,
  subtotal: 100.00,
  taxAmount: 19.00,
  currency: "EUR",
  taxRate: 19,

  // Items
  lineItems: [
    {
      description: "Office Chair",
      quantity: 1,
      unitPrice: 100.00,
      totalPrice: 100.00
    }
  ],

  // Payment
  paymentMethod: "credit_card",
  cardLast4: "4242",

  // Meta
  confidence: 0.95,
  ocrProvider: "mindee"
}
```

## Error Handling

The service handles errors gracefully:

1. **OCR Failures**
   - Status set to `FAILED`
   - Error message stored in `errorMessage`
   - No expense created

2. **Classification Failures**
   - Falls back to default category
   - Lower confidence score
   - Marked for review

3. **Validation Errors**
   - Invalid file format
   - Missing required data
   - Throws `BadRequestException`

## Development Notes

### Current Status

- ✅ Service implementation complete
- ✅ AI classification integration
- ✅ Automation integration
- ✅ WebSocket events
- ⏳ Mindee integration (pending BRIDGE)
- ⏳ File storage (S3) integration
- ⏳ Controller endpoints

### TODO: Mindee Integration

The service currently uses a mock OCR result for development. Once BRIDGE creates the Mindee integration:

1. Uncomment Mindee service injection in constructor
2. Replace `mockOcrResult()` with actual Mindee call
3. Remove mock method

```typescript
// Replace this:
const ocrResult: ReceiptParseResult = this.mockOcrResult();

// With this:
const ocrResult = await this.mindeeService.parseReceipt({
  file,
  mimeType,
});
```

### TODO: File Storage

Add file storage (S3) to persist receipt images:

```typescript
// Upload to S3
const fileUrl = await this.storageService.uploadReceipt({
  file,
  fileName,
  organisationId,
});

// Save URL in database
await this.prisma.receiptScan.update({
  where: { id: scanId },
  data: { fileUrl },
});
```

## Testing

### Unit Tests

```typescript
describe('ReceiptScannerService', () => {
  it('should scan receipt and auto-approve', async () => {
    const result = await service.scanReceipt({
      organisationId: 'org_123',
      file: mockFile,
      mimeType: 'image/jpeg',
      userId: 'user_456',
      autoApprove: true,
    });

    expect(result.status).toBe('completed');
    expect(result.expenseId).toBeDefined();
    expect(result.autoApproval.approved).toBe(true);
  });

  it('should mark for review if confidence low', async () => {
    // Mock low confidence
    jest.spyOn(classificationService, 'classifyTransaction')
      .mockResolvedValue({ confidence: 0.6, ... });

    const result = await service.scanReceipt({...});

    expect(result.status).toBe('needs_review');
    expect(result.expenseId).toBeUndefined();
  });
});
```

### Integration Tests

```typescript
describe('Receipt Scanner E2E', () => {
  it('should process receipt end-to-end', async () => {
    // 1. Upload receipt
    const scanResult = await receiptScanner.scanReceipt({...});

    // 2. Verify scan record created
    const scan = await prisma.receiptScan.findUnique({
      where: { id: scanResult.id },
    });
    expect(scan).toBeDefined();

    // 3. Verify expense created (if auto-approved)
    if (scanResult.expenseId) {
      const expense = await prisma.expense.findUnique({
        where: { id: scanResult.expenseId },
      });
      expect(expense.status).toBe('APPROVED');
    }
  });
});
```

## Usage Example

### Basic Receipt Scan

```typescript
import { ReceiptScannerService } from './receipt-scanner.service';

// In your controller/service
const result = await this.receiptScanner.scanReceipt({
  organisationId: req.user.orgId,
  file: req.file.buffer,
  mimeType: req.file.mimetype,
  userId: req.user.id,
  fileName: req.file.originalname,
  autoApprove: true, // Respect automation settings
});

// Handle result
if (result.status === 'completed' && result.expenseId) {
  return {
    message: 'Receipt processed and expense created',
    expenseId: result.expenseId,
  };
} else if (result.status === 'needs_review') {
  return {
    message: 'Receipt scanned, manual review required',
    scanId: result.id,
    reason: result.autoApproval.reason,
  };
}
```

### Get Scan History

```typescript
const history = await this.receiptScanner.getScanHistory(
  'org_123',
  {
    status: 'needs_review',
    page: 1,
    pageSize: 20,
  }
);

console.log(`Found ${history.total} scans needing review`);
history.data.forEach(scan => {
  console.log(`- ${scan.fileName}: ${scan.category}`);
});
```

### Manual Expense Creation

```typescript
// User reviews a scan and approves it
const expenseId = await this.receiptScanner.createExpenseFromScan({
  organisationId: 'org_123',
  scanId: 'scan_789',
  userId: 'user_456',
  autoApprove: false, // Manual approval
});

console.log('Expense created:', expenseId);
```

## Configuration

No additional configuration required. The service uses existing automation settings from `AutomationSettings` model.

### Related Settings

- `expenseApproval`: AutomationMode (FULL_AUTO | SEMI_AUTO | MANUAL)
- `expenseConfidenceThreshold`: number (0-100)
- `maxAutoApproveAmount`: Decimal (optional)

## Dependencies

### Internal Modules
- `ClassificationService` - AI classification
- `AutomationSettingsService` - Automation rules
- `AutoApproveService` - Auto-approval logic
- `ExpensesService` - Expense creation
- `EventsGateway` - WebSocket events
- `PrismaService` - Database access

### External Services
- `MindeeService` (via BRIDGE) - OCR processing

## Security Considerations

1. **File Validation**
   - Validate MIME types
   - Check file sizes
   - Scan for malware

2. **Access Control**
   - Verify user belongs to organization
   - Check permissions for expense creation

3. **Data Privacy**
   - Sanitize OCR data before storage
   - Consider GDPR implications for receipt storage
   - Encrypt sensitive data (card numbers, etc.)

## Performance

- OCR processing: ~2-5 seconds per receipt
- Classification: ~1-2 seconds
- Total processing time: ~3-7 seconds
- WebSocket events provide real-time feedback

## Future Enhancements

1. **Batch Processing**
   - Upload multiple receipts
   - Process in background queue
   - Email summary when complete

2. **Receipt Templates**
   - Learn from repeated merchants
   - Pre-fill categories
   - Suggest expense codes

3. **Duplicate Detection**
   - Check for duplicate receipts
   - Compare amounts and dates
   - Prevent double-entry

4. **Mobile App Integration**
   - Camera capture
   - Instant feedback
   - Offline queuing

5. **Advanced OCR**
   - Multi-currency support
   - Language detection
   - Handwriting recognition
