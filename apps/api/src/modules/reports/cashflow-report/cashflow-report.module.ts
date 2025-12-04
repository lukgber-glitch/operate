/**
 * Cash Flow Report Module
 * Provides comprehensive cash flow statement generation and analysis
 */

import { Module } from '@nestjs/common';
import { CashFlowReportController } from './cashflow-report.controller';
import { CashFlowReportService } from './cashflow-report.service';
import { DatabaseModule } from '../../database/database.module';
import { RbacModule } from '../../auth/rbac/rbac.module';

@Module({
  imports: [DatabaseModule, RbacModule],
  controllers: [CashFlowReportController],
  providers: [CashFlowReportService],
  exports: [CashFlowReportService],
})
export class CashFlowReportModule {}
