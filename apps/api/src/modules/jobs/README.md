# Jobs Module

Background job processing and scheduled tasks for the Operate platform.

## Overview

The Jobs module handles automated background tasks, including daily insight generation, scheduled reminders, and proactive AI suggestions for organizations.

## Features

### Daily Insight Job

Generates proactive AI suggestions for users daily at 6 AM in each organization's local timezone.

**Insight Categories:**

1. **Cash Flow Alerts**
   - Low balance warnings (< €1000)
   - Unusual spending detection (>50% increase week-over-week)

2. **Tax Deadline Reminders**
   - Upcoming tax deadlines (within 30 days)
   - Priority based on urgency (URGENT: ≤3 days, HIGH: ≤7 days)

3. **Overdue Invoice Alerts**
   - Invoices past due date
   - Invoices due within 7 days
   - Actionable reminders to send follow-ups

4. **Bill Reminders**
   - Bills due within 7 days
   - Overdue bills requiring immediate payment
   - Priority escalation for imminent due dates

5. **HR Reminders**
   - Contracts expiring within 30 days
   - Low leave balances (≤2 days remaining)

## Architecture

### Components

- **`daily-insight.processor.ts`** - BullMQ job processor for generating insights
- **`job-scheduler.service.ts`** - Scheduling service that triggers jobs at appropriate times
- **`jobs.module.ts`** - NestJS module configuration
- **`types.ts`** - TypeScript interfaces and enums

### Queue Configuration

- **Queue Name:** `daily-insights`
- **Job Name:** `generate-insights`
- **Retry Strategy:** 3 attempts with exponential backoff (1 minute delay)
- **Retention:** Last 100 completed jobs, last 50 failed jobs

## Usage

### Manual Trigger

Trigger insights for a specific organization:

```typescript
import { JobSchedulerService } from './modules/jobs';

// In your controller or service
constructor(private readonly jobScheduler: JobSchedulerService) {}

async triggerInsights(orgId: string) {
  return await this.jobScheduler.triggerManualInsights(orgId);
}
```

Trigger for all organizations:

```typescript
async triggerAllInsights() {
  return await this.jobScheduler.triggerAllInsights();
}
```

### Scheduled Execution

The service automatically checks every hour (on the hour) which organizations need their 6 AM daily insights:

- Uses organization timezone from database (`Organisation.timezone`)
- Prevents duplicate runs by checking for existing suggestions created today
- Jobs run at 6:00 AM in each organization's local time

### Queue Statistics

Get current queue status:

```typescript
const stats = await this.jobScheduler.getQueueStats();
// Returns: { waiting, active, completed, failed, delayed, total }
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Scheduler (Cron)                                         │
│    Runs every hour, checks org timezones                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Job Queue (BullMQ)                                       │
│    Queues insight generation jobs                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Insight Processor                                        │
│    Generates insights across 5 categories                   │
│    - Cash Flow                                              │
│    - Tax Deadlines                                          │
│    - Invoices                                               │
│    - Bills                                                  │
│    - HR                                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Database (Suggestion Table)                              │
│    Stores insights for display in UI                        │
│    - Expires old suggestions (7+ days)                      │
│    - Creates new suggestions with priority/category         │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

No additional environment variables required. Uses existing:
- Redis connection (for BullMQ queue)
- Database connection (for Prisma queries)

### Queue Options

Configure in `jobs.module.ts`:

```typescript
BullModule.registerQueue({
  name: DAILY_INSIGHT_QUEUE,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
})
```

## Database Schema

### Suggestion Model

```prisma
model Suggestion {
  id          String             @id @default(uuid())
  orgId       String
  userId      String?
  type        SuggestionType
  priority    SuggestionPriority @default(MEDIUM)
  title       String
  description String
  actionLabel String?
  entityType  String?
  entityId    String?
  data        Json?
  actionType  String?
  actionParams Json?
  status      SuggestionStatus   @default(PENDING)
  expiresAt   DateTime?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
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
```

## Error Handling

- **Database Errors:** Logged and job returns failure result
- **Missing Organization:** Throws error and job retries
- **Category Failures:** Individual category errors are caught and logged, other categories continue
- **Queue Errors:** BullMQ retries with exponential backoff

## Monitoring

### Logs

All processors include comprehensive logging:

```typescript
this.logger.log('Processing daily insights for organization ${orgId}');
this.logger.debug('Saved ${insights.length} suggestions for org ${orgId}');
this.logger.error('Error generating cash flow insights:', error);
```

### Job Progress

Job progress is tracked and can be monitored:

```typescript
await job.progress({
  stage: 'cash_flow',
  message: 'Analyzing cash flow',
  percent: 20,
});
```

### Job Results

Each job returns detailed results:

```typescript
{
  jobId: string;
  success: boolean;
  orgId: string;
  insightCount: number;
  categories: {
    cashFlow: number;
    tax: number;
    invoice: number;
    bill: number;
    hr: number;
  };
  highPriorityCount: number;
  duration: number;
  errorMessage?: string;
}
```

## Testing

### Manual Testing

```bash
# Via API endpoint (add to controller)
curl -X POST http://localhost:3000/api/jobs/insights/trigger \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"orgId": "org-id-here"}'
```

### Integration Tests

```typescript
describe('DailyInsightProcessor', () => {
  it('should generate insights for organization', async () => {
    const result = await jobScheduler.triggerManualInsights(orgId);
    expect(result.jobId).toBeDefined();
  });
});
```

## Performance

- **Average Execution Time:** 2-5 seconds per organization
- **Database Queries:** ~10-15 queries per organization
- **Memory Usage:** Low (streaming results, not loading all data)
- **Batch Operations:** Uses `createMany` for suggestions

## Future Enhancements

- [ ] AI-powered insight personalization
- [ ] User-specific insight preferences
- [ ] Custom insight rules per organization
- [ ] Insight effectiveness tracking (click-through rates)
- [ ] Multi-language support for descriptions
- [ ] SMS/Email notifications for high-priority insights
- [ ] Insight recommendation engine (ML-based)

## Dependencies

- `@nestjs/bull` - Job queue integration
- `@nestjs/schedule` - Cron scheduling
- `bull` - Redis-based queue
- `@prisma/client` - Database access
- `ioredis` - Redis client

## Related Modules

- **Chatbot/Suggestions** - Displays insights in UI
- **Tax Deadline** - Source for tax reminders
- **Finance/Bills** - Source for bill reminders
- **HR** - Source for employee-related insights
- **Finance/Invoices** - Source for invoice alerts
