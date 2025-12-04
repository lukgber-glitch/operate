/**
 * Receipt Extractor Module
 * AI-powered receipt extraction using OpenAI GPT-4 Vision
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../../../database/database.module';
import { ReceiptExtractorService } from './receipt-extractor.service';
import { ReceiptExtractorProcessor } from './receipt-extractor.processor';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    BullModule.registerQueue({
      name: 'receipt-extraction',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs for debugging
      },
    }),
  ],
  providers: [ReceiptExtractorService, ReceiptExtractorProcessor],
  exports: [ReceiptExtractorService],
})
export class ReceiptExtractorModule {}
