/**
 * Tax Module
 * Main module for tax-related features
 */

import { Module } from '@nestjs/common';
import { DeductionsModule } from './deductions/deductions.module';
import { VatModule } from './vat/vat.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [DeductionsModule, VatModule, ReportsModule],
  exports: [DeductionsModule, VatModule, ReportsModule],
})
export class TaxModule {}
