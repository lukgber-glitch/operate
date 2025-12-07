import { Module } from '@nestjs/common';
import { TaxReportController } from './tax-report.controller';
import { TaxReportService } from './tax-report.service';
import { DatabaseModule } from '@/modules/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TaxReportController],
  providers: [TaxReportService],
  exports: [TaxReportService],
})
export class TaxReportModule {}
