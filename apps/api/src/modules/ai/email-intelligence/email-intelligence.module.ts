/**
 * Email Intelligence Module
 * Handles email classification, entity extraction, parsing, auto-creation, aggregation, and suggestions
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../../database/database.module';
import { EmailClassifierService } from './email-classifier.service';
import { EntityExtractorService } from './entity-extractor.service';
import { CustomerAutoCreatorService } from './customer-auto-creator.service';
import { CustomerMatcherService } from './matchers/customer-matcher.service';
import { VendorAutoCreatorService } from './vendor-auto-creator.service';
import { VendorMatcherService } from './matchers/vendor-matcher.service';
import { RelationshipTrackerService } from './relationship-tracker.service';
import { EmailSuggestionsService } from './email-suggestions.service';
import { EmailAggregatorService } from './email-aggregator.service';
import { BillCreatorService } from './bill-creator.service';
import { EmailFilterService } from './email-filter.service';
import { EmailFilterController } from './email-filter.controller';
import { EmailIntelligenceController } from './email-intelligence.controller';
import { EmailAggregationProcessor } from './jobs/email-aggregation.processor';
import { ReviewQueueService } from './review-queue.service';
import { ReviewQueueController } from './review-queue.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    BullModule.registerQueue({
      name: 'email-intelligence',
    }),
  ],
  controllers: [
    EmailIntelligenceController,
    EmailFilterController,
    ReviewQueueController,
  ],
  providers: [
    EmailClassifierService,
    EntityExtractorService,
    CustomerAutoCreatorService,
    CustomerMatcherService,
    VendorAutoCreatorService,
    VendorMatcherService,
    RelationshipTrackerService,
    EmailSuggestionsService,
    EmailAggregatorService,
    BillCreatorService,
    EmailFilterService,
    EmailAggregationProcessor,
    ReviewQueueService,
  ],
  exports: [
    EmailClassifierService,
    EntityExtractorService,
    CustomerAutoCreatorService,
    CustomerMatcherService,
    VendorAutoCreatorService,
    VendorMatcherService,
    RelationshipTrackerService,
    EmailSuggestionsService,
    EmailAggregatorService,
    BillCreatorService,
    EmailFilterService,
    ReviewQueueService,
  ],
})
export class EmailIntelligenceModule {}
