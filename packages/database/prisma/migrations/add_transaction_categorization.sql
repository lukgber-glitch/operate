-- Migration: Add Transaction Categorization Fields
-- Adds category and metadata fields to BankTransactionNew for AI-powered categorization

-- Add category field for auto-categorization
ALTER TABLE "BankTransactionNew" ADD COLUMN "category" "ExpenseCategory";

-- Add metadata field for storing categorization results and tax deductions
ALTER TABLE "BankTransactionNew" ADD COLUMN "metadata" JSONB;

-- Create index on category for faster queries
CREATE INDEX "BankTransactionNew_category_idx" ON "BankTransactionNew"("category");

-- Add comment explaining the fields
COMMENT ON COLUMN "BankTransactionNew"."category" IS 'Auto-categorized expense category from AI classification';
COMMENT ON COLUMN "BankTransactionNew"."metadata" IS 'Stores categorization results, tax deductions, and other AI-generated insights';
