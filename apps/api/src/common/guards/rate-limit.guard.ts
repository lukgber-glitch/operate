import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';

/**
 * SEC-008: Enhanced Rate Limit Guard
 *
 * Extends NestJS ThrottlerGuard to support custom rate limiting per endpoint
 * Uses metadata from @RateLimit() decorator
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    protected readonly reflector: Reflector,
  ) {
    super({
      throttlers: [],
      ignoreUserAgents: [],
      skipIf: () => false,
    }, {}, reflector, { } as any);
  }

  /**
   * Get rate limit configuration from decorator metadata
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as tracker (consider using user ID for authenticated requests)
    return req.ip || req.connection?.remoteAddress || 'unknown';
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

    // If no custom rate limit config, use default from ThrottlerModule
    if (!rateLimitConfig) {
      return super.canActivate(context);
    }

    // Apply custom rate limit
    const { ttl, limit } = rateLimitConfig;
    const request = context.switchToHttp().getRequest();
    const tracker = await this.getTracker(request);
    const key = this.generateKey(context, tracker);

    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      throw new ThrottlerException();
    }

    return true;
  }

  /**
   * Generate cache key for rate limiting
   */
  protected generateKey(context: ExecutionContext, tracker: string): string {
    const request = context.switchToHttp().getRequest();
    const route = `${request.method}-${request.route?.path || request.url}`;
    return `rate-limit:${route}:${tracker}`;
  }
}
