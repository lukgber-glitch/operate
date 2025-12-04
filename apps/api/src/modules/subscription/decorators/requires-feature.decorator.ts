import { SetMetadata } from '@nestjs/common';
import { PlatformFeature } from '../types/subscription.types';

/**
 * Metadata key for feature requirements
 */
export const FEATURE_KEY = 'required_feature';

/**
 * Decorator to mark routes that require specific features
 *
 * @example
 * ```typescript
 * @RequiresFeature(PlatformFeature.OCR)
 * @Post('upload')
 * async uploadInvoice() {
 *   // Only accessible if organization has OCR feature
 * }
 * ```
 */
export const RequiresFeature = (feature: PlatformFeature) =>
  SetMetadata(FEATURE_KEY, feature);
