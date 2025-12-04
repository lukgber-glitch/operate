# AI Classification Auto-Approve Integration

## Overview

This document describes the integration between AI classification and the auto-approve workflow for the Operate/CoachOS platform.

## Architecture

### Core Components

1. **ClassificationService** (`classification.service.ts`)
   - Main service for AI-powered transaction classification
   - Integrates with AutoApproveService for workflow decisions
   - Emits real-time WebSocket events for UI updates

2. **AutoApproveService** (`../../automation/auto-approve.service.ts`)
   - Workflow engine for auto-approval decisions
   - Checks confidence thresholds and amount limits
   - Creates audit log entries for all decisions

3. **AutomationSettingsService** (`../../automation/automation-settings.service.ts`)
   - Manages automation settings per organization
   - Supports three modes: MANUAL, SEMI_AUTO, FULL_AUTO
   - Configurable confidence thresholds per feature

4. **EventsGateway** (`../../../websocket/events.gateway.ts`)
   - Real-time WebSocket communication
   - Organization-scoped rooms for event broadcasting
   - Supports Redis adapter for horizontal scaling

### Specialized Services

5. **ExpenseClassifierService** (`expense-classifier.service.ts`)
   - Specialized expense classification with receipt requirements
   - Batch classification support
   - Expense-specific event emission

6. **TaxDeductionClassifierService** (`tax-deduction-classifier.service.ts`)
   - Tax deduction classification with compliance notes
   - Deduction percentage calculation by category
   - Documentation requirements tracking

## Workflow

### Transaction Classification Flow

```
1. Transaction arrives
   ↓
2. AI Classification
   - Category determination
   - Confidence scoring
   - Tax relevance check
   ↓
3. Auto-Approve Decision
   - Check automation settings (mode + thresholds)
   - Validate confidence score
   - Validate amount limits
   ↓
4. Execute Action
   ├─ FULL_AUTO + thresholds met → Auto-approve
   ├─ SEMI_AUTO or low confidence → Review queue
   └─ MANUAL → Always to review queue
   ↓
5. Emit WebSocket Event
   - Real-time UI update
   - Organization-scoped broadcast
```

### Auto-Approval Decision Logic

The `AutoApproveService.shouldAutoApprove()` method checks:

1. **Mode Check**: Feature must not be in MANUAL mode
2. **Confidence Threshold**: Score must meet minimum confidence
3. **Amount Threshold**: Transaction amount must be within limits (if set)
4. **Mode-Based Decision**:
   - `FULL_AUTO`: Auto-approve if thresholds met
   - `SEMI_AUTO`: Suggest for approval (not automatic)
   - `MANUAL`: Never auto-approve

### Example Decision Flow

```typescript
const decision = await autoApproveService.shouldAutoApprove({
  organisationId: 'org-123',
  feature: 'expenses',
  confidenceScore: 92, // 92% confidence
  amount: 150.00,
});

// Result:
// {
//   autoApprove: true,
//   reason: "FULL_AUTO mode: Confidence 92% meets threshold 85% - auto-approved"
// }
```

## Data Types

### Classification Result

```typescript
interface ClassificationResult {
  category: TransactionCategory;
  confidence: number; // 0-100
  reasoning: string;
  taxRelevant: boolean;
  suggestedDeductionCategory?: string;
  taxDeductionPercentage?: number;
  suggestedAccount?: string;
  flags?: ClassificationFlag[];
  metadata?: {
    processingTime?: number;
    modelUsed?: string;
    tokensUsed?: number;
  };
}
```

### Classification with Action

```typescript
interface ClassificationResultWithAction extends ClassificationResult {
  autoApproved: boolean;
  addedToReviewQueue: boolean;
}
```

## WebSocket Events

### Event Types

The integration emits the following WebSocket events:

#### Automation Events

```typescript
enum AutomationEvent {
  CLASSIFICATION_COMPLETE = 'automation:classification_complete',
  AUTO_APPROVED = 'automation:auto_approved',
  REVIEW_REQUIRED = 'automation:review_required',
  CONFIDENCE_LOW = 'automation:confidence_low',
  TAX_DEDUCTION_SUGGESTED = 'automation:tax_deduction_suggested',
}
```

#### Event Payload

```typescript
interface AutomationEventPayload {
  organizationId: string;
  entityType: string;
  entityId: string;
  feature: string;
  action: string;
  confidence?: number;
  category?: string;
  autoApproved?: boolean;
  reasoning?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

### Frontend Integration

Frontend clients can subscribe to events:

```typescript
// Connect to WebSocket
const socket = io('http://localhost:3000/events', {
  auth: { token: jwtToken }
});

// Subscribe to automation events
socket.on('automation:auto_approved', (payload: AutomationEventPayload) => {
  console.log('Transaction auto-approved:', payload.entityId);
  // Update UI in real-time
  updateTransactionStatus(payload.entityId, 'approved');
});

socket.on('automation:classification_complete', (payload: AutomationEventPayload) => {
  console.log('Classification complete:', payload.category, payload.confidence);
  // Show classification result
  displayClassification(payload);
});
```

## Usage Examples

### Basic Transaction Classification

```typescript
const result = await classificationService.classifyWithAutoApproval(
  'org-123',
  {
    id: 'tx-456',
    description: 'AWS Cloud Services',
    amount: 99.99,
    currency: 'EUR',
    date: new Date(),
  }
);

console.log(`Category: ${result.category}`);
console.log(`Confidence: ${result.confidence}%`);
console.log(`Auto-approved: ${result.autoApproved}`);
console.log(`Needs review: ${result.addedToReviewQueue}`);
```

### Expense Classification

```typescript
const expenseResult = await expenseClassifierService.classifyExpense(
  'org-123',
  {
    id: 'exp-789',
    description: 'Business lunch with client',
    amount: 85.50,
    currency: 'EUR',
    date: new Date(),
    merchantName: 'Restaurant XYZ',
    employeeId: 'emp-123',
  }
);

console.log(`Tax deductible: ${expenseResult.taxDeductible}`);
console.log(`Deduction %: ${expenseResult.taxDeductionPercentage}%`);
console.log(`Needs receipt: ${expenseResult.needsReceipt}`);
```

### Tax Deduction Classification

```typescript
const deductionResult = await taxDeductionClassifierService.classifyDeduction(
  'org-123',
  {
    id: 'ded-999',
    description: 'Office equipment - laptop',
    amount: 1500.00,
    currency: 'EUR',
    date: new Date(),
    invoiceNumber: 'INV-2024-001',
  }
);

console.log(`Deduction percentage: ${deductionResult.deductionPercentage}%`);
console.log(`Deductible amount: ${deductionResult.deductibleAmount}`);
console.log(`Compliance notes:`, deductionResult.complianceNotes);
```

## Configuration

### Environment Variables

```env
# Claude AI Configuration
ANTHROPIC_API_KEY=your-api-key-here

# Classification Settings
CLASSIFICATION_CONFIDENCE_THRESHOLD=0.7

# WebSocket Configuration
CORS_ORIGIN=http://localhost:3000

# Redis (optional, for multi-instance WebSocket)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

### Automation Settings (per Organization)

```typescript
{
  invoiceCreation: 'SEMI_AUTO',
  expenseApproval: 'FULL_AUTO',
  taxClassification: 'FULL_AUTO',
  bankReconciliation: 'SEMI_AUTO',

  // Confidence thresholds (0-100)
  invoiceConfidenceThreshold: 85,
  expenseConfidenceThreshold: 80,
  taxConfidenceThreshold: 90,

  // Amount limits (null = no limit)
  maxAutoApproveAmount: 5000.00,
}
```

## Testing

Unit tests are provided in `classification.service.spec.ts`:

```bash
# Run tests
npm test classification.service.spec.ts

# With coverage
npm test -- --coverage classification.service.spec.ts
```

### Test Scenarios

1. ✅ Auto-approve when confidence meets threshold
2. ✅ Add to review queue when confidence is low
3. ✅ Reject auto-approval when amount exceeds limit
4. ✅ Emit WebSocket events for all classifications
5. ✅ Health check for service availability

## Audit Trail

All auto-approval decisions are logged in the `AutomationAuditLog` table:

```typescript
{
  organisationId: 'org-123',
  action: 'AUTO_APPROVED',
  feature: 'classification',
  mode: 'FULL_AUTO',
  entityType: 'transaction',
  entityId: 'tx-456',
  confidenceScore: 92,
  wasAutoApproved: true,
  inputData: { /* original transaction data */ },
  outputData: { /* classification result */ },
  createdAt: '2024-12-01T...',
}
```

## Error Handling

The integration includes comprehensive error handling:

1. **Classification Failures**: Falls back to MCC-based classification or unknown category
2. **WebSocket Failures**: Errors are logged but don't fail the classification
3. **Auto-Approve Service Failures**: Gracefully degrades to manual review
4. **Service Health Checks**: `isHealthy()` method for monitoring

## Performance Considerations

1. **Batch Processing**: Use `classifyBatch()` for multiple transactions
2. **Caching**: Classification results can be cached (implement as needed)
3. **WebSocket Scaling**: Redis adapter supports horizontal scaling
4. **Rate Limiting**: Claude API calls are rate-limited within the AI package

## Future Enhancements

1. **Learning from Corrections**: Store user corrections to improve classification
2. **Custom Categories**: Allow organizations to define custom categories
3. **Rule Engine**: Add rule-based overrides for specific merchants
4. **Analytics Dashboard**: Track auto-approval rates and accuracy
5. **A/B Testing**: Test different confidence thresholds

## Related Files

- `apps/api/src/modules/automation/auto-approve.service.ts`
- `apps/api/src/modules/automation/automation-settings.service.ts`
- `apps/api/src/websocket/events.gateway.ts`
- `packages/ai/src/classification/transaction-classifier.ts`
- `packages/shared/src/types/websocket.types.ts`

## Contact

For questions or issues, contact the ORACLE (AI/ML) team or refer to the main project documentation.
