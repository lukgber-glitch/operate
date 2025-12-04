# Automation Module

## Overview

The Automation Module provides comprehensive automation capabilities for Operate/CoachOS, including:

1. **Automation Settings Management** (W8-T3) - CRUD operations for automation configuration
2. **Auto-Approve Workflow Engine** (W8-T4) - Decision logic and execution for auto-approvals
3. **Integration Helpers** - Integration points for other services to trigger automation

## Architecture

### Services

#### 1. AutomationSettingsService (W8-T3)
Manages automation settings per organisation.

**Features:**
- Get/update automation settings
- Per-feature mode configuration (FULL_AUTO, SEMI_AUTO, MANUAL)
- Confidence threshold management (0-100%)
- Amount limits for auto-approval

**API:**
```typescript
// Get all settings
await automationSettings.getSettings(organisationId);

// Update settings
await automationSettings.updateSettings(organisationId, {
  expenseApproval: AutomationMode.FULL_AUTO,
  expenseConfidenceThreshold: 85,
  maxAutoApproveAmount: 100000,
});

// Get/update specific feature
await automationSettings.getFeatureMode(organisationId, 'expenses');
await automationSettings.updateFeatureMode(organisationId, 'expenses', {
  mode: AutomationMode.SEMI_AUTO,
  confidenceThreshold: 90,
});
```

#### 2. AutoApproveService (W8-T4)
Workflow engine for auto-approval decisions.

**Features:**
- Decision logic: should item be auto-approved?
- Auto-approval execution with audit logging
- Automation statistics and recent actions

**API:**
```typescript
// Check if should auto-approve
const decision = await autoApprove.shouldAutoApprove({
  organisationId,
  feature: 'expenses',
  confidenceScore: 92,
  amount: 45000,
});

// Execute auto-approval (with audit log)
await autoApprove.executeAutoApproval({
  organisationId,
  feature: 'expenses',
  entityType: 'Expense',
  entityId: expense.id,
  confidenceScore: 92,
  inputData: { category: 'TRAVEL', amount: 45000 },
});

// Get statistics
await autoApprove.getAutomationStats(organisationId, 'expenses');

// Get recent actions
await autoApprove.getRecentActions(organisationId, 10, 'expenses');
```

#### 3. AutomationIntegrationService
Integration helpers for triggering automation from other services.

**Features:**
- Expense classification integration
- Tax deduction classification integration
- Bank transaction reconciliation integration
- Invoice creation integration

**API:**
```typescript
// Called by expense service after AI classification
const result = await automationIntegration.handleExpenseClassification(
  expense,
  { category: 'TRAVEL', confidence: 0.92 }
);

// Called by tax service after AI suggests deduction
const result = await automationIntegration.handleTaxClassification(
  transaction,
  { deductibleAmount: 5000, confidence: 0.95, category: 'OFFICE_SUPPLIES' }
);

// Called by bank integration after import
const results = await automationIntegration.handleBankTransactionImport(
  transactions
);

// Called by email processor when AI extracts invoice data
const result = await automationIntegration.handleInvoiceCreation(
  organisationId,
  { customerName: 'Acme Corp', amount: 1500, confidence: 0.88 }
);
```

## API Endpoints

### V2 API (New Schema)

Base path: `/api/v2/organisations/:orgId/automation`

#### Get Settings
```http
GET /api/v2/organisations/:orgId/automation/settings
```

Response:
```json
{
  "id": "clx1234567890",
  "organisationId": "550e8400-e29b-41d4-a716-446655440000",
  "invoiceCreation": "SEMI_AUTO",
  "expenseApproval": "SEMI_AUTO",
  "bankReconciliation": "SEMI_AUTO",
  "taxClassification": "SEMI_AUTO",
  "paymentReminders": "SEMI_AUTO",
  "invoiceConfidenceThreshold": 85,
  "expenseConfidenceThreshold": 80,
  "taxConfidenceThreshold": 90,
  "maxAutoApproveAmount": 100000,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

#### Update Settings
```http
PATCH /api/v2/organisations/:orgId/automation/settings
Content-Type: application/json

{
  "expenseApproval": "FULL_AUTO",
  "expenseConfidenceThreshold": 90,
  "maxAutoApproveAmount": 50000
}
```

#### Get Feature Mode
```http
GET /api/v2/organisations/:orgId/automation/settings/features/:feature
```

Parameters:
- `feature`: `invoices` | `expenses` | `tax` | `bankReconciliation`

Response:
```json
{
  "mode": "SEMI_AUTO",
  "confidenceThreshold": 85
}
```

#### Update Feature Mode
```http
PATCH /api/v2/organisations/:orgId/automation/settings/features/:feature
Content-Type: application/json

{
  "mode": "FULL_AUTO",
  "confidenceThreshold": 90
}
```

#### Get Statistics
```http
GET /api/v2/organisations/:orgId/automation/stats?feature=expenses&startDate=2025-01-01&endDate=2025-01-31
```

Response:
```json
{
  "totalActions": 150,
  "autoApproved": 120,
  "suggested": 30,
  "autoApprovalRate": 80.0
}
```

#### Get Recent Actions
```http
GET /api/v2/organisations/:orgId/automation/recent-actions?limit=10&feature=expenses
```

Response:
```json
[
  {
    "id": "clx9876543210",
    "action": "AUTO_APPROVED",
    "feature": "expenses",
    "mode": "FULL_AUTO",
    "entityType": "Expense",
    "entityId": "exp_123",
    "confidenceScore": 92,
    "wasAutoApproved": true,
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

## Integration Guide

### 1. Expense Service Integration

**When:** After AI classifies an expense

**How:**
```typescript
import { AutomationIntegrationService } from '../automation';

@Injectable()
export class ExpenseService {
  constructor(
    private automationIntegration: AutomationIntegrationService,
  ) {}

  async classifyExpense(expenseId: string) {
    // 1. Get expense
    const expense = await this.getExpense(expenseId);

    // 2. Call AI classification
    const classification = await this.aiService.classifyExpense(expense);

    // 3. Trigger automation
    const result = await this.automationIntegration.handleExpenseClassification(
      expense,
      classification
    );

    // 4. Handle result
    if (result.autoApproved) {
      // Update expense status to APPROVED
      await this.updateExpenseStatus(expenseId, 'APPROVED');
    } else {
      // Create notification for manual review
      await this.notificationService.createReviewNotification(expenseId);
    }

    return { classification, automation: result };
  }
}
```

### 2. Tax Service Integration

**When:** After AI suggests a tax deduction

**How:**
```typescript
import { AutomationIntegrationService } from '../automation';

@Injectable()
export class TaxService {
  constructor(
    private automationIntegration: AutomationIntegrationService,
  ) {}

  async suggestDeduction(transactionId: string) {
    // 1. Get transaction
    const transaction = await this.getTransaction(transactionId);

    // 2. Call AI to suggest deduction
    const suggestion = await this.aiService.suggestDeduction(transaction);

    // 3. Trigger automation
    const result = await this.automationIntegration.handleTaxClassification(
      transaction,
      suggestion
    );

    // 4. Handle result
    if (result.autoApproved) {
      // Automatically confirm the deduction
      await this.confirmDeduction(transactionId, suggestion);
    } else {
      // Create suggestion for manual review
      await this.createDeductionSuggestion(transactionId, suggestion);
    }

    return { suggestion, automation: result };
  }
}
```

### 3. Bank Integration Service

**When:** After importing bank transactions

**How:**
```typescript
import { AutomationIntegrationService } from '../automation';

@Injectable()
export class BankIntegrationService {
  constructor(
    private automationIntegration: AutomationIntegrationService,
  ) {}

  async importTransactions(bankAccountId: string) {
    // 1. Fetch transactions from bank API
    const transactions = await this.fetchFromBank(bankAccountId);

    // 2. Save to database
    const savedTransactions = await this.saveTransactions(transactions);

    // 3. Trigger automation for reconciliation
    const results = await this.automationIntegration.handleBankTransactionImport(
      savedTransactions
    );

    // 4. Process results
    for (const result of results) {
      if (result.autoReconciled) {
        // Mark as reconciled
        await this.markAsReconciled(result.transactionId, result.matchedTransactionId);
      } else {
        // Create suggestion for manual matching
        await this.createMatchingSuggestion(result.transactionId);
      }
    }

    return results;
  }
}
```

### 4. Invoice Service Integration

**When:** After AI extracts invoice data from email/document

**How:**
```typescript
import { AutomationIntegrationService } from '../automation';

@Injectable()
export class InvoiceService {
  constructor(
    private automationIntegration: AutomationIntegrationService,
  ) {}

  async createFromEmail(emailId: string) {
    // 1. Get email
    const email = await this.getEmail(emailId);

    // 2. Extract invoice data with AI
    const invoiceData = await this.aiService.extractInvoiceData(email);

    // 3. Trigger automation
    const result = await this.automationIntegration.handleInvoiceCreation(
      email.organisationId,
      invoiceData
    );

    // 4. Handle result
    if (result.autoCreated) {
      // Create invoice automatically
      const invoice = await this.createInvoice(invoiceData, 'SENT');
      return { invoice, automation: result };
    } else {
      // Create draft invoice for review
      const draft = await this.createInvoice(invoiceData, 'DRAFT');
      await this.notificationService.createReviewNotification(draft.id);
      return { invoice: draft, automation: result };
    }
  }
}
```

## Automation Modes

### MANUAL
- No automation
- All actions require manual review and approval
- System provides information but takes no action

### SEMI_AUTO (Default)
- System suggests actions but requires user confirmation
- High-confidence items are pre-selected for approval
- User must explicitly approve before action is taken
- Ideal for gradual automation adoption

### FULL_AUTO
- System takes action automatically
- No user confirmation required
- Actions logged in audit trail
- Thresholds must be met (confidence + amount)
- Best for high-volume, low-risk operations

## Decision Logic

The auto-approve decision follows this flow:

```
1. Get automation settings for feature
2. Check mode:
   - MANUAL → Never auto-approve
   - SEMI_AUTO/FULL_AUTO → Continue to step 3
3. Check confidence score:
   - Below threshold → Don't auto-approve
   - Above threshold → Continue to step 4
4. Check amount (if applicable):
   - Above limit → Don't auto-approve
   - Below limit → Continue to step 5
5. Final decision based on mode:
   - FULL_AUTO → Auto-approve
   - SEMI_AUTO → Suggest for manual approval
```

## Database Schema

The module uses the following Prisma models:

### AutomationSettings
```prisma
model AutomationSettings {
  id             String   @id @default(cuid())
  organisationId String
  organisation   Organisation @relation(...)

  // Feature modes
  invoiceCreation    AutomationMode @default(SEMI_AUTO)
  expenseApproval    AutomationMode @default(SEMI_AUTO)
  bankReconciliation AutomationMode @default(SEMI_AUTO)
  taxClassification  AutomationMode @default(SEMI_AUTO)
  paymentReminders   AutomationMode @default(SEMI_AUTO)

  // Confidence thresholds (0-100)
  invoiceConfidenceThreshold Int @default(85)
  expenseConfidenceThreshold Int @default(80)
  taxConfidenceThreshold     Int @default(90)

  // Limits
  maxAutoApproveAmount Decimal? @db.Decimal(15, 2)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organisationId])
}
```

### AutomationAuditLog
```prisma
model AutomationAuditLog {
  id             String   @id @default(cuid())
  organisationId String
  organisation   Organisation @relation(...)

  action String // e.g., "AUTO_APPROVED", "SUGGESTED_FOR_REVIEW"
  feature String // e.g., "expenses", "tax"
  mode   AutomationMode

  entityType String // e.g., "Expense", "Transaction"
  entityId   String

  confidenceScore Float?
  wasAutoApproved Boolean @default(false)

  inputData  Json?
  outputData Json?

  userId String?
  user   User?   @relation(...)

  createdAt DateTime @default(now())

  @@index([organisationId, createdAt])
  @@index([entityType, entityId])
  @@index([feature, action])
}
```

## Error Handling

All services include comprehensive error handling:

- **NotFoundException**: Organisation or entity not found
- **BadRequestException**: Invalid input (thresholds, modes, feature names)
- Validation errors are logged and returned with descriptive messages
- All database operations are wrapped in try-catch blocks

## Logging

All services use NestJS Logger for comprehensive logging:

- Service actions (get, update, approve)
- Decision points (why auto-approve yes/no)
- Errors with stack traces
- Integration triggers

Example:
```
[AutoApproveService] Checking auto-approve for feature: expenses, confidence: 92, amount: 45000
[AutoApproveService] Auto-approval executed: APPROVED - FULL_AUTO mode: Confidence 92% meets threshold 85%
```

## Testing

### Unit Tests

```typescript
describe('AutoApproveService', () => {
  it('should auto-approve when FULL_AUTO and thresholds met', async () => {
    const decision = await service.shouldAutoApprove({
      organisationId: 'org123',
      feature: 'expenses',
      confidenceScore: 92,
      amount: 45000,
    });

    expect(decision.autoApprove).toBe(true);
    expect(decision.reason).toContain('FULL_AUTO mode');
  });
});
```

### Integration Tests

```typescript
describe('Automation Integration', () => {
  it('should handle expense classification flow', async () => {
    const expense = await createTestExpense();
    const classification = { category: 'TRAVEL', confidence: 0.92 };

    const result = await automationIntegration.handleExpenseClassification(
      expense,
      classification
    );

    expect(result.autoApproved).toBeDefined();
    expect(result.action).toBeOneOf(['AUTO_APPROVED', 'SUGGESTED_FOR_REVIEW']);
  });
});
```

## Migration Notes

### From Legacy API

The old API used a feature-per-row approach. The new API uses a single row per organisation with feature-specific columns.

**Old approach:**
```
AutomationSettings { orgId, feature: 'expense', mode: 'SEMI_AUTO', ... }
AutomationSettings { orgId, feature: 'invoice', mode: 'MANUAL', ... }
```

**New approach:**
```
AutomationSettings {
  orgId,
  expenseApproval: 'SEMI_AUTO',
  invoiceCreation: 'MANUAL',
  ...
}
```

### Breaking Changes

1. Feature names changed:
   - `classification` → `taxClassification`
   - `expense` → `expenseApproval`
   - `deduction` → part of `taxClassification`
   - `invoice` → `invoiceCreation`

2. Confidence thresholds now 0-100 (was 0-1)

3. API endpoints moved to v2

## Future Enhancements

Potential improvements:

1. **Machine Learning**: Learn optimal thresholds from user corrections
2. **Advanced Rules**: Complex conditions (time-based, category-specific)
3. **Batch Operations**: Bulk auto-approve for multiple items
4. **Rollback**: Undo auto-approved actions
5. **A/B Testing**: Test different automation strategies
6. **Cost Tracking**: Monitor cost savings from automation

## Support

For questions or issues:
- Check the code documentation in each service file
- Review the integration examples above
- Consult the Prisma schema for data structure
- See the API documentation in Swagger
