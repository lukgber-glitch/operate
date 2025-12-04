/**
 * Learning Module
 * Handles AI learning from user corrections
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { CorrectionLearningService } from './correction-learning.service';
import { ReceiptLearningIntegrationService } from './receipt-learning-integration.service';
import { LearningController } from './learning.controller';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [LearningController],
  providers: [CorrectionLearningService, ReceiptLearningIntegrationService],
  exports: [CorrectionLearningService, ReceiptLearningIntegrationService],
})
export class LearningModule {}
