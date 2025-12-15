import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeductionsController } from './deductions.controller';
import { DeductionsService } from './deductions.service';
import { DeductionAnalyzerService } from './deduction-analyzer.service';
import {
  CommuterCalculatorService,
  HomeOfficeCalculatorService,
  PerDiemCalculatorService,
  MileageCalculatorService,
  TrainingCalculatorService,
} from './calculators';
import { DatabaseModule } from '../../database/database.module';

/**
 * Tax Deductions Module
 * Handles deduction suggestion generation, user confirmation workflow,
 * and tax deduction calculators
 */
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [DeductionsController],
  providers: [
    DeductionsService,
    DeductionAnalyzerService,
    CommuterCalculatorService,
    HomeOfficeCalculatorService,
    PerDiemCalculatorService,
    MileageCalculatorService,
    TrainingCalculatorService,
  ],
  exports: [
    DeductionsService,
    DeductionAnalyzerService,
    CommuterCalculatorService,
    HomeOfficeCalculatorService,
    PerDiemCalculatorService,
    MileageCalculatorService,
    TrainingCalculatorService,
  ],
})
export class DeductionsModule {}
