import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PaymentReminderService } from './payment-reminder.service';
import { ReminderEscalationService } from './reminder-escalation.service';

/**
 * Reminder Scheduler
 * Schedules automated tasks for payment reminders and escalations
 */
@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(
    @InjectQueue('payment-reminders') private reminderQueue: Queue,
    private reminderService: PaymentReminderService,
    private escalationService: ReminderEscalationService,
  ) {}

  /**
   * Check and send due reminders
   * Runs every day at 9:00 AM
   */
  @Cron('0 9 * * *', {
    name: 'check-due-reminders',
    timeZone: 'Europe/Berlin',
  })
  async checkAndSendReminders(): Promise<void> {
    this.logger.log('Starting scheduled reminder check');

    try {
      // Queue the check-overdue job
      await this.reminderQueue.add('check-overdue', {}, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log('Queued check-overdue job');
    } catch (error) {
      this.logger.error(
        `Failed to queue check-overdue job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check for escalations
   * Runs every day at 10:00 AM
   */
  @Cron('0 10 * * *', {
    name: 'check-escalations',
    timeZone: 'Europe/Berlin',
  })
  async checkEscalations(): Promise<void> {
    this.logger.log('Starting scheduled escalation check');

    try {
      // Queue the check-escalations job
      await this.reminderQueue.add('check-escalations', {}, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log('Queued check-escalations job');
    } catch (error) {
      this.logger.error(
        `Failed to queue check-escalations job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Clean up old sent reminders
   * Runs every Sunday at 2:00 AM
   */
  @Cron('0 2 * * 0', {
    name: 'cleanup-old-reminders',
    timeZone: 'Europe/Berlin',
  })
  async cleanupOldReminders(): Promise<void> {
    this.logger.log('Starting cleanup of old reminders');

    // TODO: Implement cleanup logic
    // Archive or delete reminders older than X days
    // This can be configured based on retention policy

    this.logger.log('Cleanup completed');
  }

  /**
   * Generate reminder statistics report
   * Runs every Monday at 8:00 AM
   */
  @Cron('0 8 * * 1', {
    name: 'reminder-statistics',
    timeZone: 'Europe/Berlin',
  })
  async generateStatistics(): Promise<void> {
    this.logger.log('Generating reminder statistics');

    // TODO: Implement statistics generation
    // Could send weekly report to admins about:
    // - Reminders sent
    // - Escalations triggered
    // - Payment success rate after reminders
    // - Overdue invoice trends

    this.logger.log('Statistics generation completed');
  }

  /**
   * Hourly check for immediate reminders
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'hourly-reminder-check',
  })
  async hourlyReminderCheck(): Promise<void> {
    this.logger.debug('Running hourly reminder check');

    try {
      const dueReminders = await this.reminderService.getDueReminders();

      if (dueReminders.length > 0) {
        this.logger.log(
          `Found ${dueReminders.length} reminders to send in hourly check`,
        );

        // Queue individual send jobs
        for (const reminder of dueReminders) {
          await this.reminderQueue.add(
            'send',
            { reminderId: reminder.id },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 1000,
              },
            },
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Hourly reminder check failed: ${error.message}`,
        error.stack,
      );
    }
  }
}
