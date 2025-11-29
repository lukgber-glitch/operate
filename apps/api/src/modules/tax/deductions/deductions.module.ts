import { Module } from '@nestjs/common';
import { DeductionsController } from './deductions.controller';
import { DeductionsService } from './deductions.service';
import { DatabaseModule } from '../../database/database.module';

/**
 * Tax Deductions Module
 * Handles deduction suggestion generation and user confirmation workflow
 */
@Module({
  imports: [DatabaseModule],
  controllers: [DeductionsController],
  providers: [DeductionsService],
  exports: [DeductionsService],
})
export class DeductionsModule {}
