import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeductionsController } from './deductions.controller';
import { DeductionsService } from './deductions.service';
import { DeductionAnalyzerService } from './deduction-analyzer.service';
import { DatabaseModule } from '../../database/database.module';

/**
 * Tax Deductions Module
 * Handles deduction suggestion generation and user confirmation workflow
 */
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [DeductionsController],
  providers: [DeductionsService, DeductionAnalyzerService],
  exports: [DeductionsService, DeductionAnalyzerService],
})
export class DeductionsModule {}
