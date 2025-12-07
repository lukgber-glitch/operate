import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RedisService } from './redis.service';
import {
  CACHE_KEY,
  CACHE_TTL,
  CACHE_PREFIX,
  CACHE_INVALIDATE,
} from './cached.decorator';

/**
 * Cache Interceptor
 * Automatically caches method results based on @Cached decorator
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY,
      context.getHandler(),
    );
    const ttl = this.reflector.get<number>(CACHE_TTL, context.getHandler());
    const prefix = this.reflector.get<string>(
      CACHE_PREFIX,
      context.getHandler(),
    );
    const invalidatePatterns = this.reflector.get<string[]>(
      CACHE_INVALIDATE,
      context.getHandler(),
    );

    // Handle cache invalidation
    if (invalidatePatterns && invalidatePatterns.length > 0) {
      return next.handle().pipe(
        tap(async () => {
          await this.invalidateCache(invalidatePatterns);
        }),
      );
    }

    // Skip caching if no cache key is set
    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const fullKey = this.buildCacheKey(
      cacheKey,
      request,
      prefix || 'cache',
    );

    try {
      // Try to get from cache
      const cached = await this.redisService.get(fullKey);
      if (cached !== null) {
        this.logger.debug(`Cache HIT: ${fullKey}`);
        return of(cached);
      }

      this.logger.debug(`Cache MISS: ${fullKey}`);

      // If not in cache, execute handler and cache result
      return next.handle().pipe(
        tap(async (data) => {
          try {
            await this.redisService.set(fullKey, data, ttl || 300);
            this.logger.debug(
              `Cache SET: ${fullKey} (TTL: ${ttl || 300}s)`,
            );
          } catch (error) {
            this.logger.error(`Failed to cache result for ${fullKey}`, error);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for ${fullKey}:`, error);
      // If cache fails, continue without caching
      return next.handle();
    }
  }

  /**
   * Build cache key with user context and query parameters
   */
  private buildCacheKey(
    baseKey: string,
    request: any,
    prefix: string,
  ): string {
    const parts = [prefix, baseKey];

    // Add organization context if available
    if (request.user?.organisationId) {
      parts.push(`org:${request.user.organisationId}`);
    }

    // Add user context if available and no org context
    if (request.user?.id && !request.user?.organisationId) {
      parts.push(`user:${request.user.id}`);
    }

    // Add query parameters hash
    if (request.query && Object.keys(request.query).length > 0) {
      const queryHash = this.hashObject(request.query);
      parts.push(`q:${queryHash}`);
    }

    // Add body hash for POST requests
    if (
      request.method === 'POST' &&
      request.body &&
      Object.keys(request.body).length > 0
    ) {
      const bodyHash = this.hashObject(request.body);
      parts.push(`b:${bodyHash}`);
    }

    return parts.join(':');
  }

  /**
   * Simple hash function for objects
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Invalidate cache by patterns
   */
  private async invalidateCache(patterns: string[]): Promise<void> {
    try {
      for (const pattern of patterns) {
        await this.redisService.delByPattern(pattern);
        this.logger.debug(`Cache invalidated: ${pattern}`);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate cache', error);
    }
  }
}
