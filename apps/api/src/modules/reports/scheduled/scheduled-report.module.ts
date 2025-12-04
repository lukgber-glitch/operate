import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ScheduledReportController } from './scheduled-report.controller';
import { ScheduledReportService, SCHEDULED_REPORT_QUEUE } from './scheduled-report.service';
import { ScheduledReportProcessor } from './scheduled-report.processor';
import { DatabaseModule } from '../../../database/database.module';
import { ExportModule } from '../export/export.module';

/**
 * Scheduled Report Module
 *
 * Provides automated report generation and delivery functionality.
 *
 * Features:
 * - Scheduled report configuration (CRUD)
 * - Multiple scheduling frequencies (daily, weekly, monthly, quarterly, yearly, custom)
 * - Timezone-aware scheduling
 * - Multiple delivery methods (email, webhook, both, save-only)
 * - Template variable substitution
 * - Retry logic with exponential backoff
 * - Execution history and audit trail
 * - Rate limiting and concurrency control
 * - Background job processing with BullMQ
 * - Cron-based schedule checking
 *
 * Dependencies:
 * - BullModule: For background job processing
 * - ScheduleModule: For cron-based schedule checking
 * - ExportModule: For PDF/Excel generation
 * - ReportsService: For report data generation
 * - PrismaService: For database operations
 *
 * Exports:
 * - ScheduledReportService: For use in other modules
 *
 * Queue Configuration:
 * - Name: scheduled-reports
 * - Concurrency: 5 parallel jobs
 * - Retry: 3 attempts with exponential backoff
 * - Rate Limit: 10 jobs per second
 *
 * Cron Jobs:
 * - processScheduledReports: Runs every minute to check for due schedules
 *
 * API Endpoints:
 * - POST /reports/scheduled - Create schedule
 * - GET /reports/scheduled - List schedules
 * - GET /reports/scheduled/:id - Get schedule details
 * - PUT /reports/scheduled/:id - Update schedule
 * - DELETE /reports/scheduled/:id - Delete schedule
 * - POST /reports/scheduled/:id/pause - Pause schedule
 * - POST /reports/scheduled/:id/resume - Resume schedule
 * - POST /reports/scheduled/:id/execute - Manual trigger
 * - GET /reports/scheduled/:id/history - Execution history
 * - POST /reports/scheduled/:id/retry - Retry failed delivery
 *
 * Usage Example:
 * ```typescript
 * // In your module
 * @Module({
 *   imports: [ScheduledReportModule],
 * })
 * export class AppModule {}
 *
 * // Create a scheduled report
 * const schedule = await scheduledReportService.createSchedule({
 *   orgId: 'org_123',
 *   name: 'Monthly P&L Report',
 *   schedule: {
 *     frequency: ScheduleFrequency.MONTHLY,
 *     timeOfDay: '09:00',
 *     timezone: 'Europe/Berlin',
 *     dayOfMonth: 1,
 *   },
 *   reportParams: {
 *     reportType: ReportType.PROFIT_LOSS,
 *     dateRange: {
 *       type: DateRangeType.LAST_MONTH,
 *     },
 *     format: ExportFormat.PDF,
 *   },
 *   deliveryConfig: {
 *     method: DeliveryMethod.EMAIL,
 *     email: {
 *       recipients: ['finance@company.com'],
 *       subject: 'Monthly P&L Report - {{period}}',
 *       body: 'Please find attached your monthly profit & loss report.',
 *     },
 *   },
 * });
 * ```
 */
@Module({
  imports: [
    // Import configuration module
    ConfigModule,

    // Import database module
    DatabaseModule,

    // Import parent reports module for ReportsService
    forwardRef(() => require('../reports.module').ReportsModule),

    // Import schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Import export module for PDF/Excel generation
    ExportModule,

    // Register Bull queue for scheduled reports
    BullModule.registerQueue({
      name: SCHEDULED_REPORT_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds
        },
        timeout: 600000, // 10 minutes timeout
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
          count: 50, // Keep last 50 failed jobs
        },
      },
      limiter: {
        max: 10, // Max 10 jobs processed
        duration: 1000, // Per second
      },
      settings: {
        retryProcessDelay: 5000, // Delay before retrying failed jobs
      },
    }),
  ],
  controllers: [ScheduledReportController],
  providers: [
    ScheduledReportService,
    ScheduledReportProcessor,
  ],
  exports: [ScheduledReportService],
})
export class ScheduledReportModule {}
