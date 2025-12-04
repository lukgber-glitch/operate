/**
 * Deadline Check Scheduler
 * Triggers daily deadline check job at 8:00 AM
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DEADLINE_CHECK_QUEUE } from './daily-deadline-check.processor';

@Injectable()
export class DeadlineCheckScheduler {
  private readonly logger = new Logger(DeadlineCheckScheduler.name);

  constructor(
    @InjectQueue(DEADLINE_CHECK_QUEUE)
    private readonly deadlineCheckQueue: Queue,
  ) {}

  /**
   * Schedule daily deadline check at 8:00 AM every day
   */
  @Cron('0 8 * * *', {
    name: 'daily-deadline-check',
    timeZone: 'UTC',
  })
  async scheduleDailyDeadlineCheck() {
    this.logger.log('Triggering daily deadline check job');

    try {
      const job = await this.deadlineCheckQueue.add(
        'check-deadlines',
        {
          triggeredBy: 'scheduler',
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
        },
      );

      this.logger.log(`Daily deadline check job scheduled with ID ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to schedule deadline check job: ${error.message}`);
    }
  }

  /**
   * Manual trigger for deadline check
   * Can be called from admin API or during testing
   */
  async triggerManualCheck(organizationId?: string) {
    this.logger.log(
      `Manually triggering deadline check${organizationId ? ` for org ${organizationId}` : ''}`,
    );

    try {
      const job = await this.deadlineCheckQueue.add(
        'check-deadlines',
        {
          triggeredBy: 'manual',
          organizationId,
        },
        {
          priority: 1, // Higher priority for manual triggers
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000,
          },
        },
      );

      this.logger.log(`Manual deadline check job created with ID ${job.id}`);
      return { jobId: job.id };
    } catch (error) {
      this.logger.error(`Failed to trigger manual deadline check: ${error.message}`);
      throw error;
    }
  }
}
