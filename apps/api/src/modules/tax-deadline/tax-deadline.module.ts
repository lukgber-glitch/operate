/**
 * Tax Deadline Module
 *
 * Provides comprehensive tax deadline tracking and reminder functionality
 * for multiple countries and tax types
 *
 * Features:
 * - Multi-country tax deadline support (DE, AT, CH, US, UK, etc.)
 * - Automatic deadline calculation and generation
 * - Scheduled reminder notifications (7, 3, 1 days before)
 * - Filing status tracking
 * - Email and in-app notifications
 * - Calendar export (iCal format)
 * - Background jobs for deadline checks
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { TaxDeadlineController } from './tax-deadline.controller';
import { TaxDeadlineService } from './tax-deadline.service';
import {
  DailyDeadlineCheckProcessor,
  DEADLINE_CHECK_QUEUE,
} from './jobs/daily-deadline-check.processor';
import {
  DeadlineReminderProcessor,
  DEADLINE_REMINDER_QUEUE,
} from './jobs/deadline-reminder.processor';
import { DeadlineCheckScheduler } from './jobs/deadline-check.scheduler';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RbacModule } from '../auth/rbac/rbac.module';

@Module({
  imports: [
    // Database access
    DatabaseModule,

    // Notifications for reminders
    NotificationsModule,

    // RBAC for authorization
    RbacModule,

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // BullMQ queues for background jobs
    BullModule.registerQueue(
      {
        name: DEADLINE_CHECK_QUEUE,
      },
      {
        name: DEADLINE_REMINDER_QUEUE,
      },
    ),
  ],
  controllers: [TaxDeadlineController],
  providers: [
    TaxDeadlineService,
    DailyDeadlineCheckProcessor,
    DeadlineReminderProcessor,
    DeadlineCheckScheduler,
  ],
  exports: [TaxDeadlineService],
})
export class TaxDeadlineModule {}
