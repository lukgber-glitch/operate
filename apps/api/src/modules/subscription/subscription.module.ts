import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionManagerService } from './services/subscription-manager.service';
import { SubscriptionFeaturesService } from './services/subscription-features.service';
import { SubscriptionFeatureGuard } from './guards/subscription-feature.guard';
import { UsageTrackingProcessor, USAGE_TRACKING_QUEUE } from './jobs/usage-tracking.processor';
import { PrismaService } from '../database/prisma.service';

// Import Stripe modules
import { StripeModule } from '../integrations/stripe/stripe.module';

// Import Usage module
import { UsageModule } from './usage/usage.module';

// Import Dunning components
import { DunningService, DUNNING_RETRY_QUEUE, DUNNING_ESCALATE_QUEUE } from './services/dunning.service';
import { DunningRetryProcessor } from './jobs/dunning-retry.processor';
import { DunningEscalateProcessor } from './jobs/dunning-escalate.processor';
import { DunningController } from './controllers/dunning.controller';

/**
 * Subscription Module
 * Manages organization subscriptions, feature gating, usage tracking, and dunning
 *
 * Features:
 * - Subscription lifecycle management (trial, upgrade, downgrade, cancel)
 * - Tier-based feature gating with guard and decorator
 * - Usage tracking and limit enforcement
 * - Usage-based (metered) billing with Stripe
 * - Automated dunning process for failed payments
 * - Background job processing for usage monitoring and payment retries
 * - Integration with Stripe for billing
 *
 * Usage:
 * 1. Import SubscriptionModule in your feature modules
 * 2. Use @RequiresFeature() decorator on routes
 * 3. Apply SubscriptionFeatureGuard to enforce access control
 * 4. Use @TrackUsage() decorator to track metered usage
 * 5. Check usage limits via SubscriptionFeaturesService
 * 6. Dunning process automatically handles payment failures
 */
@Module({
  imports: [
    // Import Stripe integration module
    StripeModule,

    // Import Usage module for metered billing
    UsageModule,

    // Register Bull queue for usage tracking jobs
    BullModule.registerQueue({
      name: USAGE_TRACKING_QUEUE,
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

    // Register Bull queue for dunning retry jobs
    BullModule.registerQueue({
      name: DUNNING_RETRY_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),

    // Register Bull queue for dunning escalation jobs
    BullModule.registerQueue({
      name: DUNNING_ESCALATE_QUEUE,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [
    SubscriptionController,
    DunningController,
  ],
  providers: [
    PrismaService,
    SubscriptionManagerService,
    SubscriptionFeaturesService,
    SubscriptionFeatureGuard,
    UsageTrackingProcessor,
    DunningService,
    DunningRetryProcessor,
    DunningEscalateProcessor,
  ],
  exports: [
    SubscriptionManagerService,
    SubscriptionFeaturesService,
    SubscriptionFeatureGuard,
    UsageModule,
    DunningService,
  ],
})
export class SubscriptionModule {}
