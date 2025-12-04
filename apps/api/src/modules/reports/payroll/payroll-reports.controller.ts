import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  Res,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PayrollReportsService } from './payroll-reports.service';
import {
  PayrollSummaryRequestDto,
  EmployeeEarningsRequestDto,
  TaxLiabilityRequestDto,
  FourOhOneKRequestDto,
  BenefitsDeductionRequestDto,
  YTDReportRequestDto,
  QuarterlyTaxRequestDto,
  AnnualW2SummaryRequestDto,
} from './dto/payroll-report-request.dto';
import {
  PayrollSummaryResponseDto,
  EmployeeEarningsResponseDto,
  TaxLiabilityResponseDto,
  FourOhOneKResponseDto,
  BenefitsDeductionResponseDto,
  YTDReportResponseDto,
  QuarterlyTaxResponseDto,
  AnnualW2SummaryResponseDto,
  ReportErrorResponseDto,
} from './dto/payroll-report-response.dto';
import { PayrollReportType, ReportFormat } from './types/payroll-report.types';

/**
 * Payroll Reports Controller
 * REST endpoints for generating and exporting payroll reports
 *
 * Available Reports:
 * - Payroll Summary (per pay period totals)
 * - Employee Earnings (individual earnings breakdown)
 * - Tax Liability (federal, state, local taxes)
 * - 401(k) Contributions
 * - Benefits Deductions
 * - Year-to-Date (YTD) totals
 * - Quarterly Tax (Form 941 preparation)
 * - Annual W-2 Summary
 *
 * Export Formats:
 * - PDF
 * - Excel (XLSX)
 * - JSON
 */
@ApiTags('Payroll Reports')
@Controller('reports/payroll')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard) // Uncomment when auth is ready
export class PayrollReportsController {
  private readonly logger = new Logger(PayrollReportsController.name);

  constructor(private readonly payrollReportsService: PayrollReportsService) {}

  // ==================== Payroll Summary Report ====================

  @Post('summary')
  @ApiOperation({
    summary: 'Generate payroll summary report',
    description:
      'Generates a summary report of all payrolls in the specified date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
    type: PayrollSummaryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
    type: ReportErrorResponseDto,
  })
  async generatePayrollSummary(
    @Body() request: PayrollSummaryRequestDto,
    @Req() req: any
  ): Promise<PayrollSummaryResponseDto> {
    const userId = req.user?.id || 'system';

    if (request.format === ReportFormat.JSON) {
      const report = await this.payrollReportsService.generatePayrollSummary(
        request,
        userId
      );
      return {
        reportId: report.metadata.reportId,
        reportType: PayrollReportType.PAYROLL_SUMMARY,
        format: ReportFormat.JSON,
        generatedAt: report.metadata.generatedAt,
        generatedBy: userId,
        companyUuid: request.companyUuid,
        dateRange: report.metadata.dateRange,
        data: report,
        summary: {
          totalPayrolls: report.totals.totalPayrollCount,
          totalGrossPay: report.totals.totalGrossPay,
          totalNetPay: report.totals.totalNetPay,
          totalTaxes:
            report.totals.totalEmployeeTaxes + report.totals.totalEmployerTaxes,
          totalDeductions: report.totals.totalEmployeeDeductions,
        },
      };
    }

    // For PDF/Excel, return download URL
    return {
      reportId: uuidv4(),
      reportType: PayrollReportType.PAYROLL_SUMMARY,
      format: request.format,
      generatedAt: new Date(),
      generatedBy: userId,
      companyUuid: request.companyUuid,
      dateRange: { start: request.startDate, end: request.endDate },
      downloadUrl: `/reports/payroll/summary/download/${request.companyUuid}`,
      summary: {
        totalPayrolls: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalTaxes: 0,
        totalDeductions: 0,
      },
    };
  }

  @Post('summary/export')
  @ApiOperation({
    summary: 'Export payroll summary report',
    description: 'Export payroll summary as PDF or Excel',
  })
  @ApiProduces('application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({
    status: 200,
    description: 'Report exported successfully',
  })
  async exportPayrollSummary(
    @Body() request: PayrollSummaryRequestDto,
    @Req() req: any,
    @Res() res: Response
  ): Promise<void> {
    const userId = req.user?.id || 'system';
    const buffer = await this.payrollReportsService.exportPayrollSummary(
      request,
      userId
    );

    const contentType =
      request.format === ReportFormat.PDF
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const extension = request.format === ReportFormat.PDF ? 'pdf' : 'xlsx';
    const filename = `payroll-summary-${request.startDate}-to-${request.endDate}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  // ==================== Employee Earnings Report ====================

  @Post('earnings')
  @ApiOperation({
    summary: 'Generate employee earnings report',
    description: 'Detailed earnings breakdown for each employee',
  })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
    type: EmployeeEarningsResponseDto,
  })
  async generateEmployeeEarnings(
    @Body() request: EmployeeEarningsRequestDto,
    @Req() req: any
  ): Promise<EmployeeEarningsResponseDto> {
    const userId = req.user?.id || 'system';

    if (request.format === ReportFormat.JSON) {
      const report = await this.payrollReportsService.generateEmployeeEarnings(
        request,
        userId
      );
      return {
        reportId: report.metadata.reportId,
        reportType: PayrollReportType.EMPLOYEE_EARNINGS,
        format: ReportFormat.JSON,
        generatedAt: report.metadata.generatedAt,
        generatedBy: userId,
        companyUuid: request.companyUuid,
        dateRange: report.metadata.dateRange,
        data: report,
        summary: {
          totalEmployees: report.totals.totalEmployees,
          totalGrossPay: report.totals.totalGrossPay,
          totalNetPay: report.totals.totalNetPay,
          averageGrossPay:
            report.totals.totalEmployees > 0
              ? report.totals.totalGrossPay / report.totals.totalEmployees
              : 0,
        },
      };
    }

    return {
      reportId: uuidv4(),
      reportType: PayrollReportType.EMPLOYEE_EARNINGS,
      format: request.format,
      generatedAt: new Date(),
      generatedBy: userId,
      companyUuid: request.companyUuid,
      dateRange: { start: request.startDate, end: request.endDate },
      downloadUrl: `/reports/payroll/earnings/download/${request.companyUuid}`,
      summary: {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        averageGrossPay: 0,
      },
    };
  }

  @Post('earnings/export')
  @ApiOperation({
    summary: 'Export employee earnings report',
    description: 'Export employee earnings as PDF or Excel',
  })
  @ApiProduces('application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportEmployeeEarnings(
    @Body() request: EmployeeEarningsRequestDto,
    @Req() req: any,
    @Res() res: Response
  ): Promise<void> {
    const userId = req.user?.id || 'system';
    const buffer = await this.payrollReportsService.exportEmployeeEarnings(
      request,
      userId
    );

    const contentType =
      request.format === ReportFormat.PDF
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const extension = request.format === ReportFormat.PDF ? 'pdf' : 'xlsx';
    const filename = `employee-earnings-${request.startDate}-to-${request.endDate}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // ==================== Tax Liability Report ====================

  @Post('tax-liability')
  @ApiOperation({
    summary: 'Generate tax liability report',
    description: 'Federal, state, and local tax liabilities',
  })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
    type: TaxLiabilityResponseDto,
  })
  async generateTaxLiability(
    @Body() request: TaxLiabilityRequestDto,
    @Req() req: any
  ): Promise<TaxLiabilityResponseDto> {
    const userId = req.user?.id || 'system';

    if (request.format === ReportFormat.JSON) {
      const report = await this.payrollReportsService.generateTaxLiability(
        request,
        userId
      );
      return {
        reportId: report.metadata.reportId,
        reportType: PayrollReportType.TAX_LIABILITY,
        format: ReportFormat.JSON,
        generatedAt: report.metadata.generatedAt,
        generatedBy: userId,
        companyUuid: request.companyUuid,
        dateRange: report.metadata.dateRange,
        data: report,
        summary: {
          totalFederalTax: report.summary.totalFederalIncomeTax,
          totalStateTax: report.summary.totalStateIncomeTax,
          totalLocalTax: report.summary.totalLocalTax,
          totalTaxLiability: report.summary.grandTotalTaxLiability,
        },
      };
    }

    return {
      reportId: uuidv4(),
      reportType: PayrollReportType.TAX_LIABILITY,
      format: request.format,
      generatedAt: new Date(),
      generatedBy: userId,
      companyUuid: request.companyUuid,
      dateRange: { start: request.startDate, end: request.endDate },
      downloadUrl: `/reports/payroll/tax-liability/download/${request.companyUuid}`,
      summary: {
        totalFederalTax: 0,
        totalStateTax: 0,
        totalLocalTax: 0,
        totalTaxLiability: 0,
      },
    };
  }

  @Post('tax-liability/export')
  @ApiOperation({
    summary: 'Export tax liability report',
  })
  @ApiProduces('application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportTaxLiability(
    @Body() request: TaxLiabilityRequestDto,
    @Req() req: any,
    @Res() res: Response
  ): Promise<void> {
    const userId = req.user?.id || 'system';
    const buffer = await this.payrollReportsService.exportTaxLiability(
      request,
      userId
    );

    const contentType =
      request.format === ReportFormat.PDF
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const extension = request.format === ReportFormat.PDF ? 'pdf' : 'xlsx';
    const filename = `tax-liability-${request.startDate}-to-${request.endDate}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // ==================== Benefits Deduction Report ====================

  @Post('benefits-deductions')
  @ApiOperation({
    summary: 'Generate benefits deduction report',
    description: 'Health insurance, retirement, and other deductions',
  })
  async generateBenefitsDeduction(
    @Body() request: BenefitsDeductionRequestDto,
    @Req() req: any
  ): Promise<BenefitsDeductionResponseDto> {
    const userId = req.user?.id || 'system';

    if (request.format === ReportFormat.JSON) {
      const report =
        await this.payrollReportsService.generateBenefitsDeduction(
          request,
          userId
        );
      return {
        reportId: report.metadata.reportId,
        reportType: PayrollReportType.BENEFITS_DEDUCTION,
        format: ReportFormat.JSON,
        generatedAt: report.metadata.generatedAt,
        generatedBy: userId,
        companyUuid: request.companyUuid,
        dateRange: report.metadata.dateRange,
        data: report,
        summary: {
          totalEmployees: report.summary.totalEmployees,
          totalHealthInsurance: report.summary.totalHealthInsurance,
          totalRetirement: report.summary.totalRetirement,
          totalOther: report.summary.totalOther,
          totalDeductions: report.summary.grandTotalDeductions,
        },
      };
    }

    return {
      reportId: uuidv4(),
      reportType: PayrollReportType.BENEFITS_DEDUCTION,
      format: request.format,
      generatedAt: new Date(),
      generatedBy: userId,
      companyUuid: request.companyUuid,
      dateRange: { start: request.startDate, end: request.endDate },
      downloadUrl: `/reports/payroll/benefits-deductions/download/${request.companyUuid}`,
      summary: {
        totalEmployees: 0,
        totalHealthInsurance: 0,
        totalRetirement: 0,
        totalOther: 0,
        totalDeductions: 0,
      },
    };
  }

  @Post('benefits-deductions/export')
  @ApiOperation({
    summary: 'Export benefits deduction report',
  })
  @ApiProduces('application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportBenefitsDeduction(
    @Body() request: BenefitsDeductionRequestDto,
    @Req() req: any,
    @Res() res: Response
  ): Promise<void> {
    const userId = req.user?.id || 'system';
    const buffer = await this.payrollReportsService.exportBenefitsDeduction(
      request,
      userId
    );

    const contentType =
      request.format === ReportFormat.PDF
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const extension = request.format === ReportFormat.PDF ? 'pdf' : 'xlsx';
    const filename = `benefits-deductions-${request.startDate}-to-${request.endDate}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // ==================== YTD Report ====================

  @Post('ytd')
  @ApiOperation({
    summary: 'Generate year-to-date report',
    description: 'YTD totals for all employees',
  })
  async generateYTDReport(
    @Body() request: YTDReportRequestDto,
    @Req() req: any
  ): Promise<YTDReportResponseDto> {
    const userId = req.user?.id || 'system';

    if (request.format === ReportFormat.JSON) {
      const report = await this.payrollReportsService.generateYTDReport(
        request,
        userId
      );
      return {
        reportId: report.metadata.reportId,
        reportType: PayrollReportType.YTD_REPORT,
        format: ReportFormat.JSON,
        generatedAt: report.metadata.generatedAt,
        generatedBy: userId,
        companyUuid: request.companyUuid,
        dateRange: report.metadata.dateRange,
        data: report,
        summary: {
          totalEmployees: report.totals.totalEmployees,
          totalGrossPay: report.totals.totalGrossPay,
          totalTaxes: report.totals.totalTaxes,
          totalDeductions: report.totals.totalDeductions,
          totalNetPay: report.totals.totalNetPay,
        },
      };
    }

    return {
      reportId: uuidv4(),
      reportType: PayrollReportType.YTD_REPORT,
      format: request.format,
      generatedAt: new Date(),
      generatedBy: userId,
      companyUuid: request.companyUuid,
      dateRange: { start: request.startDate, end: request.endDate },
      downloadUrl: `/reports/payroll/ytd/download/${request.companyUuid}`,
      summary: {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalTaxes: 0,
        totalDeductions: 0,
        totalNetPay: 0,
      },
    };
  }

  @Post('ytd/export')
  @ApiOperation({
    summary: 'Export YTD report',
  })
  @ApiProduces('application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportYTDReport(
    @Body() request: YTDReportRequestDto,
    @Req() req: any,
    @Res() res: Response
  ): Promise<void> {
    const userId = req.user?.id || 'system';
    const buffer = await this.payrollReportsService.exportYTDReport(
      request,
      userId
    );

    const contentType =
      request.format === ReportFormat.PDF
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const extension = request.format === ReportFormat.PDF ? 'pdf' : 'xlsx';
    const filename = `ytd-report-${request.endDate}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}

// Import uuidv4 at the top if not already imported
import { v4 as uuidv4 } from 'uuid';
