import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerModuleOptions,
  ThrottlerStorage,
  THROTTLER_OPTIONS,
} from '@nestjs/throttler';
import { Response } from 'express';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';

/**
 * SEC-008: Enhanced Rate Limit Guard
 *
 * Extends NestJS ThrottlerGuard to support custom rate limiting per endpoint
 * Uses metadata from @RateLimit() decorator
 *
 * Adds RFC 6585 compliant rate limit headers:
 * - X-RateLimit-Limit: Maximum requests allowed in the window
 * - X-RateLimit-Remaining: Remaining requests in current window
 * - X-RateLimit-Reset: Unix timestamp when the rate limit resets
 * - Retry-After: Seconds until the rate limit resets (on 429 response)
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @Inject(THROTTLER_OPTIONS) protected readonly options: ThrottlerModuleOptions,
    @Inject(ThrottlerStorage) protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Get rate limit configuration from decorator metadata
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as tracker (consider using user ID for authenticated requests)
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Set rate limit response headers
   */
  private setRateLimitHeaders(
    response: Response,
    limit: number,
    remaining: number,
    ttl: number,
  ): void {
    const resetTime = Math.floor(Date.now() / 1000) + Math.ceil(ttl / 1000);

    response.setHeader('X-RateLimit-Limit', limit.toString());
    response.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
    response.setHeader('X-RateLimit-Reset', resetTime.toString());
    response.setHeader('X-RateLimit-Policy', `${limit};w=${Math.ceil(ttl / 1000)}`);
  }

  /**
   * Apply rate limit from decorator or skip if @SkipRateLimit() is present
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitConfig = this.reflector.getAllAndOverride(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip rate limiting if @SkipRateLimit() decorator is present
    if (rateLimitConfig?.skip) {
      return true;
    }

    // Get request and response objects
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    // If no custom rate limit config, use default from ThrottlerModule
    if (!rateLimitConfig) {
      // For default throttler, add headers in the parent class
      const result = await super.canActivate(context);

      // Add default rate limit headers (100 requests per minute)
      this.setRateLimitHeaders(response, 100, 99, 60000);

      return result;
    }

    // Apply custom rate limit
    const { ttl, limit } = rateLimitConfig;
    const tracker = await this.getTracker(request);
    const key = this.generateCustomKey(context, tracker);

    const { totalHits } = await this.storageService.increment(key, ttl);
    const remaining = limit - totalHits;

    // Always set rate limit headers
    this.setRateLimitHeaders(response, limit, remaining, ttl);

    if (totalHits > limit) {
      // Add Retry-After header for 429 responses
      const retryAfter = Math.ceil(ttl / 1000);
      response.setHeader('Retry-After', retryAfter.toString());

      throw new ThrottlerException();
    }

    return true;
  }

  /**
   * Generate cache key for rate limiting
   * Override to include route information for more granular rate limiting
   */
  protected generateKey(context: ExecutionContext, suffix: string, name: string): string {
    const request = context.switchToHttp().getRequest();
    const route = `${request.method}-${request.route?.path || request.url}`;
    return `rate-limit:${name}:${route}:${suffix}`;
  }

  /**
   * Generate custom cache key for decorator-based rate limiting
   */
  private generateCustomKey(context: ExecutionContext, tracker: string): string {
    const request = context.switchToHttp().getRequest();
    const route = `${request.method}-${request.route?.path || request.url}`;
    return `rate-limit:custom:${route}:${tracker}`;
  }
}
