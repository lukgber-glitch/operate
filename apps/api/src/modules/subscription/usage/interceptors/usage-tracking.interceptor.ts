import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UsageMeteringService } from '../services/usage-metering.service';
import {
  TRACK_USAGE_KEY,
  TrackUsageMetadata,
} from '../decorators/track-usage.decorator';

/**
 * Usage Tracking Interceptor
 * Automatically tracks usage based on @TrackUsage decorator
 */
@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UsageTrackingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly usageMeteringService: UsageMeteringService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<TrackUsageMetadata>(
      TRACK_USAGE_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Extract organization ID
          const organizationId = this.extractOrganizationId(
            context,
            metadata,
            result,
          );

          if (!organizationId) {
            this.logger.warn(
              `Could not extract organization ID for usage tracking of ${metadata.feature}`,
            );
            return;
          }

          // Extract user ID (optional)
          const userId = this.extractUserId(context, metadata, result);

          // Calculate quantity
          const quantity = this.calculateQuantity(metadata, result);

          // Extract metadata (optional)
          const eventMetadata = metadata.extractMetadata
            ? metadata.extractMetadata(context, result)
            : undefined;

          // Track usage
          await this.usageMeteringService.trackUsage({
            organizationId,
            feature: metadata.feature,
            quantity,
            metadata: eventMetadata,
            userId,
          });
        } catch (error) {
          // Don't fail the request if usage tracking fails
          this.logger.error(
            `Failed to track usage for ${metadata.feature}`,
            error,
          );
        }
      }),
    );
  }

  /**
   * Extract organization ID from context
   */
  private extractOrganizationId(
    context: ExecutionContext,
    metadata: TrackUsageMetadata,
    result: any,
  ): string | undefined {
    if (metadata.extractOrgId) {
      return metadata.extractOrgId(context);
    }

    // Default: Try to extract from request
    const request = context.switchToHttp().getRequest();

    // Check user object
    if (request.user?.orgId) {
      return request.user.orgId;
    }

    // Check body
    if (request.body?.organizationId) {
      return request.body.organizationId;
    }

    // Check params
    if (request.params?.orgId) {
      return request.params.orgId;
    }

    // Check query
    if (request.query?.organizationId) {
      return request.query.organizationId;
    }

    return undefined;
  }

  /**
   * Extract user ID from context
   */
  private extractUserId(
    context: ExecutionContext,
    metadata: TrackUsageMetadata,
    result: any,
  ): string | undefined {
    if (metadata.extractUserId) {
      return metadata.extractUserId(context);
    }

    // Default: Try to extract from request
    const request = context.switchToHttp().getRequest();
    return request.user?.id || request.user?.userId;
  }

  /**
   * Calculate quantity
   */
  private calculateQuantity(
    metadata: TrackUsageMetadata,
    result: any,
  ): number {
    if (!metadata.quantity) {
      return 1;
    }

    if (typeof metadata.quantity === 'function') {
      return metadata.quantity(result);
    }

    return metadata.quantity;
  }
}
