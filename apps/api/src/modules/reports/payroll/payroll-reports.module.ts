import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PayrollReportsController } from './payroll-reports.controller';
import { PayrollReportsService } from './payroll-reports.service';
import { PayrollSummaryGenerator } from './generators/payroll-summary.generator';
import { EmployeeEarningsGenerator } from './generators/employee-earnings.generator';
import { TaxLiabilityGenerator } from './generators/tax-liability.generator';
import { BenefitsDeductionGenerator } from './generators/benefits-deduction.generator';
import { YTDReportGenerator } from './generators/ytd-report.generator';

/**
 * Payroll Reports Module
 * Provides comprehensive payroll reporting functionality
 *
 * Features:
 * - Multiple report types (summary, earnings, tax, benefits, YTD, quarterly, W-2)
 * - PDF and Excel export
 * - Redis caching for performance
 * - Date range and employee filtering
 * - Scheduled report generation
 * - Email delivery
 *
 * Dependencies:
 * - ConfigModule for environment variables
 * - Redis for caching
 * - PDFKit for PDF generation
 * - XLSX for Excel export
 *
 * Integration Points:
 * - Gusto service for payroll data
 * - Email service for report delivery
 * - Storage service for report archival
 */
@Module({
  imports: [ConfigModule],
  controllers: [PayrollReportsController],
  providers: [
    PayrollReportsService,
    PayrollSummaryGenerator,
    EmployeeEarningsGenerator,
    TaxLiabilityGenerator,
    BenefitsDeductionGenerator,
    YTDReportGenerator,
  ],
  exports: [PayrollReportsService],
})
export class PayrollReportsModule {}
