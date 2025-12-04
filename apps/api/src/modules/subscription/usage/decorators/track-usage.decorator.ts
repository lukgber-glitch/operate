import { SetMetadata } from '@nestjs/common';
import { UsageFeature } from '@prisma/client';

/**
 * Track Usage Decorator Metadata Key
 */
export const TRACK_USAGE_KEY = 'track_usage';

/**
 * Track Usage Metadata
 */
export interface TrackUsageMetadata {
  feature: UsageFeature;
  quantity?: number | ((result: any) => number);
  extractOrgId?: (context: any) => string;
  extractUserId?: (context: any) => string;
  extractMetadata?: (context: any, result: any) => Record<string, any>;
}

/**
 * Track Usage Decorator
 * Automatically tracks usage when a method is called
 *
 * @param feature - The usage feature to track
 * @param options - Additional tracking options
 *
 * @example
 * ```typescript
 * @TrackUsage(UsageFeature.OCR_SCAN)
 * async scanReceipt(dto: ScanReceiptDto) {
 *   // ... implementation
 * }
 *
 * @TrackUsage(UsageFeature.API_CALL, {
 *   extractOrgId: (ctx) => ctx.switchToHttp().getRequest().user.orgId,
 *   extractMetadata: (ctx, result) => ({
 *     endpoint: ctx.switchToHttp().getRequest().url,
 *     method: ctx.switchToHttp().getRequest().method,
 *   }),
 * })
 * async handleApiCall() {
 *   // ... implementation
 * }
 * ```
 */
export const TrackUsage = (
  feature: UsageFeature,
  options?: Partial<Omit<TrackUsageMetadata, 'feature'>>,
): MethodDecorator => {
  const metadata: TrackUsageMetadata = {
    feature,
    quantity: options?.quantity,
    extractOrgId: options?.extractOrgId,
    extractUserId: options?.extractUserId,
    extractMetadata: options?.extractMetadata,
  };

  return SetMetadata(TRACK_USAGE_KEY, metadata);
};
