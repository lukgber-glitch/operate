import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RecurringInvoiceService } from './recurring-invoice.service';
import { RecurringInvoice } from '@prisma/client';

/**
 * Recurring Invoice Scheduler
 * Schedules and manages recurring invoice generation jobs
 */
@Injectable()
export class RecurringInvoiceScheduler {
  private readonly logger = new Logger(RecurringInvoiceScheduler.name);

  constructor(
    @InjectQueue('recurring-invoices')
    private readonly recurringInvoicesQueue: Queue,
    private readonly recurringInvoiceService: RecurringInvoiceService,
  ) {}

  /**
   * Schedule the next invoice generation for a recurring invoice
   */
  async scheduleNextRun(recurringInvoice: RecurringInvoice): Promise<void> {
    if (!recurringInvoice.isActive) {
      this.logger.debug(
        `Skipping scheduling for inactive recurring invoice ${recurringInvoice.id}`,
      );
      return;
    }

    const now = new Date();
    const nextRunDate = new Date(recurringInvoice.nextRunDate);

    // Check if end date has passed
    if (recurringInvoice.endDate && new Date(recurringInvoice.endDate) < now) {
      this.logger.log(
        `Recurring invoice ${recurringInvoice.id} has ended, skipping scheduling`,
      );
      return;
    }

    // Calculate delay in milliseconds
    const delay = Math.max(0, nextRunDate.getTime() - now.getTime());

    // Add job to queue with delay
    await this.recurringInvoicesQueue.add(
      'generate',
      { recurringInvoiceId: recurringInvoice.id },
      {
        delay,
        jobId: `recurring-invoice-${recurringInvoice.id}-${nextRunDate.getTime()}`,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
      },
    );

    this.logger.log(
      `Scheduled recurring invoice ${recurringInvoice.id} to generate at ${nextRunDate.toISOString()} (delay: ${delay}ms)`,
    );
  }

  /**
   * Check for due recurring invoices every hour
   * This is a safety net to catch any invoices that might have been missed
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkDueInvoices(): Promise<void> {
    this.logger.log('Running hourly check for due recurring invoices...');

    try {
      const dueInvoices =
        await this.recurringInvoiceService.getDueForProcessing();

      if (dueInvoices.length === 0) {
        this.logger.debug('No due recurring invoices found');
        return;
      }

      this.logger.log(`Found ${dueInvoices.length} due recurring invoices`);

      // Queue each invoice for immediate generation
      for (const invoice of dueInvoices) {
        try {
          await this.recurringInvoicesQueue.add(
            'generate',
            { recurringInvoiceId: invoice.id },
            {
              priority: 1, // High priority for overdue invoices
              removeOnComplete: true,
              removeOnFail: false,
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 60000,
              },
            },
          );

          this.logger.log(
            `Queued overdue recurring invoice ${invoice.id} for generation`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to queue recurring invoice ${invoice.id}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to check for due recurring invoices',
        error.stack,
      );
    }
  }

  /**
   * Initialize scheduling for all active recurring invoices
   * This should be called on application startup
   */
  async initializeSchedules(): Promise<void> {
    this.logger.log('Initializing recurring invoice schedules...');

    try {
      // Get all active recurring invoices
      const { data: activeInvoices } =
        await this.recurringInvoiceService.findAll(null, {
          isActive: true,
          pageSize: 1000, // Get all active invoices
        });

      this.logger.log(
        `Found ${activeInvoices.length} active recurring invoices`,
      );

      for (const invoice of activeInvoices) {
        try {
          await this.scheduleNextRun(invoice);
        } catch (error) {
          this.logger.error(
            `Failed to schedule recurring invoice ${invoice.id}`,
            error.stack,
          );
        }
      }

      this.logger.log('Recurring invoice schedules initialized');
    } catch (error) {
      this.logger.error(
        'Failed to initialize recurring invoice schedules',
        error.stack,
      );
    }
  }

  /**
   * Daily cleanup job - runs at 2 AM
   * Removes old completed jobs and checks for stale schedules
   */
  @Cron('0 2 * * *')
  async dailyCleanup(): Promise<void> {
    this.logger.log('Running daily recurring invoice cleanup...');

    try {
      // Clean up completed jobs older than 7 days
      const jobs = await this.recurringInvoicesQueue.getCompleted();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      let removed = 0;
      for (const job of jobs) {
        if (job.finishedOn && job.finishedOn < sevenDaysAgo) {
          await job.remove();
          removed++;
        }
      }

      this.logger.log(`Cleaned up ${removed} old completed jobs`);

      // Re-initialize schedules to catch any missed ones
      await this.initializeSchedules();
    } catch (error) {
      this.logger.error('Failed to run daily cleanup', error.stack);
    }
  }
}
