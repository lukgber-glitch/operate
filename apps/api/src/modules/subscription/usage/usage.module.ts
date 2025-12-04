import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UsageController } from './usage.controller';
import { UsageMeteringService } from './services/usage-metering.service';
import { UsageStripeService } from './services/usage-stripe.service';
import { UsageTrackingInterceptor } from './interceptors/usage-tracking.interceptor';
import {
  UsageAggregationProcessor,
  USAGE_AGGREGATION_QUEUE,
} from './jobs/usage-aggregation.processor';
import {
  UsageStripeReportProcessor,
  USAGE_STRIPE_REPORT_QUEUE,
} from './jobs/usage-stripe-report.processor';
import { DatabaseModule } from '../../database/database.module';
import { StripeModule } from '../../integrations/stripe/stripe.module';

/**
 * Usage Module
 * Handles usage-based billing and metering
 *
 * Features:
 * - Real-time usage tracking with @TrackUsage decorator
 * - Usage aggregation by billing period
 * - Stripe metered billing integration
 * - Usage quotas and overage calculation
 * - Historical usage reporting
 * - Automatic Stripe reporting (daily)
 *
 * Usage:
 * 1. Configure usage quotas for each feature per organization
 * 2. Use @TrackUsage() decorator on methods to track usage
 * 3. Or manually call UsageMeteringService.trackUsage()
 * 4. Background jobs handle aggregation and Stripe reporting
 * 5. Retrieve usage data via UsageController endpoints
 *
 * Example:
 * ```typescript
 * @TrackUsage(UsageFeature.OCR_SCAN)
 * async scanReceipt(dto: ScanReceiptDto) {
 *   return this.ocrService.scan(dto);
 * }
 * ```
 */
@Module({
  imports: [
    // Import database module
    DatabaseModule,

    // Import Stripe integration
    StripeModule,

    // Register Bull queues for background jobs
    BullModule.registerQueue(
      {
        name: USAGE_AGGREGATION_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: USAGE_STRIPE_REPORT_QUEUE,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
  ],
  controllers: [UsageController],
  providers: [
    UsageMeteringService,
    UsageStripeService,
    UsageTrackingInterceptor,
    UsageAggregationProcessor,
    UsageStripeReportProcessor,
  ],
  exports: [
    UsageMeteringService,
    UsageStripeService,
    UsageTrackingInterceptor,
  ],
})
export class UsageModule {}
