import {
  Injectable,
  CanActivate,
  ExecutionContext,
  PaymentRequiredException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionFeaturesService } from '../services/subscription-features.service';
import { FEATURE_KEY } from '../decorators/requires-feature.decorator';
import { PlatformFeature } from '../types/subscription.types';

/**
 * Subscription Feature Guard
 * Enforces feature access based on organization subscription tier
 *
 * Usage:
 * 1. Apply @RequiresFeature() decorator to controller methods
 * 2. Guard automatically checks if organization has access to the feature
 * 3. Returns 402 Payment Required if feature is not available
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, SubscriptionFeatureGuard)
 * @RequiresFeature(PlatformFeature.OCR)
 * @Post('ocr/process')
 * async processOCR() {
 *   // Only accessible with OCR feature
 * }
 * ```
 */
@Injectable()
export class SubscriptionFeatureGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionFeatureGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly features: SubscriptionFeaturesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the required feature from decorator metadata
    const requiredFeature = this.reflector.get<PlatformFeature>(
      FEATURE_KEY,
      context.getHandler(),
    );

    // If no feature requirement, allow access
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User should be authenticated by this point (via JwtAuthGuard)
    if (!user) {
      this.logger.warn('No user found in request. Ensure JwtAuthGuard is applied before SubscriptionFeatureGuard.');
      return false;
    }

    // Get organization ID from user context
    // This assumes the user object has an orgId property
    // Adjust based on your auth implementation
    const orgId = user.orgId || user.organizationId;

    if (!orgId) {
      this.logger.warn(`No organization ID found for user ${user.id}`);
      throw new PaymentRequiredException(
        'Organization context required. Please ensure you are part of an organization.',
      );
    }

    // Check if organization has access to the feature
    const featureCheck = await this.features.hasFeature(orgId, requiredFeature);

    if (!featureCheck.hasAccess) {
      this.logger.log(
        `Feature access denied for org ${orgId}: ${featureCheck.reason}`,
      );

      throw new PaymentRequiredException(
        `This feature requires ${featureCheck.upgradeRequired} tier or higher. ${featureCheck.reason}`,
      );
    }

    // Feature access granted
    return true;
  }
}
