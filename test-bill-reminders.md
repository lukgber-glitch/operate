# Bill Payment Reminders - Implementation Test Plan

## Implementation Summary

### Files Created

1. **`apps/api/src/modules/finance/bills/jobs/bill-reminder.processor.ts`**
   - Handles checking bills due in 7, 3, and 1 days
   - Creates in-app notifications with appropriate priority levels
   - Processes both automated daily checks and manual reminders

2. **`apps/api/src/modules/finance/bills/jobs/bill-overdue.processor.ts`**
   - Marks bills as OVERDUE when past due date
   - Creates urgent priority notifications
   - Handles both automated daily checks and manual overdue marking

3. **`apps/api/src/modules/finance/bills/jobs/bill-reminder.scheduler.ts`**
   - Schedules daily jobs at 1:00 AM (overdue check) and 9:00 AM (due soon check)
   - Uses Europe/Berlin timezone
   - Integrates with BullMQ queue system

4. **`apps/api/src/modules/finance/bills/jobs/index.ts`**
   - Exports all job processors and schedulers

5. **`apps/api/src/modules/finance/bills/jobs/README.md`**
   - Comprehensive documentation of the reminder system

### Files Modified

1. **`apps/api/src/modules/finance/bills/bills.module.ts`**
   - Added BullModule configuration for `bill-reminders` queue
   - Added ScheduleModule for cron jobs
   - Imported NotificationsModule
   - Registered processors and scheduler as providers

## Testing Steps

### 1. Verify Module Registration

```bash
# Check that the API starts without errors
cd apps/api
pnpm start:dev

# Look for these logs:
# - "Database connection established"
# - "BullModule registered: bill-reminders"
# - "Scheduler initialized"
```

### 2. Test Database Schema

```bash
# Verify Bill model has required fields
cd packages/database
npx prisma studio

# Check that Bill table has:
# - dueDate field
# - paymentStatus field
# - status field (with OVERDUE enum value)
# - organisationId field
```

### 3. Create Test Bill (Due in 3 Days)

```bash
# Using API or Prisma Studio
curl -X POST http://localhost:3000/api/v1/bills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "vendorName": "Test Vendor",
    "amount": 1000,
    "currency": "EUR",
    "issueDate": "2024-01-10",
    "dueDate": "2024-01-13",  # 3 days from now
    "status": "APPROVED",
    "paymentStatus": "PENDING"
  }'
```

### 4. Manually Trigger Reminder Check

```typescript
// Add a test endpoint in bills.controller.ts or use Bull Board

@Post('test-reminders')
async testReminders(@Req() req) {
  await this.billReminderQueue.add('check-due-bills', {});
  return { message: 'Reminder check queued' };
}
```

### 5. Verify Notification Created

```bash
# Check notifications table
curl http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should see:
# - type: "deadline"
# - title: "Bill Payment Due In 3 Days"
# - priority: 4 (HIGH)
# - data.billId matches the test bill
# - data.link: "/bills/{billId}"
```

### 6. Test Overdue Bill

```bash
# Create a bill with due date in the past
curl -X POST http://localhost:3000/api/v1/bills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "vendorName": "Overdue Vendor",
    "amount": 500,
    "currency": "EUR",
    "issueDate": "2024-01-01",
    "dueDate": "2024-01-05",  # Past date
    "status": "APPROVED",
    "paymentStatus": "PENDING"
  }'

# Manually trigger overdue check
curl -X POST http://localhost:3000/api/v1/bills/test-overdue \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify:
# 1. Bill status changed to OVERDUE
# 2. Notification created with priority: 5 (URGENT)
# 3. Notification title: "Bill Payment Overdue"
```

### 7. Test Scheduled Jobs

```bash
# Check Bull queue dashboard (if installed)
# Or check logs at scheduled times:

# 1:00 AM Europe/Berlin - should see:
# "Starting scheduled overdue bills check"
# "Queued check-overdue-bills job"

# 9:00 AM Europe/Berlin - should see:
# "Starting scheduled bill reminder check"
# "Queued check-due-bills job"
```

## Expected Behavior

### Reminder Priorities

| Days Until Due | Priority Level | Notification Title |
|----------------|----------------|-------------------|
| 7 days | 3 (MEDIUM) | "Bill Payment Due In 7 Days" |
| 3 days | 4 (HIGH) | "Bill Payment Due In 3 Days" |
| 1 day | 5 (URGENT) | "Bill Payment Due Tomorrow" |
| Overdue | 5 (URGENT) | "Bill Payment Overdue" |

### Notification Data Structure

```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "orgId": "org-uuid",
  "type": "deadline",
  "title": "Bill Payment Due In 3 Days",
  "message": "Bill from Acme Corp (€1,234.56) is due in 3 days",
  "priority": 4,
  "status": "UNREAD",
  "data": {
    "billId": "bill-uuid",
    "vendorName": "Acme Corp",
    "amount": 1234.56,
    "currency": "EUR",
    "dueDate": "2024-01-15T00:00:00.000Z",
    "daysUntilDue": 3,
    "billNumber": "INV-001",
    "link": "/bills/bill-uuid"
  },
  "createdAt": "2024-01-12T09:00:00.000Z"
}
```

### Overdue Bill Data Structure

```json
{
  "data": {
    "billId": "bill-uuid",
    "vendorName": "Acme Corp",
    "amount": 1234.56,
    "currency": "EUR",
    "dueDate": "2024-01-10T00:00:00.000Z",
    "daysOverdue": 2,
    "billNumber": "INV-001",
    "link": "/bills/bill-uuid",
    "isOverdue": true
  }
}
```

## Edge Cases Handled

1. **Paid Bills**: Bills with `paymentStatus: COMPLETED` are skipped
2. **Already Overdue**: Bills with `status: OVERDUE` don't get duplicate overdue notifications
3. **Multiple Users**: All organization members receive notifications
4. **Partial Payments**: Amount remaining is calculated correctly
5. **Date Precision**: Uses midnight (00:00:00) for date comparisons

## Integration Points

### With Existing Systems

1. **BillsService**: Uses existing `getDueSoon()` and `batchMarkOverdue()` methods
2. **NotificationsService**: Creates in-app notifications
3. **BullMQ**: Queue system for background jobs
4. **NestJS Schedule**: Cron job scheduling

### Database Models Used

- `Bill` - The bills to check
- `Vendor` - For vendor name in notifications
- `Membership` - To find users in organization
- `Notification` - To create reminders

## Performance Considerations

1. **Batch Processing**: Processes all organizations in one job
2. **Query Optimization**: Uses date range queries with indexes
3. **Error Handling**: Failed notifications don't stop processing
4. **Queue Retries**: 3 attempts with exponential backoff
5. **Job Cleanup**: Completed jobs are removed automatically

## Next Steps

1. Add Bull Board for queue monitoring (optional)
2. Add metrics/analytics for reminder effectiveness
3. Consider rate limiting for large organizations
4. Add user preferences for notification types
5. Implement email notifications as backup (optional)
6. Add tests for edge cases

## Acceptance Criteria Verification

- [x] Bills due in 7 days trigger notification (MEDIUM priority)
- [x] Bills due in 3 days trigger notification (HIGH priority)
- [x] Bills due in 1 day trigger urgent notification (URGENT priority)
- [x] Overdue bills marked and alerted (URGENT priority)
- [x] Notifications link to bill (`/bills/{billId}`)
- [x] Includes amount and vendor name in message
- [x] Uses existing NotificationsService
- [x] Scheduled jobs run daily
- [x] In-app notifications only (not emails to vendors)
