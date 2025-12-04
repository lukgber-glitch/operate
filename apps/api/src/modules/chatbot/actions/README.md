# Chat Action Executor System

AI-powered action execution system that allows the chatbot to perform actions on behalf of users.

## Overview

The action executor system enables the AI assistant to:
- Parse action intents from AI responses
- Validate action parameters and permissions
- Execute actions with confirmation flows
- Log all actions for audit trails
- Rate limit action execution

## Architecture

```
┌─────────────────┐
│  Chat Service   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Action Executor     │
│ Service             │
├─────────────────────┤
│ • Parse intents     │
│ • Validate params   │
│ • Check permissions │
│ • Rate limiting     │
│ • Audit logging     │
└────────┬────────────┘
         │
         ▼
    ┌────┴─────┬───────┬────────┬────────┐
    ▼          ▼       ▼        ▼        ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Invoice │ │Expense │ │Report  │ │Status  │
│Handler │ │Handler │ │Handler │ │Handler │
└────────┘ └────────┘ └────────┘ └────────┘
```

## Available Actions

### 1. Create Invoice
Creates a new invoice for a customer.

**Format:**
```
[ACTION:create_invoice params={"customerName":"Contoso Ltd","amount":500,"currency":"EUR","description":"Consulting services"}]
```

**Parameters:**
- `customerId` (string, optional) - Existing customer ID
- `customerName` (string, optional) - Customer name if new
- `customerEmail` (string, optional) - Customer email
- `amount` (number, required) - Invoice amount
- `currency` (string, optional) - Currency code (default: EUR)
- `description` (string, required) - Invoice description
- `dueDate` (string, optional) - Due date ISO format
- `vatRate` (number, optional) - VAT rate percentage

**Permissions:** `invoices:create`
**Confirmation:** Required
**Risk Level:** Medium

### 2. Create Expense
Records a new business expense.

**Format:**
```
[ACTION:create_expense params={"description":"Office supplies","amount":150,"category":"supplies","currency":"EUR"}]
```

**Parameters:**
- `description` (string, required) - Expense description
- `amount` (number, required) - Expense amount
- `currency` (string, optional) - Currency code
- `date` (string, optional) - Expense date
- `category` (string, required) - Expense category
- `vendorName` (string, optional) - Vendor name
- `vatRate` (number, optional) - VAT rate
- `isDeductible` (boolean, optional) - Tax deductible

**Permissions:** `expenses:create`
**Confirmation:** Not required
**Risk Level:** Low

### 3. Send Reminder
Sends payment reminder for an invoice.

**Format:**
```
[ACTION:send_reminder params={"invoiceId":"inv_123","reminderType":"gentle"}]
```

**Parameters:**
- `invoiceId` (string, required) - Invoice ID
- `reminderType` (string, optional) - Type: gentle, firm, final
- `customMessage` (string, optional) - Custom message

**Permissions:** `invoices:send`
**Confirmation:** Required
**Risk Level:** Medium

### 4. Generate Report
Generates financial reports.

**Format:**
```
[ACTION:generate_report params={"reportType":"income","fromDate":"2024-01-01","toDate":"2024-12-31","format":"pdf"}]
```

**Parameters:**
- `reportType` (string, required) - Report type
- `fromDate` (string, required) - Start date ISO format
- `toDate` (string, required) - End date ISO format
- `format` (string, optional) - Format: pdf, excel, csv

**Permissions:** `reports:generate`
**Confirmation:** Not required
**Risk Level:** Low

### 5. Update Status
Updates status of invoices, expenses, or tasks.

**Format:**
```
[ACTION:update_status params={"entityType":"expense","entityId":"exp_123","status":"approved"}]
```

**Parameters:**
- `entityType` (string, required) - Entity type
- `entityId` (string, required) - Entity ID
- `status` (string, required) - New status
- `reason` (string, optional) - Reason for change

**Permissions:** `invoices:update`, `expenses:update`
**Confirmation:** Not required
**Risk Level:** Low

## Usage

### From AI Assistant

The AI assistant can include action tags in responses:

```
User: "Create an invoice for Contoso Ltd for €500"

AI Response: "I'll create that invoice for you.

[ACTION:create_invoice params={"customerName":"Contoso Ltd","amount":500,"currency":"EUR","description":"Services rendered"}]

Please confirm: Create invoice for Contoso Ltd, €500.00 EUR?"

User: "Yes, confirm"

AI: "Done! Invoice INV-2024-042 created."
```

### Programmatic Usage

```typescript
import { ActionExecutorService } from './actions';

// Parse action from AI response
const intent = actionExecutor.parseActionIntent(aiResponse);

// Execute action
const result = await actionExecutor.executeAction(
  intent,
  {
    userId: 'user_123',
    organizationId: 'org_456',
    conversationId: 'conv_789',
    permissions: ['invoices:create'],
  },
  'message_id',
);

// Handle result
if (result.success) {
  console.log('Action completed:', result.message);
} else {
  console.error('Action failed:', result.error);
}
```

## Security

### Permission System
Each action requires specific permissions:
- Actions are validated against user's role permissions
- Organization scope is enforced
- Audit logs track all executions

### Rate Limiting
- 10 actions per hour per user
- 50 actions per day per user
- Higher risk actions have stricter limits

### Confirmation Flow
High-risk actions require user confirmation:
1. Action intent detected
2. Pending action stored (expires in 5 minutes)
3. User must explicitly confirm
4. Action executed after confirmation

## Adding New Actions

### 1. Add Action Type

```typescript
// action.types.ts
export enum ActionType {
  // ... existing types
  NEW_ACTION = 'new_action',
}
```

### 2. Create Handler

```typescript
// handlers/new-action.handler.ts
import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';

@Injectable()
export class NewActionHandler extends BaseActionHandler {
  constructor(private someService: SomeService) {
    super('NewActionHandler');
  }

  get actionType(): ActionType {
    return ActionType.NEW_ACTION;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'paramName',
        type: 'string',
        required: true,
        description: 'Parameter description',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    // Implementation
    return this.success('Action completed', entityId, 'EntityType');
  }
}
```

### 3. Register Handler

```typescript
// action-executor.service.ts
constructor(
  // ... existing services
  private newActionHandler: NewActionHandler,
) {
  this.registerHandlers();
}

private registerHandlers(): void {
  // ... existing registrations
  this.handlers.set(ActionType.NEW_ACTION, this.newActionHandler);
}
```

### 4. Update Module

```typescript
// chatbot.module.ts
import { NewActionHandler } from './actions/handlers/new-action.handler';

@Module({
  providers: [
    // ... existing providers
    NewActionHandler,
  ],
})
```

### 5. Update System Prompt

Add action documentation to `prompts/system-prompt.ts`.

## Monitoring

### Action Logs

All actions are logged to `MessageActionLog` table:
- Action type
- Parameters
- Result/error
- User and organization
- Timestamps

### Statistics

```typescript
const stats = await actionExecutor.getStatistics(userId, orgId);
// {
//   total: 42,
//   successful: 38,
//   failed: 4,
//   byType: { create_invoice: 12, create_expense: 30 }
// }
```

## Error Handling

Actions can fail for various reasons:
- Permission denied
- Validation errors
- Rate limit exceeded
- Service errors

All errors are:
1. Logged with details
2. Returned in `ActionResult`
3. Recorded in audit log
4. Communicated to user

## Testing

```typescript
describe('ActionExecutorService', () => {
  it('should parse action intent', () => {
    const response = 'Sure! [ACTION:create_invoice params={"amount":500}]';
    const intent = service.parseActionIntent(response);
    expect(intent.type).toBe(ActionType.CREATE_INVOICE);
  });

  it('should require confirmation for invoices', async () => {
    const result = await service.executeAction(intent, context, msgId);
    expect(result.data.requiresConfirmation).toBe(true);
  });
});
```

## Future Enhancements

- [ ] Redis-backed pending actions store
- [ ] Webhook notifications for action completion
- [ ] Batch action execution
- [ ] Action scheduling/delay
- [ ] Rollback/undo capabilities
- [ ] Action templates/presets
- [ ] Multi-step action workflows
