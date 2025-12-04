# Email Sync Service

Email synchronization service for Operate/CoachOS that syncs emails from connected Gmail and Outlook accounts, filters for financial documents (invoices, receipts), and triggers attachment processing.

## Features

- **Multi-Provider Support**: Works with Gmail and Outlook via OAuth2
- **Incremental Sync**: Only fetches new emails since last sync
- **Full Sync**: Can fetch all emails in a date range
- **Financial Document Detection**: Automatically identifies invoices, receipts, and financial documents
- **Background Processing**: Uses BullMQ for async processing
- **Rate Limiting**: Handles provider rate limits gracefully
- **Progress Tracking**: Real-time sync job status and progress
- **Error Handling**: Automatic retries with exponential backoff
- **Attachment Metadata**: Stores attachment information for processing pipeline

## Architecture

```
┌─────────────────┐
│  Email Sync     │
│  Controller     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Email Sync     │─────▶│   BullMQ     │
│  Service        │      │   Queue      │
└────────┬────────┘      └──────┬───────┘
         │                      │
         │                      ▼
         │              ┌──────────────┐
         │              │  Email Sync  │
         │              │  Processor   │
         │              └──────┬───────┘
         │                     │
         ▼                     ▼
┌─────────────────────────────────────┐
│         Gmail Service               │
│      Outlook Service                │
│      (OAuth2 Integration)           │
└─────────────────────────────────────┘
```

## Database Models

### SyncedEmail

Stores metadata about synced emails:

- Provider information (Gmail/Outlook)
- Email metadata (subject, from, to, dates)
- Attachment information
- Classification (invoice/receipt/financial)
- Processing status

### EmailSyncJob

Tracks sync operations:

- Job status and progress
- Sync statistics
- Error tracking
- Rate limiting info
- Performance metrics

## API Endpoints

### Trigger Sync

```http
POST /integrations/email-sync/sync/trigger
Content-Type: application/json

{
  "connectionId": "clx1234567890",
  "syncType": "INCREMENTAL",
  "searchQuery": "has:attachment invoice OR receipt"
}
```

**Response:**
```json
{
  "jobId": "clx9876543210",
  "connectionId": "clx1234567890",
  "status": "PENDING",
  "provider": "GMAIL",
  "totalEmails": 0,
  "processedEmails": 0
}
```

### Get Sync Status

```http
GET /integrations/email-sync/sync/status/:jobId
```

**Response:**
```json
{
  "jobId": "clx9876543210",
  "status": "RUNNING",
  "progress": 45,
  "totalEmails": 100,
  "processedEmails": 45,
  "newEmails": 23,
  "failedEmails": 0
}
```

### List Synced Emails

```http
GET /integrations/email-sync/emails?connectionId=clx1234567890&isInvoice=true&page=1&limit=50
```

### Get Statistics

```http
GET /integrations/email-sync/stats/:connectionId
```

**Response:**
```json
{
  "connectionId": "clx1234567890",
  "provider": "GMAIL",
  "totalEmailsSynced": 1543,
  "emailsWithAttachments": 432,
  "invoiceCount": 156,
  "receiptCount": 89,
  "financialCount": 267,
  "processedCount": 245,
  "pendingCount": 22
}
```

### Cancel Sync

```http
POST /integrations/email-sync/sync/cancel
Content-Type: application/json

{
  "jobId": "clx9876543210",
  "reason": "User requested cancellation"
}
```

### Retry Failed Emails

```http
POST /integrations/email-sync/retry
Content-Type: application/json

{
  "connectionId": "clx1234567890",
  "maxEmails": 50,
  "maxRetryCount": 3
}
```

## Usage Examples

### Trigger Manual Sync

```typescript
import { EmailSyncService } from '@/modules/integrations/email-sync';

// Inject the service
constructor(private emailSyncService: EmailSyncService) {}

// Trigger sync
async syncEmails(connectionId: string) {
  const job = await this.emailSyncService.triggerSync({
    connectionId,
    syncType: 'INCREMENTAL',
    searchQuery: 'has:attachment',
  });

  console.log(`Sync job ${job.id} started`);
}
```

### Monitor Sync Progress

```typescript
async monitorSync(jobId: string) {
  const status = await this.emailSyncService.getSyncStatus(jobId);

  console.log(`Progress: ${status.progress}%`);
  console.log(`Processed: ${status.processedEmails}/${status.totalEmails}`);
  console.log(`Status: ${status.status}`);
}
```

### Query Synced Emails

```typescript
async getInvoices(connectionId: string) {
  const result = await this.emailSyncService.listSyncedEmails({
    connectionId,
    isInvoice: true,
    hasAttachments: true,
    processed: false, // Not yet processed
    page: 1,
    limit: 50,
  });

  return result.emails;
}
```

## Configuration

### Environment Variables

```env
# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Gmail OAuth2
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/gmail/callback

# Outlook OAuth2
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3000/auth/outlook/callback
```

### Queue Configuration

The module uses BullMQ with the following defaults:

- **Attempts**: 3 retries with exponential backoff
- **Rate Limiting**: Max 10 jobs per second
- **Job Retention**:
  - Completed: 24 hours (last 100)
  - Failed: 7 days

## Rate Limits

### Gmail API
- **Quota**: 250 units per user per second
- **Strategy**: Pre-emptive rate limiting with backoff

### Microsoft Graph (Outlook)
- **Quota**: 10,000 requests per 10 minutes per app per tenant
- **Strategy**: Pre-emptive rate limiting with backoff

## Classification Logic

Emails are automatically classified based on:

1. **Subject Line Keywords**: invoice, bill, receipt, payment, etc.
2. **Email Body Content**: Financial terms and patterns
3. **Sender Domain**: Common invoice sender domains (Stripe, PayPal, etc.)
4. **Attachment Types**: PDF, images (common for invoices)

**Confidence Scoring:**
- Has attachments: +30%
- Financial attachment types (PDF, images): +25%
- Contains financial keywords: +30%
- From invoice sender domain: +15%

## Error Handling

### Automatic Retries

Jobs automatically retry up to 3 times with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: After 5 seconds
- Attempt 3: After 25 seconds

### Rate Limit Handling

When rate limits are hit:
1. Job status changes to `RATE_LIMITED`
2. Job pauses until rate limit resets
3. Automatically resumes when limit clears

### Failed Email Processing

Failed emails can be retried manually:
```typescript
await emailSyncService.retryFailedEmails({
  connectionId,
  maxEmails: 50,
  maxRetryCount: 3,
});
```

## Performance

### Sync Speed

- **Gmail**: ~50 emails per batch, ~200 emails/minute
- **Outlook**: ~50 emails per batch, ~150 emails/minute

### Database Indexes

Optimized indexes for common queries:
- `connectionId` + `externalId` (unique)
- `orgId`, `userId`, `provider`
- `receivedAt`, `processed`, `isInvoice`, `isReceipt`
- `hasAttachments`, `lastSyncedAt`

## Testing

```bash
# Unit tests
npm test email-sync.service.spec.ts

# Integration tests
npm test email-sync.integration.spec.ts

# E2E tests
npm run test:e2e email-sync
```

## Monitoring

### Key Metrics

- Sync job success/failure rate
- Average sync duration
- Emails synced per hour
- Classification accuracy
- API error rates
- Queue depth and processing rate

### Logging

All operations are logged with context:
```
[EmailSyncService] Triggering sync for connection clx123...
[EmailSyncProcessor] Processing sync job clx987...
[EmailSyncProcessor] Sync completed: 45 new emails, 0 errors
```

## Troubleshooting

### Sync Not Starting

1. Check connection is enabled: `syncEnabled = true`
2. Verify no other sync is running for same connection
3. Check Redis connection for queue

### High Error Rate

1. Check provider API credentials
2. Verify token refresh is working
3. Review rate limit settings
3. Check network connectivity

### Slow Sync Performance

1. Review rate limiting configuration
2. Check database query performance
3. Monitor Redis queue depth
4. Consider batch size adjustments

## Future Enhancements

- [ ] AI-powered classification with ML model
- [ ] Duplicate detection across providers
- [ ] Thread/conversation grouping
- [ ] Advanced search with full-text
- [ ] Real-time sync with webhooks (Gmail push notifications)
- [ ] Attachment content extraction
- [ ] Email categorization beyond financial
- [ ] Multi-language support for classification

## Related Modules

- **Gmail Module**: OAuth2 and Gmail API integration
- **Outlook Module**: OAuth2 and Microsoft Graph integration
- **Document Processing**: Attachment processing pipeline
- **AI Classification**: ML-based document classification

## License

Copyright © 2024 Operate/CoachOS
