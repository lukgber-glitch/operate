/**
 * Modelo 303 Service
 * Quarterly VAT Declaration Service
 * Task: W25-T4
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SpainReportCalculatorService } from './spain-report-calculator.service';
import {
  Modelo303Report,
  ReportCalculationData,
  SpainReportPeriod,
  SpainTaxpayer,
  SpainReportType,
  SpainReportStatus,
} from './interfaces/spain-report.interface';
import { QUARTERLY_PERIODS } from './constants/modelo-303.constants';

@Injectable()
export class Modelo303Service {
  private readonly logger = new Logger(Modelo303Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: SpainReportCalculatorService,
  ) {}

  /**
   * Generate Modelo 303 for a quarter
   */
  async generate(
    orgId: string,
    period: SpainReportPeriod,
    taxpayer: SpainTaxpayer,
  ): Promise<Modelo303Report> {
    this.logger.log(
      `Generating Modelo 303 for org ${orgId}, period ${period.year}-Q${period.quarter}`,
    );

    // Validate period
    this.validatePeriod(period);

    // Get invoices and expenses for the period
    const calculationData = await this.getCalculationData(orgId, period);

    // Validate data
    const validation = this.calculator.validateCalculationData(calculationData);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid calculation data: ${validation.errors.join(', ')}`,
      );
    }

    // Calculate report
    const report = await this.calculator.calculateModelo303(
      calculationData,
      taxpayer,
      orgId,
    );

    // Save to database (store as JSON for now)
    await this.saveReport(report);

    this.logger.log(`Modelo 303 generated successfully: ${report.id}`);

    return report;
  }

  /**
   * Get existing Modelo 303 report
   */
  async getReport(reportId: string): Promise<Modelo303Report> {
    this.logger.log(`Fetching Modelo 303 report ${reportId}`);

    const reportData = await this.loadReport(reportId);

    if (!reportData) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    return reportData;
  }

  /**
   * Recalculate existing report
   */
  async recalculate(reportId: string, force = false): Promise<Modelo303Report> {
    this.logger.log(`Recalculating Modelo 303 report ${reportId}`);

    // Get existing report
    const existingReport = await this.getReport(reportId);

    // Check if already submitted
    if (
      existingReport.status === SpainReportStatus.SUBMITTED ||
      existingReport.status === SpainReportStatus.ACCEPTED
    ) {
      if (!force) {
        throw new BadRequestException(
          'Cannot recalculate submitted report without force flag',
        );
      }
      this.logger.warn(`Force recalculating submitted report ${reportId}`);
    }

    // Recalculate
    const calculationData = await this.getCalculationData(
      existingReport.orgId,
      existingReport.period,
    );

    const report = await this.calculator.calculateModelo303(
      calculationData,
      existingReport.taxpayer,
      existingReport.orgId,
    );

    // Update with same ID
    report.id = reportId;
    report.createdAt = existingReport.createdAt;

    // Save updated report
    await this.saveReport(report);

    this.logger.log(`Modelo 303 recalculated successfully: ${reportId}`);

    return report;
  }

  /**
   * Get all reports for an organization
   */
  async listReports(
    orgId: string,
    filters?: {
      year?: number;
      quarter?: number;
      status?: SpainReportStatus;
    },
  ): Promise<Modelo303Report[]> {
    this.logger.log(`Listing Modelo 303 reports for org ${orgId}`);

    // In a real implementation, this would query the database
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Validate Modelo 303
   */
  async validate(reportId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const report = await this.getReport(reportId);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate taxpayer NIF
    if (!this.isValidNIF(report.taxpayer.nif)) {
      errors.push('Invalid taxpayer NIF');
    }

    // Validate amounts
    if (report.ivaCollected.totalQuota < 0) {
      errors.push('Total IVA collected cannot be negative');
    }

    if (report.ivaDeductible.totalQuota < 0) {
      errors.push('Total IVA deductible cannot be negative');
    }

    // Check calculation consistency
    const expectedTotal =
      report.ivaCollected.quota21 +
      report.ivaCollected.quota10 +
      report.ivaCollected.quota4 +
      (report.ivaCollected.intraEUAcquisitionsQuota || 0);

    if (Math.abs(expectedTotal - report.ivaCollected.totalQuota) > 0.01) {
      errors.push('IVA collected total does not match sum of individual quotas');
    }

    // Check deadline
    const daysUntilDeadline = this.calculator.getDaysUntilDeadline(report.period);
    if (daysUntilDeadline < 0) {
      warnings.push(`Filing deadline has passed ${Math.abs(daysUntilDeadline)} days ago`);
    } else if (daysUntilDeadline <= 7) {
      warnings.push(`Filing deadline approaching in ${daysUntilDeadline} days`);
    }

    // Check for unusual deduction ratio
    if (report.ivaCollected.totalQuota > 0) {
      const deductionRatio =
        report.ivaDeductible.totalQuota / report.ivaCollected.totalQuota;
      if (deductionRatio > 0.95) {
        warnings.push(
          `Unusually high deduction ratio: ${(deductionRatio * 100).toFixed(1)}%`,
        );
      }
    }

    // Check for large refund
    if (report.result.toReturn && report.result.toReturn > 10000) {
      warnings.push(
        `Large refund requested: €${report.result.toReturn.toFixed(2)}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Mark report as submitted
   */
  async markAsSubmitted(
    reportId: string,
    csvReference: string,
  ): Promise<Modelo303Report> {
    const report = await this.getReport(reportId);

    report.status = SpainReportStatus.SUBMITTED;
    report.submittedAt = new Date();
    report.csvReference = csvReference;
    report.updatedAt = new Date();

    await this.saveReport(report);

    return report;
  }

  /**
   * Get calculation data from database
   */
  private async getCalculationData(
    orgId: string,
    period: SpainReportPeriod,
  ): Promise<ReportCalculationData> {
    if (!period.quarter) {
      throw new BadRequestException('Quarter is required');
    }

    const quarterInfo = QUARTERLY_PERIODS[period.quarter];
    const months = quarterInfo.months;

    // Date range for the quarter
    const dateFrom = new Date(period.year, months[0] - 1, 1);
    const dateTo = new Date(period.year, months[2], 0, 23, 59, 59); // Last day of quarter

    // Get issued invoices (sales)
    const issuedInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId,
        issueDate: {
          gte: dateFrom,
          lte: dateTo,
        },
        status: {
          in: ['SENT', 'PAID'],
        },
      },
      include: {
        items: true,
      },
    });

    // Get received invoices (expenses)
    const receivedInvoices = await this.prisma.expense.findMany({
      where: {
        orgId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
        status: {
          in: ['APPROVED', 'REIMBURSED'],
        },
      },
    });

    // Transform to calculation format
    const issuedInvoicesData = issuedInvoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      date: inv.issueDate,
      customerId: inv.customerId || '',
      customerName: inv.customerName || '',
      customerNif: inv.customerId, // Tax ID would be on customer record
      subtotal: Number(inv.subtotal),
      taxRate: Number(inv.vatRate || 0),
      taxAmount: Number(inv.vatAmount || 0),
      total: Number(inv.totalAmount),
      type: inv.type,
      isIntraEU: false, // Would need customer country lookup
      isExport: false, // Would need customer country lookup
    }));

    const receivedInvoicesData = receivedInvoices.map((exp) => ({
      id: exp.id,
      number: exp.receiptNumber || exp.id,
      date: exp.date,
      supplierId: exp.vendorName || '',
      supplierName: exp.vendorName || '',
      supplierNif: exp.vendorVatId || '',
      subtotal: Number(exp.amount),
      taxRate: Number(exp.vatRate || 0),
      taxAmount: Number(exp.vatAmount || 0),
      total: Number(exp.amount),
      type: exp.category === 'EQUIPMENT' ? 'INVESTMENT' : 'CURRENT',
      isDeductible: true, // Default to true
      deductionPercentage: 100,
      isIntraEU: exp.vendorCountry ? this.isEUCountry(exp.vendorCountry) : false,
      isImport: exp.vendorCountry ? !this.isEUCountry(exp.vendorCountry) && exp.vendorCountry !== 'ES' : false,
    }));

    // Get previous quarter data for adjustments
    const previousQuarter = await this.getPreviousQuarterData(orgId, period);

    return {
      period,
      issuedInvoices: issuedInvoicesData,
      receivedInvoices: receivedInvoicesData,
      previousQuarter,
    };
  }

  /**
   * Get previous quarter data for adjustments
   */
  private async getPreviousQuarterData(
    orgId: string,
    period: SpainReportPeriod,
  ): Promise<{ toPay?: number; toReturn?: number } | undefined> {
    if (!period.quarter || period.quarter === 1) {
      // No previous quarter in same year
      return undefined;
    }

    // For now, return undefined - would query previous report in production
    return undefined;
  }

  /**
   * Check if country is in EU
   */
  private isEUCountry(countryCode: string): boolean {
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ];
    return euCountries.includes(countryCode.toUpperCase());
  }

  /**
   * Validate period
   */
  private validatePeriod(period: SpainReportPeriod): void {
    if (!period.year || period.year < 2020 || period.year > 2100) {
      throw new BadRequestException('Invalid year');
    }

    if (!period.quarter || period.quarter < 1 || period.quarter > 4) {
      throw new BadRequestException('Invalid quarter (must be 1-4)');
    }
  }

  /**
   * Validate Spanish NIF/CIF
   */
  private isValidNIF(nif: string): boolean {
    const pattern = /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[A-W][0-9]{7}[0-9A-J])$/;
    return pattern.test(nif);
  }

  /**
   * Save report to database
   * In production, this would save to a dedicated reports table
   * For now, we'll use a simple JSON storage approach
   */
  private async saveReport(report: Modelo303Report): Promise<void> {
    // Placeholder: In production, save to database
    // For now, just log
    this.logger.log(`Saving report ${report.id} to database`);

    // Could store in organization settings or a dedicated table
    // await this.prisma.spanishReport.upsert({...})
  }

  /**
   * Load report from database
   */
  private async loadReport(reportId: string): Promise<Modelo303Report | null> {
    // Placeholder: In production, load from database
    // For now, return null
    this.logger.log(`Loading report ${reportId} from database`);
    return null;
  }
}
