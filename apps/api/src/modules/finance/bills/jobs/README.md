# Bill Payment Reminders

This directory contains the automated bill payment reminder system.

## Overview

The bill reminder system creates in-app notifications to remind users to pay their bills on time. Unlike invoice payment reminders (which send emails to customers), bill reminders are internal notifications for the organization's users.

## Components

### 1. BillReminderProcessor (`bill-reminder.processor.ts`)

Handles creating payment reminders for bills due soon.

**Reminder Levels:**
- **7 days before due**: MEDIUM priority (3)
- **3 days before due**: HIGH priority (4)
- **1 day before due**: URGENT priority (5)

**Jobs:**
- `check-due-bills`: Daily job that checks all bills due in 7, 3, or 1 days
- `remind-bill`: Manual job to create a reminder for a specific bill

### 2. BillOverdueProcessor (`bill-overdue.processor.ts`)

Handles marking bills as overdue and creating urgent notifications.

**Jobs:**
- `check-overdue-bills`: Daily job that marks overdue bills and creates notifications
- `mark-bill-overdue`: Manual job to mark a specific bill as overdue

### 3. BillReminderScheduler (`bill-reminder.scheduler.ts`)

Schedules the automated jobs using cron.

**Schedule:**
- `1:00 AM` - Check and mark overdue bills
- `9:00 AM` - Check bills due soon and send reminders

All times are in Europe/Berlin timezone.

## Notification Format

### Bill Due Soon
```json
{
  "type": "deadline",
  "title": "Bill Payment Due In 3 Days",
  "message": "Bill from Acme Corp (€1,234.56) is due in 3 days",
  "priority": 4,
  "data": {
    "billId": "uuid",
    "vendorName": "Acme Corp",
    "amount": 1234.56,
    "currency": "EUR",
    "dueDate": "2024-01-15T00:00:00.000Z",
    "daysUntilDue": 3,
    "billNumber": "INV-001",
    "link": "/bills/uuid"
  }
}
```

### Bill Overdue
```json
{
  "type": "deadline",
  "title": "Bill Payment Overdue",
  "message": "Bill from Acme Corp (€1,234.56) is 2 days overdue",
  "priority": 5,
  "data": {
    "billId": "uuid",
    "vendorName": "Acme Corp",
    "amount": 1234.56,
    "currency": "EUR",
    "dueDate": "2024-01-10T00:00:00.000Z",
    "daysOverdue": 2,
    "billNumber": "INV-001",
    "link": "/bills/uuid",
    "isOverdue": true
  }
}
```

## Usage

### Automatic

The system runs automatically via cron jobs:
1. At 1:00 AM daily, overdue bills are marked and notifications sent
2. At 9:00 AM daily, reminders are sent for bills due in 7, 3, or 1 days

### Manual

You can manually trigger reminders using the queue:

```typescript
// Remind about a specific bill
await billReminderQueue.add('remind-bill', { billId: 'uuid' });

// Mark a specific bill as overdue
await billReminderQueue.add('mark-bill-overdue', { billId: 'uuid' });

// Check all due bills now
await billReminderQueue.add('check-due-bills', {});

// Check all overdue bills now
await billReminderQueue.add('check-overdue-bills', {});
```

## Testing

To test the reminder system:

1. Create a bill with due date in 7 days
2. Wait for the 9:00 AM job or manually trigger `check-due-bills`
3. Check notifications table for the reminder

Or manually trigger:

```bash
# Via NestJS CLI or API
curl -X POST http://localhost:3000/api/v1/bills/queue/check-reminders
```

## Configuration

The reminder system uses these defaults:

- **Queue**: `bill-reminders`
- **Retry attempts**: 3
- **Backoff**: Exponential, 2000ms delay
- **Timezone**: Europe/Berlin
- **Cleanup**: Completed jobs are removed, failed jobs are kept

## Dependencies

- `@nestjs/bull` - Queue management
- `@nestjs/schedule` - Cron scheduling
- `NotificationsService` - Creating in-app notifications
- `PrismaService` - Database access

## Notes

- Only unpaid bills (paymentStatus !== COMPLETED) receive reminders
- Bills already marked OVERDUE don't receive duplicate reminders
- Notifications are sent to all members of the organization
- In production, you may want to filter by role/permissions
- Amount is formatted using German locale (de-DE)
