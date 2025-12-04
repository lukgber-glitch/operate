# Receipt Extractor - Quick Start Guide

## Installation (5 minutes)

### Step 1: Install Dependencies
```bash
cd /c/Users/grube/op/operate
pnpm add openai sharp pdf-lib
```

### Step 2: Configure Environment
Add to `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Add Prisma Schema
Copy the model from `SCHEMA_ADDITIONS.md` to `packages/database/prisma/schema.prisma`:

```prisma
// Add these enums and model at the end of schema.prisma

enum ReceiptExtractionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  NEEDS_REVIEW
}

enum PaymentMethodType {
  CASH
  CREDIT_CARD
  DEBIT_CARD
  MOBILE_PAYMENT
  WIRE_TRANSFER
  CHECK
  OTHER
  UNKNOWN
}

enum ReceiptType {
  RETAIL
  RESTAURANT
  GAS_STATION
  HOTEL
  TRANSPORTATION
  ENTERTAINMENT
  OTHER
}

model ExtractedReceipt {
  id             String  @id @default(uuid())
  organisationId String
  userId         String

  fileName   String
  mimeType   String
  fileSize   Int
  storageKey String?

  status       ReceiptExtractionStatus @default(PENDING)
  errorMessage String?

  extractedData     Json    @default("{}")
  overallConfidence Decimal @db.Decimal(3, 2) @default(0)
  fieldConfidences  Json    @default("[]")

  merchantName  String?
  receiptDate   DateTime?        @db.Date
  totalAmount   Decimal?         @db.Decimal(12, 2)
  currency      String?          @default("EUR")
  receiptType   ReceiptType?
  paymentMethod PaymentMethodType?

  suggestedCategory        String?
  suggestedSubcategory     String?
  categorizationConfidence Decimal? @db.Decimal(3, 2)
  taxDeductible            Boolean?

  expenseId String?
  expense   Expense? @relation(fields: [expenseId], references: [id], onDelete: SetNull)

  processingTimeMs Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  organisation Organisation @relation(fields: [organisationId], references: [id], onDelete: Cascade)
  user         User         @relation("ExtractedReceipts", fields: [userId], references: [id], onDelete: Cascade)

  @@index([organisationId])
  @@index([userId])
  @@index([status])
  @@index([receiptType])
  @@index([receiptDate])
  @@index([merchantName])
  @@index([createdAt])
  @@index([expenseId])
  @@index([overallConfidence])
  @@index([organisationId, status, createdAt])
  @@index([organisationId, userId, createdAt])
}
```

Also update existing models to add relations:
```prisma
model Expense {
  // Add this line:
  extractedReceipts ExtractedReceipt[]
}

model User {
  // Add this line:
  extractedReceipts ExtractedReceipt[] @relation("ExtractedReceipts")
}

model Organisation {
  // Add this line:
  extractedReceipts ExtractedReceipt[]
}
```

### Step 4: Run Migration
```bash
cd packages/database
pnpm prisma migrate dev --name add_extracted_receipt
pnpm prisma generate
```

### Step 5: Register Module
Update `apps/api/src/modules/ai/ai.module.ts`:

```typescript
import { ReceiptExtractorModule } from './extractors/receipt-extractor.module';

@Module({
  imports: [
    // ... existing imports
    ReceiptExtractorModule,
  ],
  exports: [
    // ... existing exports
    ReceiptExtractorModule,
  ],
})
export class AiModule {}
```

## Usage Example

### Basic Receipt Extraction

```typescript
import { ReceiptExtractorService } from '@operate/api/modules/ai/extractors';

@Injectable()
export class ExpenseController {
  constructor(
    private readonly receiptExtractor: ReceiptExtractorService
  ) {}

  @Post('upload-receipt')
  @UseInterceptors(FileInterceptor('file'))
  async uploadReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Body('organisationId') orgId: string,
    @Body('userId') userId: string,
  ) {
    const result = await this.receiptExtractor.extractReceipt({
      file: file.buffer,
      mimeType: file.mimetype,
      organisationId: orgId,
      userId: userId,
      fileName: file.originalname,
      autoCategorize: true,
      autoCreateExpense: true,
    });

    return {
      extractionId: result.id,
      merchantName: result.extractedData.merchantName,
      total: result.extractedData.total,
      confidence: result.overallConfidence,
      category: result.suggestedCategory,
      status: result.status,
    };
  }
}
```

## Test Extraction

Create a test file `test-receipt.ts`:

```typescript
import { ReceiptExtractorService } from './receipt-extractor.service';
import { readFileSync } from 'fs';

// Mock receipt image
const receiptImage = readFileSync('./test-receipt.jpg');

const result = await receiptExtractor.extractReceipt({
  file: receiptImage,
  mimeType: 'image/jpeg',
  organisationId: 'org-123',
  userId: 'user-456',
  fileName: 'test-receipt.jpg',
  autoCategorize: true,
  autoCreateExpense: false,
});

console.log('Extraction Result:', result);
```

## Expected Output

```json
{
  "id": "ext-abc123",
  "organisationId": "org-123",
  "userId": "user-456",
  "fileName": "test-receipt.jpg",
  "mimeType": "image/jpeg",
  "status": "COMPLETED",
  "extractedData": {
    "merchantName": "Starbucks Coffee",
    "merchantAddress": "123 Main St, Berlin",
    "receiptNumber": "REC-789456",
    "date": "2025-12-03",
    "time": "14:30",
    "items": [
      {
        "description": "Grande Latte",
        "quantity": 2,
        "unitPrice": 4.50,
        "totalPrice": 9.00
      }
    ],
    "subtotal": 12.50,
    "tax": 2.38,
    "total": 14.88,
    "currency": "EUR",
    "taxRate": 19,
    "paymentMethod": "CREDIT_CARD",
    "cardLast4": "4242",
    "receiptType": "RESTAURANT"
  },
  "overallConfidence": 0.95,
  "suggestedCategory": "MEALS_ENTERTAINMENT",
  "suggestedSubcategory": "Coffee Shop",
  "categorizationConfidence": 0.92,
  "taxDeductible": true,
  "processingTimeMs": 3420
}
```

## Troubleshooting

### Issue: "OpenAI API key not configured"
**Fix**: Add `OPENAI_API_KEY` to your `.env` file

### Issue: "ExtractedReceipt model not found"
**Fix**: Run `pnpm prisma generate` in packages/database

### Issue: Module import errors
**Fix**: Rebuild the project: `pnpm build`

### Issue: Low confidence scores
**Fix**: Use higher quality images (>800x600, good lighting)

## Next Steps

1. Create REST API endpoints for receipt upload
2. Add file upload middleware (multer)
3. Implement frontend upload component
4. Add progress tracking with WebSockets
5. Create admin dashboard for reviewing low-confidence extractions

## Support

- Documentation: `README.md`
- Schema Details: `SCHEMA_ADDITIONS.md`
- Implementation: `IMPLEMENTATION_SUMMARY.md`
- Contact: luk.gber@gmail.com
