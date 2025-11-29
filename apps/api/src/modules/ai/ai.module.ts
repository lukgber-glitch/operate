/**
 * AI Module
 * Handles AI/ML features including transaction classification
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AutomationModule } from '../automation/automation.module';
import { ClassificationService } from './classification/classification.service';
import { ClassificationController } from './classification/classification.controller';
import { ReviewQueueService } from './classification/review-queue/review-queue.service';
import { ReviewQueueController } from './classification/review-queue/review-queue.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, AutomationModule],
  controllers: [ClassificationController, ReviewQueueController],
  providers: [ClassificationService, ReviewQueueService],
  exports: [ClassificationService, ReviewQueueService],
})
export class AiModule {}
