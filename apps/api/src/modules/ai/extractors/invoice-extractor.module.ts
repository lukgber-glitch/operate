/**
 * Invoice Extractor Module
 * AI-powered invoice data extraction using GPT-4 Vision
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../../../database/database.module';
import { InvoiceExtractorService } from './invoice-extractor.service';
import { InvoiceExtractorProcessor } from './invoice-extractor.processor';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    BullModule.registerQueue({
      name: 'invoice-extraction',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    }),
  ],
  providers: [InvoiceExtractorService, InvoiceExtractorProcessor],
  exports: [InvoiceExtractorService],
})
export class InvoiceExtractorModule {}
