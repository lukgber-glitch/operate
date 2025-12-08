# Proactive Suggestion Scheduler

**Task:** UX-005 - Build proactive suggestion scheduler

**Status:** ✅ Complete

## Overview

The Proactive Suggestion Scheduler is a comprehensive system that automatically generates actionable suggestions for users based on their business data. The system runs daily and proactively identifies items requiring attention, reducing the need for users to manually check for issues.

## Architecture

### Location
- **Main Implementation:** `apps/api/src/modules/chatbot/suggestions/`
- **Types:** `apps/api/src/modules/ai/proactive/proactive-suggestion.types.ts`
- **Database Model:** `packages/database/prisma/schema.prisma` (Suggestion model)

### Components

#### 1. ProactiveSuggestionsService
**Path:** `chatbot/suggestions/proactive-suggestions.service.ts`

Main orchestrator that:
- Coordinates all suggestion generators
- Caches suggestions for 5 minutes
- Provides API for retrieving suggestions by context
- Manages insights, reminders, and optimizations

#### 2. ProactiveScheduler
**Path:** `chatbot/suggestions/proactive.scheduler.ts`

Cron-based scheduler that:
- Runs daily at 8:00 AM Europe/Berlin timezone
- Processes organizations in batches of 10
- Generates all suggestion types
- Stores suggestions in database
- Sends notifications for high-priority items
- Includes tax deadline reminders and cash flow alerts

#### 3. Suggestion Generators

All generators extend `BaseSuggestionGenerator` and implement the `SuggestionGenerator` interface.

##### InvoiceSuggestionsGenerator
**Path:** `generators/invoice-suggestions.generator.ts`

Generates:
- Overdue invoice warnings
- Draft invoice reminders
- Invoices due soon alerts
- Revenue insights and trends

##### ExpenseSuggestionsGenerator
**Path:** `generators/expense-suggestions.generator.ts`

Generates:
- Expense approval reminders
- Expense categorization suggestions
- Spending insights

##### TaxSuggestionsGenerator
**Path:** `generators/tax-suggestions.generator.ts`

Generates:
- Tax filing deadline reminders
- VAT return alerts
- Tax compliance suggestions

##### HRSuggestionsGenerator
**Path:** `generators/hr-suggestions.generator.ts`

Generates:
- Leave request approvals
- Payroll reminders
- Employee document expiries

##### BillsSuggestionsGenerator (NEW)
**Path:** `generators/bills-suggestions.generator.ts`

Generates:
- **Overdue bills:** Bills past their due date with vendor details
- **Bills due in 7 days:** Proactive payment reminders
- **Bills pending approval:** Draft bills needing review
- **Duplicate detection:** Potential duplicate bills from same vendor

##### BankReconciliationSuggestionsGenerator (NEW)
**Path:** `generators/bank-reconciliation-suggestions.generator.ts`

Generates:
- **Unreconciled transactions:** Transactions from last 30 days needing reconciliation
- **Uncategorized transactions:** Transactions missing categories
- **Unmatched transactions:** Transactions that could match invoices/bills
- **Bank connection health:** Status of bank sync connections

## Suggestion Types

### Core Types

1. **PAYMENT_DUE**
   - Bills due in next 7 days
   - Priority: HIGH
   - Action: Navigate to bills or pay immediately

2. **OVERDUE_INVOICE**
   - Invoices past due date
   - Priority: HIGH
   - Action: Send reminders to customers

3. **LOW_CASH**
   - Cash balance below threshold
   - Priority: CRITICAL/HIGH
   - Action: View cash flow analysis

4. **TAX_DEADLINE**
   - Upcoming tax filing dates
   - Priority: varies by urgency (1-14 days)
   - Action: Open tax wizard or view preview

5. **UNRECONCILED**
   - Bank transactions needing review
   - Priority: MEDIUM/HIGH
   - Action: Navigate to reconciliation view

6. **UNCATEGORIZED**
   - Transactions missing categories
   - Priority: MEDIUM
   - Action: Navigate to categorization view

### Priority Levels

- **HIGH:** Requires immediate attention (overdue items, critical deadlines)
- **MEDIUM:** Should be addressed soon (items due in 7 days, pending approvals)
- **LOW:** Nice to have (tips, optimizations, insights)

## Database Schema

### Suggestion Model

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
  actionLabel String?

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

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orgId, status])
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

enum SuggestionPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum SuggestionStatus {
  PENDING
  VIEWED
  ACTED
  DISMISSED
  EXPIRED
}
```

## Scheduler Configuration

### Cron Schedule
```typescript
@Cron('0 8 * * *', {
  timeZone: 'Europe/Berlin',
})
```

Runs every day at 8:00 AM Central European Time.

### Batch Processing
- Processes 10 organizations at a time
- 1 second delay between batches to avoid system overload

### Deduplication
- Checks for similar suggestions created in last 24 hours
- Prevents duplicate notifications

## Notification System

### High-Priority Notifications

Suggestions with `HIGH` or `URGENT` priority automatically trigger notifications to:
- Organization owners
- Admin users

### Notification Types
- **SUGGESTION:** General suggestion notification
- **TAX_REMINDER:** Tax deadline notifications
- **CASH_FLOW_ALERT:** Critical cash flow alerts

### Escalation Rules

**Tax Deadlines:**
- 1 day before: Push notification
- 3 days before: Email notification
- 7 days before: In-app suggestion only

**Cash Flow:**
- Critical (runway < 1 month): Push notification
- Warning (runway < 3 months): In-app suggestion

## API Endpoints

### Get Suggestions for Context
```
GET /api/chat/suggestions?page=dashboard
```

Returns suggestions relevant to current page/context.

### Get Insights
```
GET /api/chat/suggestions/insights
```

Returns business insights across all generators.

### Get Deadline Reminders
```
GET /api/chat/suggestions/reminders
```

Returns all upcoming deadline reminders.

### Get Optimizations
```
GET /api/chat/suggestions/optimizations
```

Returns optimization suggestions.

### Manual Trigger (Testing)
```
POST /api/chat/suggestions/trigger
```

Manually triggers the proactive scheduler (for testing/debugging).

## Integration with Chat UI

Suggestions are displayed in the chat interface as:
- **Greeting cards:** Show top 3-5 suggestions when chat opens
- **Proactive prompts:** Appear during conversations when relevant
- **Quick actions:** One-click buttons to execute suggested actions

## Performance Considerations

### Caching
- 5-minute cache for context-based suggestions
- 10-minute cache for insights
- 1-hour cache for reminders
- 30-minute cache for optimizations

### Query Optimization
- Indexed on `orgId`, `status`, `priority`, `type`
- Compound index on `[orgId, status]` for fast filtering
- Limited to last 30 days for most queries

### Batch Processing
- Organizations processed in batches of 10
- Prevents memory exhaustion on large datasets
- Small delays between batches to reduce load spikes

## Testing

### Manual Trigger
```bash
curl -X POST http://localhost:3001/api/chat/suggestions/trigger
```

### Check Logs
```bash
# View scheduler logs
tail -f apps/api/logs/proactive-scheduler.log

# Check for errors
grep "ERROR" apps/api/logs/proactive-scheduler.log
```

### Database Queries
```sql
-- Check created suggestions
SELECT type, priority, title, createdAt
FROM "Suggestion"
WHERE "orgId" = 'your-org-id'
ORDER BY "createdAt" DESC
LIMIT 20;

-- Check suggestion counts by type
SELECT type, COUNT(*)
FROM "Suggestion"
WHERE "orgId" = 'your-org-id'
GROUP BY type;
```

## Future Enhancements

### Potential Additions
1. **Machine Learning:** Learn from user dismissals to improve relevance
2. **User Preferences:** Allow users to configure suggestion frequency/types
3. **Smart Timing:** Send suggestions at optimal times based on user activity
4. **Cross-Entity Insights:** Correlate data across multiple entities for deeper insights
5. **Predictive Suggestions:** Forecast issues before they occur

### Additional Generators
- **Compliance Suggestions:** Regulatory deadlines and requirements
- **Customer Followup:** Inactive customers needing attention
- **Vendor Negotiation:** Contract renewals and price optimization
- **Document Expiry:** Certificates, licenses, contracts expiring soon

## Dependencies

- `@nestjs/schedule`: Cron scheduling
- `@nestjs/common`: NestJS core
- `@prisma/client`: Database access
- `date-fns`: Date manipulation
- Redis (via `RedisService`): Caching
- `NotificationsService`: Push notifications
- `TaxCalendarService`: Tax deadline data
- `VatService`: VAT calculations
- `CashFlowPredictorService`: Cash flow forecasting

## Monitoring

### Metrics to Track
- Suggestions generated per day
- Notification sent per day
- Suggestion dismissal rate
- Actions taken from suggestions
- Generator performance (execution time)
- Cache hit rate

### Health Checks
- Scheduler running status
- Last successful run timestamp
- Error count and types
- Average batch processing time

## Support

For issues or questions:
1. Check logs in `apps/api/logs/`
2. Review database for persisted suggestions
3. Test individual generators in isolation
4. Use manual trigger endpoint for debugging
5. Check cron schedule configuration

## Summary

The Proactive Suggestion Scheduler successfully implements UX-005 requirements:

✅ Daily scheduler running at 8 AM
✅ Bills due date detection (7 days)
✅ Invoice payment reminders
✅ Tax deadline alerts
✅ Cash flow alerts
✅ Bank reconciliation suggestions
✅ Prioritized suggestion system
✅ Action handlers for suggestions
✅ Database storage and caching
✅ Notification system integration
✅ 6 active generators (Invoice, Expense, Tax, HR, Bills, Bank)

The system is production-ready and extensible for future enhancement.
