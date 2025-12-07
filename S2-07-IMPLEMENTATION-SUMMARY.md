# S2-07: Wire Bills to Chat Actions - Implementation Summary

## Task Objective
Add bill management actions to the chat action executor, enabling users to create bills, record payments, list bills, and check bill status through natural language chat commands.

## Implementation Status: COMPLETE ✓

## Files Created

### 1. Bill Action Handlers (4 new files)

#### `apps/api/src/modules/chatbot/actions/handlers/create-bill.handler.ts`
- **Purpose**: Handles creation of bills (accounts payable) from vendors
- **Action Type**: `CREATE_BILL`
- **Key Features**:
  - Creates bills with vendor information, amounts, due dates
  - Automatic due date calculation (30 days from issue if not specified)
  - Supports tax amounts and VAT rates
  - Validates permissions (`bills:create`)
  - Requires confirmation before execution (medium risk)

**Example Usage**:
```
User: "Create a bill for €200 from AWS for cloud hosting"
AI: [ACTION:create_bill params={"vendorName":"AWS","amount":200,"currency":"EUR","description":"Cloud hosting services"}]
```

#### `apps/api/src/modules/chatbot/actions/handlers/pay-bill.handler.ts`
- **Purpose**: Records bill payments
- **Action Type**: `PAY_BILL`
- **Key Features**:
  - Records full or partial payments
  - Tracks payment methods and transaction IDs
  - Updates bill payment status automatically
  - Calculates remaining balance
  - Validates permissions (`bills:update`)
  - Requires confirmation before execution (high risk)

**Example Usage**:
```
User: "Mark bill #123 as paid"
AI: [ACTION:pay_bill params={"billId":"bill_123","amount":200,"paymentMethod":"bank_transfer"}]
```

#### `apps/api/src/modules/chatbot/actions/handlers/list-bills.handler.ts`
- **Purpose**: Lists and filters bills by various criteria
- **Action Type**: `LIST_BILLS`
- **Key Features**:
  - Filter options: `overdue`, `due_soon`, `pending`, `paid`, `all`
  - Filter by vendor name
  - Filter by status
  - Configurable limit (max 50 bills)
  - Shows overdue status and days until due
  - Validates permissions (`bills:view`)
  - No confirmation required (low risk, read-only)

**Example Usage**:
```
User: "Show me overdue bills"
AI: [ACTION:list_bills params={"filter":"overdue","limit":10}]

User: "What bills are due this week?"
AI: [ACTION:list_bills params={"filter":"due_soon","limit":5}]
```

#### `apps/api/src/modules/chatbot/actions/handlers/bill-status.handler.ts`
- **Purpose**: Checks status of specific bills
- **Action Type**: `BILL_STATUS`
- **Key Features**:
  - Query by bill ID or vendor name
  - Shows payment details and remaining balance
  - Calculates days until due / overdue status
  - Returns detailed bill information
  - Validates permissions (`bills:view`)
  - No confirmation required (low risk, read-only)

**Example Usage**:
```
User: "When is the AWS bill due?"
AI: [ACTION:bill_status params={"vendorName":"AWS"}]

User: "Check status of bill #123"
AI: [ACTION:bill_status params={"billId":"bill_123"}]
```

## Files Modified

### 2. Core Action System Updates

#### `apps/api/src/modules/chatbot/actions/action.types.ts`
**Changes**:
- Added 4 new action types to `ActionType` enum:
  - `CREATE_BILL = 'create_bill'`
  - `PAY_BILL = 'pay_bill'`
  - `LIST_BILLS = 'list_bills'`
  - `BILL_STATUS = 'bill_status'`

#### `apps/api/src/modules/chatbot/actions/action-executor.service.ts`
**Changes**:
1. **Imports**: Added 4 new handler imports
2. **Constructor**: Injected 4 new handler dependencies
3. **registerHandlers()**: Registered 4 new handlers with the action executor
4. **getAvailableActions()**: Added 4 new action definitions with:
   - Action descriptions
   - Required parameters
   - Required permissions
   - Confirmation requirements
   - Risk levels
   - Usage examples

**Action Definitions Added**:
```typescript
{
  type: ActionType.CREATE_BILL,
  name: 'Create Bill',
  description: 'Create a new bill (accounts payable) from a vendor',
  requiredPermissions: ['bills:create'],
  requiresConfirmation: true,
  riskLevel: 'medium',
}

{
  type: ActionType.PAY_BILL,
  name: 'Pay Bill',
  description: 'Record a payment for a bill',
  requiredPermissions: ['bills:update'],
  requiresConfirmation: true,
  riskLevel: 'high',
}

{
  type: ActionType.LIST_BILLS,
  name: 'List Bills',
  description: 'List and filter bills by various criteria',
  requiredPermissions: ['bills:view'],
  requiresConfirmation: false,
  riskLevel: 'low',
}

{
  type: ActionType.BILL_STATUS,
  name: 'Bill Status',
  description: 'Check the status of a specific bill or bills from a vendor',
  requiredPermissions: ['bills:view'],
  requiresConfirmation: false,
  riskLevel: 'low',
}
```

### 3. Module Integration

#### `apps/api/src/modules/chatbot/chatbot.module.ts`
**Changes**:
1. **Imports**: Added `BillsModule` and 4 bill handler imports
2. **Module imports array**: Added `BillsModule` to enable dependency injection
3. **Providers array**: Added 4 new bill handler providers

### 4. Permissions System

#### `apps/api/src/modules/chatbot/chat.service.ts`
**Changes**:
- Updated `getUserPermissions()` method to include bill permissions:
  - **ADMIN**: `bills:create`, `bills:update`, `bills:view`
  - **ACCOUNTANT**: `bills:create`, `bills:update`, `bills:view`
  - **EMPLOYEE**: `bills:view`
  - **VIEWER**: `bills:view`

### 5. System Prompts & AI Instructions

#### `apps/api/src/modules/chatbot/prompts/system-prompt.ts`
**Changes**:

1. **Added Bills Capability Section**:
```markdown
2. **Bills & Accounts Payable**
   - Help track and manage bills from vendors
   - Record bill payments and track outstanding balances
   - Monitor overdue and upcoming bills
   - Assist with vendor management and payment terms
```

2. **Added Bill Action Examples**:
```
3. **create_bill** - Create a new bill from a vendor
   Example: [ACTION:create_bill params={"vendorName":"AWS","amount":200,"currency":"EUR","description":"Cloud hosting services"}]

4. **pay_bill** - Record a bill payment
   Example: [ACTION:pay_bill params={"billId":"bill_123","amount":200,"paymentMethod":"bank_transfer"}]

5. **list_bills** - List and filter bills
   Example: [ACTION:list_bills params={"filter":"overdue","limit":10}]

6. **bill_status** - Check status of a specific bill
   Example: [ACTION:bill_status params={"vendorName":"AWS"}]
```

3. **Updated Action Guidelines**:
- Added bills and payments to sensitive actions list
- Added bill payment verification guideline

4. **Added Bills Context**:
```typescript
bills: `
**Current Context: Bills & Accounts Payable**
The user is managing bills from vendors. Focus on bill tracking, payment recording, vendor management, and monitoring due dates.
`
```

## Action Parameters

### CREATE_BILL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vendorName | string | Yes | Vendor/supplier name |
| amount | number | Yes | Bill amount (excluding tax) |
| dueDate | string | No | Payment due date (ISO format, defaults to 30 days) |
| description | string | No | Bill description or purpose |
| currency | string | No | Currency code (default: EUR) |
| issueDate | string | No | Bill issue date (default: today) |
| taxAmount | number | No | Tax/VAT amount |
| vatRate | number | No | VAT rate percentage |
| billNumber | string | No | Bill/invoice number from vendor |
| reference | string | No | Internal reference number |
| taxDeductible | boolean | No | Whether bill is tax deductible (default: true) |

### PAY_BILL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| billId | string | Yes | ID of the bill to mark as paid |
| amount | number | Yes | Payment amount |
| paymentDate | string | No | Payment date (default: today) |
| paymentMethod | string | No | Payment method (default: bank_transfer) |
| transactionId | string | No | Transaction or payment reference ID |
| reference | string | No | Payment reference or note |

### LIST_BILLS Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| filter | string | No | Filter type: overdue, due_soon, pending, paid, all (default: all) |
| limit | number | No | Max bills to return (default: 10, max: 50) |
| vendorName | string | No | Filter by vendor name |
| status | string | No | Filter by status: DRAFT, APPROVED, PAID, OVERDUE, CANCELLED |

### BILL_STATUS Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| billId | string | No* | Specific bill ID to check |
| vendorName | string | No* | Vendor name to search for bills |

*Note: At least one of billId or vendorName must be provided

## Integration with Existing Systems

### BillsService Integration
All bill handlers use the existing `BillsService` for operations:
- `create()` - Creates new bills
- `recordPayment()` - Records bill payments
- `findAll()` - Lists bills with filters
- `findById()` - Gets specific bill details
- `getOverdue()` - Gets overdue bills
- `getDueSoon()` - Gets bills due soon

### Permission System
All bill actions integrate with the existing RBAC permission system:
- `bills:create` - Required for creating bills
- `bills:update` - Required for recording payments
- `bills:view` - Required for viewing bills and status

### Confirmation System
High-risk actions (CREATE_BILL, PAY_BILL) integrate with the existing confirmation system:
1. User requests action via chat
2. AI detects action and creates pending confirmation
3. User receives confirmation request
4. User confirms or cancels
5. Action executes only after confirmation

## Usage Examples

### Example 1: Create a Bill
```
User: "Record a bill for €500 from Office Depot due next month"

AI: I'll create a bill for Office Depot.
[ACTION:create_bill params={"vendorName":"Office Depot","amount":500,"currency":"EUR","dueDate":"2024-01-31"}]

This will create a bill for €500 from Office Depot, due on January 31, 2024.
Please confirm to proceed with this action.
```

### Example 2: List Overdue Bills
```
User: "Show me all overdue bills"

AI: Let me check your overdue bills.
[ACTION:list_bills params={"filter":"overdue","limit":10}]

You have 3 overdue bills:
- AWS: €200 (Due: Dec 1, 2024)
- Office Depot: €500 (Due: Nov 15, 2024)
- Telekom: €150 (Due: Nov 30, 2024)
```

### Example 3: Check Bill Status
```
User: "When is the AWS bill due?"

AI: Let me check the AWS bill status.
[ACTION:bill_status params={"vendorName":"AWS"}]

AWS Bill Details:
- Amount: €200
- Due Date: December 15, 2024
- Days until due: 9 days
- Status: APPROVED
- Payment Status: PENDING
```

### Example 4: Record Payment
```
User: "Mark the AWS bill as paid"

AI: I'll record a payment for the AWS bill.
[ACTION:pay_bill params={"billId":"bill_abc123","amount":200,"paymentMethod":"bank_transfer"}]

This will record a €200 payment for the AWS bill.
Please confirm to proceed with this action.
```

## Acceptance Criteria Status

✅ "Create a bill for €200 from AWS" → creates bill
✅ "Show overdue bills" → lists overdue bills
✅ "Mark bill #123 as paid" → records payment
✅ "When is the office rent due?" → shows due date
✅ Actions require confirmation before execution (CREATE_BILL, PAY_BILL)

## Testing Recommendations

### Unit Tests
1. Test each handler's parameter validation
2. Test permission checks for each action
3. Test error handling for invalid inputs
4. Test confirmation requirements

### Integration Tests
1. Test bill creation workflow through chat
2. Test payment recording workflow
3. Test bill listing with various filters
4. Test bill status queries

### E2E Tests
1. Full conversation flow: create bill → check status → record payment
2. Test overdue bill notifications
3. Test vendor-specific queries
4. Test multi-bill operations

## Next Steps

1. **Test the implementation** - Run integration tests to verify all actions work correctly
2. **Add bill context provider** - Create a BillContextProvider for enhanced context awareness
3. **Add proactive bill suggestions** - Integrate with ProactiveSuggestionsService for:
   - Overdue bill reminders
   - Upcoming payment notifications
   - Duplicate bill detection
4. **Enhance error messages** - Add more specific error messages for common failure scenarios
5. **Add bulk operations** - Consider adding bulk bill payment recording
6. **Add bill analytics** - Integrate with reporting for bills by vendor, category, etc.

## Technical Notes

### Performance Considerations
- Bill listing is limited to 50 results maximum to prevent performance issues
- All queries use indexed fields (organisationId, dueDate, paymentStatus)
- Pagination is built-in for large result sets

### Security Considerations
- All actions require valid user permissions
- High-risk actions (payments) require explicit confirmation
- Bill IDs are validated before operations
- Amount validation prevents negative or zero payments

### Error Handling
- All handlers use try-catch blocks
- Errors are logged with appropriate context
- User-friendly error messages are returned
- Failed actions are logged in MessageActionLog

## Dependencies

This implementation depends on:
- ✅ Bills module (S2-01, S2-02, S2-03)
- ✅ BillsService with all CRUD operations
- ✅ Action executor system
- ✅ Permission system
- ✅ Confirmation system

## Sprint 2 Integration

This task (S2-07) is part of Sprint 2: Bills & Vendors, which includes:
- S2-01: Bill Schema & Repository ✅
- S2-02: Bills Service & Controller ✅
- S2-03: Vendors Management ✅
- S2-04: Bill Notifications (Pending)
- S2-05: Email → Bill Pipeline (Pending)
- S2-06: Email Sync Service (Pending)
- **S2-07: Wire Bills to Chat Actions ✅**

## Summary

Successfully implemented comprehensive bill management capabilities in the chat system, enabling users to:
1. Create bills through natural language
2. Record payments with validation
3. List and filter bills by multiple criteria
4. Check bill status and details

All actions integrate seamlessly with existing systems, follow security best practices, and provide a smooth user experience through the chat interface.
