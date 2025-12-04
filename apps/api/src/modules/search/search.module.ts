/**
 * Search Module
 * Provides global search functionality across all entities
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchIndexerService } from './search-indexer.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: 'search-reindex',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per minute
    }]),
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchIndexerService],
  exports: [SearchService, SearchIndexerService],
})
export class SearchModule {}
