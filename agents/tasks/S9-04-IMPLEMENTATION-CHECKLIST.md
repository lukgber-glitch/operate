# S9-04: EXECUTE_SUGGESTION Handler - Implementation Checklist

**Task**: Create the EXECUTE_SUGGESTION action handler
**Status**: Ready for Implementation
**Analysis**: See S9-04-EXECUTE-SUGGESTION-ANALYSIS.md

---

## Files to Create

### 1. Handler Implementation
**File**: `apps/api/src/modules/chatbot/actions/handlers/execute-suggestion.handler.ts`

**Content**:
```typescript
import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import { ActionType, ActionResult, ActionContext, ParameterDefinition } from '../action.types';
import { PrismaService } from '../../../database/prisma.service';
import { SendReminderHandler } from './send-reminder.handler';
import { GetCashFlowHandler } from './get-cash-flow.handler';

@Injectable()
export class ExecuteSuggestionHandler extends BaseActionHandler {
  constructor(
    private prisma: PrismaService,
    private sendReminderHandler: SendReminderHandler,
    private getCashFlowHandler: GetCashFlowHandler,
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
        return this.error('Suggestion has expired', 'EXPIRED');
      }

      // 3. Execute suggestion action
      const actionResult = await this.executeSuggestionAction(
        suggestion,
        context,
      );

      // 4. Mark as ACTED (only if execution was successful)
      if (actionResult.success !== false) {
        await this.prisma.suggestion.update({
          where: { id: suggestion.id },
          data: {
            status: 'ACTED',
            actedAt: new Date(),
          },
        });
      }

      this.logger.log(
        `Suggestion ${suggestion.id} (${suggestion.type}) executed`,
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
   * Map suggestion type to action and execute
   */
  private async executeSuggestionAction(
    suggestion: any,
    context: ActionContext,
  ): Promise<any> {
    const actionParams = (suggestion.actionParams as Record<string, any>) || {};

    switch (suggestion.type) {
      case 'INVOICE_REMINDER':
        // Execute invoice reminder
        return await this.sendReminderHandler.execute(
          {
            invoiceId: suggestion.entityId,
            reminderType: actionParams.reminderType || 'gentle',
            customMessage: actionParams.customMessage,
          },
          context,
        );

      case 'CASH_FLOW':
        // Execute cash flow analysis
        return await this.getCashFlowHandler.execute(
          {
            days: actionParams.days || 30,
          },
          context,
        );

      case 'TAX_DEADLINE':
        // Navigate to tax wizard
        return {
          action: 'navigate',
          path: '/tax/wizard',
          ...actionParams,
        };

      case 'EXPENSE_ANOMALY':
        // Navigate to expense details
        return {
          action: 'navigate',
          path: `/expenses/${suggestion.entityId}`,
          ...actionParams,
        };

      case 'CLIENT_FOLLOWUP':
        // Open chat with draft email context
        return {
          action: 'open_chat',
          context: 'draft_email',
          entityId: suggestion.entityId,
          ...actionParams,
        };

      case 'COMPLIANCE':
        // Navigate to compliance page
        return {
          action: 'navigate',
          path: '/compliance',
          ...actionParams,
        };

      case 'OPTIMIZATION':
        // Navigate to insights page
        return {
          action: 'navigate',
          path: '/insights',
          ...actionParams,
        };

      case 'INSIGHT':
        // Navigate based on entity type
        const insightPath = this.getInsightPath(
          suggestion.entityType,
          suggestion.entityId,
        );
        return {
          action: 'navigate',
          path: insightPath,
          ...actionParams,
        };

      default:
        // Fallback: use actionType from suggestion
        if (suggestion.actionType) {
          return {
            action: suggestion.actionType,
            ...actionParams,
          };
        }
        throw new Error(`Unsupported suggestion type: ${suggestion.type}`);
    }
  }

  /**
   * Get navigation path for insight suggestions
   */
  private getInsightPath(entityType: string | null, entityId: string | null): string {
    if (!entityType || !entityId) {
      return '/insights';
    }

    switch (entityType) {
      case 'invoice':
        return `/invoices/${entityId}`;
      case 'expense':
        return `/expenses/${entityId}`;
      case 'client':
        return `/clients/${entityId}`;
      case 'bill':
        return `/bills/${entityId}`;
      default:
        return '/insights';
    }
  }
}
```

---

## Files to Modify

### 2. Action Types Enum
**File**: `apps/api/src/modules/chatbot/actions/action.types.ts`

**Change**: Add new enum value
```typescript
export enum ActionType {
  // ... existing types
  GET_CASH_FORECAST = 'get_cash_forecast',
  EXECUTE_SUGGESTION = 'execute_suggestion',  // ADD THIS
}
```

### 3. Handler Index
**File**: `apps/api/src/modules/chatbot/actions/handlers/index.ts`

**Change**: Export new handler
```typescript
export * from './base.handler';
export * from './create-invoice.handler';
// ... other exports
export * from './execute-suggestion.handler';  // ADD THIS
```

### 4. Action Executor Service
**File**: `apps/api/src/modules/chatbot/actions/action-executor.service.ts`

**Changes**:

1. Import the handler (line ~37):
```typescript
import { GetCashForecastHandler } from './handlers/get-cash-forecast.handler';
import { ExecuteSuggestionHandler } from './handlers/execute-suggestion.handler';  // ADD
```

2. Inject in constructor (line ~66):
```typescript
private getCashForecastHandler: GetCashForecastHandler,
private executeSuggestionHandler: ExecuteSuggestionHandler,  // ADD
```

3. Register handler (line ~87):
```typescript
this.handlers.set(ActionType.GET_CASH_FORECAST, this.getCashForecastHandler);
this.handlers.set(ActionType.EXECUTE_SUGGESTION, this.executeSuggestionHandler);  // ADD
```

4. Add to available actions (line ~447):
```typescript
{
  type: ActionType.EXECUTE_SUGGESTION,
  name: 'Execute Suggestion',
  description: 'Execute a proactive AI suggestion',
  parameters: this.executeSuggestionHandler.getRequiredParameters(),
  requiredPermissions: [], // No specific permission - delegated to underlying actions
  requiresConfirmation: false,
  riskLevel: 'medium',
  examples: [
    '[ACTION:execute_suggestion params={"suggestionId":"sugg_123"}]',
  ],
},
```

### 5. Chatbot Module (if needed)
**File**: `apps/api/src/modules/chatbot/chatbot.module.ts`

**Check**: Verify `ExecuteSuggestionHandler` is in providers array
If using barrel exports from handlers/index.ts, it should auto-include.
Otherwise, add explicitly:
```typescript
providers: [
  // ... other providers
  ExecuteSuggestionHandler,
]
```

---

## Testing Checklist

### Unit Tests
**File**: `apps/api/src/modules/chatbot/actions/handlers/execute-suggestion.handler.spec.ts`

- [ ] Test parameter validation (missing suggestionId)
- [ ] Test suggestion not found
- [ ] Test already acted suggestion
- [ ] Test dismissed suggestion
- [ ] Test expired suggestion
- [ ] Test INVOICE_REMINDER execution
- [ ] Test CASH_FLOW execution
- [ ] Test TAX_DEADLINE navigation
- [ ] Test EXPENSE_ANOMALY navigation
- [ ] Test CLIENT_FOLLOWUP chat action
- [ ] Test unsupported suggestion type
- [ ] Test marking suggestion as ACTED after success
- [ ] Test NOT marking as ACTED after failure

### Integration Tests
- [ ] Create suggestion via SuggestionsService
- [ ] Execute via ExecuteSuggestionHandler
- [ ] Verify underlying action was called
- [ ] Verify suggestion status updated to ACTED
- [ ] Verify action result returned correctly

---

## Validation Steps

1. **Code Compiles**
   ```bash
   cd apps/api
   npm run build
   ```

2. **Tests Pass**
   ```bash
   npm run test:unit -- execute-suggestion.handler.spec
   ```

3. **API Endpoint Works**
   ```bash
   curl -X POST http://localhost:3000/api/v1/chatbot/actions/execute \
     -H "Content-Type: application/json" \
     -d '{
       "action": {
         "type": "execute_suggestion",
         "parameters": {"suggestionId": "test_id"}
       }
     }'
   ```

4. **Chat Integration**
   - User says: "Execute suggestion 123"
   - AI parses: `[ACTION:execute_suggestion params={"suggestionId":"123"}]`
   - Action executes successfully
   - Result returned to chat

---

## Completion Criteria

- [x] Analysis document created
- [ ] Handler implementation created
- [ ] ActionType enum updated
- [ ] Handler exported from index
- [ ] Executor service updated
- [ ] Module providers updated
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Manual testing completed
- [ ] Code review passed
- [ ] Deployed to staging
- [ ] Verified in production

---

## Notes

**Dependencies**: All required services and handlers already exist
**Blockers**: None
**Estimated Time**: 4-6 hours total
**Priority**: Medium (Part of Sprint 9 - Proactive Suggestions)

**Related Tasks**:
- S9-01: Proactive suggestion generator (prerequisite)
- S9-02: Suggestion display in chat (consumer)
- S9-03: Suggestion API endpoints (consumer)
