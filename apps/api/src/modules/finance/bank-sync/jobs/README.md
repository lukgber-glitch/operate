# Bank Import Background Jobs

Production-ready BullMQ job system for automated bank transaction imports.

## Overview

This module provides:
- **Background job processing** using Bull/Redis
- **Automated scheduling** with cron jobs
- **Retry logic** with exponential backoff
- **Progress tracking** for UI updates
- **WebSocket event emission** for real-time updates
- **Job metrics** for monitoring

## Architecture

```
jobs/
├── bank-import.types.ts      # TypeScript type definitions
├── bank-import.processor.ts  # Job processor (handles execution)
├── bank-import.scheduler.ts  # Cron scheduler & manual triggers
├── bank-import.module.ts     # NestJS module configuration
└── README.md                 # This file
```

## Job Types

### 1. `sync-connection`
Sync a single bank connection (accounts + transactions).

**Use case:** Manual refresh button, initial sync after connection

**Retry:** 3 attempts with exponential backoff (5s, 10s, 20s)

### 2. `sync-all-org`
Batch sync all connections for an organization.

**Use case:** Scheduled background sync every 4 hours

**Retry:** 2 attempts with exponential backoff (10s, 20s)

### 3. `refresh-consents`
Check and refresh PSD2 consents expiring within N days.

**Use case:** Daily check at 3am for consents expiring within 7 days

**Retry:** 2 attempts with fixed 1-minute delay

## Scheduled Jobs

### Every 4 hours: Sync all active connections
- Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
- Timezone: Europe/Berlin
- Staggered by 30 seconds per organization to avoid rate limits

### Daily at 3am: Refresh expiring consents
- Checks consents expiring within 7 days
- Marks connections as `REQUIRES_REAUTH`
- Emits event for UI notifications

### Daily at 4am: Cleanup old jobs
- Completed jobs: removed after 7 days
- Failed jobs: removed after 30 days

## Configuration

Environment variables:

```bash
# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Job configuration
BANK_SYNC_ENABLED=true                  # Enable/disable scheduler
BANK_SYNC_STAGGER_DELAY_MS=30000       # Delay between org syncs (30s)
```

## API Endpoints

### Schedule Immediate Sync
```http
POST /organisations/:orgId/bank-connections/:id/sync
Content-Type: application/json

{
  "forceFullSync": false,
  "accountIds": ["acc_123"],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "triggeredBy": "user_123"
}

Response:
{
  "jobId": "12345",
  "message": "Sync job scheduled successfully. Use the job ID to track progress."
}
```

### Get Job Status
```http
GET /organisations/:orgId/bank-connections/jobs/:jobId

Response:
{
  "id": "12345",
  "state": "completed",
  "progress": {
    "stage": "completed",
    "message": "Sync completed: 42 new transactions",
    "percent": 100,
    "accountsProcessed": 3,
    "transactionsProcessed": 42
  },
  "data": { ... },
  "result": { ... }
}
```

### Get Queue Health
```http
GET /organisations/:orgId/bank-connections/queue/health

Response:
{
  "isHealthy": true,
  "isPaused": false,
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 1234,
    "failed": 12,
    "delayed": 3,
    "paused": 0
  },
  "warnings": []
}
```

### Get Queue Statistics
```http
GET /organisations/:orgId/bank-connections/queue/stats

Response:
{
  "waiting": 5,
  "active": 2,
  "completed": 1234,
  "failed": 12,
  "delayed": 3,
  "paused": 0
}
```

## Job Progress Tracking

Jobs emit progress updates that can be tracked in the UI:

```typescript
{
  stage: 'starting' | 'syncing_accounts' | 'syncing_transactions' | 'finalizing' | 'completed' | 'failed',
  message: string,
  percent: number, // 0-100
  accountsProcessed?: number,
  transactionsProcessed?: number,
  estimatedTimeRemaining?: number // milliseconds
}
```

## Events

Jobs emit events via EventEmitter2 for real-time updates:

### `bank.sync.completed`
```typescript
{
  connectionId: string,
  accountsSynced: number,
  transactionsSynced: number,
  timestamp: Date
}
```

### `bank.batch.completed`
```typescript
{
  orgId: string,
  totalConnections: number,
  successfulSyncs: number,
  failedSyncs: number,
  timestamp: Date
}
```

### `bank.consents.expiring`
```typescript
{
  count: number,
  connections: string[], // Connection IDs
  timestamp: Date
}
```

### `bank.sync.failed`
```typescript
{
  jobId: string,
  type: BankImportJobType,
  error: string,
  timestamp: Date
}
```

### `bank.job.completed`
```typescript
{
  jobId: string,
  type: BankImportJobType,
  queuedAt: Date,
  startedAt: Date,
  completedAt: Date,
  duration: number,
  attempts: number,
  accountsSynced?: number,
  transactionsSynced?: number,
  connectionsSynced?: number,
  success: boolean
}
```

### `bank.job.failed`
```typescript
{
  jobId: string,
  type: BankImportJobType,
  attempts: number,
  error: string,
  timestamp: Date
}
```

## Error Handling

### Retryable Errors
- Network errors
- Rate limit errors (429)
- Temporary service unavailability (503)
- Timeout errors

Jobs will retry with exponential backoff.

### Non-Retryable Errors
- Authentication errors (401, 403)
- Expired consents
- Invalid connection ID
- Malformed data

Jobs will fail immediately and require manual intervention.

### Failed Job Handling
1. Job is marked as failed after max retries
2. `bank.job.failed` event is emitted
3. Connection status may be updated (e.g., `REQUIRES_REAUTH`)
4. Admin notification can be sent

## Monitoring

### Metrics
All jobs emit metrics via `bank.job.completed` event:
- Duration
- Accounts synced
- Transactions synced
- Success/failure rate
- Retry attempts

### Logs
Jobs log at different levels:
- **DEBUG**: Progress updates, job status changes
- **LOG**: Job start/completion, scheduling
- **WARN**: Retries, minor issues
- **ERROR**: Job failures, critical errors

### Queue Health
Monitor queue health via `/queue/health` endpoint:
- Check if queue is paused
- Monitor failed job count
- Alert on high waiting job count

## Manual Job Management

### Schedule immediate sync (in code)
```typescript
const jobId = await bankImportScheduler.scheduleImmediateSync(connectionId, {
  forceFullSync: true,
  triggeredBy: userId
});
```

### Get job status (in code)
```typescript
const status = await bankImportScheduler.getJobStatus(jobId);
```

### Pause queue (maintenance)
```typescript
await bankImportScheduler.pauseQueue();
```

### Resume queue
```typescript
await bankImportScheduler.resumeQueue();
```

## Testing

### Test sync job
```bash
curl -X POST http://localhost:3000/organisations/org_123/bank-connections/conn_123/sync \
  -H "Content-Type: application/json" \
  -d '{"forceFullSync": false}'
```

### Check job status
```bash
curl http://localhost:3000/organisations/org_123/bank-connections/jobs/12345
```

### Monitor queue
```bash
curl http://localhost:3000/organisations/org_123/bank-connections/queue/health
```

## Production Deployment

### Redis Requirements
- **Persistence**: Enable AOF or RDB for job persistence
- **Memory**: Allocate sufficient memory for job queue
- **Connection Pool**: Configure connection pool size based on concurrency

### Scaling
- **Horizontal**: Run multiple worker instances
- **Vertical**: Increase Redis memory and worker concurrency
- **Rate Limiting**: Configure limiter in module (default: 10 jobs/second)

### Monitoring
- Set up alerts for:
  - High failed job count (>100)
  - Queue stalled for >5 minutes
  - High waiting job count (>1000)
  - Redis connection errors

## Troubleshooting

### Jobs not processing
1. Check Redis connection
2. Verify `BANK_SYNC_ENABLED=true`
3. Check queue is not paused
4. Review worker logs

### High failure rate
1. Check bank API credentials
2. Review rate limiting
3. Check network connectivity
4. Verify consent validity

### Slow job processing
1. Check Redis performance
2. Review concurrency settings
3. Monitor network latency
4. Check bank API response times
