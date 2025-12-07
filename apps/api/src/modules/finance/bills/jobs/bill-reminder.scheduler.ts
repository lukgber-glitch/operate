import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Bill Reminder Scheduler
 * Schedules automated tasks for bill payment reminders and overdue checks
 */
@Injectable()
export class BillReminderScheduler {
  private readonly logger = new Logger(BillReminderScheduler.name);

  constructor(
    @InjectQueue('bill-reminders') private billReminderQueue: Queue,
  ) {}

  /**
   * Check for bills due soon (7, 3, 1 days)
   * Runs every day at 9:00 AM Europe/Berlin time
   */
  @Cron('0 9 * * *', {
    name: 'check-bills-due-soon',
    timeZone: 'Europe/Berlin',
  })
  async checkBillsDueSoon(): Promise<void> {
    this.logger.log('Starting scheduled bill reminder check');

    try {
      await this.billReminderQueue.add(
        'check-due-bills',
        {},
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log('Queued check-due-bills job');
    } catch (error) {
      this.logger.error(
        `Failed to queue check-due-bills job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check for overdue bills
   * Runs every day at 1:00 AM Europe/Berlin time
   * Runs early in the morning to mark bills overdue at start of day
   */
  @Cron('0 1 * * *', {
    name: 'check-overdue-bills',
    timeZone: 'Europe/Berlin',
  })
  async checkOverdueBills(): Promise<void> {
    this.logger.log('Starting scheduled overdue bills check');

    try {
      await this.billReminderQueue.add(
        'check-overdue-bills',
        {},
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log('Queued check-overdue-bills job');
    } catch (error) {
      this.logger.error(
        `Failed to queue check-overdue-bills job: ${error.message}`,
        error.stack,
      );
    }
  }
}
