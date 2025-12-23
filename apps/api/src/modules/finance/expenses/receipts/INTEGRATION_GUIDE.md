# Receipts Module Integration Guide

## Overview

The Receipts Module provides REST API endpoints for uploading receipts, performing OCR extraction, and creating expenses from receipt data.

## Architecture

```
User → Receipts Controller → Receipt Service → [BRIDGE + ORACLE] → Expense Service
                                                    ↓
                                              File Storage
```

## Integration Points

### 1. BRIDGE Integration (Mindee OCR)

The `uploadReceipt` endpoint will call BRIDGE's Mindee integration:

```typescript
// Example integration call
const ocrResult = await this.mindeeService.scanReceipt({
  fileBuffer: file.buffer,
  fileName: file.originalname,
  mimeType: file.mimetype,
});

// Expected response from BRIDGE
interface MindeeOCRResult {
  merchantName: { value: string; confidence: number };
  date: { value: string; confidence: number };
  totalAmount: { value: number; confidence: number };
  taxAmount: { value: number; confidence: number };
  currency: { value: string; confidence: number };
  receiptNumber: { value: string; confidence: number };
  paymentMethod: { value: string; confidence: number };
}
```

### 2. ORACLE Integration (Receipt Classification)

ORACLE will classify the receipt and suggest categories:

```typescript
// Example integration call
const classification = await this.receiptScannerService.classify({
  merchantName: ocrResult.merchantName.value,
  description: notes || ocrResult.merchantName.value,
  amount: ocrResult.totalAmount.value,
});

// Expected response from ORACLE
interface ClassificationResult {
  category: ExpenseCategory;
  subcategory: string;
  confidence: number;
  autoApprove: boolean; // Based on fraud detection and approval rules
}
```

### 3. File Storage

Receipts must be uploaded to a secure storage service:

```typescript
// Example storage call
const receiptUrl = await this.storageService.uploadFile({
  file: file.buffer,
  fileName: `receipts/${orgId}/${scanId}_${Date.now()}.${ext}`,
  contentType: file.mimetype,
  acl: 'private', // Only organisation members can access
});
```

## Implementation Steps

### Step 1: Create ReceiptsService

```typescript
// apps/api/src/modules/finance/expenses/receipts/receipts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';

@Injectable()
export class ReceiptsService {
  constructor(
    private prisma: PrismaService,
    private mindeeService: MindeeService, // From BRIDGE
    private receiptScannerService: ReceiptScannerService, // From ORACLE
    private storageService: StorageService,
    private expensesService: ExpensesService,
  ) {}

  async uploadAndScan(
    orgId: string,
    userId: string,
    file: Express.Multer.File,
    dto: UploadReceiptDto,
  ): Promise<ReceiptScanResult> {
    // 1. Upload to storage
    const receiptUrl = await this.uploadReceipt(orgId, file);

    // 2. Create scan record
    const scan = await this.prisma.receiptScan.create({
      data: {
        organisationId: orgId,
        uploadedById: userId,
        receiptUrl,
        status: 'PROCESSING',
        notes: dto.notes,
      },
    });

    // 3. Perform OCR (async)
    this.performOCR(scan.id, file, dto.autoApprove).catch(console.error);

    return this.mapToScanResult(scan);
  }

  private async performOCR(
    scanId: string,
    file: Express.Multer.File,
    autoApprove = true,
  ): Promise<void> {
    try {
      // 1. Call Mindee OCR
      const ocr = await this.mindeeService.scanReceipt({
        fileBuffer: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
      });

      // 2. Call ORACLE for classification
      const classification = await this.receiptScannerService.classify({
        merchantName: ocr.merchantName.value,
        amount: ocr.totalAmount.value,
      });

      // 3. Calculate overall confidence
      const overallConfidence = this.calculateConfidence(ocr, classification);

      // 4. Update scan with results
      await this.prisma.receiptScan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          merchantName: ocr.merchantName,
          date: ocr.date,
          totalAmount: ocr.totalAmount,
          taxAmount: ocr.taxAmount,
          currency: ocr.currency,
          category: classification.category,
          subcategory: classification.subcategory,
          receiptNumber: ocr.receiptNumber,
          paymentMethod: ocr.paymentMethod,
          overallConfidence,
          autoApproved: autoApprove && classification.autoApprove,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      // Mark scan as failed
      await this.prisma.receiptScan.update({
        where: { id: scanId },
        data: {
          status: 'FAILED',
          error: error.message,
          completedAt: new Date(),
        },
      });
    }
  }

  async confirmScan(
    scanId: string,
    orgId: string,
    userId: string,
    corrections: ConfirmScanDto,
  ): Promise<Expense> {
    // 1. Get scan result
    const scan = await this.getScan(scanId);

    if (scan.status !== 'COMPLETED') {
      throw new BadRequestException('Scan is not completed');
    }

    // 2. Merge scan data with corrections
    const expenseData = this.mergeScanWithCorrections(scan, corrections);

    // 3. Create expense
    const expense = await this.expensesService.create(orgId, {
      ...expenseData,
      submittedBy: userId,
    });

    // 4. Update scan status
    await this.prisma.receiptScan.update({
      where: { id: scanId },
      data: {
        status: 'CONFIRMED',
        expenseId: expense.id,
      },
    });

    return expense;
  }
}
```

### Step 2: Add Prisma Schema

```prisma
// packages/database/prisma/schema.prisma

model ReceiptScan {
  id               String          @id @default(cuid())
  organisationId   String
  uploadedById     String
  receiptUrl       String
  status           ReceiptScanStatus @default(PENDING)

  // Extracted fields (JSON with value + confidence)
  merchantName     Json?
  date             Json?
  totalAmount      Json?
  taxAmount        Json?
  currency         Json?
  category         Json?
  subcategory      Json?
  receiptNumber    Json?
  paymentMethod    Json?

  overallConfidence Float?
  autoApproved      Boolean         @default(false)
  notes            String?
  error            String?

  expenseId        String?         @unique
  expense          Expense?        @relation(fields: [expenseId], references: [id])

  createdAt        DateTime        @default(now())
  completedAt      DateTime?

  @@index([organisationId, status])
  @@index([uploadedById])
  @@index([createdAt])
  @@map("receipt_scans")
}

enum ReceiptScanStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CONFIRMED
  REJECTED
}
```

### Step 3: Update Controller

Replace `throw new Error('Not implemented')` with actual service calls:

```typescript
async uploadReceipt(...): Promise<ReceiptScanResult> {
  return this.receiptsService.uploadAndScan(orgId, userId, file, uploadDto);
}

async confirmScan(...): Promise<Expense> {
  return this.receiptsService.confirmScan(scanId, orgId, userId, corrections);
}
```

## API Flow

### Upload Flow

1. **POST /organisations/:orgId/receipts/upload**
   - Validate file (type, size)
   - Upload to storage
   - Create scan record (status: PROCESSING)
   - Return scan ID immediately
   - Perform OCR in background

2. **Background Processing**
   - Call BRIDGE Mindee OCR
   - Call ORACLE classification
   - Calculate confidence scores
   - Update scan record (status: COMPLETED)

3. **GET /organisations/:orgId/receipts/:scanId**
   - Return scan result with all extracted fields
   - Frontend displays for user review

4. **POST /organisations/:orgId/receipts/:scanId/confirm**
   - User confirms/corrects extracted data
   - Create expense from scan + corrections
   - Link scan to expense
   - Update scan status to CONFIRMED

## Error Handling

```typescript
// Validation errors
if (!file) {
  throw new BadRequestException('File is required');
}

// File type errors
if (!allowedTypes.includes(file.mimetype)) {
  throw new BadRequestException('Invalid file type');
}

// OCR errors
if (ocrResult.error) {
  throw new BadGatewayException('OCR service failed');
}

// Not found errors
if (!scan) {
  throw new NotFoundException('Scan not found');
}

// State errors
if (scan.status === 'CONFIRMED') {
  throw new BadRequestException('Scan already confirmed');
}
```

## Testing

```typescript
// Example test
describe('ReceiptsController', () => {
  it('should upload and scan receipt', async () => {
    const file = createMockFile('receipt.jpg', 'image/jpeg');
    const result = await controller.uploadReceipt(
      'org-123',
      file,
      { autoApprove: true },
      'user-456',
    );

    expect(result.scanId).toBeDefined();
    expect(result.status).toBe(ScanStatus.PROCESSING);
    expect(result.receiptUrl).toBeDefined();
  });

  it('should confirm scan and create expense', async () => {
    const expense = await controller.confirmScan(
      'org-123',
      'scan-789',
      { totalAmount: 50.00 },
      'user-456',
    );

    expect(expense.id).toBeDefined();
    expect(expense.amount).toBe(50.00);
    expect(expense.status).toBe('PENDING');
  });
});
```

## Security Considerations

1. **File Upload**
   - Validate file type (no executables)
   - Limit file size (10MB max)
   - Scan for malware
   - Use secure storage with signed URLs

2. **RBAC**
   - `EXPENSES_CREATE` - Upload receipts
   - `EXPENSES_READ` - View scan results
   - Organisation-level isolation

3. **Data Privacy**
   - Encrypt files at rest
   - Use signed URLs with expiration
   - Audit all access

## Next Steps

1. **BRIDGE Agent**: Implement Mindee OCR integration
2. **ORACLE Agent**: Implement receipt classification service
3. **FORGE Agent**: Implement ReceiptsService with full logic
4. **VAULT Agent**: Add ReceiptScan schema to Prisma
5. **VERIFY Agent**: Add comprehensive tests

## Dependencies

- `@nestjs/platform-express` - Already installed
- `@types/multer` - Already installed
- Storage service (S3, GCS, or Azure Blob)
- BRIDGE Mindee integration
- ORACLE receipt scanner service
