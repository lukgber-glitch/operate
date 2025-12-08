import { SetMetadata } from '@nestjs/common';
import { ThrottlerOptions } from '@nestjs/throttler';

/**
 * SEC-008: Rate Limit Decorator Metadata Key
 */
export const RATE_LIMIT_KEY = 'rate-limit';

/**
 * SEC-008: Rate Limit Options
 *
 * Predefined rate limit profiles for different endpoint types
 */
export enum RateLimitProfile {
  /**
   * Authentication endpoints (login, register, etc.)
   * Very strict: 5 requests per minute
   */
  AUTH = 'auth',

  /**
   * API endpoints (standard CRUD operations)
   * Moderate: 100 requests per minute
   */
  API = 'api',

  /**
   * File upload endpoints
   * Strict: 10 requests per minute
   */
  UPLOAD = 'upload',

  /**
   * AI/Chat endpoints (expensive operations)
   * Strict: 20 requests per minute
   */
  AI = 'ai',

  /**
   * Public endpoints (health checks, etc.)
   * Lenient: 1000 requests per 15 minutes
   */
  PUBLIC = 'public',

  /**
   * Search endpoints
   * Moderate: 30 requests per minute
   */
  SEARCH = 'search',
}

/**
 * Rate limit configurations for each profile
 */
export const RATE_LIMIT_CONFIGS: Record<
  RateLimitProfile,
  { ttl: number; limit: number }
> = {
  [RateLimitProfile.AUTH]: {
    ttl: 60000, // 1 minute
    limit: 5,
  },
  [RateLimitProfile.API]: {
    ttl: 60000, // 1 minute
    limit: 100,
  },
  [RateLimitProfile.UPLOAD]: {
    ttl: 60000, // 1 minute
    limit: 10,
  },
  [RateLimitProfile.AI]: {
    ttl: 60000, // 1 minute
    limit: 20,
  },
  [RateLimitProfile.PUBLIC]: {
    ttl: 900000, // 15 minutes
    limit: 1000,
  },
  [RateLimitProfile.SEARCH]: {
    ttl: 60000, // 1 minute
    limit: 30,
  },
};

/**
 * SEC-008: Rate Limit Decorator
 *
 * Apply rate limiting to controller methods or entire controllers
 *
 * @param profile - Predefined rate limit profile
 * @param customOptions - Optional custom rate limit options
 *
 * @example
 * ```typescript
 * // Use predefined profile
 * @RateLimit(RateLimitProfile.AUTH)
 * @Post('login')
 * async login() { ... }
 *
 * // Use custom limits
 * @RateLimit(RateLimitProfile.API, { limit: 50 })
 * @Get('users')
 * async getUsers() { ... }
 * ```
 */
export const RateLimit = (
  profile: RateLimitProfile,
  customOptions?: Partial<{ ttl: number; limit: number }>,
) => {
  const config = {
    ...RATE_LIMIT_CONFIGS[profile],
    ...customOptions,
  };

  return SetMetadata(RATE_LIMIT_KEY, config);
};

/**
 * SEC-008: Skip Rate Limiting
 *
 * Decorator to skip rate limiting for specific endpoints
 * Use sparingly and only for trusted internal endpoints
 *
 * @example
 * ```typescript
 * @SkipRateLimit()
 * @Get('health')
 * async health() { ... }
 * ```
 */
export const SkipRateLimit = () => SetMetadata(RATE_LIMIT_KEY, { skip: true });
