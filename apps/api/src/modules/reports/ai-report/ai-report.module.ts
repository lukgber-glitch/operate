/**
 * AI Report Module
 * Natural language report generation with OpenAI integration
 */

import { Module } from '@nestjs/common';
import { AIReportController } from './ai-report.controller';
import { AIReportService } from './ai-report.service';
import { ReportGeneratorModule } from '../report-generator/report-generator.module';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../cache/cache.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
    ReportGeneratorModule,
  ],
  controllers: [AIReportController],
  providers: [AIReportService],
  exports: [AIReportService],
})
export class AIReportModule {}
