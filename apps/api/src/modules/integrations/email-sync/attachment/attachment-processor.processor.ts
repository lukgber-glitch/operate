import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AttachmentProcessorService, ATTACHMENT_PROCESSING_QUEUE } from './attachment-processor.service';

/**
 * Attachment Processor
 * BullMQ worker for processing email attachments asynchronously
 *
 * Job Types:
 * - process-attachment: Process a single attachment (download, store, classify, extract)
 * - bulk-process: Process multiple attachments in batch
 * - retry-failed: Retry failed attachments
 * - cleanup-storage: Clean up old attachments based on retention policy
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Progress tracking
 * - Error handling and logging
 * - Rate limiting per organization
 * - Concurrent processing with configurable limits
 */
@Processor(ATTACHMENT_PROCESSING_QUEUE)
export class AttachmentProcessorProcessor {
  private readonly logger = new Logger(AttachmentProcessorProcessor.name);

  constructor(
    private readonly attachmentProcessorService: AttachmentProcessorService,
  ) {}

  /**
   * Process a single attachment
   * Main job type for attachment processing pipeline
   *
   * Job Data:
   * - attachmentId: Attachment ID to process
   * - emailId: Email ID
   * - connectionId: Email connection ID
   * - provider: Email provider (GMAIL/OUTLOOK)
   * - externalId: Provider-specific attachment ID
   * - orgId: Organization ID
   * - userId: User ID
   * - skipScanning: Skip virus scanning (optional)
   *
   * Job Options:
   * - attempts: 3 (retry up to 3 times)
   * - backoff: Exponential backoff (1s, 2s, 4s)
   * - removeOnComplete: Keep completed jobs for 24h
   * - removeOnFail: Keep failed jobs for 7 days
   */
  @Process('process-attachment')
  async processAttachment(job: Job): Promise<void> {
    const { attachmentId, emailId, orgId, userId } = job.data;

    this.logger.log(
      `[Job ${job.id}] Processing attachment: ${attachmentId} (org: ${orgId})`,
    );

    try {
      // Report progress: Starting
      await job.progress(10);

      // Process attachment
      await this.attachmentProcessorService.processSingleAttachment(
        attachmentId,
        job.data,
      );

      // Report progress: Complete
      await job.progress(100);

      this.logger.log(
        `[Job ${job.id}] Successfully processed attachment: ${attachmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to process attachment ${attachmentId}: ${error.message}`,
        error.stack,
      );

      // Re-throw error to trigger retry
      throw error;
    }
  }

  /**
   * Process multiple attachments in bulk
   * Optimized batch processing for multiple attachments
   *
   * Job Data:
   * - attachmentIds: Array of attachment IDs
   * - orgId: Organization ID
   * - userId: User ID
   * - forceReprocess: Force reprocess (optional)
   */
  @Process('bulk-process')
  async bulkProcess(job: Job): Promise<void> {
    const { attachmentIds, orgId, userId } = job.data;

    this.logger.log(
      `[Job ${job.id}] Bulk processing ${attachmentIds.length} attachments (org: ${orgId})`,
    );

    const results = {
      total: attachmentIds.length,
      processed: 0,
      failed: 0,
    };

    try {
      for (let i = 0; i < attachmentIds.length; i++) {
        const attachmentId = attachmentIds[i];

        try {
          // Get attachment data
          const attachment = await this.getAttachmentJobData(attachmentId);

          // Process attachment
          await this.attachmentProcessorService.processSingleAttachment(
            attachmentId,
            {
              ...attachment,
              orgId,
              userId,
            },
          );

          results.processed++;

          // Report progress
          const progress = Math.round(((i + 1) / attachmentIds.length) * 100);
          await job.progress(progress);
        } catch (error) {
          this.logger.error(
            `[Job ${job.id}] Failed to process attachment ${attachmentId}: ${error.message}`,
          );
          results.failed++;
        }
      }

      this.logger.log(
        `[Job ${job.id}] Bulk processing complete: ${results.processed}/${results.total} succeeded, ${results.failed} failed`,
      );

      return results as any;
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Bulk processing failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retry failed attachments
   * Automatically retry attachments that failed processing
   *
   * Job Data:
   * - orgId: Organization ID
   * - emailId: Email ID (optional, to retry specific email)
   * - maxRetries: Maximum retry count threshold
   */
  @Process('retry-failed')
  async retryFailed(job: Job): Promise<void> {
    const { orgId, emailId, maxRetries } = job.data;

    this.logger.log(
      `[Job ${job.id}] Retrying failed attachments (org: ${orgId})`,
    );

    try {
      const result = await this.attachmentProcessorService.retryFailedAttachments(
        orgId,
        { emailId, maxRetries },
      );

      this.logger.log(
        `[Job ${job.id}] Queued ${result.queued} failed attachments for retry`,
      );

      return result as any;
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to retry attachments: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Clean up old attachments based on retention policy
   * Scheduled job to free up storage space
   *
   * Job Data:
   * - orgId: Organization ID
   * - retentionDays: Number of days to keep attachments
   * - dryRun: Preview cleanup without deleting (optional)
   */
  @Process('cleanup-storage')
  async cleanupStorage(job: Job): Promise<void> {
    const { orgId, retentionDays, dryRun } = job.data;

    this.logger.log(
      `[Job ${job.id}] Cleaning up storage (org: ${orgId}, retention: ${retentionDays} days, dryRun: ${dryRun})`,
    );

    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Find old attachments
      const oldAttachments = await this.findOldAttachments(orgId, cutoffDate);

      this.logger.log(
        `[Job ${job.id}] Found ${oldAttachments.length} old attachments to clean up`,
      );

      if (dryRun) {
        return {
          dryRun: true,
          totalFound: oldAttachments.length,
          attachments: oldAttachments.map((att) => ({
            id: att.id,
            filename: att.filename,
            size: att.size,
            createdAt: att.createdAt,
          })),
        } as any;
      }

      let deletedCount = 0;
      let freedSpace = 0;

      for (const attachment of oldAttachments) {
        try {
          await this.attachmentProcessorService.deleteAttachment(
            { attachmentId: attachment.id, deleteFromStorage: true },
            orgId,
          );

          deletedCount++;
          freedSpace += attachment.size;
        } catch (error) {
          this.logger.warn(
            `[Job ${job.id}] Failed to delete attachment ${attachment.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `[Job ${job.id}] Cleanup complete: deleted ${deletedCount} attachments, freed ${freedSpace} bytes`,
      );

      return {
        deleted: deletedCount,
        freedSpace,
        errors: oldAttachments.length - deletedCount,
      } as any;
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Storage cleanup failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Re-classify attachments with improved AI model
   * Scheduled job to improve classification accuracy
   *
   * Job Data:
   * - orgId: Organization ID
   * - confidenceThreshold: Only re-classify below this confidence
   */
  @Process('reclassify-attachments')
  async reclassifyAttachments(job: Job): Promise<void> {
    const { orgId, confidenceThreshold } = job.data;

    this.logger.log(
      `[Job ${job.id}] Re-classifying attachments (org: ${orgId}, threshold: ${confidenceThreshold})`,
    );

    // TODO: Implement re-classification logic
    // This would be useful when AI model improves or new classification rules are added

    this.logger.warn(
      `[Job ${job.id}] Re-classification not yet implemented`,
    );
  }

  /**
   * Helper: Get attachment job data
   */
  private async getAttachmentJobData(attachmentId: string): Promise<any> {
    // This would fetch attachment and email data to construct job payload
    // For now, return minimal data
    return {
      attachmentId,
      // Additional data would be fetched from database
    };
  }

  /**
   * Helper: Find old attachments for cleanup
   */
  private async findOldAttachments(
    orgId: string,
    cutoffDate: Date,
  ): Promise<any[]> {
    // This would query database for attachments older than cutoff date
    // For now, return empty array
    return [];
  }

  /**
   * Handle job completion
   */
  @Process('completed')
  async onCompleted(job: Job, result: any): Promise<void> {
    this.logger.debug(
      `[Job ${job.id}] Completed: ${job.name}`,
    );
  }

  /**
   * Handle job failure
   */
  @Process('failed')
  async onFailed(job: Job, error: Error): Promise<void> {
    this.logger.error(
      `[Job ${job.id}] Failed: ${job.name} - ${error.message}`,
    );
  }

  /**
   * Handle job progress
   */
  @Process('progress')
  async onProgress(job: Job, progress: number): Promise<void> {
    this.logger.debug(
      `[Job ${job.id}] Progress: ${progress}%`,
    );
  }
}
