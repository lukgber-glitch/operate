import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ElsterStatusService } from '../services/elster-status.service';
import { StatusCheckJobData } from '../types/elster-status.types';

/**
 * ELSTER Status Check Job Processor
 *
 * Background job that polls tigerVAT for status updates on pending filings.
 *
 * Job Flow:
 * 1. Receives job with filing ID
 * 2. Polls tigerVAT for status
 * 3. Updates filing status if changed
 * 4. Sends notification if status changed
 * 5. Reschedules if status is still pending
 *
 * Queue: elster-status
 * Job Name: check-status
 * Schedule: Every 5 minutes for pending filings
 * Max Retries: 20 (over ~100 minutes)
 */
@Processor('elster-status', {
  concurrency: 5, // Process up to 5 jobs concurrently
})
export class StatusCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(StatusCheckProcessor.name);

  constructor(private readonly statusService: ElsterStatusService) {
    super();
  }

  /**
   * Process status check job
   */
  async process(job: Job<StatusCheckJobData>): Promise<any> {
    const { filingId, organisationId, retryCount = 0 } = job.data;

    this.logger.log(
      `Processing status check job for filing ${filingId} (attempt ${retryCount + 1})`,
    );

    try {
      // Poll for updates
      const updatedFiling = await this.statusService.pollForUpdates(filingId, {
        force: true,
      });

      this.logger.log(
        `Status check completed for filing ${filingId}: ${updatedFiling.status}`,
      );

      // If still pending, reschedule another check
      if (
        updatedFiling.status === 'SUBMITTED' ||
        updatedFiling.status === 'PENDING'
      ) {
        // Schedule next check in 5 minutes
        await this.statusService.scheduleStatusCheck(filingId, 5 * 60 * 1000);
      }

      return {
        success: true,
        filingId,
        status: updatedFiling.status,
        checked: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Status check failed for filing ${filingId}: ${error.message}`,
        error.stack,
      );

      throw error; // Re-throw for BullMQ retry logic
    }
  }

  /**
   * Handle job completion
   */
  async onCompleted(job: Job<StatusCheckJobData>, result: any) {
    this.logger.log(
      `Status check job completed for filing ${job.data.filingId}`,
    );
  }

  /**
   * Handle job failure
   */
  async onFailed(job: Job<StatusCheckJobData>, error: Error) {
    this.logger.error(
      `Status check job failed for filing ${job.data.filingId}: ${error.message}`,
      error.stack,
    );

    // TODO: Send alert to admin if job fails after all retries
    if (job.attemptsMade >= (job.opts.attempts || 1)) {
      this.logger.error(
        `Status check job exhausted all retries for filing ${job.data.filingId}`,
      );
    }
  }

  /**
   * Handle job progress
   */
  async onProgress(job: Job<StatusCheckJobData>, progress: number | object) {
    this.logger.debug(
      `Status check job progress for filing ${job.data.filingId}: ${JSON.stringify(progress)}`,
    );
  }
}
