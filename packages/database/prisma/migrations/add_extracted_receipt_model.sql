-- CreateEnum for Receipt Extraction Status
CREATE TYPE "ReceiptExtractionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum for Payment Method Type
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_PAYMENT', 'WIRE_TRANSFER', 'CHECK', 'OTHER', 'UNKNOWN');

-- CreateEnum for Receipt Type
CREATE TYPE "ReceiptType" AS ENUM ('RETAIL', 'RESTAURANT', 'GAS_STATION', 'HOTEL', 'TRANSPORTATION', 'ENTERTAINMENT', 'OTHER');

-- CreateTable ExtractedReceipt
CREATE TABLE "ExtractedReceipt" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    -- File info
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageKey" TEXT,

    -- Extraction status
    "status" "ReceiptExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,

    -- Extracted data (stored as JSON)
    "extractedData" JSONB NOT NULL,
    "overallConfidence" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "fieldConfidences" JSONB NOT NULL DEFAULT '[]',

    -- Quick access fields (duplicated from extractedData for querying)
    "merchantName" TEXT,
    "receiptDate" DATE,
    "totalAmount" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'EUR',
    "receiptType" "ReceiptType",
    "paymentMethod" "PaymentMethodType",

    -- Categorization (AI suggestions)
    "suggestedCategory" TEXT,
    "suggestedSubcategory" TEXT,
    "categorizationConfidence" DECIMAL(3,2),
    "taxDeductible" BOOLEAN,

    -- Linked expense
    "expenseId" TEXT,

    -- Performance metrics
    "processingTimeMs" INTEGER,

    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractedReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtractedReceipt_organisationId_idx" ON "ExtractedReceipt"("organisationId");
CREATE INDEX "ExtractedReceipt_userId_idx" ON "ExtractedReceipt"("userId");
CREATE INDEX "ExtractedReceipt_status_idx" ON "ExtractedReceipt"("status");
CREATE INDEX "ExtractedReceipt_receiptType_idx" ON "ExtractedReceipt"("receiptType");
CREATE INDEX "ExtractedReceipt_receiptDate_idx" ON "ExtractedReceipt"("receiptDate");
CREATE INDEX "ExtractedReceipt_merchantName_idx" ON "ExtractedReceipt"("merchantName");
CREATE INDEX "ExtractedReceipt_createdAt_idx" ON "ExtractedReceipt"("createdAt");
CREATE INDEX "ExtractedReceipt_expenseId_idx" ON "ExtractedReceipt"("expenseId");
CREATE INDEX "ExtractedReceipt_overallConfidence_idx" ON "ExtractedReceipt"("overallConfidence");

-- CreateIndex for composite queries
CREATE INDEX "ExtractedReceipt_orgId_status_createdAt_idx" ON "ExtractedReceipt"("organisationId", "status", "createdAt");
CREATE INDEX "ExtractedReceipt_orgId_userId_createdAt_idx" ON "ExtractedReceipt"("organisationId", "userId", "createdAt");

-- Add foreign key constraints (optional, depends on your schema setup)
-- ALTER TABLE "ExtractedReceipt" ADD CONSTRAINT "ExtractedReceipt_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "ExtractedReceipt" ADD CONSTRAINT "ExtractedReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "ExtractedReceipt" ADD CONSTRAINT "ExtractedReceipt_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
