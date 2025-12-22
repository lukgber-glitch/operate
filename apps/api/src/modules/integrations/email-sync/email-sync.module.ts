import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailSyncController } from './email-sync.controller';
import { EmailSyncService, EMAIL_SYNC_QUEUE } from './email-sync.service';
import { EmailSyncProcessor } from './email-sync.processor';
import { EmailSyncScheduler } from './email-sync.scheduler';
import { DatabaseModule } from '../../database/database.module';

// Import Gmail and Outlook modules
import { GmailModule } from '../gmail/gmail.module';
import { OutlookModule } from '../outlook/outlook.module';
import { AttachmentProcessorModule } from './attachment/attachment-processor.module';

// Import Email Intelligence module for classification and suggestions
import { EmailIntelligenceModule } from '../../ai/email-intelligence/email-intelligence.module';

// Import Mailbox service and controller
import { MailboxService } from './mailbox.service';
import { MailboxController } from './mailbox.controller';

/**
 * Email Sync Module
 * Handles synchronization of emails from Gmail and Outlook
 *
 * Features:
 * - Incremental and full email sync
 * - Automatic scheduled sync (every 30 minutes)
 * - Background processing with BullMQ
 * - Financial document detection (invoices, receipts)
 * - Rate limiting and error handling
 * - Sync job management and monitoring
 * - Attachment metadata storage
 *
 * Dependencies:
 * - GmailModule: For Gmail API operations
 * - OutlookModule: For Outlook/Graph API operations
 * - BullModule: For background job processing
 * - ScheduleModule: For automatic scheduled syncs
 * - PrismaService: For database operations
 *
 * Exports:
 * - EmailSyncService: For use in other modules
 * - MailboxService: For mailbox configuration management
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [EmailSyncModule],
 * })
 * export class AppModule {}
 * ```
 *
 * API Endpoints:
 * - POST /integrations/email-sync/sync/trigger - Trigger sync
 * - GET /integrations/email-sync/sync/status/:jobId - Get status
 * - POST /integrations/email-sync/sync/cancel - Cancel sync
 * - GET /integrations/email-sync/emails - List synced emails
 * - GET /integrations/email-sync/stats/:connectionId - Get statistics
 *
 * Background Jobs:
 * - sync-emails: Main sync job (fetches emails from provider)
 * - process-email-attachments: Process attachments for single email
 * - classify-email: AI classification of email content
 *
 * Scheduled Tasks:
 * - email-sync-scheduler: Automatic sync every 30 minutes for active connections
 */
@Module({
  imports: [
    // Import database module
    DatabaseModule,

    // Import schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Import Gmail and Outlook integration modules
    GmailModule,
    OutlookModule,

    // Import attachment processor module
    AttachmentProcessorModule,

    // Import Email Intelligence module
    EmailIntelligenceModule,

    // Register Bull queue for email sync jobs
    BullModule.registerQueue({
      name: EMAIL_SYNC_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
      },
      limiter: {
        max: 10, // Max 10 jobs processed
        duration: 1000, // Per second
      },
    }),
  ],
  controllers: [EmailSyncController, MailboxController],
  providers: [
    EmailSyncService,
    EmailSyncProcessor,
    EmailSyncScheduler,
    MailboxService,
  ],
  exports: [EmailSyncService, MailboxService],
})
export class EmailSyncModule {}
