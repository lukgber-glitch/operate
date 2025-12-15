# AI Autopilot Mode Module

The AI Autopilot Mode automatically handles routine bookkeeping tasks with AI assistance, saving time and reducing manual work.

## Features

- **Automatic Transaction Categorization**: AI categorizes bank transactions
- **Invoice Creation**: Detects completed work and suggests invoice creation
- **Payment Reminders**: Automatically sends reminders for overdue invoices
- **Transaction Reconciliation**: Matches bank transactions with invoices/expenses
- **Receipt Extraction**: Processes receipts from emails and uploads
- **Bill Payment**: Automatically pays bills (with amount threshold)
- **Expense Filing**: Categorizes and files expenses

## Configuration

Each organization has an `AutopilotConfig` with:

- **enabled**: Master toggle for autopilot
- **Feature toggles**: Enable/disable specific features
- **confidenceThreshold**: Minimum AI confidence (0-100) for auto-action
- **maxAutoAmount**: Maximum amount for auto-payment
- **dailySummaryEnabled**: Enable/disable daily summary emails
- **dailySummaryTime**: Time to send daily summaries (HH:mm format)

## Endpoints

### Configuration
- `GET /autopilot/config` - Get configuration
- `PATCH /autopilot/config` - Update configuration
- `POST /autopilot/enable` - Enable autopilot
- `POST /autopilot/disable` - Disable autopilot

### Actions
- `GET /autopilot/actions` - List actions (with filters)
- `GET /autopilot/actions/pending` - Get pending approval actions
- `POST /autopilot/actions/:id/approve` - Approve action
- `POST /autopilot/actions/:id/reject` - Reject action

### Summaries
- `GET /autopilot/summary/today` - Today's summary
- `GET /autopilot/summary/:date` - Summary for specific date
- `GET /autopilot/summary/weekly` - Weekly summary

### Stats
- `GET /autopilot/stats` - Dashboard stats

## Action Lifecycle

1. **Detection**: Cron jobs detect opportunities (e.g., uncategorized transactions)
2. **Creation**: System creates `AutopilotAction` with confidence score
3. **Approval**:
   - High confidence (>= threshold): Auto-approved
   - Low confidence: Requires manual approval
4. **Execution**: Approved actions are executed by cron job
5. **Tracking**: Results tracked in daily/weekly summaries

## Action Types

- `CATEGORIZE_TRANSACTION` - Categorize a bank transaction
- `CREATE_INVOICE` - Create an invoice for completed work
- `SEND_REMINDER` - Send payment reminder for overdue invoice
- `RECONCILE_TRANSACTION` - Reconcile bank transaction with invoice/expense
- `EXTRACT_RECEIPT` - Extract data from receipt
- `PAY_BILL` - Pay a bill automatically
- `FILE_EXPENSE` - File and categorize an expense
- `CREATE_CLIENT` - Create new client record
- `MATCH_PAYMENT` - Match payment to invoice

## Action Status

- `PENDING` - Awaiting approval
- `APPROVED` - Approved, awaiting execution
- `EXECUTED` - Successfully executed
- `REJECTED` - Rejected by user
- `FAILED` - Execution failed

## Time Saved Calculation

Each action type has an estimated time saved (in minutes):

```typescript
CATEGORIZE_TRANSACTION: 1 min
CREATE_INVOICE: 5 min
SEND_REMINDER: 2 min
RECONCILE_TRANSACTION: 3 min
EXTRACT_RECEIPT: 4 min
PAY_BILL: 3 min
FILE_EXPENSE: 2 min
CREATE_CLIENT: 4 min
MATCH_PAYMENT: 2 min
```

## Cron Jobs

### Detection Tasks (Every 15 minutes)
- Detect categorizable transactions
- Detect invoice opportunities
- Detect overdue invoices
- Detect reconciliation matches
- Detect unprocessed receipts
- Detect payable bills

### Action Execution (Every hour)
- Execute all approved actions

### Daily Summaries (Hourly check)
- Generate daily summaries at configured time
- Send summary emails to organization admins

### Cleanup (Daily at midnight)
- Delete actions older than 90 days

## Integration Points

The autopilot module will integrate with:

- **AI/Classification Service**: For transaction categorization
- **Invoice Module**: For invoice creation and reminders
- **Banking Module**: For transaction reconciliation
- **Email Module**: For receipt extraction and summary emails
- **Bill Payment Module**: For automatic bill payment
- **Expense Module**: For expense filing

## Security

- All actions require authentication (JWT)
- Organization isolation enforced (tenant guard)
- High-value actions require manual approval
- Configurable confidence thresholds
- Audit trail for all actions

## Future Enhancements

- Machine learning from approval/rejection patterns
- Custom automation rules per organization
- Integration with accounting software
- Advanced pattern detection
- Predictive cash flow analysis
- Smart payment scheduling
