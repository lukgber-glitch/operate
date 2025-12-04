import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DunningService, DUNNING_ESCALATE_QUEUE } from '../services/dunning.service';
import { DunningStatus } from '@prisma/client';

/**
 * Dunning Escalate Processor
 * Handles escalation of dunning states when retries continue to fail
 *
 * Escalation Flow:
 * RETRYING (Day 0)
 *    ↓
 * WARNING_SENT (Day 3) - Send warning email
 *    ↓
 * ACTION_REQUIRED (Day 7) - Send urgent email
 *    ↓
 * FINAL_WARNING (Day 14) - Send final warning
 *    ↓
 * SUSPENDED (Day 21) - Suspend account
 *
 * This processor ensures smooth state transitions and sends
 * appropriate notifications at each stage.
 */

export interface DunningEscalateJobData {
  subscriptionId: string;
  currentState: DunningStatus;
  retryCount: number;
}

@Processor(DUNNING_ESCALATE_QUEUE)
export class DunningEscalateProcessor {
  private readonly logger = new Logger(DunningEscalateProcessor.name);

  constructor(private readonly dunningService: DunningService) {}

  @Process('escalate-state')
  async handleEscalateState(job: Job<DunningEscalateJobData>): Promise<void> {
    const { subscriptionId, currentState, retryCount } = job.data;

    this.logger.log(
      `Processing escalation job for subscription ${subscriptionId}, current state: ${currentState}`,
    );

    try {
      // Get current dunning state
      const dunningState = await this.dunningService.getDunningState(subscriptionId);

      if (!dunningState) {
        this.logger.error(`No dunning state found for subscription ${subscriptionId}`);
        return;
      }

      // Check if already resolved
      if (dunningState.state === DunningStatus.RESOLVED) {
        this.logger.log(`Subscription ${subscriptionId} already resolved, skipping escalation`);
        return;
      }

      // Perform escalation
      await this.dunningService.escalateDunning(subscriptionId, retryCount);

      this.logger.log(
        `Successfully escalated dunning for subscription ${subscriptionId} from ${currentState}`,
      );

      job.progress(100);
    } catch (error) {
      this.logger.error(
        `Error processing escalation job for subscription ${subscriptionId}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  /**
   * Process check-escalation job
   * Runs periodically to check if any dunning states need escalation
   */
  @Process('check-escalation')
  async handleCheckEscalation(job: Job): Promise<void> {
    this.logger.log('Checking for dunning states that need escalation');

    try {
      // Get all active dunning states
      const activeDunning = await this.dunningService.getDunningList();

      const now = new Date();
      let escalatedCount = 0;

      for (const state of activeDunning) {
        // Skip resolved or suspended states
        if (
          state.state === DunningStatus.RESOLVED ||
          state.state === DunningStatus.SUSPENDED
        ) {
          continue;
        }

        // Check if it's time to escalate
        if (state.nextRetryAt && new Date(state.nextRetryAt) <= now) {
          this.logger.log(
            `Escalating subscription ${state.subscriptionId} (next retry overdue)`,
          );

          await this.dunningService.escalateDunning(
            state.subscriptionId,
            state.retryCount,
          );

          escalatedCount++;
        }
      }

      this.logger.log(`Escalation check complete: ${escalatedCount} states escalated`);
      job.progress(100);
    } catch (error) {
      this.logger.error(
        `Error checking for escalations: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  /**
   * Job completed handler
   */
  @Process()
  async onCompleted(job: Job<DunningEscalateJobData>): Promise<void> {
    if (job.data?.subscriptionId) {
      this.logger.log(
        `Escalation job completed for subscription ${job.data.subscriptionId}`,
      );
    } else {
      this.logger.log('Escalation check job completed');
    }
  }

  /**
   * Job failed handler
   */
  @Process()
  async onFailed(job: Job<DunningEscalateJobData>, error: Error): Promise<void> {
    if (job.data?.subscriptionId) {
      this.logger.error(
        `Escalation job failed for subscription ${job.data.subscriptionId}: ${error.message}`,
        error.stack,
      );
    } else {
      this.logger.error(
        `Escalation check job failed: ${error.message}`,
        error.stack,
      );
    }

    // Log to monitoring system for admin attention
    // TODO: Send alert to admin team
  }
}
