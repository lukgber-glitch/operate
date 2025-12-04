/**
 * Daily Deadline Check Processor
 * Runs daily at 8:00 AM to check for upcoming tax deadlines and schedule reminders
 *
 * Features:
 * - Checks all active organizations
 * - Identifies deadlines needing reminders (7, 3, 1 days before)
 * - Schedules reminder jobs
 * - Updates overdue status
 * - Logs all activities
 */

import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export const DEADLINE_CHECK_QUEUE = 'deadline-check';
export const DEADLINE_REMINDER_QUEUE = 'deadline-reminder';

export interface DeadlineCheckJobData {
  triggeredBy?: 'scheduler' | 'manual';
  organizationId?: string; // Optional: check only specific org
}

export interface DeadlineCheckJobResult {
  jobId: string;
  success: boolean;
  organizationsChecked: number;
  deadlinesFound: number;
  remindersScheduled: number;
  overdueUpdated: number;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  errorMessage?: string;
}

@Processor(DEADLINE_CHECK_QUEUE)
export class DailyDeadlineCheckProcessor {
  private readonly logger = new Logger(DailyDeadlineCheckProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(DEADLINE_REMINDER_QUEUE)
    private readonly reminderQueue: Queue,
  ) {}

  @Process()
  async handleDeadlineCheck(job: Job<DeadlineCheckJobData>): Promise<DeadlineCheckJobResult> {
    const startedAt = new Date();

    this.logger.log(`Processing daily deadline check job ${job.id}`);

    try {
      await job.progress({
        stage: 'starting',
        message: 'Checking tax deadlines',
        percent: 0,
      });

      let organizationsChecked = 0;
      let deadlinesFound = 0;
      let remindersScheduled = 0;
      let overdueUpdated = 0;

      // Get all active organizations (or specific one if provided)
      const organizations = job.data.organizationId
        ? await this.prisma.organization.findMany({
            where: { id: job.data.organizationId },
            select: { id: true, name: true },
          })
        : await this.prisma.organization.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true },
          });

      this.logger.log(`Found ${organizations.length} organizations to check`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      const oneDayFromNow = new Date(today);
      oneDayFromNow.setDate(today.getDate() + 1);

      // Check each organization
      for (const org of organizations) {
        organizationsChecked++;

        await job.progress({
          stage: 'processing',
          message: `Checking organization ${org.name}`,
          percent: (organizationsChecked / organizations.length) * 80,
        });

        // Find deadlines that need reminders
        const deadlines = await this.prisma.taxDeadlineReminder.findMany({
          where: {
            organizationId: org.id,
            status: {
              in: ['PENDING', 'EXTENDED'],
            },
            dueDate: {
              gte: today,
              lte: sevenDaysFromNow,
            },
          },
          include: {
            reminders: true,
            organization: {
              select: {
                users: {
                  select: {
                    id: true,
                    email: true,
                    roles: true,
                  },
                },
              },
            },
          },
        });

        deadlinesFound += deadlines.length;

        for (const deadline of deadlines) {
          const dueDate = new Date(deadline.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // Check which reminder to send
          let reminderType: string | null = null;

          if (daysUntilDue === 7) {
            // Check if 7-day reminder was already sent
            const sentReminder = deadline.reminders.find(
              (r) => r.reminderType === 'SEVEN_DAYS',
            );
            if (!sentReminder) {
              reminderType = 'SEVEN_DAYS';
            }
          } else if (daysUntilDue === 3) {
            const sentReminder = deadline.reminders.find(
              (r) => r.reminderType === 'THREE_DAYS',
            );
            if (!sentReminder) {
              reminderType = 'THREE_DAYS';
            }
          } else if (daysUntilDue === 1) {
            const sentReminder = deadline.reminders.find(
              (r) => r.reminderType === 'ONE_DAY',
            );
            if (!sentReminder) {
              reminderType = 'ONE_DAY';
            }
          } else if (daysUntilDue === 0) {
            const sentReminder = deadline.reminders.find(
              (r) => r.reminderType === 'SAME_DAY',
            );
            if (!sentReminder) {
              reminderType = 'SAME_DAY';
            }
          }

          if (reminderType) {
            // Schedule reminder job
            await this.reminderQueue.add('send-reminder', {
              deadlineId: deadline.id,
              reminderType,
              organizationId: org.id,
            });

            remindersScheduled++;

            this.logger.log(
              `Scheduled ${reminderType} reminder for deadline ${deadline.id} (due ${dueDate.toDateString()})`,
            );
          }
        }

        // Update overdue deadlines
        const updateResult = await this.prisma.taxDeadlineReminder.updateMany({
          where: {
            organizationId: org.id,
            dueDate: {
              lt: today,
            },
            status: 'PENDING',
          },
          data: {
            status: 'OVERDUE',
          },
        });

        overdueUpdated += updateResult.count;
      }

      await job.progress({
        stage: 'completed',
        message: 'Deadline check completed',
        percent: 100,
      });

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.log(
        `Deadline check completed: ${organizationsChecked} orgs, ${deadlinesFound} deadlines, ` +
          `${remindersScheduled} reminders scheduled, ${overdueUpdated} updated to overdue`,
      );

      return {
        jobId: job.id?.toString() || 'unknown',
        success: true,
        organizationsChecked,
        deadlinesFound,
        remindersScheduled,
        overdueUpdated,
        startedAt,
        completedAt,
        duration,
      };
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.error(`Deadline check job ${job.id} failed:`, error.message);

      return {
        jobId: job.id?.toString() || 'unknown',
        success: false,
        organizationsChecked: 0,
        deadlinesFound: 0,
        remindersScheduled: 0,
        overdueUpdated: 0,
        startedAt,
        completedAt,
        duration,
        errorMessage: error.message || 'Unknown error',
      };
    }
  }

  @OnQueueActive()
  onActive(job: Job<DeadlineCheckJobData>): void {
    this.logger.log(`Deadline check job ${job.id} started`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<DeadlineCheckJobData>, result: DeadlineCheckJobResult): void {
    this.logger.log(
      `Deadline check job ${job.id} completed: ${result.success ? 'SUCCESS' : 'FAILURE'} ` +
        `(${result.duration}ms)`,
    );

    if (result.success) {
      this.logger.log(
        `  → ${result.organizationsChecked} orgs, ${result.deadlinesFound} deadlines, ` +
          `${result.remindersScheduled} reminders scheduled`,
      );
    }
  }

  @OnQueueFailed()
  onFailed(job: Job<DeadlineCheckJobData>, error: Error): void {
    this.logger.error(`Deadline check job ${job.id} failed: ${error.message}`);
  }
}
