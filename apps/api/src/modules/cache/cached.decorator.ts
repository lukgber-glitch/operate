import { SetMetadata } from '@nestjs/common';

/**
 * Metadata keys for caching
 */
export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';
export const CACHE_PREFIX = 'cache_prefix';

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  key: string;
  ttl?: number; // Time to live in seconds
  prefix?: string; // Optional prefix for cache keys
}

/**
 * Cached decorator
 * Marks a method for automatic caching using the cache interceptor
 *
 * @param config - Cache configuration or cache key string
 * @param ttlSeconds - TTL in seconds (default: 300 = 5 minutes)
 *
 * @example
 * ```typescript
 * @Cached('dashboard:cashflow', 300)
 * async getCashFlow() { ... }
 *
 * // Or with full config
 * @Cached({ key: 'user:profile', ttl: 600, prefix: 'api' })
 * async getUserProfile() { ... }
 * ```
 */
export function Cached(
  config: string | CacheConfig,
  ttlSeconds: number = 300,
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const cacheConfig: CacheConfig =
      typeof config === 'string' ? { key: config, ttl: ttlSeconds } : config;

    SetMetadata(CACHE_KEY, cacheConfig.key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL, cacheConfig.ttl || 300)(
      target,
      propertyKey,
      descriptor,
    );
    if (cacheConfig.prefix) {
      SetMetadata(CACHE_PREFIX, cacheConfig.prefix)(
        target,
        propertyKey,
        descriptor,
      );
    }

    return descriptor;
  };
}

/**
 * CacheInvalidate decorator
 * Marks a method to invalidate specific cache keys after execution
 *
 * @param patterns - Cache key patterns to invalidate
 *
 * @example
 * ```typescript
 * @CacheInvalidate(['dashboard:*', 'user:profile:*'])
 * async updateUserProfile() { ... }
 * ```
 */
export const CACHE_INVALIDATE = 'cache_invalidate';

export function CacheInvalidate(patterns: string[]): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(CACHE_INVALIDATE, patterns)(target, propertyKey, descriptor);
    return descriptor;
  };
}
