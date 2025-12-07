# Transaction Classification Pipeline

## Overview

The Transaction Classification Pipeline automatically categorizes bank transactions after they're synced from banking providers (Tink, Plaid, etc.). This pipeline uses AI-powered classification to assign expense categories and calculate tax deductions for eligible expenses.

## Architecture

```
Bank Sync → Event Emission → Pipeline Service → Categorization → Tax Deduction
     ↓              ↓                 ↓                ↓                ↓
  Tink API   bank.sync.completed   Batch Process   AI Categories   Tax Calc
                                  (max 50 txns)    (confidence)   (deduction%)
```

## Components

### 1. Transaction Pipeline Service
**File**: `transaction-pipeline.service.ts`

- **Event Listener**: Listens for `bank.sync.completed` events
- **Batch Processing**: Processes up to 50 unclassified transactions at once
- **Auto-Categorization**: Auto-applies categories with >80% confidence
- **Tax Deductions**: Calculates tax deductibility for expenses
- **Error Handling**: Graceful error handling with detailed logging

### 2. Bank Import Processor
**File**: `../bank-sync/jobs/bank-import.processor.ts`

- **Event Emission**: Emits `bank.sync.completed` after successful sync
- **Metadata**: Includes connectionId, accountsSynced, transactionsSynced

### 3. Transaction Categorization Service
**File**: `../../ai/transaction-categorization/transaction-categorization.service.ts`

- **Pattern Matching**: Merchant names, MCC codes, keywords
- **Historical Learning**: Learns from user's past categorizations
- **Confidence Scoring**: Provides confidence scores for each suggestion
- **Batch API**: `batchCategorize()` for efficient processing

### 4. Tax Deduction Classifier
**File**: `../../ai/classification/tax-deduction-classifier.service.ts`

- **Deduction Rules**: Category-based tax deduction percentages
- **Auto-Approval**: Auto-approves high-confidence deductions
- **Compliance Notes**: Generates compliance documentation requirements

## Database Schema

### BankTransactionNew Fields

```prisma
model BankTransactionNew {
  // ... existing fields ...

  // AI Categorization (NEW)
  category ExpenseCategory? // Auto-categorized expense category
  metadata Json? // Stores categorization results, tax deductions, etc.
}
```

### Metadata Structure

```typescript
{
  categorization: {
    primarySuggestion: CategorySuggestion,
    alternateSuggestions: CategorySuggestion[],
    confidence: number,
    categorizedAt: Date
  },
  taxDeduction: {
    deductionPercentage: number,
    deductibleAmount: number,
    confidence: number,
    reasoning: string,
    autoApproved: boolean,
    taxYear: number,
    requiresDocumentation: boolean,
    complianceNotes: string[]
  }
}
```

## Event Flow

### 1. Bank Sync Completes

```typescript
// bank-import.processor.ts
this.eventEmitter.emit('bank.sync.completed', {
  connectionId: string,
  accountsSynced: number,
  transactionsSynced: number,
  timestamp: Date
});
```

### 2. Pipeline Processes Transactions

```typescript
// transaction-pipeline.service.ts
@OnEvent('bank.sync.completed')
async handleBankSyncCompleted(event: BankSyncCompletedEvent) {
  // 1. Fetch unclassified transactions (UNMATCHED, no category)
  // 2. Build categorization requests
  // 3. Batch categorize (max 50)
  // 4. Apply high-confidence categories (>0.8)
  // 5. Calculate tax deductions for expenses
  // 6. Store results in metadata
  // 7. Emit transaction.classified events
}
```

### 3. Categorization Applied

```typescript
// For high-confidence matches
transaction.category = primarySuggestion.categoryId; // Auto-applied

// For all matches
transaction.metadata = {
  categorization: { /* suggestions */ },
  taxDeduction: { /* deduction info */ }
};
```

### 4. Events Emitted

```typescript
this.eventEmitter.emit('transaction.classified', {
  transactionId: string,
  orgId: string,
  category: string,
  confidence: number,
  autoApplied: boolean,
  taxDeduction?: TaxDeductionResult,
  timestamp: Date
});
```

## Usage

### Automatic Processing

The pipeline runs automatically whenever bank transactions are synced:

1. User connects bank account (Tink OAuth)
2. Bank sync job runs (scheduled or manual)
3. New transactions are imported
4. `bank.sync.completed` event emitted
5. Pipeline processes transactions automatically
6. Results stored in database

### Manual Triggers

```typescript
// Re-process connection
await transactionPipelineService.triggerPipeline(connectionId);

// Re-classify specific transactions
await transactionPipelineService.reclassifyTransactions([txId1, txId2]);
```

## Categorization Logic

### Confidence Thresholds

- **>0.8**: Auto-categorized (category field populated)
- **0.5-0.8**: Suggested (stored in metadata, user review needed)
- **<0.5**: Low confidence (fallback to OTHER category)

### Pattern Matching Priority

1. **Historical Patterns** (0.95 confidence if frequent)
2. **MCC Codes** (0.90-0.95 confidence)
3. **Merchant Name** (0.85 confidence)
4. **Merchant Category** (0.75 confidence)
5. **Keywords** (0.65 confidence)

### Example

```
Transaction: "STARBUCKS COFFEE #12345"
Amount: -4.50 EUR
Date: 2025-12-06

Categorization:
- Primary: MEALS (confidence: 0.90)
  - Matched: Merchant name pattern "starbucks|coffee"
  - Reasoning: "Matched based on merchant name pattern"

Tax Deduction:
- Category: meals_business
- Deduction: 70% (3.15 EUR)
- Requires Documentation: No
- Compliance: "Business meals are typically 70% deductible"
```

## Tax Deduction Rules

```typescript
const TAX_DEDUCTION_RULES = {
  office_supplies: { percentage: 100 },
  travel_business: { percentage: 100 },
  meals_business: { percentage: 70 },
  software_subscriptions: { percentage: 100 },
  professional_services: { percentage: 100 },
  marketing: { percentage: 100 },
  utilities: { percentage: 100 },
  rent: { percentage: 100 },
  equipment: { percentage: 100 },
  insurance_business: { percentage: 100 },
  vehicle_business: { percentage: 100 },
  personal: { percentage: 0 },
  unknown: { percentage: 0 }
};
```

## Performance

### Batch Processing

- **Batch Size**: 50 transactions per batch
- **Processing Time**: ~100-200ms per transaction
- **Total for 50**: ~5-10 seconds

### Optimization

- Processes only UNMATCHED transactions
- Only processes transactions without category
- Uses batch API for categorization
- Parallel tax deduction processing
- Indexed queries on reconciliationStatus and category

## Error Handling

```typescript
// Transaction-level errors don't fail entire batch
for (const result of batchResult.results) {
  try {
    await this.applyCategorizationResult(orgId, result);
    // Process tax deduction
  } catch (error) {
    logger.error(`Failed for ${result.transactionId}: ${error.message}`);
    errors.push({ transactionId: result.transactionId, error: error.message });
  }
}

// Returns detailed result with error tracking
return {
  totalProcessed: 50,
  categorized: 48,
  autoCategorized: 35,
  taxDeductionsApplied: 30,
  failed: 2,
  errors: [{ transactionId, error }, ...]
};
```

## Monitoring & Logging

### Log Examples

```
[TransactionPipelineService] Bank sync completed for connection abc-123, processing 15 new transactions
[TransactionPipelineService] Processing 15 unclassified transactions
[TransactionPipelineService] Auto-categorized transaction tx-1 as Meals & Entertainment (confidence: 0.92)
[TransactionPipelineService] Tax deduction processed for transaction tx-1: 70% deductible (3.15 EUR)
[TransactionPipelineService] Pipeline completed for connection abc-123: 15/15 categorized, 12 auto-applied, 10 tax deductions, duration: 2341ms
```

### Events for Monitoring

- `bank.sync.completed` - Sync finished
- `transaction.categorized` - Individual transaction classified
- `transaction.classified` - Emitted per transaction (with details)

## Testing

### Manual Test Flow

1. **Connect Bank**: Use Tink OAuth to connect a test bank
2. **Sync Transactions**: Trigger manual sync or wait for scheduled job
3. **Check Logs**: Look for pipeline processing logs
4. **Verify Database**: Check `BankTransactionNew` records:
   - `category` field populated for high-confidence matches
   - `metadata` field contains categorization and tax deduction data
5. **Review Events**: Check that `transaction.classified` events are emitted

### Test Cases

- ✅ New transactions are categorized
- ✅ High-confidence transactions auto-categorized
- ✅ Low-confidence transactions stored in metadata only
- ✅ Tax deductions calculated for expenses
- ✅ No processing for credit transactions (positive amounts)
- ✅ Batch size limit enforced (50 max)
- ✅ Error handling for failed categorizations
- ✅ Events emitted correctly

## Migration

### Database Migration

```sql
-- Run this migration to add new fields
ALTER TABLE "BankTransactionNew" ADD COLUMN "category" "ExpenseCategory";
ALTER TABLE "BankTransactionNew" ADD COLUMN "metadata" JSONB;
CREATE INDEX "BankTransactionNew_category_idx" ON "BankTransactionNew"("category");
```

**File**: `packages/database/prisma/migrations/add_transaction_categorization.sql`

### Deployment Steps

1. **Update Schema**: Already updated in `schema.prisma`
2. **Run Migration**: Apply SQL migration to database
3. **Generate Prisma Client**: `pnpm prisma generate`
4. **Deploy Code**: Deploy updated API code
5. **Verify**: Check logs for pipeline processing

## Future Enhancements

### Phase 2 (Potential)

- [ ] ML model training from user feedback
- [ ] Custom categorization rules per organization
- [ ] Bulk re-categorization UI
- [ ] Category suggestions in real-time (WebSocket)
- [ ] Advanced tax optimization recommendations
- [ ] Multi-country tax rule support
- [ ] Receipt matching integration
- [ ] Duplicate transaction detection

### Phase 3 (Advanced)

- [ ] GPT-4 integration for complex categorization
- [ ] Anomaly detection (unusual expenses)
- [ ] Budget alerts based on categories
- [ ] Predictive categorization for recurring transactions
- [ ] Custom ML model per organization

## Related Files

- `transaction-pipeline.service.ts` - Main pipeline service
- `banking.module.ts` - Module configuration
- `../bank-sync/bank-sync.service.ts` - Bank sync orchestration
- `../bank-sync/jobs/bank-import.processor.ts` - Background job processor
- `../../ai/transaction-categorization/transaction-categorization.service.ts` - Categorization engine
- `../../ai/classification/tax-deduction-classifier.service.ts` - Tax deduction calculator
- `packages/database/prisma/schema.prisma` - Database schema

## Support

For issues or questions:
1. Check logs in `apps/api` for errors
2. Review event emissions in `bank-import.processor.ts`
3. Verify database schema has new fields
4. Test categorization service directly
5. Check transaction reconciliation status (must be UNMATCHED)
