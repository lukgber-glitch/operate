# ELSTER Status Tracking Service

Complete status tracking and monitoring system for ELSTER tax filings.

## Overview

The ELSTER Status Tracking Service manages the entire lifecycle of filing status updates, from submission through acceptance or rejection. It provides real-time status monitoring, automatic notifications, and comprehensive audit trails.

## Features

- **Status Updates**: Track filing status changes with validation
- **Polling**: Automated polling of tigerVAT for status updates
- **Webhooks**: Real-time status updates via webhook integration
- **Notifications**: Automatic notifications on status changes
- **Timeline**: Complete audit trail of status changes
- **Job Scheduling**: Background jobs for periodic status checks
- **Statistics**: Status analytics and reporting

## Status Flow

```
DRAFT ──┐
        │
        ├──> SUBMITTED ──> PENDING ──┬──> ACCEPTED (terminal)
        │                             │
        │                             └──> REJECTED ──> (can resubmit)
        │
        └──> ERROR ──> (can retry)
```

## Architecture

### Core Components

1. **ElsterStatusService** (`services/elster-status.service.ts`)
   - Main service for status management
   - Status update operations
   - Polling and webhook processing
   - Notification handling

2. **StatusCheckProcessor** (`jobs/status-check.processor.ts`)
   - BullMQ job processor for background status checks
   - Handles retries and failures
   - Reschedules pending filings

3. **StatusSchedulerService** (`jobs/status-scheduler.service.ts`)
   - Cron-based scheduler
   - Runs every 5 minutes
   - Finds and schedules pending filing checks

4. **Types** (`types/elster-status.types.ts`)
   - Complete type definitions
   - Status enums and interfaces
   - Error types

### Database Schema

```prisma
model ElsterFilingStatusEvent {
  id         String   @id @default(cuid())
  filingId   String
  filing     ElsterFiling @relation(fields: [filingId], references: [id])

  fromStatus String?
  toStatus   String
  details    Json?

  createdAt  DateTime @default(now())

  @@index([filingId])
  @@index([createdAt])
  @@index([filingId, createdAt])
}
```

## Usage

### Update Status Manually

```typescript
import { ElsterStatusService } from './services/elster-status.service';
import { ElsterFilingStatus, StatusSource } from './types';

// Inject the service
constructor(private readonly statusService: ElsterStatusService) {}

// Update status
const result = await this.statusService.updateStatus(
  'filing-id',
  ElsterFilingStatus.ACCEPTED,
  {
    message: 'Filing accepted by ELSTER',
    timestamp: new Date(),
    source: StatusSource.MANUAL,
  }
);

console.log(`Status changed: ${result.statusChanged}`);
console.log(`Notification sent: ${result.notificationSent}`);
```

### Poll for Updates

```typescript
// Poll a specific filing
const updatedFiling = await this.statusService.pollForUpdates(
  'filing-id',
  { force: true }
);

console.log(`Current status: ${updatedFiling.status}`);
```

### Handle Webhooks

```typescript
import { WebhookPayload } from './types';

// Process webhook from tigerVAT
const webhookPayload: WebhookPayload = {
  transferTicket: 'tt-123',
  status: 'ACCEPTED',
  timestamp: new Date().toISOString(),
  message: 'Filing accepted',
};

const result = await this.statusService.handleWebhook(webhookPayload);
console.log(`Webhook processed: ${result.success}`);
```

### Get Filing Timeline

```typescript
// Get complete status history
const timeline = await this.statusService.getFilingTimeline('filing-id');

timeline.forEach(event => {
  console.log(`${event.createdAt}: ${event.fromStatus} -> ${event.toStatus}`);
});
```

### Get Statistics

```typescript
// Get status statistics for an organization
const stats = await this.statusService.getStatusStatistics('org-id');

console.log(`Total filings: ${stats.total}`);
console.log(`Pending: ${stats.pending}`);
console.log(`Needs attention: ${stats.needsAttention}`);
console.log(`Accepted: ${stats.byStatus.ACCEPTED}`);
```

## Configuration

### Environment Variables

```env
# tigerVAT API Configuration
TIGERVAT_BASE_URL=https://api.tigervat.de/v1
TIGERVAT_API_KEY=your-api-key-here

# Status Polling Configuration
ELSTER_POLLING_ENABLED=true
ELSTER_POLLING_INTERVAL_MS=300000  # 5 minutes
```

### Polling Configuration

Default polling configuration is defined in `types/elster-status.types.ts`:

```typescript
export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  enabled: true,
  intervalMs: 5 * 60 * 1000,      // 5 minutes
  maxRetries: 20,                  // 20 retries
  retryDelayMs: 5 * 60 * 1000,    // 5 minutes between retries
  backoffMultiplier: 1.0,          // No exponential backoff
};
```

## Status Transitions

Valid status transitions are enforced:

```typescript
DRAFT       -> SUBMITTED, ERROR
SUBMITTED   -> PENDING, ACCEPTED, REJECTED, ERROR
PENDING     -> ACCEPTED, REJECTED, ERROR
ACCEPTED    -> (terminal state)
REJECTED    -> SUBMITTED (can resubmit)
ERROR       -> SUBMITTED (can retry)
```

Invalid transitions will throw `ElsterStatusError` with code `INVALID_STATUS`.

## Notifications

Automatic notifications are sent when status changes:

- **Priority Levels**: Based on status importance
  - REJECTED: 5 (highest)
  - ERROR: 4
  - ACCEPTED: 3
  - PENDING: 2
  - SUBMITTED: 1
  - DRAFT: 0

- **Notification Content**:
  - Filing type and period
  - Status change
  - Message/error details
  - Transfer ticket reference

## Background Jobs

### Status Check Job

**Queue**: `elster-status`
**Job Name**: `check-status`
**Schedule**: Every 5 minutes for pending filings

Job data structure:
```typescript
interface StatusCheckJobData {
  filingId: string;
  organisationId: string;
  submissionId?: string;
  transferTicket?: string;
  retryCount?: number;
}
```

### Scheduler

**Cron**: `*/5 * * * *` (every 5 minutes)

The scheduler:
1. Finds all pending filings
2. Schedules status check jobs
3. Handles rate limiting
4. Logs progress

## Error Handling

### Error Types

```typescript
enum ElsterStatusErrorCode {
  FILING_NOT_FOUND = 'FILING_NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
  POLL_FAILED = 'POLL_FAILED',
  WEBHOOK_VALIDATION_FAILED = 'WEBHOOK_VALIDATION_FAILED',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  JOB_SCHEDULING_FAILED = 'JOB_SCHEDULING_FAILED',
}
```

### Error Handling Example

```typescript
try {
  await statusService.updateStatus(filingId, newStatus);
} catch (error) {
  if (error instanceof ElsterStatusError) {
    switch (error.code) {
      case ElsterStatusErrorCode.FILING_NOT_FOUND:
        // Handle not found
        break;
      case ElsterStatusErrorCode.INVALID_STATUS:
        // Handle invalid transition
        break;
      default:
        // Handle other errors
    }
  }
}
```

## Testing

### Run Tests

```bash
# Unit tests
npm test -- elster-status.service.spec.ts

# With coverage
npm test -- --coverage elster-status.service.spec.ts
```

### Test Coverage

- Status update operations
- Polling functionality
- Webhook processing
- Status transition validation
- Notification sending
- Timeline retrieval
- Statistics calculation

## Integration with BullMQ

### Setup Queue (Recommended)

```typescript
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'elster-status',
    }),
  ],
})
export class ElsterModule {}
```

### Register Processor

```typescript
import { StatusCheckProcessor } from './jobs/status-check.processor';

@Module({
  providers: [StatusCheckProcessor],
})
export class ElsterModule {}
```

## API Endpoints (Future)

Recommended controller endpoints:

```typescript
// GET /api/tax/elster/filings/:id/status
// Get current status

// GET /api/tax/elster/filings/:id/timeline
// Get status history

// POST /api/tax/elster/filings/:id/poll
// Trigger manual poll

// POST /api/tax/elster/webhooks/status
// Webhook endpoint for tigerVAT

// GET /api/tax/elster/statistics
// Get status statistics
```

## Best Practices

1. **Status Updates**
   - Always validate transitions
   - Include meaningful details
   - Use appropriate source types

2. **Polling**
   - Respect rate limits
   - Use force option sparingly
   - Handle terminal states

3. **Webhooks**
   - Validate all payloads
   - Use idempotent operations
   - Log all webhook events

4. **Notifications**
   - Set appropriate priorities
   - Include actionable information
   - Link to relevant resources

5. **Error Handling**
   - Catch and log all errors
   - Use specific error codes
   - Provide helpful error messages

## Troubleshooting

### Status Not Updating

1. Check polling is enabled: `ELSTER_POLLING_ENABLED=true`
2. Verify tigerVAT API credentials
3. Check filing has transfer ticket
4. Review logs for errors

### Notifications Not Sent

1. Verify organisation exists
2. Check notification creation in database
3. Review user permissions
4. Check notification settings

### Jobs Not Running

1. Ensure `@nestjs/schedule` is installed
2. Verify `ScheduleModule.forRoot()` is imported
3. Check scheduler is enabled
4. Review cron expression

## Performance Considerations

- **Polling Interval**: Default 5 minutes balances freshness vs. API load
- **Concurrent Jobs**: Limited to 5 concurrent status checks
- **Database Queries**: Indexed on filingId, createdAt for fast lookups
- **Notification Batching**: Consider batching for high-volume scenarios

## Future Enhancements

- [ ] Exponential backoff for retries
- [ ] Webhook signature validation
- [ ] Status change webhooks to frontend
- [ ] Advanced analytics and reporting
- [ ] Machine learning for status prediction
- [ ] Multi-provider support (ERiC, etc.)

## References

- [ELSTER Documentation](https://www.elster.de)
- [tigerVAT API](https://www.tigervat.de)
- [BullMQ Documentation](https://docs.bullmq.io)
- [NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling)

## Support

For issues or questions:
1. Check logs: `apps/api/logs/elster-status.log`
2. Review error codes and messages
3. Consult integration tests
4. Contact DevOps team
