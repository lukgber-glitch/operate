# Email Sync Service - Quick Start Guide

## Overview

The Email Sync Service automatically syncs emails from connected Gmail and Outlook accounts, identifies financial documents (invoices, receipts), and stores them for processing.

## Quick Setup (5 Steps)

### 1. Run Database Migration

```bash
cd packages/database
npx prisma migrate dev --name add_email_sync_models
npx prisma generate
```

This creates the `SyncedEmail` and `EmailSyncJob` tables.

### 2. Configure Redis (for BullMQ)

Add to `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

Start Redis:
```bash
# Docker
docker run -d -p 6379:6379 redis:alpine

# Or use existing Redis instance
```

### 3. Import Module

In `apps/api/src/app.module.ts`:

```typescript
import { EmailSyncModule } from './modules/integrations/email-sync';

@Module({
  imports: [
    // ... other modules
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    EmailSyncModule, // Add this line
  ],
})
export class AppModule {}
```

### 4. Test the API

Start your server:
```bash
npm run start:dev
```

Trigger a sync (requires JWT token and existing email connection):
```bash
curl -X POST http://localhost:3000/api/integrations/email-sync/sync/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "your-connection-id",
    "syncType": "INCREMENTAL"
  }'
```

### 5. Monitor Progress

Check sync status:
```bash
curl http://localhost:3000/api/integrations/email-sync/sync/status/JOB_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/integrations/email-sync/sync/trigger` | Start sync |
| GET | `/integrations/email-sync/sync/status/:jobId` | Check progress |
| GET | `/integrations/email-sync/emails` | List synced emails |
| GET | `/integrations/email-sync/stats/:connectionId` | Get statistics |

## Common Use Cases

### 1. Sync Last 30 Days of Emails

```typescript
await emailSyncService.triggerSync({
  connectionId: 'clx123...',
  syncType: 'INCREMENTAL',
  searchQuery: 'has:attachment',
});
```

### 2. Find Unprocessed Invoices

```typescript
const { emails } = await emailSyncService.listSyncedEmails({
  connectionId: 'clx123...',
  isInvoice: true,
  processed: false,
  page: 1,
  limit: 50,
});
```

### 3. Get Sync Statistics

```typescript
const stats = await emailSyncService.getSyncStatistics('clx123...');
console.log(`Total emails: ${stats.totalEmailsSynced}`);
console.log(`Invoices found: ${stats.invoiceCount}`);
```

## Configuration Options

### Sync Types

- `INCREMENTAL` - Only new emails since last sync (default)
- `FULL` - All emails in date range
- `MANUAL` - User-triggered sync
- `SCHEDULED` - Automated sync (cron)

### Search Filters

Gmail syntax:
```typescript
searchQuery: 'has:attachment invoice OR receipt after:2024-01-01'
```

Outlook syntax (OData filter):
```typescript
filter: 'hasAttachments eq true and contains(subject, "invoice")'
```

## Monitoring

### Check Queue Status

```bash
# BullBoard UI (if installed)
http://localhost:3000/admin/queues

# Or use Redis CLI
redis-cli
> KEYS bull:email-sync:*
```

### View Logs

```bash
# Application logs
tail -f logs/app.log | grep EmailSync

# Or use your logging service
```

## Troubleshooting

### Sync Not Starting

**Check:**
1. Email connection exists and `syncEnabled = true`
2. Redis is running and accessible
3. No other sync is running for the same connection
4. JWT token is valid

### Emails Not Being Found

**Check:**
1. OAuth2 tokens are valid (not expired)
2. Search query is correct for the provider
3. Check sync job status for errors
4. Verify email account has attachments

### Rate Limit Errors

**Solution:**
- Wait for rate limit to reset (automatic)
- Sync jobs will resume automatically
- Check job status for `rateLimitResetAt`

## Performance Tips

1. **Use Incremental Sync** - Faster and more efficient
2. **Filter by Date Range** - Reduce emails to process
3. **Search Query** - Use specific queries (e.g., `has:attachment`)
4. **Monitor Queue Depth** - Don't queue too many syncs at once

## Next Steps

1. ✅ Set up email connections (Gmail/Outlook OAuth2)
2. ✅ Run initial full sync for each connection
3. ✅ Schedule daily incremental syncs (cron)
4. ✅ Implement attachment processing pipeline
5. ✅ Set up monitoring and alerts

## Documentation

- **Full Documentation**: `apps/api/src/modules/integrations/email-sync/README.md`
- **Implementation Report**: `TASK_W32-T3_EMAIL_SYNC_IMPLEMENTATION_REPORT.md`
- **API Docs**: `http://localhost:3000/api/docs` (Swagger)

## Support

For issues or questions:
1. Check the full README.md in the module directory
2. Review implementation report for technical details
3. Check API documentation at `/api/docs`
4. Review error logs in sync job status

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2025-12-03
