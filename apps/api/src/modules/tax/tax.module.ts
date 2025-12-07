/**
 * Tax Module
 * Main module for tax-related features
 */

import { Module } from '@nestjs/common';
import { DeductionsModule } from './deductions/deductions.module';
import { VatModule } from './vat/vat.module';
import { ReportsModule } from './reports/reports.module';
import { TaxCalendarModule } from './calendar/tax-calendar.module';
import { VatReturnModule } from './vat-return/vat-return.module';
import { TaxArchiveModule } from './archive/tax-archive.module';
import { AustriaTaxModule } from './austria/austria-tax.module';

@Module({
  imports: [
    DeductionsModule,
    VatModule,
    ReportsModule,
    TaxCalendarModule,
    VatReturnModule,
    TaxArchiveModule,
    AustriaTaxModule,
  ],
  exports: [
    DeductionsModule,
    VatModule,
    ReportsModule,
    TaxCalendarModule,
    VatReturnModule,
    TaxArchiveModule,
    AustriaTaxModule,
  ],
})
export class TaxModule {}
