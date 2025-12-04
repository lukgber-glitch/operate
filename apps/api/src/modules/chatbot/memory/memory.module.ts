import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../cache/cache.module';
import { ConversationMemoryService } from './memory.service';
import { TokenEstimatorService } from './token-estimator.service';
import { SlidingWindowService } from './sliding-window.service';
import { MemoryExtractorService } from './extractor.service';
import { MemoryCacheService } from './memory-cache.service';

/**
 * Memory Module
 * Provides conversation memory management functionality
 */
@Module({
  imports: [ConfigModule, DatabaseModule, CacheModule],
  providers: [
    ConversationMemoryService,
    TokenEstimatorService,
    SlidingWindowService,
    MemoryExtractorService,
    MemoryCacheService,
  ],
  exports: [
    ConversationMemoryService,
    TokenEstimatorService,
    SlidingWindowService,
    MemoryExtractorService,
    MemoryCacheService,
  ],
})
export class MemoryModule {}
