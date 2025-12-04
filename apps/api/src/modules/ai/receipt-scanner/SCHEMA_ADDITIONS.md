# Receipt Scanner - Prisma Schema Additions

This document outlines the Prisma schema additions required for the Receipt Scanner feature.

## Required Schema Addition

Add the following model to your `schema.prisma` file:

```prisma
// ============================================================================
// RECEIPT SCANNER MODELS
// ============================================================================

enum ScanStatus {
  PENDING
  PROCESSING
  COMPLETED
  NEEDS_REVIEW
  FAILED
}

model ReceiptScan {
  id              String          @id @default(cuid())
  organisationId  String
  organisation    Organisation    @relation("ReceiptScans", fields: [organisationId], references: [id], onDelete: Cascade)

  // File info
  fileName        String
  fileSize        Int
  mimeType        String
  fileUrl         String?         // S3/storage URL (optional, for future file storage)

  // OCR results (stored as JSON)
  ocrData         Json            // ReceiptParseResult from Mindee
  ocrConfidence   Float           // 0.0-1.0

  // AI Classification results
  category        String?
  subcategory     String?
  taxDeductible   Boolean         @default(false)

  // Status
  status          ScanStatus      @default(PENDING)
  errorMessage    String?

  // Related expense (created from scan)
  expenseId       String?         @unique
  expense         Expense?        @relation(fields: [expenseId], references: [id])

  // User who uploaded
  userId          String
  user            User            @relation("UserReceiptScans", fields: [userId], references: [id])

  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([organisationId, status])
  @@index([userId])
  @@index([createdAt])
  @@index([expenseId])
}
```

## Update Organisation Model

Add the following relation to the `Organisation` model:

```prisma
model Organisation {
  // ... existing fields ...

  receiptScans ReceiptScan[] @relation("ReceiptScans")
}
```

## Update User Model

Add the following relation to the `User` model:

```prisma
model User {
  // ... existing fields ...

  receiptScans ReceiptScan[] @relation("UserReceiptScans")
}
```

## Update Expense Model

Add the following relation to the `Expense` model:

```prisma
model Expense {
  // ... existing fields ...

  receiptScan ReceiptScan?
}
```

## Migration Steps

After adding the schema:

1. Generate Prisma client:
   ```bash
   cd packages/database
   npx prisma generate
   ```

2. Create migration:
   ```bash
   npx prisma migrate dev --name add-receipt-scan-model
   ```

3. Apply migration to production:
   ```bash
   npx prisma migrate deploy
   ```

## Data Structure

### ReceiptScan.ocrData (JSON)

The `ocrData` field stores the complete OCR result from Mindee as JSON:

```typescript
{
  merchantName: string;
  merchantAddress?: string;
  merchantVatId?: string;
  merchantPhone?: string;
  receiptNumber?: string;
  date?: Date;
  time?: string;
  totalAmount?: number;
  subtotal?: number;
  taxAmount?: number;
  tipAmount?: number;
  currency?: string;
  taxRate?: number;
  taxLines?: Array<{
    description: string;
    rate: number;
    amount: number;
  }>;
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  paymentMethod?: string;
  cardLast4?: string;
  confidence: number;
  rawText?: string;
  ocrProvider: 'mindee';
}
```

## Indexes

The model includes the following indexes for optimal query performance:

- `[organisationId, status]` - For filtering scans by org and status
- `[userId]` - For user-specific scan history
- `[createdAt]` - For chronological ordering
- `[expenseId]` - For linking scans to expenses

## Notes

- The `fileUrl` field is optional and prepared for future file storage integration (S3, etc.)
- The `ocrConfidence` is stored as a separate field for easy querying
- The relationship with `Expense` is one-to-one (a scan creates one expense)
- All scans cascade delete when the organization is deleted
- The `status` enum tracks the processing pipeline: PENDING → PROCESSING → COMPLETED/NEEDS_REVIEW/FAILED
