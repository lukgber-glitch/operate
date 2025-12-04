import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DataDeletionService } from '../services/data-deletion.service';
import { AuditTrailService } from '../../gdpr/services/audit-trail.service';
import { GdprEventType, ActorType } from '../../gdpr/types/gdpr.types';
import { DeletionMode, DataCategory } from '../types/data-tools.types';

/**
 * Deletion Job Data Interface
 */
export interface DeletionJobData {
  jobId: string;
  userId: string;
  organisationId?: string;
  mode: DeletionMode;
  categories: DataCategory[];
  options: {
    cascade?: boolean;
    scheduledFor?: Date;
  };
  confirmed: boolean;
  confirmationToken?: string;
  requestedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Data Deletion Processor
 * Background job processor for data deletion operations
 */
@Injectable()
export class DataDeletionProcessor {
  private readonly logger = new Logger(DataDeletionProcessor.name);

  constructor(
    private readonly deletionService: DataDeletionService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  /**
   * Process deletion job
   */
  async process(job: Job<DeletionJobData>) {
    this.logger.log(
      `Processing deletion job ${job.data.jobId} for user ${job.data.userId}, mode: ${job.data.mode}`,
    );

    const startTime = Date.now();

    try {
      // Check if scheduled for future
      if (job.data.options.scheduledFor) {
        const scheduledTime = new Date(job.data.options.scheduledFor);
        if (scheduledTime > new Date()) {
          this.logger.log(`Deletion job ${job.data.jobId} scheduled for ${scheduledTime.toISOString()}`);
          await job.progress(0);
          // Job will be re-queued at scheduled time
          return {
            success: false,
            jobId: job.data.jobId,
            scheduled: true,
            scheduledFor: scheduledTime,
          };
        }
      }

      // Verify confirmation if required
      if (!job.data.confirmed) {
        throw new Error('Deletion not confirmed. Confirmation required before proceeding.');
      }

      await job.progress(10);

      // Log deletion start
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_DELETED,
        userId: job.data.userId,
        organisationId: job.data.organisationId,
        actorId: job.data.requestedBy,
        actorType: ActorType.USER,
        resourceType: 'DataDeletion',
        resourceId: job.data.jobId,
        details: {
          mode: job.data.mode,
          categories: job.data.categories,
          jobId: job.data.jobId,
        },
        ipAddress: job.data.ipAddress,
        userAgent: job.data.userAgent,
      });

      await job.progress(20);

      // Perform deletion
      const result = await this.deletionService.deleteUserData(
        job.data.userId,
        job.data.organisationId,
        job.data.mode,
        job.data.categories,
        job.data.options,
      );

      await job.progress(80);

      // Verify deletion completed
      const verified = await this.deletionService.verifyDeletionComplete(
        job.data.userId,
        job.data.categories,
      );

      if (!verified) {
        throw new Error('Deletion verification failed. Some data may still exist.');
      }

      await job.progress(90);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Deletion job ${job.data.jobId} completed in ${processingTime}ms. Deleted ${result.recordsDeleted} records.`,
      );

      // Log successful completion
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_DELETED,
        userId: job.data.userId,
        organisationId: job.data.organisationId,
        actorId: job.data.requestedBy,
        actorType: ActorType.SYSTEM,
        resourceType: 'DataDeletion',
        resourceId: job.data.jobId,
        details: {
          status: 'completed',
          recordsDeleted: result.recordsDeleted,
          tablesAffected: result.tablesAffected,
          verified: true,
          processingTimeMs: processingTime,
        },
      });

      await job.progress(100);

      return {
        success: true,
        jobId: job.data.jobId,
        result,
        verified,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Deletion job ${job.data.jobId} failed: ${error.message}`, error.stack);

      // Log failure
      await this.auditTrailService.logEvent({
        eventType: GdprEventType.DATA_DELETED,
        userId: job.data.userId,
        organisationId: job.data.organisationId,
        actorId: job.data.requestedBy,
        actorType: ActorType.SYSTEM,
        resourceType: 'DataDeletion',
        resourceId: job.data.jobId,
        details: {
          status: 'failed',
          error: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }

  /**
   * Handle job completion
   */
  async onCompleted(job: Job<DeletionJobData>, result: any) {
    this.logger.log(`Deletion job ${job.data.jobId} completed successfully`);

    // Could send confirmation email/notification to user here
  }

  /**
   * Handle job failure
   */
  async onFailed(job: Job<DeletionJobData>, error: Error) {
    this.logger.error(`Deletion job ${job.data.jobId} failed: ${error.message}`);

    // Could send failure notification to admin here
  }

  /**
   * Handle job progress
   */
  async onProgress(job: Job<DeletionJobData>, progress: number) {
    this.logger.debug(`Deletion job ${job.data.jobId} progress: ${progress}%`);
  }
}
