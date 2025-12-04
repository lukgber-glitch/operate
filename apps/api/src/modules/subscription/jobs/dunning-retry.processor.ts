import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DunningService, DUNNING_RETRY_QUEUE } from '../services/dunning.service';

/**
 * Dunning Retry Processor
 * Handles scheduled payment retry jobs
 *
 * Job Flow:
 * 1. Triggered by dunning service at scheduled intervals
 * 2. Attempts to retry failed payment
 * 3. If successful: resolves dunning
 * 4. If failed: escalates to next dunning state
 *
 * Retry Schedule:
 * - Day 0: Immediate
 * - Day 3: Warning email + retry
 * - Day 7: Action required email + retry
 * - Day 14: Final warning email + retry
 * - Day 21: Suspend account
 */

export interface DunningRetryJobData {
  subscriptionId: string;
}

@Processor(DUNNING_RETRY_QUEUE)
export class DunningRetryProcessor {
  private readonly logger = new Logger(DunningRetryProcessor.name);

  constructor(private readonly dunningService: DunningService) {}

  @Process('retry-payment')
  async handleRetryPayment(job: Job<DunningRetryJobData>): Promise<void> {
    const { subscriptionId } = job.data;

    this.logger.log(`Processing payment retry job for subscription ${subscriptionId}`);

    try {
      // Attempt to retry the payment
      const success = await this.dunningService.retryPayment(subscriptionId);

      if (success) {
        this.logger.log(`Payment retry successful for subscription ${subscriptionId}`);
        job.progress(100);
      } else {
        this.logger.warn(`Payment retry failed for subscription ${subscriptionId}`);
        job.progress(50);
      }
    } catch (error) {
      this.logger.error(
        `Error processing retry job for subscription ${subscriptionId}: ${error.message}`,
        error.stack,
      );

      // Re-throw to trigger BullMQ retry mechanism
      throw error;
    }
  }

  /**
   * Job completed handler
   */
  @Process()
  async onCompleted(job: Job<DunningRetryJobData>): Promise<void> {
    this.logger.log(`Retry job completed for subscription ${job.data.subscriptionId}`);
  }

  /**
   * Job failed handler
   */
  @Process()
  async onFailed(job: Job<DunningRetryJobData>, error: Error): Promise<void> {
    this.logger.error(
      `Retry job failed for subscription ${job.data.subscriptionId}: ${error.message}`,
      error.stack,
    );

    // After max retries, escalate to next dunning state
    if (job.attemptsMade >= job.opts.attempts) {
      this.logger.warn(
        `Max retry attempts reached for subscription ${job.data.subscriptionId}, escalating`,
      );

      // Get current dunning state and escalate
      const dunningState = await this.dunningService.getDunningState(
        job.data.subscriptionId,
      );

      if (dunningState) {
        await this.dunningService.escalateDunning(
          job.data.subscriptionId,
          dunningState.retryCount + 1,
        );
      }
    }
  }

  /**
   * Job progress handler
   */
  @Process()
  async onProgress(job: Job<DunningRetryJobData>, progress: number): Promise<void> {
    this.logger.debug(
      `Retry job progress for subscription ${job.data.subscriptionId}: ${progress}%`,
    );
  }
}
