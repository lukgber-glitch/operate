# Payment Reminder System - Quick Start Guide

## Installation

### 1. Install Dependencies
```bash
npm install @nestjs/bull @nestjs/schedule bull date-fns
```

### 2. Configure Redis
```typescript
// app.module.ts
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    // ... other imports
  ],
})
```

### 3. Add Environment Variables
```env
REDIS_HOST=localhost
REDIS_PORT=6379
EMAIL_FROM=noreply@operate.com
```

## Basic Usage

### 1. Auto-Schedule Reminders for New Invoice

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export class InvoiceService {
  constructor(
    @InjectQueue('payment-reminders') private reminderQueue: Queue,
  ) {}

  async createInvoice(dto: CreateInvoiceDto) {
    // Create invoice
    const invoice = await this.prisma.invoice.create({ data: dto });

    // Schedule automatic reminders
    await this.reminderQueue.add('schedule-for-invoice', {
      invoiceId: invoice.id
    });

    return invoice;
  }
}
```

### 2. Cancel Reminders When Invoice is Paid

```typescript
async markInvoiceAsPaid(invoiceId: string, orgId: string) {
  // Update invoice status
  await this.prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.PAID }
  });

  // Cancel all pending reminders
  await this.reminderQueue.add('cancel-for-invoice', {
    organisationId: orgId,
    invoiceId: invoiceId
  });
}
```

### 3. Create Manual Reminder

```typescript
import { PaymentReminderService } from './reminders';

export class InvoiceController {
  constructor(
    private reminderService: PaymentReminderService
  ) {}

  @Post(':id/send-reminder')
  async sendReminder(@Param('id') invoiceId: string) {
    const reminder = await this.reminderService.createReminder(
      'org-id',
      invoiceId,
      {
        reminderType: ReminderType.AFTER_DUE,
        scheduledFor: new Date().toISOString(),
        subject: 'Payment Reminder',
        body: 'Your invoice is overdue...',
        escalationLevel: 1
      }
    );

    // Send immediately
    await this.reminderService.sendReminderNow('org-id', reminder.id);
  }
}
```

### 4. Configure Reminder Settings

```typescript
// Update settings for an organisation
const settings = await this.reminderService.updateSettings('org-id', {
  enableAutoReminders: true,
  reminderDaysBeforeDue: [7, 3, 1],
  reminderDaysAfterDue: [1, 7, 14, 30],
  autoEscalate: true,
  escalationThresholdDays: 14,
  maxEscalationLevel: 3,
  beforeDueTemplate: 'Dear {customerName}, your invoice {invoiceNumber}...',
  afterDueTemplate: 'Dear {customerName}, invoice {invoiceNumber} is overdue...',
  escalationTemplate: 'URGENT: Invoice {invoiceNumber} requires immediate attention...'
});
```

### 5. Get Escalation Statistics

```typescript
import { ReminderEscalationService } from './reminders';

const stats = await this.escalationService.getEscalationStats('org-id');
console.log(stats);
// {
//   level1: 5,   // 1-7 days overdue
//   level2: 3,   // 8-21 days overdue
//   level3: 1,   // 22+ days overdue
//   totalOverdue: 9
// }
```

## API Examples

### Get Reminder History
```bash
curl http://localhost:3000/organisations/org-123/invoices/inv-456/reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Manual Reminder
```bash
curl -X POST http://localhost:3000/organisations/org-123/invoices/inv-456/reminders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reminderType": "AFTER_DUE",
    "scheduledFor": "2025-12-15T09:00:00Z",
    "subject": "Payment Reminder",
    "body": "Dear customer, please pay invoice...",
    "escalationLevel": 1
  }'
```

### Send Reminder Immediately
```bash
curl -X POST http://localhost:3000/organisations/org-123/invoices/inv-456/reminders/rem-789/send-now \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Settings
```bash
curl -X PATCH http://localhost:3000/organisations/org-123/reminder-settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enableAutoReminders": true,
    "reminderDaysAfterDue": [1, 7, 14, 21, 30],
    "autoEscalate": true
  }'
```

### Trigger Manual Escalation Check
```bash
curl -X POST http://localhost:3000/organisations/org-123/reminders/check-escalations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Scheduled Jobs

The system runs these jobs automatically:

- **9:00 AM Daily** - Check and send due reminders
- **10:00 AM Daily** - Check for invoice escalations
- **Every Hour** - Emergency reminder check
- **2:00 AM Sunday** - Cleanup old reminders
- **8:00 AM Monday** - Generate statistics

No manual intervention needed!

## Template Variables

Use these in email templates:

- `{customerName}` - Customer's name
- `{invoiceNumber}` - Invoice number
- `{totalAmount}` - Invoice total
- `{currency}` - Currency (EUR, USD, etc.)
- `{dueDate}` - Due date
- `{daysOverdue}` - Days past due (if applicable)

Example:
```
Dear {customerName},

Invoice {invoiceNumber} for {totalAmount} {currency} is now {daysOverdue}
days overdue (due date: {dueDate}).

Please arrange immediate payment.
```

## Escalation Levels

1. **Level 1** (1-7 days overdue): Friendly reminder
2. **Level 2** (8-21 days overdue): Firm notice with consequences
3. **Level 3** (22+ days overdue): Final notice, legal action threatened

## Testing

### Check if System is Working

```bash
# 1. Check pending reminders
curl http://localhost:3000/organisations/org-123/reminders/pending \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Check escalation stats
curl http://localhost:3000/organisations/org-123/reminders/escalation-stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. View settings
curl http://localhost:3000/organisations/org-123/reminder-settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Test Invoice

```typescript
// Create overdue invoice for testing
const testInvoice = await prisma.invoice.create({
  data: {
    orgId: 'org-123',
    number: 'TEST-001',
    customerName: 'Test Customer',
    totalAmount: 1000,
    currency: 'EUR',
    dueDate: new Date('2025-11-15'), // 16 days ago
    status: InvoiceStatus.SENT
  }
});

// Trigger escalation
await reminderQueue.add('escalate', { invoiceId: testInvoice.id });
```

## Common Issues

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Start Redis server
```bash
docker run -d -p 6379:6379 redis:alpine
# or
redis-server
```

### Jobs Not Processing
**Check**: Is the app running and is Redis connected?
```bash
# View queue dashboard (if enabled)
curl http://localhost:3000/admin/queues
```

### Reminders Not Sending
**Check**:
1. Email service integration completed?
2. Check logs: `apps/api/logs/`
3. Check reminder status in database

## Next Steps

1. **Integrate Email Service**
   - Replace placeholder in `PaymentReminderService.sendReminder()`
   - Add SendGrid/SES/Nodemailer
   - Test email delivery

2. **Add to Invoice Lifecycle**
   - Hook invoice creation → schedule reminders
   - Hook payment received → cancel reminders
   - Hook invoice cancelled → cancel reminders

3. **Set Up Monitoring**
   - Configure logging
   - Set up alerts for failures
   - Monitor queue metrics

4. **Customize Templates**
   - Design HTML email templates
   - Add company branding
   - Support multi-language

## Support

- **Documentation**: See `README.md`
- **Implementation**: See `IMPLEMENTATION.md`
- **Code**: Check inline JSDoc comments
- **Database**: Check Prisma schema for PaymentReminder and ReminderSettings

## Quick Reference

| Action | Endpoint | Method |
|--------|----------|--------|
| Get history | `/organisations/:orgId/invoices/:invoiceId/reminders` | GET |
| Create reminder | `/organisations/:orgId/invoices/:invoiceId/reminders` | POST |
| Send now | `/organisations/:orgId/invoices/:invoiceId/reminders/:id/send-now` | POST |
| Cancel | `/organisations/:orgId/invoices/:invoiceId/reminders/:id` | DELETE |
| Get settings | `/organisations/:orgId/reminder-settings` | GET |
| Update settings | `/organisations/:orgId/reminder-settings` | PATCH |
| Stats | `/organisations/:orgId/reminders/escalation-stats` | GET |
| Check escalations | `/organisations/:orgId/reminders/check-escalations` | POST |

---

**Ready to use!** 🚀
