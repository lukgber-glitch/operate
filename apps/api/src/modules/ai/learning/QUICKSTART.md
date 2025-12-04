# Learning from Corrections - Quick Start Guide

## Setup

### 1. Run Database Migration

```bash
cd operate/packages/database
npx prisma migrate dev --name add_learning_from_corrections
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

## Basic Usage

### Recording a Correction

When a user confirms a receipt with changes:

```typescript
import { CorrectionLearningService, EntityType, CorrectionField } from '@/modules/ai/learning';

// In your receipt confirmation handler
async confirmReceipt(receiptId: string, confirmedData: any, userId: string) {
  // ... save receipt data ...

  // Record corrections for learning
  await this.learningService.recordCorrection({
    organisationId: user.organisationId,
    entityType: EntityType.RECEIPT,
    entityId: receiptId,
    field: CorrectionField.CATEGORY,
    originalValue: { category: ocrResult.category },
    correctedValue: { category: confirmedData.category },
    userId: userId,
    context: {
      merchant: confirmedData.merchant,
      amount: confirmedData.amount,
      currency: confirmedData.currency,
      description: confirmedData.description
    }
  });
}
```

### Using Receipt Integration (Recommended)

Simpler approach using the integration service:

```typescript
import { ReceiptLearningIntegrationService } from '@/modules/ai/learning';

async confirmReceipt(receiptId: string, originalData: any, confirmedData: any, userId: string) {
  // Record all corrections automatically
  await this.receiptLearning.recordReceiptCorrections({
    organisationId: user.organisationId,
    receiptId,
    userId,
    originalData: {
      merchant: ocrResult.merchant,
      category: ocrResult.category,
      subcategory: ocrResult.subcategory,
      taxDeductible: ocrResult.taxDeductible,
      deductionPercentage: ocrResult.deductionPercentage,
      amount: ocrResult.amount,
      currency: ocrResult.currency,
      description: ocrResult.description
    },
    confirmedData: {
      merchant: confirmedData.merchant,
      category: confirmedData.category,
      subcategory: confirmedData.subcategory,
      taxDeductible: confirmedData.taxDeductible,
      deductionPercentage: confirmedData.deductionPercentage,
      amount: confirmedData.amount,
      currency: confirmedData.currency,
      description: confirmedData.description
    }
  });
}
```

### Enhancing Classifications with Learning

Before showing classification results to users:

```typescript
import { ReceiptLearningIntegrationService } from '@/modules/ai/learning';

async classifyReceipt(receiptData: any, organisationId: string) {
  // Get AI classification
  const ocrResult = await this.ocrService.scanReceipt(receiptData);

  // Enhance with learning
  const { suggestions, enhancedData } = await this.receiptLearning.enhanceWithLearning({
    organisationId,
    receiptData: ocrResult
  });

  // enhancedData has high-confidence (>90%) suggestions auto-applied
  // suggestions array contains all suggestions with confidence scores

  return {
    classification: enhancedData,
    suggestions: suggestions.filter(s => s.confidence < 0.9), // Show only non-applied suggestions
    autoApplied: suggestions.filter(s => s.confidence >= 0.9)  // For transparency
  };
}
```

## API Examples

### Record a Correction

```bash
curl -X POST http://localhost:3000/api/ai/learning/corrections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "organisationId": "org-123",
    "entityType": "receipt",
    "entityId": "receipt-456",
    "field": "category",
    "originalValue": { "category": "General" },
    "correctedValue": { "category": "Meals & Entertainment" },
    "userId": "user-789",
    "context": {
      "merchant": "Starbucks",
      "amount": 15.50,
      "currency": "EUR"
    }
  }'
```

### Get Learning Suggestions

```bash
curl -X POST http://localhost:3000/api/ai/learning/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "organisationId": "org-123",
    "entityType": "receipt",
    "data": {
      "merchant": "Starbucks",
      "amount": 15.50,
      "category": "General"
    }
  }'
```

### Get Accuracy Statistics

```bash
curl http://localhost:3000/api/ai/learning/accuracy/org-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Learning Patterns

```bash
# All active patterns with high accuracy
curl "http://localhost:3000/api/ai/learning/patterns/org-123?activeOnly=true&minAccuracy=0.8" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Merchant-category patterns
curl "http://localhost:3000/api/ai/learning/patterns/org-123?patternType=merchant_category" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Integration Checklist

### Receipt Scanner Integration

- [ ] Import `ReceiptLearningIntegrationService` in receipt module
- [ ] Call `recordReceiptCorrections()` on receipt confirmation
- [ ] Call `enhanceWithLearning()` before showing classification
- [ ] Display suggestions with confidence scores to users
- [ ] Show auto-applied suggestions for transparency

### Classification Service Integration

- [ ] Import `CorrectionLearningService` in classification module
- [ ] Call `applyLearning()` after AI classification
- [ ] Merge high-confidence suggestions into result
- [ ] Return learning suggestions with classification

### Review Queue Integration

- [ ] Call `recordCorrection()` when user corrects in review queue
- [ ] Include proper context (merchant, amount, description)
- [ ] Track corrections per field type

## Monitoring

### Key Metrics to Track

```typescript
// Get stats for an organization
const stats = await learningService.getAccuracyStats(organisationId);

console.log(`Overall Accuracy: ${(stats.overallAccuracy * 100).toFixed(1)}%`);
console.log(`Total Corrections: ${stats.totalCorrections}`);
console.log(`Active Patterns: ${stats.activePatternsCount}`);
console.log(`Improvement: +${stats.improvement.toFixed(1)}%`);
```

### Pattern Pruning

Run periodically to remove inaccurate patterns:

```typescript
// Deactivate patterns with <60% accuracy
const deactivated = await learningService.pruneInaccuratePatterns(
  organisationId,
  0.6 // minAccuracy threshold
);

console.log(`Deactivated ${deactivated} inaccurate patterns`);
```

## Testing

### Manual Testing

1. Create a receipt with category "General"
2. User corrects to "Meals & Entertainment"
3. Create another receipt for same merchant
4. Verify suggestion appears with high confidence
5. After 3+ corrections, pattern should auto-apply

### Example Test Flow

```typescript
// 1. First correction - creates pattern
await recordCorrection({
  field: 'category',
  originalValue: { category: 'General' },
  correctedValue: { category: 'Meals & Entertainment' },
  context: { merchant: 'Starbucks' }
});

// 2. Second correction - strengthens pattern
await recordCorrection({
  field: 'category',
  originalValue: { category: 'General' },
  correctedValue: { category: 'Meals & Entertainment' },
  context: { merchant: 'Starbucks Coffee' }
});

// 3. Third correction - pattern becomes reliable (3+ occurrences)
await recordCorrection({
  field: 'category',
  originalValue: { category: 'General' },
  correctedValue: { category: 'Meals & Entertainment' },
  context: { merchant: 'STARBUCKS' }
});

// 4. Apply learning - should get high-confidence suggestion
const adjustments = await applyLearning({
  data: {
    merchant: 'Starbucks Seattle',
    category: 'General'
  }
});

// Should return suggestion with confidence >0.9
expect(adjustments).toHaveLength(1);
expect(adjustments[0].field).toBe('category');
expect(adjustments[0].suggestedValue).toBe('Meals & Entertainment');
expect(adjustments[0].confidence).toBeGreaterThan(0.9);
```

## Common Issues

### Pattern Not Being Created

**Problem:** Corrections recorded but no patterns appearing

**Solution:**
- Check that context is provided (merchant, amount, description)
- Verify field names match CorrectionField enum
- Check database for CorrectionRecord entries

### Low Confidence Scores

**Problem:** Patterns exist but confidence is low

**Solution:**
- Need more corrections (min 3 for reliability)
- Check pattern accuracy (may need higher occurrences)
- Verify context fields are consistent

### Patterns Not Matching

**Problem:** Pattern exists but not matching new data

**Solution:**
- Merchant matching is case-insensitive substring
- Check that merchant names are similar enough
- Review condition field in LearningPattern table

## Best Practices

1. **Always Provide Context**
   ```typescript
   context: {
     merchant: receipt.merchant,
     amount: receipt.amount,
     currency: receipt.currency,
     description: receipt.description,
     category: receipt.category // For subcategory learning
   }
   ```

2. **Show Confidence to Users**
   ```typescript
   suggestions.forEach(s => {
     console.log(`${s.field}: ${s.suggestedValue} (${(s.confidence * 100).toFixed(0)}% confident)`);
     console.log(`Reason: ${s.reasoning}`);
   });
   ```

3. **Regular Pattern Maintenance**
   ```typescript
   // Run weekly/monthly
   await pruneInaccuratePatterns(orgId, 0.6);
   ```

4. **Monitor Improvement**
   ```typescript
   // Track monthly
   const stats = await getAccuracyStats(orgId);
   // Alert if improvement < 0 (accuracy declining)
   ```

## Next Steps

1. Enable in production: Run migration
2. Add to receipt flow: Integrate services
3. Monitor metrics: Track accuracy improvement
4. Tune thresholds: Adjust based on user feedback
5. Build UI: Show patterns and suggestions to users

## Support

For issues or questions, see:
- Full documentation: `README.md`
- Implementation details: `/c/Users/grube/op/operate/W10-T6_LEARNING_FROM_CORRECTIONS_REPORT.md`
- API docs: Swagger UI at `/api/docs`
