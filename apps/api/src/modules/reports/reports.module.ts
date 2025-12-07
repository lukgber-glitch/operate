import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { RbacModule } from '../auth/rbac/rbac.module';
import { ReportGeneratorModule } from './report-generator/report-generator.module';
import { AIReportModule } from './ai-report/ai-report.module';
import { CashFlowReportModule } from './cashflow-report/cashflow-report.module';
import { PnlReportModule } from './pnl-report/pnl-report.module';
import { ArAgingModule } from './ar-aging/ar-aging.module';
import { ApAgingModule } from './ap-aging/ap-aging.module';
import { ScenarioPlanningService } from './scenario/scenario-planning.service';
import { BankIntelligenceModule } from '../ai/bank-intelligence/bank-intelligence.module';

/**
 * Reports Module
 * Provides reporting and analytics functionality across all business areas
 * Includes:
 * - Basic reports (financial, tax, invoice, HR)
 * - Advanced Report Generator (comprehensive analytics)
 * - AI-Powered Reports (natural language generation, insights, predictions)
 * - Cash Flow Statements (IFRS/GAAP compliant with projections and analysis)
 * - P&L Statements (comprehensive profit & loss with trends and forecasting)
 * - AR/AP Aging Reports (accounts receivable and payable aging analysis)
 * - Scenario Planning (what-if business analysis)
 */
@Module({
  imports: [RbacModule, ReportGeneratorModule, AIReportModule, CashFlowReportModule, PnlReportModule, ArAgingModule, ApAgingModule, BankIntelligenceModule],
  controllers: [ReportsController],
  providers: [ReportsService, ScenarioPlanningService],
  exports: [ReportsService, ReportGeneratorModule, AIReportModule, CashFlowReportModule, PnlReportModule, ArAgingModule, ApAgingModule, ScenarioPlanningService],
})
export class ReportsModule {}
