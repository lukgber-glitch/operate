# ELSTER Status Tracking - Migration Guide

Guide for adding status tracking to existing ELSTER implementations.

## Prerequisites

- Existing ELSTER module with VAT filing capability
- Prisma ORM configured
- @nestjs/schedule installed
- Redis (optional, for BullMQ)

## Step-by-Step Migration

### 1. Update Prisma Schema

Add the new `ElsterFilingStatusEvent` model to your schema:

```prisma
model ElsterFiling {
  // ... existing fields ...

  // Add this relation
  statusEvents ElsterFilingStatusEvent[]
}

model ElsterFilingStatusEvent {
  id        String   @id @default(cuid())
  filingId  String
  filing    ElsterFiling @relation(fields: [filingId], references: [id], onDelete: Cascade)

  fromStatus String?
  toStatus   String
  details    Json?

  createdAt DateTime @default(now())

  @@index([filingId])
  @@index([createdAt])
  @@index([filingId, createdAt])
}
```

### 2. Run Database Migration

```bash
cd packages/database

# Generate migration
npx prisma migrate dev --name add_elster_status_events

# Apply migration
npx prisma migrate deploy
```

### 3. Install Dependencies

```bash
# Install scheduling module
npm install --save @nestjs/schedule

# Optional: Install BullMQ for advanced job processing
npm install --save @nestjs/bull bull bullmq
```

### 4. Update Environment Variables

Add to your `.env` file:

```env
# Status Tracking
ELSTER_POLLING_ENABLED=true
ELSTER_POLLING_INTERVAL_MS=300000  # 5 minutes
ELSTER_MAX_POLLING_RETRIES=20
ELSTER_RETRY_DELAY_MS=300000
```

### 5. Update Module Imports

Update `elster.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ElsterStatusService } from './services/elster-status.service';
import { StatusSchedulerService } from './jobs/status-scheduler.service';

@Module({
  imports: [
    // ... existing imports ...
    ScheduleModule.forRoot(),
  ],
  providers: [
    // ... existing providers ...
    ElsterStatusService,
    StatusSchedulerService,
  ],
  exports: [
    // ... existing exports ...
    ElsterStatusService,
  ],
})
export class ElsterModule {}
```

### 6. Update Existing Filing Service

Integrate status tracking into your existing `ElsterVatService`:

```typescript
import { ElsterStatusService } from './elster-status.service';
import { StatusSource } from '../types/elster-status.types';

@Injectable()
export class ElsterVatService {
  constructor(
    // ... existing dependencies ...
    private readonly statusService: ElsterStatusService,
  ) {}

  async submitUStVA(
    organisationId: string,
    data: UStVAData,
    options: SubmitOptions = {},
  ): Promise<ElsterSubmissionResult> {
    // ... existing submission logic ...

    // After creating filing record:
    if (filing.status === ElsterFilingStatus.SUBMITTED) {
      // Schedule status check
      await this.statusService.scheduleStatusCheck(filing.id);
    }

    return result;
  }
}
```

### 7. Create Webhook Endpoint (Optional)

Add a controller to handle webhooks from tigerVAT:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ElsterStatusService } from './services/elster-status.service';
import { WebhookPayload } from './types/elster-status.types';

@Controller('webhooks/elster')
export class ElsterWebhookController {
  constructor(private readonly statusService: ElsterStatusService) {}

  @Post('status')
  async handleStatusWebhook(@Body() payload: WebhookPayload) {
    return await this.statusService.handleWebhook(payload);
  }
}
```

### 8. Add to Module

```typescript
@Module({
  controllers: [ElsterWebhookController],
  // ...
})
export class ElsterModule {}
```

### 9. Test the Integration

Create a test to verify status tracking:

```typescript
describe('ELSTER Status Integration', () => {
  it('should track status changes', async () => {
    // Submit filing
    const result = await vatService.submitUStVA(orgId, data);

    // Verify initial status
    expect(result.status).toBe(ElsterFilingStatus.SUBMITTED);

    // Simulate status update
    await statusService.updateStatus(
      result.submissionId,
      ElsterFilingStatus.ACCEPTED
    );

    // Get timeline
    const timeline = await statusService.getFilingTimeline(
      result.submissionId
    );

    expect(timeline).toHaveLength(2);
    expect(timeline[1].toStatus).toBe(ElsterFilingStatus.ACCEPTED);
  });
});
```

## Optional: BullMQ Integration

For production environments, integrate BullMQ for reliable job processing.

### 1. Install BullMQ

```bash
npm install --save @nestjs/bull bull bullmq
```

### 2. Configure Queue Module

```typescript
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'elster-status',
      defaultJobOptions: {
        attempts: 20,
        backoff: {
          type: 'exponential',
          delay: 300000, // 5 minutes
        },
      },
    }),
  ],
})
export class ElsterModule {}
```

### 3. Update Status Service

Replace the TODO in `scheduleStatusCheck`:

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class ElsterStatusService {
  constructor(
    @InjectQueue('elster-status') private statusQueue: Queue,
    // ... other dependencies
  ) {}

  async scheduleStatusCheck(
    filingId: string,
    delay: number = DEFAULT_POLLING_CONFIG.intervalMs,
  ): Promise<void> {
    const jobData: StatusCheckJobData = {
      filingId,
      // ...
    };

    await this.statusQueue.add('check-status', jobData, {
      delay,
      attempts: DEFAULT_POLLING_CONFIG.maxRetries,
    });
  }
}
```

### 4. Register Processor

Add to module providers:

```typescript
import { StatusCheckProcessor } from './jobs/status-check.processor';

@Module({
  providers: [
    // ...
    StatusCheckProcessor,
  ],
})
export class ElsterModule {}
```

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] Environment variables configured
- [ ] Module imports updated
- [ ] Status service integrated into VAT service
- [ ] Scheduler running (check logs)
- [ ] Webhook endpoint created (optional)
- [ ] Tests passing
- [ ] BullMQ configured (optional)
- [ ] Monitoring/logging in place

## Rollback Plan

If issues occur:

1. **Disable Polling**
   ```env
   ELSTER_POLLING_ENABLED=false
   ```

2. **Remove Scheduler**
   Comment out `StatusSchedulerService` in module providers

3. **Revert Database**
   ```bash
   npx prisma migrate resolve --rolled-back [migration-name]
   ```

## Monitoring

After deployment, monitor:

1. **Logs**: Check for scheduler and polling activity
   ```bash
   tail -f apps/api/logs/combined.log | grep "ELSTER"
   ```

2. **Database**: Verify status events are created
   ```sql
   SELECT * FROM "ElsterFilingStatusEvent"
   ORDER BY "createdAt" DESC
   LIMIT 10;
   ```

3. **Queue**: Monitor BullMQ dashboard (if using)
   ```
   http://localhost:3000/admin/queues
   ```

## Troubleshooting

### Scheduler Not Running

**Problem**: Status checks not executing

**Solution**:
1. Verify `ScheduleModule.forRoot()` in imports
2. Check `ELSTER_POLLING_ENABLED=true`
3. Review cron expression in decorator
4. Check service is in providers array

### Jobs Failing

**Problem**: Status check jobs failing repeatedly

**Solution**:
1. Check tigerVAT API credentials
2. Verify network connectivity
3. Review error logs for specifics
4. Increase retry delay if rate limited

### Duplicate Events

**Problem**: Multiple status events for same change

**Solution**:
1. Add idempotency checks in status update
2. Use unique constraints if needed
3. Review scheduler timing

## Performance Tuning

### High Volume Scenarios

For organizations with many filings:

1. **Adjust Polling Interval**
   ```env
   ELSTER_POLLING_INTERVAL_MS=600000  # 10 minutes
   ```

2. **Batch Processing**
   Modify scheduler to process in batches:
   ```typescript
   const batches = chunk(pendingFilings, 10);
   for (const batch of batches) {
     await Promise.all(
       batch.map(f => this.statusService.scheduleStatusCheck(f.id))
     );
     await sleep(1000); // Rate limiting
   }
   ```

3. **Database Optimization**
   Add compound indexes for common queries:
   ```prisma
   @@index([organisationId, status, submittedAt])
   ```

## Support

For migration assistance:
- Review existing tests in `__tests__/`
- Check STATUS_TRACKING_README.md for details
- Contact backend team lead
