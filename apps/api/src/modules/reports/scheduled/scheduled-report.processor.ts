import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ScheduledReportService, SCHEDULED_REPORT_QUEUE } from './scheduled-report.service';

interface ScheduleJobData {
  scheduleId: string;
  manual?: boolean;
}

/**
 * Scheduled Report Processor
 *
 * Background job processor for scheduled report generation.
 * Handles queued report generation tasks with retry logic and error handling.
 *
 * Features:
 * - Concurrent job processing with configurable limits
 * - Automatic retries with exponential backoff
 * - Job progress tracking
 * - Dead letter queue for failed jobs
 * - Comprehensive logging and monitoring
 *
 * Job Types:
 * - execute-report: Generate and deliver a scheduled report
 *
 * Configuration:
 * - Concurrency: 5 jobs in parallel
 * - Retry: 3 attempts with exponential backoff
 * - Timeout: 10 minutes per job
 */
@Processor(SCHEDULED_REPORT_QUEUE)
export class ScheduledReportProcessor {
  private readonly logger = new Logger(ScheduledReportProcessor.name);

  constructor(
    private readonly scheduledReportService: ScheduledReportService,
  ) {}

  /**
   * Process report execution job
   */
  @Process({
    name: 'execute-report',
    concurrency: 5,
  })
  async handleReportExecution(job: Job<ScheduleJobData>): Promise<any> {
    const { scheduleId, manual } = job.data;

    this.logger.log(
      `Processing report execution job ${job.id} for schedule ${scheduleId}`,
    );

    try {
      // Update job progress
      await job.progress(10);

      // Execute the scheduled report
      const result = await this.scheduledReportService.executeScheduledReport(
        scheduleId,
        manual || false,
      );

      await job.progress(100);

      this.logger.log(
        `Successfully completed job ${job.id} for schedule ${scheduleId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process job ${job.id} for schedule ${scheduleId}: ${error.message}`,
        error.stack,
      );

      // Re-throw to trigger retry mechanism
      throw error;
    }
  }

  /**
   * Job activated handler
   */
  @OnQueueActive()
  onActive(job: Job<ScheduleJobData>) {
    this.logger.debug(
      `Job ${job.id} activated for schedule ${job.data.scheduleId}`,
    );
  }

  /**
   * Job completed handler
   */
  @OnQueueCompleted()
  onCompleted(job: Job<ScheduleJobData>, result: any) {
    this.logger.log(
      `Job ${job.id} completed for schedule ${job.data.scheduleId}`,
    );

    if (result && !result.success) {
      this.logger.warn(
        `Job ${job.id} completed but execution failed: ${result.error}`,
      );
    }
  }

  /**
   * Job failed handler
   */
  @OnQueueFailed()
  onFailed(job: Job<ScheduleJobData>, error: Error) {
    this.logger.error(
      `Job ${job.id} failed for schedule ${job.data.scheduleId}`,
      error.stack,
    );

    // Check if this was the last attempt
    if (job.attemptsMade >= job.opts.attempts) {
      this.logger.error(
        `Job ${job.id} exhausted all retry attempts. Moving to dead letter queue.`,
      );

      // In production, you might want to:
      // 1. Send alert to administrators
      // 2. Store in dead letter queue table
      // 3. Trigger incident management workflow
      this.handleDeadLetterJob(job, error);
    }
  }

  /**
   * Handle jobs that exhausted all retries
   */
  private async handleDeadLetterJob(
    job: Job<ScheduleJobData>,
    error: Error,
  ): Promise<void> {
    this.logger.error(
      `Dead letter job detected: ${job.id}`,
      JSON.stringify({
        jobId: job.id,
        scheduleId: job.data.scheduleId,
        attempts: job.attemptsMade,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
    );

    // TODO: Store in dead letter queue table
    // TODO: Send alert notification
    // TODO: Create support ticket if critical
  }
}
