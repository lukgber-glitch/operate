-- Migration: Add Tax Document Archive
-- Created: 2025-12-07
-- Description: Creates TaxDocument table for archiving tax documents with 10-year retention

-- Create TaxDocument table
CREATE TABLE IF NOT EXISTS "TaxDocument" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "period" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDocument_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "TaxDocument"
ADD CONSTRAINT "TaxDocument_organisationId_fkey"
FOREIGN KEY ("organisationId")
REFERENCES "Organisation"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "TaxDocument_organisationId_year_idx" ON "TaxDocument"("organisationId", "year");
CREATE INDEX "TaxDocument_organisationId_type_idx" ON "TaxDocument"("organisationId", "type");
CREATE INDEX "TaxDocument_type_idx" ON "TaxDocument"("type");
CREATE INDEX "TaxDocument_year_idx" ON "TaxDocument"("year");
CREATE INDEX "TaxDocument_retentionUntil_idx" ON "TaxDocument"("retentionUntil");

-- Add comment for documentation
COMMENT ON TABLE "TaxDocument" IS 'Tax document archive with 10-year retention (§147 AO)';
COMMENT ON COLUMN "TaxDocument"."type" IS 'Document type: vat_return, elster_receipt, annual_return, tax_assessment, supporting_doc';
COMMENT ON COLUMN "TaxDocument"."hash" IS 'SHA-256 hash for integrity verification';
COMMENT ON COLUMN "TaxDocument"."retentionUntil" IS 'Document retention expiry date (10 years from end of tax year)';
COMMENT ON COLUMN "TaxDocument"."metadata" IS 'Flexible JSON metadata: transferTicket, submissionId, etc.';
