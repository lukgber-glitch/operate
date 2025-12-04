/**
 * P&L Report Module
 * Specialized module for Profit & Loss statement generation and analysis
 */

import { Module } from '@nestjs/common';
import { PnlReportController } from './pnl-report.controller';
import { PnlReportService } from './pnl-report.service';
import { PrismaModule } from '../../database/prisma.module';
import { CacheModule } from '../../cache/cache.module';
import { ReportGeneratorModule } from '../report-generator/report-generator.module';
import { RbacModule } from '../../auth/rbac/rbac.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    ReportGeneratorModule,
    RbacModule,
  ],
  controllers: [PnlReportController],
  providers: [PnlReportService],
  exports: [PnlReportService],
})
export class PnlReportModule {}
