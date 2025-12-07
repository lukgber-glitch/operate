import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { BillsRepository } from './bills.repository';
import { RbacModule } from '../../auth/rbac/rbac.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import {
  BillReminderProcessor,
  BillOverdueProcessor,
  BillReminderScheduler,
} from './jobs';

/**
 * Bills Module
 * Manages accounts payable (bills) - invoices received from vendors
 *
 * Features:
 * - Bill tracking and management
 * - Vendor management
 * - Payment tracking
 * - Email extraction integration
 * - Tax deduction categorization
 * - Approval workflows
 * - Automated payment reminders
 * - Overdue bill tracking
 */
@Module({
  imports: [
    RbacModule,
    NotificationsModule,
    // Schedule module for cron jobs
    ScheduleModule.forRoot(),
    // Bull queue for background jobs
    BullModule.registerQueue({
      name: 'bill-reminders',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [BillsController],
  providers: [
    BillsService,
    BillsRepository,
    BillReminderProcessor,
    BillOverdueProcessor,
    BillReminderScheduler,
  ],
  exports: [BillsService, BillsRepository],
})
export class BillsModule {}
