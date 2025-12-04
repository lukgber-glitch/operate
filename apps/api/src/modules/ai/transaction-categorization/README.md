# Transaction Categorization Service

AI-powered automatic categorization for bank transactions using rule-based pattern matching.

## Features

- **Smart Pattern Matching**: Merchant names, MCC codes, keywords, and transaction descriptions
- **Historical Learning**: Learns from organization's past categorization choices
- **Multi-Suggestion**: Provides top 3 category suggestions with confidence scores
- **Batch Processing**: Efficient categorization of multiple transactions
- **Event-Driven**: Emits events for integration with automation and UI
- **Production-Ready**: Comprehensive error handling, logging, and metrics

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│          Bank Transaction Import                        │
│  (from GoCardless, Plaid, or other providers)          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│     Transaction Categorization Service                  │
│                                                          │
│  1. Merchant Name Pattern Matching                      │
│  2. MCC Code Lookup                                      │
│  3. Keyword Analysis                                     │
│  4. Historical Pattern Matching                          │
│  5. Confidence Scoring                                   │
│  6. Multi-Suggestion Ranking                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Categorization Results                         │
│                                                          │
│  • Primary Suggestion (highest confidence)              │
│  • Alternate Suggestions (2-3 alternatives)             │
│  • Confidence Scores (0.0 - 1.0)                        │
│  • Reasoning (why this category was chosen)             │
│  • Metadata (patterns matched, MCC codes, etc.)         │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐        ┌──────────────────┐
│  Auto-Apply  │        │  Review Queue    │
│ (conf >= 0.8)│        │ (conf 0.5-0.8)   │
└──────────────┘        └──────────────────┘
```

## Category Mappings

### Built-in Expense Categories

| Category | Examples | MCC Codes |
|----------|----------|-----------|
| **Travel & Transport** | Airlines, Hotels, Uber, Fuel | 3000-3999, 4111, 5541, 7011 |
| **Office Supplies** | Amazon, Staples, Office Depot | 5943 |
| **Software & Subscriptions** | Adobe, Microsoft, Slack, GitHub | 5734 |
| **Equipment & Hardware** | Apple, Dell, HP, Furniture | 5045 |
| **Meals & Entertainment** | Restaurants, Cafes, Starbucks | 5812-5814, 5813 |
| **Utilities** | Phone, Internet, Electricity | 4814, 4900 |
| **Rent & Facilities** | Office rent, Property lease | - |
| **Insurance** | Business insurance policies | - |
| **Professional Services** | Lawyers, Accountants, Consultants | 8111, 8931 |
| **Other** | Uncategorized transactions | - |

## Usage

### Basic Categorization

```typescript
import { TransactionCategorizationService } from './transaction-categorization';

// Single transaction
const result = await categorizationService.categorizeTransaction({
  transactionId: 'txn-123',
  merchantName: 'AMAZON WEB SERVICES',
  description: 'AWS cloud hosting',
  amount: 150.00,
  currency: 'EUR',
  date: new Date(),
  orgId: 'org-456',
});

console.log(result.primarySuggestion);
// {
//   categoryId: 'SOFTWARE',
//   categoryName: 'Software & Subscriptions',
//   confidence: 0.95,
//   reasoning: 'Matched based on merchant name pattern'
// }
```

### Batch Categorization

```typescript
const transactions = [
  { transactionId: 'txn-1', merchantName: 'STARBUCKS', amount: 5.50, ... },
  { transactionId: 'txn-2', merchantName: 'SHELL', amount: 60.00, ... },
  { transactionId: 'txn-3', merchantName: 'MICROSOFT', amount: 99.00, ... },
];

const batchResult = await categorizationService.batchCategorize(transactions);

console.log(`Categorized ${batchResult.categorized}/${batchResult.total} in ${batchResult.duration}ms`);
```

### Get Suggestions

```typescript
// Get top 3 suggestions for a transaction
const suggestions = await categorizationService.getCategorySuggestions(
  'org-456',
  'txn-123',
);

suggestions.forEach(s => {
  console.log(`${s.categoryName}: ${(s.confidence * 100).toFixed(0)}%`);
});
```

### Learn from User Feedback

```typescript
// When user corrects or confirms a categorization
await categorizationService.learnFromUserChoice(
  'txn-123',
  ExpenseCategory.PROFESSIONAL_SERVICES,
  'org-456',
);
```

## Pattern Matching

### 1. Merchant Name Patterns

Regular expressions match merchant names:

```typescript
/amazon|office depot|staples/i → OFFICE
/adobe|microsoft|slack/i → SOFTWARE
/uber|lyft|taxi|lufthansa/i → TRAVEL
```

**Confidence**: 0.85

### 2. MCC Codes

Merchant Category Codes from payment processors:

```typescript
'5812' → MEALS (Eating Places/Restaurants)
'5734' → SOFTWARE (Computer Software Stores)
'3000' → TRAVEL (Airlines)
```

**Confidence**: 0.90-0.95

### 3. Keywords

Keywords in transaction description:

```typescript
'subscription' → SOFTWARE
'business lunch' → MEALS
'parking' → TRAVEL
```

**Confidence**: 0.65

### 4. Historical Patterns

Organization-specific patterns learned from past categorizations:

```typescript
// If "ACME Corp" was categorized as PROFESSIONAL_SERVICES 5 times
'ACME Corp' → PROFESSIONAL_SERVICES
```

**Confidence**: 0.70 + (frequency * 0.05), max 0.95

## Confidence Scoring

| Confidence | Meaning | Action |
|------------|---------|--------|
| **0.80 - 1.00** | High confidence | Auto-apply category |
| **0.60 - 0.79** | Medium confidence | Suggest with review |
| **0.40 - 0.59** | Low confidence | Show multiple options |
| **< 0.40** | Very low | Default to OTHER |

## Events

### `transaction.categorized`

Emitted after successful categorization:

```typescript
{
  transactionId: 'txn-123',
  orgId: 'org-456',
  category: 'SOFTWARE',
  confidence: 0.95,
  timestamp: Date
}
```

### `transaction.learning`

Emitted when learning from user feedback:

```typescript
{
  transactionId: 'txn-123',
  orgId: 'org-456',
  merchantName: 'ACME Corp',
  category: 'PROFESSIONAL_SERVICES',
  timestamp: Date
}
```

## Integration with Bank Import

The service is designed to integrate seamlessly with the bank import pipeline:

```typescript
// In bank-import.processor.ts
private async handleSyncConnection(job: Job): Promise<BankImportJobResult> {
  const syncResult = await this.bankSyncService.syncConnection(...);

  // Categorize new transactions
  if (syncResult.success && syncResult.newTransactions > 0) {
    await this.categorizeNewTransactions(
      syncResult.transactionIds,
      job.data.orgId,
    );
  }

  return syncResult;
}
```

## Database Schema

Store categorization suggestions in transaction metadata:

```typescript
// In BankTransactionNew.rawData JSON field
{
  "categorization": {
    "primarySuggestion": {
      "categoryId": "SOFTWARE",
      "categoryName": "Software & Subscriptions",
      "confidence": 0.95,
      "reasoning": "Matched based on merchant name pattern"
    },
    "alternateSuggestions": [
      { "categoryId": "OFFICE", "confidence": 0.65, ... },
      { "categoryId": "EQUIPMENT", "confidence": 0.55, ... }
    ],
    "categorizedAt": "2024-12-02T10:30:00Z"
  }
}
```

## Performance

- **Single categorization**: ~5-10ms
- **Batch categorization (100 transactions)**: ~50-100ms (~1ms per transaction)
- **Historical pattern lookup**: ~10-20ms per query (with database index)

## Customization

### Add Custom Patterns

```typescript
// In service constructor or initialization
this.merchantPatterns.set(
  /your-custom-vendor/i,
  ExpenseCategory.PROFESSIONAL_SERVICES,
);

this.mccMappings.set('9999', {
  code: '9999',
  description: 'Custom Category',
  category: ExpenseCategory.CUSTOM,
  confidence: 0.90,
});
```

### Adjust Confidence Thresholds

```typescript
// Modify confidence calculation
const baseConfidence = 0.85;
const frequencyBoost = historicalFrequency * 0.05;
const finalConfidence = Math.min(0.95, baseConfidence + frequencyBoost);
```

## Testing

```bash
# Unit tests
npm test apps/api/src/modules/ai/transaction-categorization

# Test specific merchant patterns
npm test -- --grep "merchant name patterns"

# Test MCC code mappings
npm test -- --grep "MCC code"
```

## Monitoring & Metrics

Track categorization performance:

```typescript
// Metrics to monitor
- Average confidence score
- Auto-categorization rate (conf >= 0.8)
- Category distribution
- Processing time
- Error rate
```

## Future Enhancements

1. **Machine Learning**: Replace rules with trained ML model
2. **Multi-language**: Support merchant names in multiple languages
3. **Custom Categories**: Per-organization category taxonomies
4. **Smart Learning**: Automatically adjust patterns based on feedback
5. **Bulk Operations**: Recategorize historical transactions
6. **Export/Import**: Share patterns between organizations

## Support

For issues or questions:
- Check the INTEGRATION_GUIDE.md
- Review example usage in tests
- Contact the AI/ML team

## License

Internal use only - Operate/CoachOS
