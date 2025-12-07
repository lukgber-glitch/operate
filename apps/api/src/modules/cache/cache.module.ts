import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RedisService } from './redis.service';
import { CacheInterceptor } from './cache.interceptor';

/**
 * Cache Module
 * Global module that provides caching services with Redis
 *
 * Features:
 * - Redis-based caching
 * - Automatic caching via @Cached decorator
 * - Cache invalidation via @CacheInvalidate decorator
 * - Organization and user context awareness
 * - Query and body parameter hashing
 */
@Global()
@Module({
  providers: [
    RedisService,
    CacheInterceptor,
    // Register cache interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
  exports: [RedisService, CacheInterceptor],
})
export class CacheModule {}
