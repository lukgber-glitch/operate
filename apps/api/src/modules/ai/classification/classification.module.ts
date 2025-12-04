/**
 * Classification Module
 * AI-powered transaction and expense classification
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AutomationModule } from '../../automation/automation.module';
import { EventsModule } from '../../../websocket/events.module';
import { ClassificationService } from './classification.service';
import { ClassificationController } from './classification.controller';
import { ExpenseClassifierService } from './expense-classifier.service';
import { TaxDeductionClassifierService } from './tax-deduction-classifier.service';
import { ReviewQueueService } from './review-queue/review-queue.service';
import { ReviewQueueController } from './review-queue/review-queue.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, AutomationModule, EventsModule],
  controllers: [ClassificationController, ReviewQueueController],
  providers: [
    ClassificationService,
    ExpenseClassifierService,
    TaxDeductionClassifierService,
    ReviewQueueService,
  ],
  exports: [
    ClassificationService,
    ExpenseClassifierService,
    TaxDeductionClassifierService,
    ReviewQueueService,
  ],
})
export class ClassificationModule {}
