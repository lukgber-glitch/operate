# Transaction Categorization Integration Guide

## Overview
The Transaction Categorization Service provides AI-powered category suggestions for bank transactions using rule-based pattern matching.

## Integration Points

### 1. Bank Import Processor Integration

Add categorization after transaction import:

```typescript
// In bank-import.processor.ts

import { TransactionCategorizationService } from '../../../ai/transaction-categorization';

@Processor(BANK_IMPORT_QUEUE)
export class BankImportProcessor {
  constructor(
    private readonly bankSyncService: BankSyncService,
    private readonly eventEmitter: EventEmitter2,
    private readonly categorizationService: TransactionCategorizationService, // Add this
  ) {}

  private async handleSyncConnection(
    job: Job<SyncConnectionJobData>,
  ): Promise<BankImportJobResult> {
    // ... existing sync logic ...

    // After successful sync, categorize new transactions
    if (syncResult.success && syncResult.newTransactions > 0) {
      await this.categorizeNewTransactions(
        connectionId,
        syncResult.transactionIds,
        job.data.orgId,
      );
    }

    return result;
  }

  /**
   * Categorize newly imported transactions
   */
  private async categorizeNewTransactions(
    connectionId: string,
    transactionIds: string[],
    orgId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Auto-categorizing ${transactionIds.length} transactions from connection ${connectionId}`,
      );

      // Fetch transactions from database
      const transactions = await this.prisma.bankTransactionNew.findMany({
        where: { id: { in: transactionIds } },
      });

      // Build categorization requests
      const requests = transactions.map(t => ({
        transactionId: t.id,
        merchantName: t.merchantName || undefined,
        merchantCategory: t.merchantCategory || undefined,
        description: t.description,
        amount: t.amount.toNumber(),
        currency: t.currency,
        date: t.bookingDate,
        orgId,
      }));

      // Batch categorize
      const result = await this.categorizationService.batchCategorize(requests);

      // Update transactions with suggestions (store in metadata)
      for (const catResult of result.results) {
        await this.prisma.bankTransactionNew.update({
          where: { id: catResult.transactionId },
          data: {
            rawData: {
              ...(transactions.find(t => t.id === catResult.transactionId)?.rawData as any || {}),
              categorization: {
                primarySuggestion: catResult.primarySuggestion,
                alternateSuggestions: catResult.alternateSuggestions,
                confidence: catResult.confidence,
                categorizedAt: catResult.categorizedAt,
              },
            },
          },
        });

        // Auto-apply category if confidence is high enough
        if (catResult.autoCategorizationEnabled) {
          await this.prisma.bankTransactionNew.update({
            where: { id: catResult.transactionId },
            data: {
              // Note: Add category field to BankTransactionNew model if not exists
              // For now, store in metadata
            },
          });
        }
      }

      this.logger.log(
        `Categorization complete: ${result.categorized}/${result.total} successful ` +
        `(${result.results.filter(r => r.autoCategorizationEnabled).length} auto-applied)`,
      );
    } catch (error) {
      // Don't fail the import if categorization fails
      this.logger.warn(
        `Failed to categorize transactions from connection ${connectionId}: ${error.message}`,
      );
    }
  }
}
```

### 2. Bank Import Module Update

Update the module to import TransactionCategorizationModule:

```typescript
// In bank-import.module.ts

import { TransactionCategorizationModule } from '../../../ai/transaction-categorization';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BANK_IMPORT_QUEUE,
    }),
    PrismaModule,
    TransactionCategorizationModule, // Add this
  ],
  providers: [BankImportProcessor, BankImportScheduler],
  exports: [BullModule],
})
export class BankImportModule {}
```

## Event System

The categorization service emits the following events:

### `transaction.categorized`
Emitted when a transaction is categorized.

```typescript
{
  transactionId: string;
  orgId: string;
  category: ExpenseCategory;
  confidence: number;
  timestamp: Date;
}
```

### `transaction.learning`
Emitted when learning from user feedback.

```typescript
{
  transactionId: string;
  orgId: string;
  merchantName: string;
  category: ExpenseCategory;
  timestamp: Date;
}
```

## API Usage Examples

### Categorize Single Transaction

```typescript
const result = await categorizationService.categorizeTransaction({
  transactionId: 'txn-123',
  merchantName: 'STARBUCKS MUNICH',
  merchantCategory: 'Restaurant',
  description: 'Coffee meeting',
  amount: 15.50,
  currency: 'EUR',
  date: new Date(),
  orgId: 'org-456',
});

console.log(result.primarySuggestion);
// {
//   categoryId: 'MEALS',
//   categoryName: 'Meals & Entertainment',
//   confidence: 0.90,
//   reasoning: 'Matched based on merchant name pattern'
// }
```

### Batch Categorization

```typescript
const batchResult = await categorizationService.batchCategorize([
  {
    transactionId: 'txn-1',
    merchantName: 'AMAZON',
    description: 'Office supplies',
    amount: 45.00,
    currency: 'EUR',
    date: new Date(),
    orgId: 'org-456',
  },
  {
    transactionId: 'txn-2',
    merchantName: 'SHELL',
    description: 'Fuel',
    amount: 60.00,
    currency: 'EUR',
    date: new Date(),
    orgId: 'org-456',
  },
]);

console.log(batchResult);
// {
//   total: 2,
//   categorized: 2,
//   failed: 0,
//   results: [...],
//   duration: 45
// }
```

### Get Category Suggestions

```typescript
const suggestions = await categorizationService.getCategorySuggestions(
  'org-456',
  'txn-123',
);

// Returns top 3 suggestions with confidence scores
console.log(suggestions);
// [
//   { categoryId: 'MEALS', categoryName: 'Meals & Entertainment', confidence: 0.90, ... },
//   { categoryId: 'ENTERTAINMENT', categoryName: 'Entertainment', confidence: 0.70, ... },
//   { categoryId: 'OTHER', categoryName: 'Other', confidence: 0.50, ... }
// ]
```

### Learn from User Choice

```typescript
// When user selects a category for a transaction
await categorizationService.learnFromUserChoice(
  'txn-123',
  ExpenseCategory.PROFESSIONAL_SERVICES,
  'org-456',
);

// This updates historical patterns for better future suggestions
```

## Reconciliation UI Integration

In the reconciliation UI, display category suggestions:

```typescript
// Fetch transaction with categorization metadata
const transaction = await prisma.bankTransactionNew.findUnique({
  where: { id: transactionId },
});

const categorization = transaction.rawData?.categorization;

if (categorization) {
  // Display primary suggestion
  console.log(`Suggested: ${categorization.primarySuggestion.categoryName}`);
  console.log(`Confidence: ${categorization.confidence * 100}%`);

  // Show reasoning
  console.log(`Because: ${categorization.primarySuggestion.reasoning}`);

  // Provide alternate suggestions
  console.log('Other options:', categorization.alternateSuggestions);
}
```

## Automation System Integration

The categorization service integrates with the automation system for:

1. **Auto-approval**: High-confidence categorizations (>= 0.8) can be auto-applied
2. **Review queue**: Medium-confidence categorizations can be added to review queue
3. **Event emission**: Real-time updates via WebSocket for UI

Example workflow:

```typescript
// In automation service or workflow
if (categorizationResult.autoCategorizationEnabled) {
  // Auto-apply category
  await applyCategory(transactionId, categorizationResult.primarySuggestion.categoryId);

  // Emit event for UI update
  eventEmitter.emit('transaction.auto-categorized', {
    transactionId,
    category: categorizationResult.primarySuggestion.categoryId,
  });
} else if (categorizationResult.confidence > 0.5) {
  // Add to review queue
  await addToReviewQueue({
    transactionId,
    suggestions: [
      categorizationResult.primarySuggestion,
      ...categorizationResult.alternateSuggestions,
    ],
  });
}
```

## Pattern Customization

To add custom patterns for your organization:

1. **Merchant patterns**: Add to `merchantPatterns` Map in service
2. **MCC codes**: Add to `mccMappings` Map
3. **Keywords**: Add to `keywordMap` Map

Example:

```typescript
// Custom pattern for your organization
this.merchantPatterns.set(/yourcompany|your-vendor/i, ExpenseCategory.PROFESSIONAL_SERVICES);

// Custom MCC code
this.mccMappings.set('9999', {
  code: '9999',
  description: 'Custom Category',
  category: ExpenseCategory.OTHER,
  confidence: 0.90,
});
```

## Future Enhancements

1. **Machine Learning**: Replace rule-based system with ML model
2. **Organization-specific models**: Train models per organization
3. **Multi-language support**: Support merchant names in multiple languages
4. **Confidence tuning**: Dynamic confidence thresholds based on feedback
5. **Category hierarchy**: Support sub-categories and custom taxonomies

## Testing

```bash
# Unit tests
npm test transaction-categorization.service.spec.ts

# Integration tests
npm test:e2e transaction-categorization.e2e-spec.ts
```

## Monitoring

Monitor categorization performance:

```typescript
// Track metrics
eventEmitter.on('transaction.categorized', (data) => {
  metrics.recordCategorization({
    category: data.category,
    confidence: data.confidence,
    autoApplied: data.autoApplied,
  });
});

// Alert on low confidence
if (avgConfidence < 0.6) {
  logger.warn('Categorization confidence below threshold');
}
```
