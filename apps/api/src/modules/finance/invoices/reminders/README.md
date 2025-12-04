# Payment Reminder System

## Overview

Automated payment reminder and escalation system for overdue invoices. Handles scheduling, sending, and escalating payment reminders based on configurable rules.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Payment Reminder System                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │ Reminder Service │◄────────┤  Escalation      │             │
│  │                  │         │  Service         │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                        │
│           │                            │                        │
│  ┌────────▼─────────┐         ┌────────▼─────────┐             │
│  │ Reminder         │         │  Reminder        │             │
│  │ Processor        │◄────────┤  Scheduler       │             │
│  │ (BullMQ)         │         │  (Cron Jobs)     │             │
│  └──────────────────┘         └──────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. PaymentReminderService
Main service handling reminder CRUD operations.

**Key Methods:**
- `createReminder()` - Create manual reminder
- `scheduleRemindersForInvoice()` - Auto-schedule based on settings
- `sendReminder()` - Send a reminder via email
- `cancelReminder()` - Cancel pending reminder
- `getSettings()` - Get organisation reminder settings
- `updateSettings()` - Update reminder configuration

### 2. ReminderEscalationService
Handles escalation logic and level management.

**Escalation Levels:**
- **Level 1 (Friendly)**: 1-7 days overdue
  - Polite reminder
  - Request for payment

- **Level 2 (Firm)**: 8-21 days overdue
  - Stronger language
  - Warning about consequences
  - Late fees mentioned

- **Level 3 (Final Notice)**: 22+ days overdue
  - Urgent action required
  - Legal action threatened
  - Collection agency mentioned

**Key Methods:**
- `shouldEscalate()` - Check if invoice needs escalation
- `escalate()` - Escalate to next level
- `getEscalationLevel()` - Get current level
- `getEscalationTemplate()` - Get template by level
- `getEscalationStats()` - Statistics dashboard

### 3. ReminderProcessor
BullMQ processor for background jobs.

**Job Types:**
- `send` - Send individual reminder
- `check-overdue` - Check all due reminders
- `check-escalations` - Check invoices for escalation
- `escalate` - Escalate specific invoice
- `schedule-for-invoice` - Schedule reminders for new invoice
- `cancel-for-invoice` - Cancel reminders for paid invoice

### 4. ReminderScheduler
Automated cron jobs.

**Schedules:**
- **9:00 AM Daily** - Check and send due reminders
- **10:00 AM Daily** - Check for escalations
- **Hourly** - Emergency reminder check
- **2:00 AM Sunday** - Cleanup old reminders
- **8:00 AM Monday** - Generate statistics

## API Endpoints

### Reminder Management

#### Get Reminder History
```http
GET /organisations/:orgId/invoices/:invoiceId/reminders
Authorization: Bearer {token}
```

#### Create Manual Reminder
```http
POST /organisations/:orgId/invoices/:invoiceId/reminders
Authorization: Bearer {token}
Content-Type: application/json

{
  "reminderType": "AFTER_DUE",
  "scheduledFor": "2025-12-15T09:00:00Z",
  "subject": "Payment reminder",
  "body": "Dear customer...",
  "escalationLevel": 1
}
```

#### Send Reminder Now
```http
POST /organisations/:orgId/invoices/:invoiceId/reminders/:id/send-now
Authorization: Bearer {token}
```

#### Cancel Reminder
```http
DELETE /organisations/:orgId/invoices/:invoiceId/reminders/:id
Authorization: Bearer {token}
```

#### Schedule Auto Reminders
```http
POST /organisations/:orgId/invoices/:invoiceId/reminders/schedule-auto
Authorization: Bearer {token}
```

### Settings

#### Get Reminder Settings
```http
GET /organisations/:orgId/reminder-settings
Authorization: Bearer {token}
```

#### Update Settings
```http
PATCH /organisations/:orgId/reminder-settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "enableAutoReminders": true,
  "reminderDaysBeforeDue": [7, 3, 1],
  "reminderDaysAfterDue": [1, 7, 14, 30],
  "autoEscalate": true,
  "escalationThresholdDays": 14,
  "maxEscalationLevel": 3,
  "beforeDueTemplate": "Dear {customerName}...",
  "afterDueTemplate": "Dear {customerName}...",
  "escalationTemplate": "Dear {customerName}..."
}
```

### Statistics & Escalation

#### Get Escalation Stats
```http
GET /organisations/:orgId/reminders/escalation-stats
Authorization: Bearer {token}
```

Response:
```json
{
  "level1": 5,
  "level2": 3,
  "level3": 1,
  "totalOverdue": 9
}
```

#### Trigger Manual Escalation Check
```http
POST /organisations/:orgId/reminders/check-escalations
Authorization: Bearer {token}
```

#### Escalate Specific Invoice
```http
POST /organisations/:orgId/invoices/:invoiceId/escalate
Authorization: Bearer {token}
```

## Template Variables

Available in all email templates:

- `{customerName}` - Customer name
- `{invoiceNumber}` - Invoice number
- `{totalAmount}` - Invoice total
- `{currency}` - Currency code
- `{dueDate}` - Due date
- `{daysOverdue}` - Days past due

## Configuration

### Default Settings

```typescript
{
  enableAutoReminders: true,
  reminderDaysBeforeDue: [7, 3, 1], // 7, 3, 1 days before due
  reminderDaysAfterDue: [1, 7, 14, 30], // 1, 7, 14, 30 days after due
  autoEscalate: true,
  escalationThresholdDays: 14,
  maxEscalationLevel: 3
}
```

### Job Queue Configuration

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: true,
  removeOnFail: false
}
```

## Usage Examples

### 1. Auto-schedule reminders for new invoice

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

// In your invoice creation logic
await this.reminderQueue.add('schedule-for-invoice', {
  invoiceId: invoice.id
});
```

### 2. Cancel reminders when invoice is paid

```typescript
// In your payment processing logic
await this.reminderQueue.add('cancel-for-invoice', {
  organisationId: invoice.orgId,
  invoiceId: invoice.id
});
```

### 3. Create custom reminder

```typescript
const reminder = await this.reminderService.createReminder(
  orgId,
  invoiceId,
  {
    reminderType: ReminderType.AFTER_DUE,
    scheduledFor: new Date('2025-12-15T09:00:00Z'),
    subject: 'Custom payment reminder',
    body: 'Dear customer, please pay...',
    escalationLevel: 1
  }
);
```

### 4. Get escalation statistics

```typescript
const stats = await this.escalationService.getEscalationStats(orgId);
// { level1: 5, level2: 3, level3: 1, totalOverdue: 9 }
```

## Database Schema

### PaymentReminder
```prisma
model PaymentReminder {
  id             String         @id @default(cuid())
  organisationId String
  invoiceId      String
  reminderType   ReminderType
  scheduledFor   DateTime
  sentAt         DateTime?
  subject        String
  body           String
  status         ReminderStatus @default(PENDING)
  failureReason  String?
  escalationLevel Int           @default(1)
  createdAt      DateTime       @default(now())
}
```

### ReminderSettings
```prisma
model ReminderSettings {
  id                       String  @id @default(cuid())
  organisationId           String  @unique
  enableAutoReminders      Boolean @default(true)
  reminderDaysBeforeDue    Int[]   @default([7, 3, 1])
  reminderDaysAfterDue     Int[]   @default([1, 7, 14, 30])
  autoEscalate             Boolean @default(true)
  escalationThresholdDays  Int     @default(14)
  maxEscalationLevel       Int     @default(3)
  beforeDueTemplate        String?
  onDueTemplate            String?
  afterDueTemplate         String?
  escalationTemplate       String?
}
```

## Permissions Required

- `invoices:read` - View reminders
- `invoices:write` - Create/send reminders
- `invoices:delete` - Cancel reminders
- `settings:read` - View settings
- `settings:write` - Update settings

## Integration Points

### Email Service
Currently placeholder - needs integration with email service:
```typescript
// TODO: Integrate with email service
// In PaymentReminderService.sendReminder()
```

### Invoice Events
Should trigger reminder actions:
- **Invoice Created** → Schedule auto-reminders
- **Invoice Paid** → Cancel pending reminders
- **Invoice Updated** → Adjust reminder schedule

## Testing

### Manual Testing

1. Create test invoice
2. Update reminder settings
3. Schedule auto-reminders
4. Check pending reminders
5. Trigger escalation manually
6. View escalation stats

### Cron Job Testing

```bash
# Trigger reminder check
curl -X POST http://localhost:3000/organisations/{orgId}/reminders/check-escalations \
  -H "Authorization: Bearer {token}"

# View pending reminders
curl http://localhost:3000/organisations/{orgId}/reminders/pending \
  -H "Authorization: Bearer {token}"
```

## Monitoring

Key metrics to track:
- Reminders sent per day
- Escalation rate
- Payment success rate after reminders
- Failed reminder deliveries
- Average days to payment after reminder

## Future Enhancements

1. **Email Service Integration**
   - SendGrid/SES integration
   - HTML email templates
   - Email tracking/analytics

2. **SMS Reminders**
   - Twilio integration
   - Multi-channel reminders

3. **Custom Workflows**
   - Per-customer reminder rules
   - Industry-specific templates
   - Multi-language support

4. **Analytics Dashboard**
   - Reminder effectiveness
   - Customer payment patterns
   - Escalation insights

5. **Payment Links**
   - Include payment links in reminders
   - One-click payment options

## Error Handling

All errors are logged and failed jobs are retried with exponential backoff:
- **Attempt 1**: Immediate
- **Attempt 2**: After 2s
- **Attempt 3**: After 4s

Failed jobs are kept for debugging.

## Support

For issues or questions, contact the backend team or check:
- Logs: `apps/api/logs/`
- Queue dashboard: `http://localhost:3000/admin/queues`
- Database: Check `PaymentReminder` and `ReminderSettings` tables
