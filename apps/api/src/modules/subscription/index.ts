/**
 * Subscription Module Exports
 */

// Module
export { SubscriptionModule } from './subscription.module';

// Services
export { SubscriptionManagerService } from './services/subscription-manager.service';
export { SubscriptionFeaturesService } from './services/subscription-features.service';

// Controller
export { SubscriptionController } from './subscription.controller';

// DTOs
export {
  StartTrialDto,
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
  CancelSubscriptionDto,
  CheckFeatureDto,
  SubscriptionResponseDto,
  UsageStatsDto,
  PortalSessionResponseDto,
} from './dto/subscription.dto';

// Types
export {
  SubscriptionTier,
  PlatformFeature,
  TierConfig,
  SUBSCRIPTION_TIERS,
  UsageMetrics,
  FeatureCheckResult,
  SubscriptionStatus,
  SubscriptionChangeType,
  OrganizationSubscription,
} from './types/subscription.types';

// Guards & Decorators
export { SubscriptionFeatureGuard } from './guards/subscription-feature.guard';
export { RequiresFeature } from './decorators/requires-feature.decorator';

// Jobs
export {
  UsageTrackingProcessor,
  USAGE_TRACKING_QUEUE,
  UsageTrackingJobData,
  UsageTrackingJobResult,
} from './jobs/usage-tracking.processor';
