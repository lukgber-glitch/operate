import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { AttachmentProcessorService, ATTACHMENT_PROCESSING_QUEUE } from './attachment-processor.service';
import { AttachmentProcessorProcessor } from './attachment-processor.processor';
import { AttachmentStorageService } from './attachment-storage.service';
import { AttachmentClassifierService } from './attachment-classifier.service';
import { DatabaseModule } from '@/modules/database/database.module';
import { GmailModule } from '../../gmail/gmail.module';
import { OutlookModule } from '../../outlook/outlook.module';
import { InvoiceExtractorModule } from '../../../ai/extractors/invoice-extractor.module';
import { ReceiptExtractorModule } from '../../../ai/extractors/receipt-extractor.module';

/**
 * Attachment Processor Module
 * Handles email attachment processing, storage, and classification
 *
 * Provides:
 * - AttachmentProcessorService: Main service for attachment processing
 * - AttachmentStorageService: Storage management (local/S3)
 * - AttachmentClassifierService: AI-based classification
 * - AttachmentProcessorProcessor: BullMQ worker
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - GmailModule: Gmail attachment downloads
 * - OutlookModule: Outlook attachment downloads
 * - BullModule: Job queue for async processing
 *
 * Configuration:
 * Environment variables required:
 * - ATTACHMENT_STORAGE_BACKEND: 'LOCAL' or 'S3' (default: LOCAL)
 * - ATTACHMENT_STORAGE_PATH: Local storage directory (default: ./storage/attachments)
 * - AWS_S3_BUCKET: S3 bucket name (required for S3 backend)
 * - AWS_S3_REGION: S3 region (required for S3 backend)
 * - AWS_ACCESS_KEY_ID: AWS access key (required for S3 backend)
 * - AWS_SECRET_ACCESS_KEY: AWS secret key (required for S3 backend)
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    GmailModule,
    OutlookModule,
    InvoiceExtractorModule,
    ReceiptExtractorModule,
    BullModule.registerQueue({
      name: ATTACHMENT_PROCESSING_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000, // Start with 1 second
        },
        removeOnComplete: {
          age: 86400, // 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 604800, // 7 days
          count: 5000, // Keep last 5000 failed jobs
        },
      },
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // Per second
      },
    }),
    BullModule.registerQueue({
      name: 'invoice-extraction',
    }),
    BullModule.registerQueue({
      name: 'receipt-extraction',
    }),
  ],
  providers: [
    AttachmentProcessorService,
    AttachmentProcessorProcessor,
    AttachmentStorageService,
    AttachmentClassifierService,
  ],
  exports: [
    AttachmentProcessorService,
    AttachmentStorageService,
    AttachmentClassifierService,
  ],
})
export class AttachmentProcessorModule {}
