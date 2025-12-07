# S9-04: EXECUTE_SUGGESTION Action Handler - Analysis & Design

**Agent**: FORGE (Backend)
**Task**: Create the EXECUTE_SUGGESTION action handler
**Date**: 2025-12-07

---

## 1. ANALYSIS OF CURRENT ACTION HANDLER PATTERN

### Handler Architecture
All action handlers follow a consistent pattern:

```typescript
@Injectable()
export class XxxHandler extends BaseActionHandler {
  constructor(
    private someService: SomeService,
    // Dependencies injected
  ) {
    super('XxxHandler');
  }

  get actionType(): ActionType {
    return ActionType.XXX_ACTION;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'param1',
        type: 'string',
        required: true,
        description: 'Parameter description',
        validation: (value) => /* validation logic */,
      },
      // ... more parameters
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // 1. Check permissions
      if (!this.hasPermission(context, 'resource:action')) {
        return this.error('Permission denied', 'PERMISSION_DENIED');
      }

      // 2. Normalize parameters
      const normalized = this.normalizeParams(params);

      // 3. Validate business logic
      // ... validation

      // 4. Execute action
      const result = await this.someService.doSomething(...);

      // 5. Log execution
      this.logger.log(`Action completed: ${result.id}`);

      // 6. Return success
      return this.success(
        'Action completed successfully',
        result.id,
        'EntityType',
        { /* additional data */ },
      );
    } catch (error) {
      this.logger.error('Failed to execute action:', error);
      return this.error('Failed to execute action', error.message);
    }
  }
}
```

### Handler Registration
Handlers are registered in `ActionExecutorService`:

1. **Dependency Injection**: Handlers injected in constructor
2. **Registration**: `registerHandlers()` maps ActionType to handler instance
3. **Execution**: `executeAction()` looks up handler by type and executes

### Key Base Handler Methods
- `validate()`: Validates parameters against schema
- `normalizeParams()`: Sanitizes and trims parameters
- `hasPermission()`: Checks user permissions
- `success()`: Returns success result
- `error()`: Returns error result

---

## 2. ANALYSIS OF SUGGESTION SYSTEM

### Database Schema

**Suggestion Model** (from `schema.prisma`):
```prisma
model Suggestion {
  id     String  @id @default(uuid())
  orgId  String
  userId String? // Null for org-wide suggestions

  // Suggestion details
  type        SuggestionType
  priority    SuggestionPriority @default(MEDIUM)
  title       String
  description String
  actionLabel String? // "Pay Now", "Review", "File Tax"

  // Context
  entityType String? // invoice, expense, client, tax
  entityId   String?
  data       Json? // Additional structured data

  // Action
  actionType   String? // navigate, api_call, open_chat
  actionParams Json?

  // Status
  status        SuggestionStatus @default(PENDING)
  viewedAt      DateTime?
  actedAt       DateTime?
  dismissedAt   DateTime?
  dismissReason String?

  // Scheduling
  showAfter DateTime  @default(now())
  expiresAt DateTime?

  // AI metadata
  confidence Decimal? @db.Decimal(3, 2)
  model      String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum SuggestionType {
  TAX_DEADLINE
  INVOICE_REMINDER
  EXPENSE_ANOMALY
  CASH_FLOW
  CLIENT_FOLLOWUP
  COMPLIANCE
  OPTIMIZATION
  INSIGHT
}

enum SuggestionStatus {
  PENDING
  VIEWED
  ACTED
  DISMISSED
  EXPIRED
}
```

### Existing Services

**1. SuggestionsService** (`apps/api/src/modules/chatbot/suggestions.service.ts`):
- `getSuggestions()`: Fetch suggestions with filters
- `applySuggestion()`: Execute suggestion action
- `dismissSuggestion()`: Dismiss suggestion
- `executeAction()`: Internal action executor (basic)

**Current Action Types Supported**:
- `navigate`: Return navigation params
- `api_call`: Execute internal API call
- `open_chat`: Open chatbot with context

**2. ProactiveSuggestionsService** (`apps/api/src/modules/chatbot/suggestions/proactive-suggestions.service.ts`):
- Generates suggestions using multiple generators
- Caches suggestions
- Returns insights, reminders, optimizations

**3. EmailSuggestionsService** (`apps/api/src/modules/ai/email-intelligence/email-suggestions.service.ts`):
- Email-specific suggestions
- Different model (EmailSuggestion)
- Not part of unified Suggestion table

### Suggestion Type → Action Mapping

Based on the task requirements, here's the mapping:

| Suggestion Type | Target Action | Handler | Parameters |
|-----------------|---------------|---------|------------|
| `INVOICE_REMINDER` | Send reminder | `SendReminderHandler` | `invoiceId`, `reminderType` |
| `TAX_DEADLINE` | Open tax wizard | Navigate | `path: /tax/wizard` |
| `EXPENSE_ANOMALY` | Review expense | Navigate | `path: /expenses/{id}` |
| `CASH_FLOW` | View cash flow | `GetCashFlowHandler` | `days` (optional) |
| `CLIENT_FOLLOWUP` | Draft email | Open chat | `action: draft_email` |
| `COMPLIANCE` | Review compliance | Navigate | `path: /compliance` |
| `OPTIMIZATION` | View optimization | Navigate | `path: /insights` |
| `INSIGHT` | View insight details | Navigate | Varies by entityType |

---

## 3. DESIGN FOR EXECUTE_SUGGESTION HANDLER

### Handler Specification

**File**: `apps/api/src/modules/chatbot/actions/handlers/execute-suggestion.handler.ts`

**Purpose**: Execute a proactive suggestion by mapping suggestion type to appropriate action

**Flow**:
1. Receive suggestion ID as parameter
2. Fetch suggestion from database
3. Validate suggestion status (must be PENDING or VIEWED)
4. Map suggestion type to underlying action
5. Execute the appropriate handler or action
6. Mark suggestion as ACTED
7. Return result

### Parameters

```typescript
{
  name: 'suggestionId',
  type: 'string',
  required: true,
  description: 'ID of the suggestion to execute',
}
```

### Permissions

No specific permission check needed - the underlying action handlers will check their own permissions.

### Code Structure

```typescript
@Injectable()
export class ExecuteSuggestionHandler extends BaseActionHandler {
  constructor(
    private prisma: PrismaService,
    private suggestionsService: SuggestionsService,
    // Action handlers
    private sendReminderHandler: SendReminderHandler,
    private getCashFlowHandler: GetCashFlowHandler,
    // ... other handlers as needed
  ) {
    super('ExecuteSuggestionHandler');
  }

  get actionType(): ActionType {
    return ActionType.EXECUTE_SUGGESTION;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'suggestionId',
        type: 'string',
        required: true,
        description: 'ID of the suggestion to execute',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      const normalized = this.normalizeParams(params);

      // 1. Fetch suggestion
      const suggestion = await this.prisma.suggestion.findFirst({
        where: {
          id: normalized.suggestionId,
          orgId: context.organizationId,
        },
      });

      if (!suggestion) {
        return this.error('Suggestion not found', 'NOT_FOUND');
      }

      // 2. Validate status
      if (suggestion.status === 'ACTED') {
        return this.error(
          'Suggestion has already been acted upon',
          'ALREADY_ACTED',
        );
      }

      if (suggestion.status === 'DISMISSED') {
        return this.error(
          'Cannot execute a dismissed suggestion',
          'DISMISSED',
        );
      }

      if (suggestion.status === 'EXPIRED') {
        return this.error(
          'Suggestion has expired',
          'EXPIRED',
        );
      }

      // 3. Map suggestion type to action
      const actionResult = await this.executeSuggestionAction(
        suggestion,
        context,
      );

      // 4. Mark suggestion as ACTED
      await this.prisma.suggestion.update({
        where: { id: suggestion.id },
        data: {
          status: 'ACTED',
          actedAt: new Date(),
        },
      });

      this.logger.log(
        `Suggestion ${suggestion.id} (${suggestion.type}) executed successfully`,
      );

      // 5. Return result
      return this.success(
        `Suggestion executed: ${suggestion.title}`,
        suggestion.id,
        'Suggestion',
        {
          suggestionType: suggestion.type,
          actionResult,
        },
      );
    } catch (error) {
      this.logger.error('Failed to execute suggestion:', error);
      return this.error(
        'Failed to execute suggestion',
        error.message || 'Unknown error',
      );
    }
  }

  /**
   * Execute the underlying action based on suggestion type
   */
  private async executeSuggestionAction(
    suggestion: any,
    context: ActionContext,
  ): Promise<any> {
    const actionParams = suggestion.actionParams as Record<string, any> || {};

    switch (suggestion.type) {
      case 'INVOICE_REMINDER':
        // Execute send reminder handler
        return await this.sendReminderHandler.execute(
          {
            invoiceId: suggestion.entityId,
            reminderType: actionParams.reminderType || 'gentle',
            ...actionParams,
          },
          context,
        );

      case 'CASH_FLOW':
        // Execute cash flow handler
        return await this.getCashFlowHandler.execute(
          {
            days: actionParams.days || 30,
            ...actionParams,
          },
          context,
        );

      case 'TAX_DEADLINE':
      case 'EXPENSE_ANOMALY':
      case 'COMPLIANCE':
      case 'OPTIMIZATION':
      case 'INSIGHT':
      case 'CLIENT_FOLLOWUP':
        // These require navigation or chat actions
        // Return navigation/action data for frontend
        return {
          action: suggestion.actionType || 'navigate',
          ...actionParams,
        };

      default:
        throw new Error(`Unsupported suggestion type: ${suggestion.type}`);
    }
  }
}
```

---

## 4. FILES TO CREATE/MODIFY

### Create New Files

1. **Handler Implementation**
   - **Path**: `apps/api/src/modules/chatbot/actions/handlers/execute-suggestion.handler.ts`
   - **Purpose**: Execute suggestion action handler

### Modify Existing Files

2. **Action Types Enum**
   - **Path**: `apps/api/src/modules/chatbot/actions/action.types.ts`
   - **Change**: Add `EXECUTE_SUGGESTION = 'execute_suggestion'` to `ActionType` enum

3. **Handler Index**
   - **Path**: `apps/api/src/modules/chatbot/actions/handlers/index.ts`
   - **Change**: Export the new handler
   ```typescript
   export * from './execute-suggestion.handler';
   ```

4. **Action Executor Service**
   - **Path**: `apps/api/src/modules/chatbot/actions/action-executor.service.ts`
   - **Changes**:
     - Import `ExecuteSuggestionHandler`
     - Inject in constructor
     - Register in `registerHandlers()`
     - Add to `getAvailableActions()` definitions array

5. **Chatbot Module** (if needed)
   - **Path**: `apps/api/src/modules/chatbot/chatbot.module.ts`
   - **Change**: Add `ExecuteSuggestionHandler` to providers array

---

## 5. DEPENDENCIES & INTEGRATION

### Services Required
- `PrismaService`: Fetch and update suggestions
- `SuggestionsService`: May use for helper methods
- `SendReminderHandler`: For invoice reminders
- `GetCashFlowHandler`: For cash flow suggestions
- Other handlers as needed for future suggestion types

### Permission Model
- No direct permission check in this handler
- Relies on underlying action handlers to enforce permissions
- This allows suggestion execution to respect user permissions naturally

### Error Handling
1. **Not Found**: Suggestion ID doesn't exist
2. **Already Acted**: Suggestion already executed
3. **Dismissed**: Suggestion was dismissed by user
4. **Expired**: Suggestion past expiration date
5. **Unsupported Type**: Suggestion type not yet implemented
6. **Permission Denied**: Underlying action handler denies permission

---

## 6. MISSING PIECES IDENTIFIED

### 1. Bill Payment Suggestion Handler
**Issue**: Task mentions "BILL_DUE → Schedule payment" but there's no direct "schedule payment" action.

**Options**:
- **A**: Use `PayBillHandler` directly (requires manual payment)
- **B**: Create navigation to bills page with pre-filled filter
- **C**: Add future "schedule payment" feature

**Recommendation**: Use option B for now (navigate to bills with filter), plan for option C in future sprint.

### 2. Transaction Reconciliation Handler
**Issue**: Task mentions "RECONCILE_TRANSACTION → Auto-reconcile" but no such handler exists.

**Missing**:
- `ReconcileTransactionHandler` for auto-reconciliation
- Reconciliation service/logic

**Recommendation**: Return navigation action to reconciliation page for now. Add auto-reconcile handler in future sprint when reconciliation feature is built.

### 3. Email Review Handler
**Issue**: Task mentions "REVIEW_EMAIL → Show email details" but no email viewing action exists.

**Missing**:
- Email viewing/detail handler
- Email model in database

**Recommendation**: Return navigation to email list/detail page. This integrates with existing email intelligence system.

### 4. Additional Suggestion Types in Database
**Current Database Types**:
- TAX_DEADLINE
- INVOICE_REMINDER
- EXPENSE_ANOMALY
- CASH_FLOW
- CLIENT_FOLLOWUP
- COMPLIANCE
- OPTIMIZATION
- INSIGHT

**Task Requirements**:
- INVOICE_OVERDUE (similar to INVOICE_REMINDER)
- BILL_DUE (not in enum)
- RECONCILE_TRANSACTION (not in enum)
- REVIEW_EMAIL (not in enum)
- TAX_DEADLINE (exists)

**Schema Update Needed**: Add missing types to `SuggestionType` enum in Prisma schema.

### 5. Action Type Registry
**Current Coverage**:
✅ CREATE_INVOICE
✅ SEND_REMINDER
✅ GENERATE_REPORT
✅ CREATE_EXPENSE
✅ UPDATE_STATUS
✅ CREATE_BILL
✅ PAY_BILL
✅ LIST_BILLS
✅ BILL_STATUS
✅ GET_CASH_FLOW
✅ GET_RUNWAY
✅ GET_BURN_RATE
✅ GET_CASH_FORECAST

**Missing**:
❌ RECONCILE_TRANSACTION
❌ SCHEDULE_PAYMENT
❌ VIEW_EMAIL

---

## 7. IMPLEMENTATION PLAN

### Phase 1: Core Handler (Immediate)
1. ✅ Add `EXECUTE_SUGGESTION` to `ActionType` enum
2. ✅ Create `ExecuteSuggestionHandler` class
3. ✅ Implement parameter definition
4. ✅ Implement execute method with:
   - Suggestion fetch
   - Status validation
   - Type mapping for existing types
   - Mark as acted
5. ✅ Register handler in executor service
6. ✅ Export from index
7. ✅ Add to chatbot module providers

### Phase 2: Extended Types (Follow-up)
1. Add missing `SuggestionType` enum values to Prisma schema:
   - BILL_DUE
   - RECONCILE_TRANSACTION
   - REVIEW_EMAIL
2. Run Prisma migration
3. Update handler to support new types
4. Add navigation/action mappings for new types

### Phase 3: Full Action Handlers (Future Sprint)
1. Create `ReconcileTransactionHandler`
2. Create `SchedulePaymentHandler`
3. Create `ViewEmailHandler`
4. Update `ExecuteSuggestionHandler` to use new handlers

---

## 8. TESTING STRATEGY

### Unit Tests
1. Test parameter validation
2. Test suggestion not found
3. Test invalid statuses (acted, dismissed, expired)
4. Test each suggestion type mapping
5. Test marking suggestion as acted

### Integration Tests
1. Create suggestion → Execute → Verify action taken
2. Execute INVOICE_REMINDER → Verify reminder sent
3. Execute CASH_FLOW → Verify cash flow data returned
4. Execute navigation suggestions → Verify navigation params

### End-to-End Tests
1. User sees suggestion in chat
2. User clicks "Execute" or says "Do it"
3. Action executes successfully
4. Suggestion marked as acted
5. Result shown in chat

---

## 9. EXAMPLE USAGE

### Chat Interaction
```
User: "Show me my suggestions"
AI: "You have 3 pending suggestions:
     1. Invoice #1234 is 5 days overdue - send reminder?
     2. Review unusual expense of €500 for 'Office supplies'
     3. Tax deadline in 7 days - file VAT return"

User: "Execute the first one"
AI: [ACTION:execute_suggestion params={"suggestionId":"sugg_123"}]

Result: "Payment reminder sent to customer@example.com for invoice #1234"
```

### API Call Example
```typescript
// Execute suggestion via API
POST /api/v1/chatbot/actions/execute

{
  "action": {
    "type": "execute_suggestion",
    "parameters": {
      "suggestionId": "sugg_abc123"
    }
  },
  "context": {
    "userId": "user_123",
    "organizationId": "org_456",
    "conversationId": "conv_789",
    "permissions": ["invoices:send", "bills:view"]
  }
}

// Response
{
  "success": true,
  "message": "Suggestion executed: Send payment reminder for Invoice #1234",
  "entityId": "sugg_abc123",
  "entityType": "Suggestion",
  "data": {
    "suggestionType": "INVOICE_REMINDER",
    "actionResult": {
      "success": true,
      "message": "Payment reminder sent successfully"
    }
  }
}
```

---

## 10. CODE DESIGN DETAILS

### Suggestion Type Mapping Strategy

**Option A: Switch Statement** (Recommended)
```typescript
private async executeSuggestionAction(
  suggestion: any,
  context: ActionContext,
): Promise<any> {
  const actionParams = suggestion.actionParams || {};

  switch (suggestion.type) {
    case 'INVOICE_REMINDER':
      return await this.sendReminderHandler.execute(
        { invoiceId: suggestion.entityId, ...actionParams },
        context,
      );
    case 'CASH_FLOW':
      return await this.getCashFlowHandler.execute(actionParams, context);
    // ... more cases
    default:
      return { action: 'navigate', ...actionParams };
  }
}
```

**Pros**: Simple, clear, easy to maintain
**Cons**: Requires code change for each new type

**Option B: Strategy Pattern**
```typescript
private readonly actionStrategies = new Map<string, ActionStrategy>();

// Register strategies in constructor
this.actionStrategies.set('INVOICE_REMINDER', {
  handler: this.sendReminderHandler,
  paramMapper: (s) => ({ invoiceId: s.entityId, ...s.actionParams }),
});
```

**Pros**: More flexible, easier to extend
**Cons**: More complex, overkill for current needs

**Decision**: Use Option A (switch statement) for simplicity and clarity.

### Error Handling Strategy

```typescript
try {
  const actionResult = await this.executeSuggestionAction(suggestion, context);

  // Mark as acted only if successful
  if (actionResult.success !== false) {
    await this.prisma.suggestion.update({
      where: { id: suggestion.id },
      data: { status: 'ACTED', actedAt: new Date() },
    });
  }

  return this.success(
    `Suggestion executed: ${suggestion.title}`,
    suggestion.id,
    'Suggestion',
    { suggestionType: suggestion.type, actionResult },
  );
} catch (error) {
  // Don't mark as acted if execution failed
  this.logger.error('Failed to execute suggestion:', error);
  return this.error('Failed to execute suggestion', error.message);
}
```

### Suggestion Status State Machine

```
PENDING → VIEWED → ACTED
  ↓         ↓
DISMISSED  DISMISSED
  ↓         ↓
EXPIRED   EXPIRED
```

**Rules**:
1. Can execute from PENDING or VIEWED
2. Cannot execute from ACTED, DISMISSED, or EXPIRED
3. Mark as ACTED only after successful execution
4. Keep in PENDING/VIEWED if execution fails

---

## 11. FUTURE ENHANCEMENTS

### 1. Batch Execution
Allow executing multiple suggestions at once:
```typescript
{
  name: 'suggestionIds',
  type: 'array',
  required: true,
  description: 'Array of suggestion IDs to execute',
}
```

### 2. Dry Run Mode
Preview what would happen without executing:
```typescript
{
  name: 'dryRun',
  type: 'boolean',
  required: false,
  description: 'Preview execution without making changes',
}
```

### 3. Suggestion Scheduling
Execute suggestion at a later time:
```typescript
{
  name: 'scheduledFor',
  type: 'string',
  required: false,
  description: 'ISO date to execute suggestion',
}
```

### 4. Partial Execution
For suggestions with multiple steps, allow executing specific steps:
```typescript
{
  name: 'steps',
  type: 'array',
  required: false,
  description: 'Specific steps to execute',
}
```

### 5. Undo Capability
Allow undoing recently executed suggestions:
```typescript
// Store original state before execution
// Provide undo action for reversible operations
```

---

## 12. SUMMARY

### What We Have
- ✅ Robust action handler pattern
- ✅ Complete suggestion database model
- ✅ Multiple suggestion services
- ✅ Existing action handlers (12 types)
- ✅ Permission system
- ✅ Validation framework

### What We Need to Build
- 📝 `ExecuteSuggestionHandler` class
- 📝 Update `ActionType` enum
- 📝 Register in executor service
- 📝 Update handler index
- 📝 Add to module providers

### What's Missing (Future Work)
- ⏭️ Additional suggestion types in schema
- ⏭️ ReconcileTransactionHandler
- ⏭️ SchedulePaymentHandler
- ⏭️ ViewEmailHandler
- ⏭️ Batch execution support

### Complexity Assessment
**Low-Medium Complexity**
- Pattern is well-established
- Services already exist
- Mapping logic is straightforward
- Main challenge: Handling navigation vs execution actions

### Estimated Effort
- **Core Handler**: 2-3 hours
- **Testing**: 1-2 hours
- **Integration**: 1 hour
- **Total**: 4-6 hours

---

## 13. RECOMMENDATIONS

### Immediate Action Items
1. ✅ Create `ExecuteSuggestionHandler` with switch-based mapping
2. ✅ Support existing suggestion types (8 types in schema)
3. ✅ Handle both executable actions (via handlers) and navigation actions
4. ✅ Add comprehensive error handling for all status states
5. ✅ Write unit tests for each suggestion type

### Follow-Up Tasks
1. Add missing suggestion types to Prisma schema
2. Create missing action handlers (reconcile, schedule, email)
3. Implement batch execution
4. Add suggestion execution analytics
5. Create dashboard widget showing executed suggestions

### Integration Points
1. **Frontend**: Chat interface should detect execute_suggestion actions
2. **Analytics**: Track which suggestions get executed vs dismissed
3. **Learning**: Feed execution data to ML for better suggestions
4. **Notifications**: Notify users when auto-execution occurs

---

## END OF ANALYSIS

**Status**: ✅ Analysis Complete
**Ready for Implementation**: Yes
**Blockers**: None
**Dependencies**: All services exist

**Next Step**: Begin implementation with `ExecuteSuggestionHandler` creation.