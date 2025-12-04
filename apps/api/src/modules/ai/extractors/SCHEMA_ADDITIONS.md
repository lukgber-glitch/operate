# Prisma Schema Additions for Receipt Extractor

Add the following to your `schema.prisma` file:

```prisma
// ============================================================================
// RECEIPT EXTRACTION MODELS (GPT-4 Vision)
// ============================================================================

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

  // File info
  fileName   String
  mimeType   String
  fileSize   Int
  storageKey String? // Optional: for cloud storage reference

  // Extraction status
  status       ReceiptExtractionStatus @default(PENDING)
  errorMessage String?

  // Extracted data (full JSON structure)
  extractedData Json  @default("{}")

  // Confidence metrics
  overallConfidence Decimal @db.Decimal(3, 2) @default(0)
  fieldConfidences  Json    @default("[]") // Array of {field, confidence, notes}

  // Quick access fields (duplicated from extractedData for efficient querying)
  merchantName  String?
  receiptDate   DateTime?    @db.Date
  totalAmount   Decimal?     @db.Decimal(12, 2)
  currency      String?      @default("EUR")
  receiptType   ReceiptType?
  paymentMethod PaymentMethodType?

  // AI Categorization suggestions
  suggestedCategory         String?
  suggestedSubcategory      String?
  categorizationConfidence  Decimal? @db.Decimal(3, 2)
  taxDeductible             Boolean?

  // Linked expense
  expenseId String?
  expense   Expense? @relation(fields: [expenseId], references: [id], onDelete: SetNull)

  // Performance metrics
  processingTimeMs Int?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
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

## Also Update Existing Models

Add the relation to the `Expense` model:

```prisma
model Expense {
  // ... existing fields ...

  // Add this relation
  extractedReceipts ExtractedReceipt[]

  // ... rest of model ...
}
```

Add the relation to the `User` model:

```prisma
model User {
  // ... existing fields ...

  // Add this relation
  extractedReceipts ExtractedReceipt[] @relation("ExtractedReceipts")

  // ... rest of model ...
}
```

Add the relation to the `Organisation` model:

```prisma
model Organisation {
  // ... existing fields ...

  // Add this relation
  extractedReceipts ExtractedReceipt[]

  // ... rest of model ...
}
```

## Migration Steps

1. Add the models to `schema.prisma`
2. Run: `pnpm prisma:generate`
3. Run: `pnpm prisma:migrate dev --name add_extracted_receipt`
4. Run: `pnpm prisma:generate` again to update client

## Field Descriptions

### ExtractedReceipt Model

- **extractedData**: Full JSON containing all extracted fields including:
  - merchantName, merchantAddress, merchantPhone, merchantVatId
  - receiptNumber, date, time
  - items[] (array of line items with description, quantity, unitPrice, totalPrice)
  - subtotal, tax, tip, discount, total
  - currency, taxRate
  - paymentMethod, cardLast4
  - receiptType
  - fieldConfidences[] (confidence per field)
  - metadata (quality, language, warnings, etc.)

- **Quick Access Fields**: Duplicated from extractedData for efficient database queries without parsing JSON

- **Confidence Metrics**:
  - overallConfidence: 0-1 decimal, overall extraction quality
  - fieldConfidences: JSON array with per-field confidence scores

- **Categorization**: AI-suggested expense category based on receipt content

- **Performance**: processingTimeMs tracks extraction time for monitoring

## Example JSON Structure

```json
{
  "extractedData": {
    "merchantName": "Starbucks Coffee",
    "merchantAddress": "123 Main St, Berlin 10115",
    "receiptNumber": "REC-789456",
    "date": "2025-12-03",
    "time": "14:30",
    "items": [
      {
        "description": "Grande Latte",
        "quantity": 2,
        "unitPrice": 4.50,
        "totalPrice": 9.00
      },
      {
        "description": "Blueberry Muffin",
        "quantity": 1,
        "unitPrice": 3.50,
        "totalPrice": 3.50
      }
    ],
    "subtotal": 12.50,
    "tax": 2.38,
    "total": 14.88,
    "currency": "EUR",
    "taxRate": 19,
    "paymentMethod": "CREDIT_CARD",
    "cardLast4": "4242",
    "receiptType": "RESTAURANT",
    "fieldConfidences": [
      {"field": "merchantName", "confidence": 0.98, "notes": "Clear text"},
      {"field": "total", "confidence": 0.95, "notes": "Verified calculation"},
      {"field": "items", "confidence": 0.92, "notes": "All items visible"}
    ],
    "overallConfidence": 0.95,
    "metadata": {
      "language": "en",
      "quality": "high",
      "calculationVerified": true,
      "warnings": null
    }
  }
}
```
