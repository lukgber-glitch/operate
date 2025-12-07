# Queue Monitoring System

Comprehensive queue monitoring and management system for Operate's background job processing.

## Features

- **Bull Board Dashboard**: Web-based UI for visual queue monitoring at `/admin/queues`
- **Queue Health API**: REST endpoints for programmatic queue management
- **Automated Metrics**: Periodic collection and logging of queue metrics
- **Alerts**: Automatic warnings for high failure rates and stalled jobs
- **Management Operations**: Retry, clean, pause, and resume queues

## Architecture

```
queue/
├── queue.module.ts                  # Main module (imports all queue features)
├── queue-board.module.ts            # Bull Board dashboard configuration
├── queue-board.middleware.ts        # Authentication middleware
├── queue-health.controller.ts       # REST API for queue operations
├── queue-metrics.service.ts         # Automated metrics collection
└── README.md                        # This file
```

## Monitored Queues

### Email and Document Processing
- `email-sync` - Email synchronization from Gmail/Outlook
- `attachment-processing` - Email attachment processing
- `invoice-extraction` - Invoice data extraction from documents
- `receipt-extraction` - Receipt data extraction from documents

### Banking
- `bank-import` - Bank transaction imports
- `truelayer-sync` - TrueLayer banking data sync
- `truelayer-balance` - TrueLayer balance updates

### Finance
- `payment-reminders` - Payment reminder scheduling
- `bill-reminders` - Bill payment reminders
- `recurring-invoices` - Recurring invoice generation

### Tax and Compliance
- `deadline-check` - Tax deadline monitoring
- `deadline-reminder` - Tax deadline notifications
- `retention-check` - Document retention compliance

### Reporting and Export
- `scheduled-reports` - Scheduled report generation
- `export-scheduler` - Data export scheduling
- `mrr-snapshot` - Monthly recurring revenue snapshots

### Subscription and Usage
- `subscription-usage-tracking` - Usage tracking
- `usage-aggregation` - Usage aggregation
- `usage-stripe-report` - Stripe usage reporting
- `dunning-retry` - Payment retry processing
- `dunning-escalate` - Payment escalation handling

### Utility
- `exchange-rate-refresh` - Currency exchange rate updates
- `search-indexing` - Search index updates
- `client-insights` - Client insights generation
- `xero-sync` - Xero integration sync

## Installation

The required dependencies are already installed:

```json
{
  "@bull-board/api": "^5.x",
  "@bull-board/express": "^5.x",
  "@bull-board/nestjs": "^5.x"
}
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Queue Monitoring
QUEUE_ADMIN_KEY=your-secure-admin-key-here
BULL_BOARD_ENABLED=true
QUEUE_METRICS_ENABLED=true
QUEUE_FAILURE_THRESHOLD=100
```

### Variable Descriptions

- `QUEUE_ADMIN_KEY`: Secret key for API key authentication (required)
- `BULL_BOARD_ENABLED`: Enable/disable Bull Board dashboard (default: true)
- `QUEUE_METRICS_ENABLED`: Enable/disable automated metrics collection (default: true)
- `QUEUE_FAILURE_THRESHOLD`: Alert threshold for failed jobs (default: 100)

## Authentication

The queue monitoring system supports two authentication methods:

### 1. Admin API Key (Recommended for Scripts)

Add the `X-Queue-Admin-Key` header to your requests:

```bash
curl -H "X-Queue-Admin-Key: your-secure-admin-key-here" \
  https://operate.guru/admin/queues/health
```

### 2. JWT Bearer Token (For User Sessions)

Use a valid JWT token with OWNER or ADMIN role:

```bash
curl -H "Authorization: Bearer your-jwt-token" \
  https://operate.guru/admin/queues/health
```

## Bull Board Dashboard

### Access

- **URL**: `https://operate.guru/admin/queues`
- **Authentication**: Required (see above)

### Features

- Real-time queue status
- Job details and logs
- Job data inspection
- Retry failed jobs (individual)
- Clean completed/failed jobs
- Pause/resume queues
- Job timeline visualization

### Screenshots

The Bull Board provides:
- Queue list with job counts
- Job details with stack traces
- Job data and options
- Progress tracking
- Retry and remove operations

## REST API Endpoints

### Get Queue Health

```bash
GET /admin/queues/health
```

Returns health metrics for all queues.

**Response:**
```json
[
  {
    "name": "email-sync",
    "waiting": 5,
    "active": 2,
    "completed": 1234,
    "failed": 3,
    "delayed": 0,
    "isPaused": false,
    "lastJobTime": "2025-12-07T10:30:00.000Z"
  }
]
```

### Get Queue Statistics

```bash
GET /admin/queues/:queueName/stats
```

Returns detailed statistics for a specific queue.

**Example:**
```bash
curl -H "X-Queue-Admin-Key: your-key" \
  https://operate.guru/admin/queues/email-sync/stats
```

### Retry Failed Jobs

```bash
POST /admin/queues/:queueName/retry-failed
```

Retries all failed jobs in a queue.

**Response:**
```json
{
  "retriedCount": 5
}
```

### Clean Old Jobs

```bash
POST /admin/queues/:queueName/clean?status=completed&age=86400000
```

Cleans jobs older than the specified age.

**Query Parameters:**
- `status`: `completed` or `failed` (default: `completed`)
- `age`: Age in milliseconds (default: 86400000 = 24 hours)

**Response:**
```json
{
  "cleanedCount": 150
}
```

### Pause Queue

```bash
POST /admin/queues/:queueName/pause
```

Pauses job processing for a queue.

**Response:**
```json
{
  "paused": true
}
```

### Resume Queue

```bash
POST /admin/queues/:queueName/resume
```

Resumes job processing for a paused queue.

**Response:**
```json
{
  "resumed": true
}
```

### List All Queues

```bash
GET /admin/queues/list
```

Returns a list of all available queue names.

**Response:**
```json
{
  "queues": [
    "email-sync",
    "bank-import",
    "invoice-extraction"
  ]
}
```

## Automated Metrics

The `QueueMetricsService` automatically collects metrics every 5 minutes.

### Metrics Logged

For each queue, the following metrics are logged:
- `waiting`: Jobs waiting to be processed
- `active`: Jobs currently being processed
- `completed`: Total completed jobs
- `failed`: Total failed jobs
- `delayed`: Jobs scheduled for future execution
- `isPaused`: Queue pause status

### Log Format

Metrics are logged in JSON format for easy ingestion by monitoring systems:

```json
{
  "type": "queue_metrics",
  "queue": "email-sync",
  "waiting": 5,
  "active": 2,
  "completed": 1234,
  "failed": 3,
  "delayed": 0,
  "isPaused": false,
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

### Alerts

Automatic alerts are logged for:

1. **High Failure Rate**: When failed jobs exceed threshold
```json
{
  "type": "queue_alert",
  "level": "warning",
  "queue": "email-sync",
  "message": "Queue email-sync has 150 failed jobs (threshold: 100)",
  "failed": 150,
  "threshold": 100,
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

2. **Paused with Waiting Jobs**: When queue is paused but has waiting jobs
```json
{
  "type": "queue_alert",
  "level": "warning",
  "queue": "bank-import",
  "message": "Queue bank-import is paused with 25 waiting jobs",
  "waiting": 25,
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

3. **High Active Job Count**: When many jobs are active (possible stalled jobs)
```json
{
  "type": "queue_alert",
  "level": "info",
  "queue": "invoice-extraction",
  "message": "Queue invoice-extraction has 75 active jobs",
  "active": 75,
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

## Integration with External Monitoring

The JSON-formatted logs can be ingested by monitoring systems:

### Grafana + Loki

Configure Loki to parse JSON logs and create dashboards:
- Queue job counts over time
- Failure rates
- Processing latency
- Alert history

### CloudWatch

Use CloudWatch Logs Insights queries:
```
fields @timestamp, queue, waiting, active, failed
| filter type = "queue_metrics"
| stats avg(waiting), avg(active), sum(failed) by queue
```

### Datadog

Create monitors based on log metrics:
- Alert when `failed > threshold`
- Alert when `isPaused = true` and `waiting > 0`
- Alert when `active > 50`

## Security Considerations

### Production Deployment

1. **Generate Secure Admin Key**
```bash
openssl rand -base64 32
```

2. **IP Whitelisting** (Recommended)
Add IP restrictions in your reverse proxy (Nginx/Apache):
```nginx
location /admin/queues {
    allow 10.0.0.0/8;      # Internal network
    allow 203.0.113.0/24;  # Office IP range
    deny all;
    proxy_pass http://localhost:3000;
}
```

3. **VPN Access** (Most Secure)
Only allow access through VPN connection

4. **Environment Variables**
Never commit `.env` files or expose `QUEUE_ADMIN_KEY`

### HTTPS Only

The Bull Board dashboard should only be accessible over HTTPS in production.

## Troubleshooting

### Queue Not Appearing in Dashboard

1. Check if queue is registered in `queue.module.ts`
2. Verify queue is actually being used (has jobs)
3. Check Bull Board module imports in `queue-board.module.ts`

### Authentication Failing

1. Verify `QUEUE_ADMIN_KEY` is set in `.env`
2. Check header name: `X-Queue-Admin-Key` (case-sensitive)
3. For JWT: Ensure user has OWNER or ADMIN role

### Metrics Not Logging

1. Check `QUEUE_METRICS_ENABLED=true` in `.env`
2. Verify cron job is running (should run every 5 minutes)
3. Check application logs for errors

### High Memory Usage

If queues accumulate many completed jobs:

```bash
# Clean completed jobs older than 1 hour
curl -X POST -H "X-Queue-Admin-Key: your-key" \
  "https://operate.guru/admin/queues/email-sync/clean?status=completed&age=3600000"
```

Consider adding automatic cleanup to queue configuration:
```typescript
removeOnComplete: {
  age: 3600,    // 1 hour
  count: 100,   // Keep last 100
}
```

## Performance Considerations

### Queue Configuration

Each queue should be configured with appropriate:
- Job attempts and backoff
- Concurrency limits
- Rate limiting
- Job retention policies

### Redis Optimization

- Monitor Redis memory usage
- Configure appropriate `maxmemory-policy`
- Use Redis persistence (AOF) for critical queues
- Consider Redis cluster for high-volume queues

### Scaling

For high-volume scenarios:
- Deploy multiple worker instances
- Use queue priorities
- Implement job sharding
- Monitor and adjust concurrency

## Adding New Queues

When adding a new queue to the application:

1. **Register in queue.module.ts**
```typescript
BullModule.registerQueue(
  { name: 'my-new-queue' },
),
```

2. **Add to queue-board.module.ts**
```typescript
BullBoardModule.forFeature({
  name: 'my-new-queue',
  adapter: BullAdapter,
}),
```

3. **Inject in queue-health.controller.ts**
```typescript
constructor(
  @InjectQueue('my-new-queue') private myNewQueue: Queue,
) {}
```

4. **Add to getAllQueues() mapping**
```typescript
private getAllQueues(): Map<string, Queue> {
  return new Map([
    ['my-new-queue', this.myNewQueue],
  ]);
}
```

5. **Update queue-metrics.service.ts** (same steps)

## Support

For issues or questions:
- Check application logs: `pm2 logs operate-api`
- Review queue health: `/admin/queues/health`
- Inspect individual queues in Bull Board
- Check Redis connection and memory

## License

Internal use only - Operate business automation platform.
