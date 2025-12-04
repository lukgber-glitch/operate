# Receipts Module

## Overview

REST API endpoints for uploading receipts, performing OCR extraction, and creating expenses from scanned receipts.

## Created Files

```
apps/api/src/modules/finance/expenses/receipts/
├── dto/
│   ├── index.ts                    # Export barrel for all DTOs
│   └── receipts.dto.ts             # Complete DTOs and types
├── receipts.controller.ts          # REST API endpoints
├── receipts.module.ts              # Module configuration with Multer
├── INTEGRATION_GUIDE.md            # Detailed integration guide
└── README.md                       # This file
```

## Endpoints

### Upload Receipt
```
POST /organisations/:orgId/receipts/upload
Content-Type: multipart/form-data
Permission: EXPENSES_CREATE

Body:
  - file: Receipt image (JPEG, PNG, WebP) or PDF (max 10MB)
  - notes: Optional notes (string)
  - autoApprove: Auto-approve if confidence is high (boolean, default: true)

Response: ReceiptScanResult
  - scanId: Unique scan identifier
  - status: PENDING | PROCESSING | COMPLETED | FAILED
  - receiptUrl: URL to uploaded receipt
  - Extracted fields with confidence scores
```

### Get Scan Status
```
GET /organisations/:orgId/receipts/:scanId/status
Permission: EXPENSES_READ

Response:
  - scanId: string
  - status: ScanStatus
  - progress: number (0-100)
```

### Get Scan Result
```
GET /organisations/:orgId/receipts/:scanId
Permission: EXPENSES_READ

Response: ReceiptScanResult with all extracted fields
```

### Confirm Scan & Create Expense
```
POST /organisations/:orgId/receipts/:scanId/confirm
Permission: EXPENSES_CREATE

Body: ConfirmScanDto
  - All fields optional (overrides for scan results)
  - merchantName, date, totalAmount, taxAmount, currency
  - category, subcategory, receiptNumber, paymentMethod
  - notes, description, metadata, approved

Response: Created Expense object
```

### Reject Scan
```
POST /organisations/:orgId/receipts/:scanId/reject
Permission: EXPENSES_CREATE

Body:
  - reason: string (optional)

Response: void
```

### Get Scan History
```
GET /organisations/:orgId/receipts
Permission: EXPENSES_READ

Query: ScanHistoryFiltersDto
  - status: ScanStatus (optional)
  - dateFrom: ISO date string (optional)
  - dateTo: ISO date string (optional)
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)

Response: PaginatedResult<ReceiptScan>
```

### Re-scan Receipt
```
POST /organisations/:orgId/receipts/:scanId/rescan
Permission: EXPENSES_CREATE

Response: ReceiptScanResult (new scan initiated)
```

## DTOs

### Request DTOs (with validation)
- `UploadReceiptDto` - Upload request
- `ConfirmScanDto` - Scan confirmation/correction
- `ScanHistoryFiltersDto` - History filters

### Response Types (interfaces)
- `ReceiptScanResult` - Scan result with extracted data
- `ExtractedField<T>` - Field with confidence score
- `PaginatedResult<T>` - Paginated wrapper
- `ReceiptScan` - Scan history item

### Enums
- `ScanStatus` - PENDING, PROCESSING, COMPLETED, FAILED, CONFIRMED, REJECTED
- `ConfidenceLevel` - HIGH, MEDIUM, LOW

## File Upload Configuration

### Multer Settings
```typescript
{
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: {
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
  },
}
```

### Validation
- File type validation via FileTypeValidator
- File size validation via MaxFileSizeValidator
- Custom error messages for user feedback

## RBAC Permissions

Uses existing expense permissions:
- `EXPENSES_CREATE` - Upload and confirm receipts
- `EXPENSES_READ` - View scan results and history

## Integration Points

### BRIDGE (Mindee OCR)
- OCR extraction from receipt images/PDFs
- Returns extracted fields with confidence scores
- See `INTEGRATION_GUIDE.md` for details

### ORACLE (Receipt Classification)
- AI-powered category suggestion
- Fraud detection
- Auto-approval decision
- See `INTEGRATION_GUIDE.md` for details

### ExpensesService
- Creates expense from confirmed scan
- Validates expense data
- Handles approval workflow

## Implementation Status

✅ Controller with all endpoints
✅ DTOs with validation
✅ Module configuration with Multer
✅ RBAC integration
✅ Swagger documentation
✅ Error handling patterns
✅ Integration guide

⏳ Pending (requires BRIDGE and ORACLE):
- ReceiptsService implementation
- Mindee OCR integration
- Receipt classification service
- Prisma schema for ReceiptScan
- File storage service integration
- Comprehensive tests

## Next Steps

1. **BRIDGE Agent**: Implement Mindee OCR integration
2. **ORACLE Agent**: Implement receipt scanner/classifier service
3. **FORGE Agent**: Implement ReceiptsService with full business logic
4. **VAULT Agent**: Add ReceiptScan Prisma schema
5. **VERIFY Agent**: Add comprehensive test suite

## Usage Example

### Frontend Upload Flow

```typescript
// 1. Upload receipt
const formData = new FormData();
formData.append('file', receiptFile);
formData.append('notes', 'Client lunch');
formData.append('autoApprove', 'true');

const scanResult = await api.post(
  `/organisations/${orgId}/receipts/upload`,
  formData
);

// 2. Poll for completion (or use WebSocket)
const pollStatus = async (scanId) => {
  const { status } = await api.get(
    `/organisations/${orgId}/receipts/${scanId}/status`
  );

  if (status === 'COMPLETED') {
    const result = await api.get(
      `/organisations/${orgId}/receipts/${scanId}`
    );
    return result;
  }

  if (status === 'FAILED') {
    throw new Error('Scan failed');
  }

  // Still processing, poll again
  await sleep(1000);
  return pollStatus(scanId);
};

const result = await pollStatus(scanResult.scanId);

// 3. Show extracted data to user for review/correction
// User can modify any field

// 4. Confirm and create expense
const expense = await api.post(
  `/organisations/${orgId}/receipts/${scanResult.scanId}/confirm`,
  {
    // User corrections (all optional)
    totalAmount: 50.00, // User corrected amount
    category: 'MEALS',  // User confirmed category
    description: 'Business lunch with client',
  }
);

console.log('Expense created:', expense.id);
```

## Error Handling

### File Validation Errors
```typescript
{
  statusCode: 400,
  message: 'File size must not exceed 10MB',
  error: 'Bad Request'
}
```

### OCR Errors
```typescript
{
  statusCode: 502,
  message: 'OCR service failed',
  error: 'Bad Gateway'
}
```

### State Errors
```typescript
{
  statusCode: 400,
  message: 'Scan already confirmed',
  error: 'Bad Request'
}
```

## Security

- File type validation (no executables)
- File size limits (10MB max)
- RBAC permission checks
- Organisation-level isolation
- Signed URLs for receipt access
- Audit trail for all operations

## Notes

- All endpoints are organisation-scoped
- Scans are tied to user who uploaded
- Receipts stored securely with signed URLs
- Background OCR processing (async)
- Confidence scores guide user review
- Auto-approval for high-confidence scans
- Full audit trail maintained
