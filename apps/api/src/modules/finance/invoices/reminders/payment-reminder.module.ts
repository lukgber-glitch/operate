import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentReminderController } from './payment-reminder.controller';
import { PaymentReminderService } from './payment-reminder.service';
import { ReminderEscalationService } from './reminder-escalation.service';
import { ReminderProcessor } from './reminder.processor';
import { ReminderScheduler } from './reminder.scheduler';
import { RbacModule } from '../../../auth/rbac/rbac.module';
import { NotificationsModule } from '../../../notifications/notifications.module';

/**
 * Payment Reminder Module
 * Manages payment reminders, escalations, and automated workflows
 */
@Module({
  imports: [
    RbacModule,
    NotificationsModule,
    // Schedule module for cron jobs
    ScheduleModule.forRoot(),
    // Bull queue for background jobs
    BullModule.registerQueue({
      name: 'payment-reminders',
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
  controllers: [PaymentReminderController],
  providers: [
    PaymentReminderService,
    ReminderEscalationService,
    ReminderProcessor,
    ReminderScheduler,
  ],
  exports: [
    PaymentReminderService,
    ReminderEscalationService,
  ],
})
export class PaymentReminderModule {}
