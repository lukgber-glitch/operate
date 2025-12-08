# Email→Bill Automation Integration Guide

## Quick Integration Steps

### 1. Update email-sync.module.ts

Replace the current module configuration with:

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailSyncController } from './email-sync.controller';
import { EmailSyncService, EMAIL_SYNC_QUEUE } from './email-sync.service';
import { EmailSyncProcessor } from './email-sync.processor';
import { DatabaseModule } from '../../database/database.module';

// Import Gmail and Outlook modules
import { GmailModule } from '../gmail/gmail.module';
import { OutlookModule } from '../outlook/outlook.module';
import { AttachmentProcessorModule } from './attachment/attachment-processor.module';

// Import Email Intelligence module
import { EmailIntelligenceModule } from '../../ai/email-intelligence/email-intelligence.module';

// Import AI Extractors
import { InvoiceExtractorModule } from '../../ai/extractors/invoice-extractor.module';

// Import Email Bill Automation (NEW)
import { EmailBillAutomationService } from './email-bill-automation.service';
import { EmailBillAutomationController } from './email-bill-automation.controller';
import { EmailToBillProcessor } from './email-to-bill.processor';

@Module({
  imports: [
    DatabaseModule,
    GmailModule,
    OutlookModule,
    AttachmentProcessorModule,
    EmailIntelligenceModule,
    InvoiceExtractorModule,

    // Existing queue
    BullModule.registerQueue({
      name: EMAIL_SYNC_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),

    // NEW: Email-to-Bill queue
    BullModule.registerQueue({
      name: 'email-to-bill',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 86400, count: 100 },
      },
    }),
  ],
  controllers: [
    EmailSyncController,
    EmailBillAutomationController, // NEW
  ],
  providers: [
    EmailSyncService,
    EmailSyncProcessor,
    EmailBillAutomationService,    // NEW
    EmailToBillProcessor,          // NEW
  ],
  exports: [
    EmailSyncService,
    EmailBillAutomationService,    // NEW
  ],
})
export class EmailSyncModule {}
```

### 2. Run Database Migrations (Optional)

These fields are optional but recommended for better tracking:

```sql
-- Add bill tracking fields to ExtractedInvoice
ALTER TABLE "ExtractedInvoice"
  ADD COLUMN IF NOT EXISTS "billCreated" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "billId" TEXT;

-- Add bill reference to EmailAttachment
ALTER TABLE "EmailAttachment"
  ADD COLUMN IF NOT EXISTS "billId" TEXT;

-- Add foreign key constraints
ALTER TABLE "ExtractedInvoice"
  ADD CONSTRAINT "ExtractedInvoice_billId_fkey"
  FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL;

ALTER TABLE "EmailAttachment"
  ADD CONSTRAINT "EmailAttachment_billId_fkey"
  FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL;
```

Or update Prisma schema and run migration:

```prisma
model ExtractedInvoice {
  id                  String                    @id @default(cuid())
  // ... existing fields ...
  billCreated         Boolean                   @default(false)
  billId              String?
  bill                Bill?                     @relation(fields: [billId], references: [id])
}

model EmailAttachment {
  id                String                    @id @default(cuid())
  // ... existing fields ...
  billId            String?
  bill              Bill?                     @relation(fields: [billId], references: [id])
}
```

Then run:
```bash
npx prisma migrate dev --name add-bill-automation-fields
```

### 3. Test the Integration

```bash
# 1. Start the API
cd apps/api
npm run dev

# 2. Process a test email (replace with real IDs)
curl -X POST http://localhost:3001/organisations/{orgId}/email-automation/process-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "test-email-id",
    "autoApprove": false,
    "minConfidence": 0.7
  }'

# 3. Check automation stats
curl http://localhost:3001/organisations/{orgId}/email-automation/stats?days=30 \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Get pending bills
curl http://localhost:3001/organisations/{orgId}/email-automation/pending-bills \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## API Endpoints Summary

Base URL: `/organisations/:orgId/email-automation`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/process-email` | Process specific email for bills |
| POST | `/process-all` | Batch process all invoice emails |
| GET | `/stats` | Get automation statistics |
| GET | `/pending-bills` | List draft bills awaiting review |
| POST | `/bills/:billId/approve` | Approve a draft bill |
| POST | `/bills/:billId/reject` | Reject a draft bill |

## Configuration

Uses existing environment variables:
- `OPENAI_API_KEY` - For GPT-4 Vision extraction
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` - Gmail OAuth
- `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET` - Outlook OAuth
- `REDIS_HOST`, `REDIS_PORT` - For Bull queues

No additional configuration needed!

## Troubleshooting

### Bills not being created?

1. Check if email sync is working:
   ```bash
   GET /integrations/email-sync/emails?limit=10
   ```

2. Check if attachments are being extracted:
   ```bash
   GET /integrations/email-sync/emails?isInvoice=true&hasAttachments=true
   ```

3. Check extraction confidence scores:
   - Bills are only created if confidence >= 0.7 (configurable)
   - Check extraction records in database

4. Check vendor creation:
   - Ensure vendors can be auto-created or already exist
   - Check vendor matching logic

### Queue not processing?

1. Verify Redis is running
2. Check Bull queue health:
   ```bash
   GET /health
   ```
3. Check queue logs:
   ```bash
   npm run logs:api | grep "email-to-bill"
   ```

## Support

For questions or issues:
1. Check audit report: `audits/fixes/p1-h001-email-bill-automation.md`
2. Review service code: `email-bill-automation.service.ts`
3. Check processor logs: `email-to-bill.processor.ts`
