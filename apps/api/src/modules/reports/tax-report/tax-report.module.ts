import { Module } from '@nestjs/common';
import { TaxReportController } from './tax-report.controller';
import { TaxReportService } from './tax-report.service';
import { PrismaModule } from '@/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaxReportController],
  providers: [TaxReportService],
  exports: [TaxReportService],
})
export class TaxReportModule {}
