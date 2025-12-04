# AI Learning from Corrections

## Overview

The Learning module enables Operate/CoachOS to learn from user corrections and improve classification accuracy over time. When users correct OCR results, tax classifications, or expense categories, the system identifies patterns and applies them to future classifications.

## Architecture

### Core Components

1. **CorrectionLearningService** - Main service for recording and applying corrections
2. **ReceiptLearningIntegrationService** - Integration with receipt scanner
3. **LearningController** - REST API endpoints

### Database Models

- **CorrectionRecord** - Individual correction made by a user
- **LearningPattern** - Learned pattern from multiple corrections

## Pattern Types

The system learns the following pattern types:

### 1. Merchant → Category
```typescript
// User always categorizes "Starbucks" as "Meals & Entertainment"
{
  condition: { merchant: "starbucks" },
  adjustment: { category: "Meals & Entertainment" }
}
```

### 2. Amount Range → Category
```typescript
// Expenses under €50 are usually "Office Supplies"
{
  condition: { amountRange: "25-50", currency: "EUR" },
  adjustment: { category: "Office Supplies" }
}
```

### 3. Keyword → Subcategory
```typescript
// "Uber" receipts are always "Transportation > Rideshare"
{
  condition: { keyword: "uber" },
  adjustment: { subcategory: "Rideshare" }
}
```

### 4. Merchant → Tax Deductibility
```typescript
// "Amazon Business" purchases are 100% deductible
{
  condition: { merchant: "amazon business" },
  adjustment: {
    taxDeductible: true,
    deductionPercentage: 100
  }
}
```

### 5. Amount Range → Tax Deductibility
```typescript
// Small expenses (€0-10) are usually fully deductible
{
  condition: { amountRange: "0-10", currency: "EUR" },
  adjustment: {
    taxDeductible: true,
    deductionPercentage: 100
  }
}
```

### 6. Category → Subcategory
```typescript
// "Travel" expenses are usually "Transportation"
{
  condition: { category: "Travel" },
  adjustment: { subcategory: "Transportation" }
}
```

### 7. Description Keywords → Category
```typescript
// Descriptions containing "hotel" are "Travel & Lodging"
{
  condition: { keyword: "hotel" },
  adjustment: { category: "Travel & Lodging" }
}
```

## Usage

### Recording Corrections

When a user confirms a receipt with corrections:

```typescript
import { CorrectionLearningService } from './correction-learning.service';
import { EntityType, CorrectionField } from './dto/learning.dto';

// Record a category correction
await learningService.recordCorrection({
  organisationId: 'org-123',
  entityType: EntityType.RECEIPT,
  entityId: 'receipt-456',
  field: CorrectionField.CATEGORY,
  originalValue: { category: 'General' },
  correctedValue: { category: 'Meals & Entertainment' },
  userId: 'user-789',
  context: {
    merchant: 'Starbucks',
    amount: 15.50,
    currency: 'EUR',
    description: 'Coffee meeting with client'
  }
});
```

### Applying Learning

Before showing classification results to users:

```typescript
// Get learning-based suggestions
const adjustments = await learningService.applyLearning({
  organisationId: 'org-123',
  entityType: EntityType.RECEIPT,
  data: {
    merchant: 'Starbucks',
    amount: 15.50,
    currency: 'EUR',
    category: 'General', // AI's initial classification
  }
});

// adjustments = [
//   {
//     field: 'category',
//     originalValue: 'General',
//     suggestedValue: 'Meals & Entertainment',
//     confidence: 0.95,
//     reasoning: 'Based on 12 previous corrections, "starbucks" is usually categorized as "Meals & Entertainment"',
//     occurrences: 12,
//     accuracy: 0.92
//   }
// ]
```

### Receipt Integration

Use the integration service for receipt workflows:

```typescript
import { ReceiptLearningIntegrationService } from './receipt-learning-integration.service';

// After user confirms receipt
await receiptLearningIntegration.recordReceiptCorrections({
  organisationId: 'org-123',
  receiptId: 'receipt-456',
  userId: 'user-789',
  originalData: {
    merchant: 'Unknown',
    category: 'General',
    taxDeductible: false,
  },
  confirmedData: {
    merchant: 'Starbucks',
    category: 'Meals & Entertainment',
    taxDeductible: true,
    deductionPercentage: 70,
  }
});

// Before showing classification to user
const { suggestions, enhancedData } = await receiptLearningIntegration.enhanceWithLearning({
  organisationId: 'org-123',
  receiptData: {
    merchant: 'Starbucks',
    amount: 15.50,
    category: 'General',
  }
});

// Suggestions with confidence < 90% are shown as recommendations
// Suggestions with confidence >= 90% are auto-applied in enhancedData
```

### Getting Statistics

Track learning accuracy and improvement:

```typescript
const stats = await learningService.getAccuracyStats('org-123');

// stats = {
//   organisationId: 'org-123',
//   overallAccuracy: 0.87,
//   accuracyByField: {
//     category: 0.89,
//     merchant: 0.95,
//     taxDeductible: 0.82,
//     ...
//   },
//   totalClassifications: 1500,
//   totalCorrections: 180,
//   activePatternsCount: 45,
//   improvement: 12.5, // percentage points
//   patternStats: [...]
// }
```

## API Endpoints

### POST /ai/learning/corrections
Record a user correction.

**Request:**
```json
{
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
}
```

### POST /ai/learning/apply
Get learning-based suggestions for new data.

**Request:**
```json
{
  "organisationId": "org-123",
  "entityType": "receipt",
  "data": {
    "merchant": "Starbucks",
    "amount": 15.50,
    "category": "General"
  }
}
```

**Response:**
```json
[
  {
    "field": "category",
    "originalValue": "General",
    "suggestedValue": "Meals & Entertainment",
    "confidence": 0.95,
    "patternType": "merchant_category",
    "occurrences": 12,
    "accuracy": 0.92,
    "reasoning": "Based on 12 previous corrections..."
  }
]
```

### GET /ai/learning/patterns/:organisationId
Get all learning patterns.

**Query params:**
- `patternType` - Filter by pattern type
- `activeOnly` - Only active patterns
- `minAccuracy` - Minimum accuracy threshold
- `minOccurrences` - Minimum occurrences

### GET /ai/learning/accuracy/:organisationId
Get accuracy statistics.

### POST /ai/learning/patterns/:organisationId/prune
Deactivate patterns with low accuracy.

## Configuration

### Pattern Thresholds

```typescript
// Minimum occurrences before pattern is considered reliable
MIN_PATTERN_OCCURRENCES = 3

// Minimum accuracy for pattern to be applied
MIN_PATTERN_ACCURACY = 0.7

// Auto-apply threshold (suggestions above this are auto-applied)
AUTO_APPLY_THRESHOLD = 0.9
```

### Amount Ranges

```typescript
// Amount buckets for pattern matching
0-10, 10-25, 25-50, 50-100, 100-250, 250-500, 500-1000, 1000+
```

## Best Practices

### 1. Progressive Enhancement
- Start with low-confidence suggestions as recommendations
- Auto-apply only high-confidence patterns (>90%)
- Let users override learned patterns

### 2. Pattern Pruning
- Regularly prune patterns with low accuracy (<60%)
- Monitor pattern performance over time
- Adjust thresholds based on user feedback

### 3. Context Enrichment
- Always provide context when recording corrections
- Include merchant, amount, description, etc.
- More context = better pattern matching

### 4. User Transparency
- Show users why suggestions are made
- Display confidence scores
- Allow users to see and manage patterns

## Performance Considerations

### Database Queries
- Patterns are indexed by organisation and accuracy
- Use `activeOnly` and `minAccuracy` filters to reduce result sets
- Consider caching frequently-used patterns

### Pattern Matching
- Merchant matching uses case-insensitive substring search
- Keywords are extracted and normalized
- Amount ranges reduce precision for better matching

## Future Enhancements

1. **ML-based Pattern Discovery** - Use clustering to discover patterns automatically
2. **Cross-Organization Learning** - Learn from anonymized patterns across organizations
3. **Temporal Patterns** - Learn seasonal or time-based patterns
4. **User Preferences** - Personalized learning per user within an organization
5. **Confidence Calibration** - Dynamically adjust confidence based on pattern age and accuracy
6. **A/B Testing** - Test different pattern matching strategies

## Maintenance

### Monitoring
- Track correction rates over time (should decrease)
- Monitor pattern accuracy metrics
- Alert on sudden drops in accuracy

### Data Cleanup
- Archive old correction records (>1 year)
- Consolidate similar patterns
- Remove inactive patterns

### Auditing
- Log all pattern applications
- Track auto-applied vs suggested patterns
- Measure user acceptance of suggestions
