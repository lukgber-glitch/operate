import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Cache Module
 * Global module that provides caching services
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class CacheModule {}
