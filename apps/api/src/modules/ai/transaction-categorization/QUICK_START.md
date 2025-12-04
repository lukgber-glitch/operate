# Transaction Categorization - Quick Start

## 🚀 5-Minute Integration Guide

### Step 1: Import the Module

```typescript
// In your module (e.g., bank-import.module.ts)
import { TransactionCategorizationModule } from '../../../ai/transaction-categorization';

@Module({
  imports: [
    // ... other imports
    TransactionCategorizationModule,
  ],
})
export class YourModule {}
```

### Step 2: Inject the Service

```typescript
// In your service or processor
import { TransactionCategorizationService } from '../../../ai/transaction-categorization';

export class YourService {
  constructor(
    private readonly categorizationService: TransactionCategorizationService,
  ) {}
}
```

### Step 3: Categorize Transactions

```typescript
// Single transaction
const result = await this.categorizationService.categorizeTransaction({
  transactionId: 'txn-123',
  merchantName: 'STARBUCKS',
  description: 'Coffee',
  amount: 5.50,
  currency: 'EUR',
  date: new Date(),
  orgId: 'org-456',
});

// Check confidence
if (result.confidence >= 0.8) {
  // Auto-apply category
  console.log(`Auto-categorized as ${result.primarySuggestion.categoryName}`);
} else {
  // Show suggestions to user
  console.log('Suggested categories:', result.alternateSuggestions);
}
```

### Step 4: Batch Processing (Recommended)

```typescript
// Multiple transactions at once (more efficient)
const batchResult = await this.categorizationService.batchCategorize([
  { transactionId: 'txn-1', merchantName: 'AMAZON', amount: 45.00, ... },
  { transactionId: 'txn-2', merchantName: 'SHELL', amount: 60.00, ... },
  { transactionId: 'txn-3', merchantName: 'MICROSOFT', amount: 99.00, ... },
]);

console.log(`Categorized ${batchResult.categorized} transactions in ${batchResult.duration}ms`);
```

---

## 📋 Common Use Cases

### Use Case 1: Bank Import Pipeline

```typescript
// After importing transactions from bank
const newTransactionIds = syncResult.transactionIds;

// Fetch transactions
const transactions = await this.prisma.bankTransactionNew.findMany({
  where: { id: { in: newTransactionIds } },
});

// Build categorization requests
const requests = transactions.map(t => ({
  transactionId: t.id,
  merchantName: t.merchantName || undefined,
  description: t.description,
  amount: t.amount.toNumber(),
  currency: t.currency,
  date: t.bookingDate,
  orgId: yourOrgId,
}));

// Categorize all at once
const results = await this.categorizationService.batchCategorize(requests);

// Store results in database
for (const result of results.results) {
  await this.prisma.bankTransactionNew.update({
    where: { id: result.transactionId },
    data: {
      rawData: {
        categorization: {
          primarySuggestion: result.primarySuggestion,
          alternateSuggestions: result.alternateSuggestions,
          confidence: result.confidence,
        },
      },
    },
  });
}
```

### Use Case 2: Manual Categorization UI

```typescript
// When user views transaction details
const suggestions = await this.categorizationService.getCategorySuggestions(
  'org-456',
  'txn-123',
);

// Display in UI
suggestions.forEach((suggestion, index) => {
  console.log(`${index + 1}. ${suggestion.categoryName} (${(suggestion.confidence * 100).toFixed(0)}%)`);
  console.log(`   ${suggestion.reasoning}`);
});
```

### Use Case 3: Learning from User Feedback

```typescript
// When user selects or corrects a category
await this.categorizationService.learnFromUserChoice(
  'txn-123',
  ExpenseCategory.PROFESSIONAL_SERVICES,
  'org-456',
);

// Future transactions from same merchant will have better suggestions
```

---

## 🎯 What Gets Categorized

### Supported Categories

| Category | Common Merchants | Confidence |
|----------|------------------|------------|
| **Travel & Transport** | Uber, Airlines, Hotels, Gas Stations | 85-95% |
| **Software & Subscriptions** | Adobe, Microsoft, Slack, GitHub | 90-95% |
| **Office Supplies** | Amazon, Staples, Office Depot | 85% |
| **Meals & Entertainment** | Restaurants, Cafes, Bars | 85-90% |
| **Professional Services** | Lawyers, Accountants, Consultants | 90-95% |
| **Utilities** | Internet, Phone, Electricity | 90-95% |
| **Equipment** | Apple, Dell, HP, Furniture | 85-90% |
| **Insurance** | Insurance Companies | 85% |
| **Rent** | Property Management | 85% |
| **Other** | Everything else | 50% |

### Pattern Types

1. **Merchant Name** (85% confidence)
   - Pattern: `/amazon|office depot/i`
   - Example: "AMAZON WEB SERVICES" → SOFTWARE

2. **MCC Code** (90-95% confidence)
   - Code: `5812`
   - Example: "5812 - STARBUCKS" → MEALS

3. **Keywords** (65% confidence)
   - Keyword: "subscription"
   - Example: "Monthly subscription fee" → SOFTWARE

4. **Historical** (70-95% confidence)
   - Based on past choices
   - Example: "ACME CORP" → PROFESSIONAL_SERVICES (if used 5+ times)

---

## ⚡ Performance Tips

### ✅ DO: Use Batch Processing

```typescript
// GOOD: Process 100 transactions in ~100ms
const results = await batchCategorize(transactions);
```

### ❌ DON'T: Process One-by-One

```typescript
// BAD: Process 100 transactions in ~1000ms
for (const transaction of transactions) {
  await categorizeTransaction(transaction); // 10x slower!
}
```

### ✅ DO: Store Results in Metadata

```typescript
// Store in rawData JSON field
rawData: {
  categorization: {
    primarySuggestion: {...},
    alternateSuggestions: [...],
  }
}
```

### ✅ DO: Auto-Apply High Confidence

```typescript
if (result.confidence >= 0.8) {
  // Auto-apply, no user review needed
}
```

---

## 🔔 Events

Listen for categorization events:

```typescript
// In your service
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class YourService {
  @OnEvent('transaction.categorized')
  handleCategorized(payload: any) {
    console.log(`Transaction ${payload.transactionId} categorized as ${payload.category}`);
    // Update UI, trigger automation, etc.
  }

  @OnEvent('transaction.learning')
  handleLearning(payload: any) {
    console.log(`Learned new pattern: ${payload.merchantName} → ${payload.category}`);
    // Analytics, pattern optimization, etc.
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Low Confidence Scores

**Solution**: Transactions with uncommon merchants or unclear descriptions will have lower confidence. This is expected. Provide manual categorization UI for these cases.

### Issue: Wrong Category Suggestions

**Solution**: Use `learnFromUserChoice()` to teach the system. After 3-5 corrections for the same merchant, confidence will improve.

### Issue: Slow Performance

**Solution**:
1. Use batch processing instead of single transactions
2. Add database indexes (see IMPLEMENTATION_SUMMARY.md)
3. Cache frequent merchant patterns

### Issue: Missing Merchant Patterns

**Solution**: Add custom patterns to the service:

```typescript
// In service initialization
this.merchantPatterns.set(
  /your-custom-pattern/i,
  ExpenseCategory.YOUR_CATEGORY,
);
```

---

## 📚 Next Steps

1. **Read INTEGRATION_GUIDE.md** - Detailed integration steps
2. **Read README.md** - Full documentation and examples
3. **Read IMPLEMENTATION_SUMMARY.md** - Technical details and architecture

---

## 🆘 Need Help?

- Check the documentation files in this directory
- Review the example code in tests
- Contact the AI/ML team (ORACLE agent)

---

**Quick Tip**: Start with batch categorization in the bank import pipeline. This provides immediate value with minimal UI changes. Add manual categorization UI in a later sprint.
