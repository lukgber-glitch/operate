-- Add email classification fields to synced_emails table
-- Migration: add_email_classification_fields
-- Date: 2025-12-06

-- Add classification columns
ALTER TABLE "synced_emails"
  ADD COLUMN IF NOT EXISTS "classification" TEXT,
  ADD COLUMN IF NOT EXISTS "classificationConfidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "classificationPriority" TEXT,
  ADD COLUMN IF NOT EXISTS "classificationReasoning" TEXT,
  ADD COLUMN IF NOT EXISTS "classificationIntent" TEXT,
  ADD COLUMN IF NOT EXISTS "classificationEntities" JSONB,
  ADD COLUMN IF NOT EXISTS "classificationAction" TEXT,
  ADD COLUMN IF NOT EXISTS "classificationActionDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "classificationFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "classifiedAt" TIMESTAMP(3);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "synced_emails_classification_idx" ON "synced_emails"("classification");
CREATE INDEX IF NOT EXISTS "synced_emails_classificationPriority_idx" ON "synced_emails"("classificationPriority");
CREATE INDEX IF NOT EXISTS "synced_emails_classifiedAt_idx" ON "synced_emails"("classifiedAt");

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN "synced_emails"."classification" IS 'Email classification category (INVOICE_RECEIVED, PAYMENT_RECEIVED, etc.)';
COMMENT ON COLUMN "synced_emails"."classificationConfidence" IS 'AI confidence score for classification (0-1)';
COMMENT ON COLUMN "synced_emails"."classificationPriority" IS 'Priority level (CRITICAL, HIGH, MEDIUM, LOW, SPAM)';
COMMENT ON COLUMN "synced_emails"."classificationReasoning" IS 'AI reasoning for the classification';
COMMENT ON COLUMN "synced_emails"."classificationIntent" IS 'Extracted intent from email content';
COMMENT ON COLUMN "synced_emails"."classificationEntities" IS 'Extracted business entities (vendor name, invoice number, amounts, etc.)';
COMMENT ON COLUMN "synced_emails"."classificationAction" IS 'Suggested action (CREATE_BILL, RECORD_PAYMENT, etc.)';
COMMENT ON COLUMN "synced_emails"."classificationActionDetails" IS 'Additional details for suggested action';
COMMENT ON COLUMN "synced_emails"."classificationFlags" IS 'Additional classification flags (urgent, review_needed, etc.)';
COMMENT ON COLUMN "synced_emails"."classifiedAt" IS 'Timestamp when email was classified';
