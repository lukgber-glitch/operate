/**
 * Tax Deadline Module Exports
 */

export * from './tax-deadline.module';
export * from './tax-deadline.service';
export * from './tax-deadline.controller';
export * from './dto';
export * from './constants/deadlines.constants';
// Export DEADLINE_REMINDER_QUEUE from daily-deadline-check.processor (canonical)
export * from './jobs/daily-deadline-check.processor';
// Exclude DEADLINE_REMINDER_QUEUE from deadline-reminder.processor (conflicts with daily-deadline-check.processor)
export {
  DeadlineReminderJobData,
  DeadlineReminderJobResult,
  DeadlineReminderProcessor,
} from './jobs/deadline-reminder.processor';
export * from './jobs/deadline-check.scheduler';
