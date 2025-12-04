import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { XeroSyncService } from '../services/xero-sync.service';

/**
 * Xero Sync Job Data
 */
export interface XeroSyncJobData {
  orgId: string;
  xeroTenantId?: string;
  syncMode: 'full' | 'incremental';
  triggeredBy?: string;
}

/**
 * Xero Sync Job Processor
 * Handles background sync jobs using BullMQ
 *
 * Job Types:
 * - xero-full-sync: Full sync of all data
 * - xero-incremental-sync: Incremental sync of changed data (runs every 15 minutes)
 * - xero-manual-sync: Manual sync triggered by user
 *
 * Configuration:
 * - Scheduled full sync: Configurable via environment (default: daily at 2 AM)
 * - Incremental sync: Every 15 minutes
 * - Manual sync: On-demand via API
 */
@Processor('xero-sync', {
  concurrency: 2, // Process up to 2 sync jobs simultaneously
  limiter: {
    max: 10, // Max 10 jobs per...
    duration: 60000, // ...60 seconds (10 jobs/minute)
  },
})
export class XeroSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(XeroSyncProcessor.name);

  constructor(private readonly xeroSyncService: XeroSyncService) {
    super();
  }

  /**
   * Process Xero sync jobs
   */
  async process(job: Job<XeroSyncJobData>): Promise<any> {
    const { orgId, xeroTenantId, syncMode, triggeredBy } = job.data;

    this.logger.log(
      `Processing Xero ${syncMode} sync for org ${orgId} (Job ${job.id})`,
    );

    try {
      let result;

      if (syncMode === 'full') {
        // Full sync
        result = await this.xeroSyncService.performFullSync(
          orgId,
          xeroTenantId,
          triggeredBy || `job:${job.id}`,
        );
      } else {
        // Incremental sync
        result = await this.xeroSyncService.performIncrementalSync(
          orgId,
          undefined, // Use default cutoff (last sync)
          xeroTenantId,
          triggeredBy || `job:${job.id}`,
        );
      }

      this.logger.log(
        `Xero ${syncMode} sync completed for org ${orgId} (Job ${job.id})`,
      );

      // Update job progress
      await job.updateProgress(100);

      return {
        success: true,
        orgId,
        syncMode,
        result,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Xero ${syncMode} sync failed for org ${orgId} (Job ${job.id}): ${error.message}`,
        error.stack,
      );

      // Update job with error
      await job.log(`Error: ${error.message}`);

      throw error; // Re-throw to mark job as failed
    }
  }

  /**
   * Handle job completion
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job<XeroSyncJobData>) {
    const { orgId, syncMode } = job.data;
    this.logger.log(
      `Job ${job.id} completed: ${syncMode} sync for org ${orgId}`,
    );
  }

  /**
   * Handle job failure
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job<XeroSyncJobData>, error: Error) {
    const { orgId, syncMode } = job.data;
    this.logger.error(
      `Job ${job.id} failed: ${syncMode} sync for org ${orgId}`,
      error.stack,
    );
  }

  /**
   * Handle job progress
   */
  @OnWorkerEvent('progress')
  onProgress(job: Job<XeroSyncJobData>, progress: number) {
    const { orgId } = job.data;
    this.logger.debug(`Job ${job.id} progress: ${progress}% (org ${orgId})`);
  }
}

/**
 * Xero Sync Job Scheduler
 * Registers repeatable jobs for scheduled syncs
 */
export class XeroSyncScheduler {
  private readonly logger = new Logger(XeroSyncScheduler.name);

  /**
   * Schedule incremental sync (every 15 minutes)
   */
  static getIncrementalSyncSchedule() {
    return {
      pattern: '*/15 * * * *', // Every 15 minutes
      jobName: 'xero-incremental-sync',
    };
  }

  /**
   * Schedule full sync (daily at 2 AM)
   */
  static getFullSyncSchedule() {
    return {
      pattern: '0 2 * * *', // Daily at 2 AM
      jobName: 'xero-full-sync',
    };
  }

  /**
   * Get job options for Xero sync
   */
  static getJobOptions(jobType: 'full' | 'incremental') {
    return {
      attempts: 3, // Retry up to 3 times
      backoff: {
        type: 'exponential',
        delay: 60000, // Start with 1 minute delay
      },
      removeOnComplete: {
        age: 86400, // Remove completed jobs after 24 hours
        count: 100, // Keep last 100 completed jobs
      },
      removeOnFail: {
        age: 604800, // Remove failed jobs after 7 days
        count: 50, // Keep last 50 failed jobs
      },
    };
  }
}
