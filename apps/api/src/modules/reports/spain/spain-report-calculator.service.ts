/**
 * Spain Report Calculator Service
 * Handles tax calculations for Spanish reports from invoice/expense data
 * Task: W25-T4
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  Modelo303Report,
  ReportCalculationData,
  SpainReportPeriod,
  SpainTaxpayer,
  SpainReportType,
  SpainReportStatus,
} from './interfaces/spain-report.interface';
import {
  VAT_RATE_TO_BOX_MAP,
  CALCULATION_FORMULAS,
  QUARTERLY_PERIODS,
} from './constants/modelo-303.constants';
import {
  SPAIN_IVA_RATES,
  SPAIN_MODELO_347_THRESHOLD,
} from '@operate/shared/constants/spain-tax.constants';

@Injectable()
export class SpainReportCalculatorService {
  private readonly logger = new Logger(SpainReportCalculatorService.name);

  /**
   * Calculate Modelo 303 from invoice/expense data
   */
  async calculateModelo303(
    data: ReportCalculationData,
    taxpayer: SpainTaxpayer,
    orgId: string,
  ): Promise<Modelo303Report> {
    this.logger.log(
      `Calculating Modelo 303 for period ${data.period.year}-Q${data.period.quarter}`,
    );

    // Calculate IVA collected (from issued invoices)
    const ivaCollected = this.calculateIvaCollected(data.issuedInvoices);

    // Calculate IVA deductible (from received invoices)
    const ivaDeductible = this.calculateIvaDeductible(data.receivedInvoices);

    // Calculate result
    const result = this.calculateResult(
      ivaCollected.totalQuota,
      ivaDeductible.totalQuota,
      data.previousQuarter,
    );

    // Create report
    const report: Modelo303Report = {
      id: this.generateReportId(),
      orgId,
      type: SpainReportType.MODELO_303,
      period: data.period,
      taxpayer,
      status: SpainReportStatus.CALCULATED,
      createdAt: new Date(),
      updatedAt: new Date(),
      ivaCollected,
      ivaDeductible,
      result,
      calculatedFrom: {
        invoiceCount: data.issuedInvoices.length,
        expenseCount: data.receivedInvoices.length,
        dateRange: this.getDateRangeForPeriod(data.period),
      },
    };

    this.logger.log(
      `Modelo 303 calculated: ${ivaCollected.totalQuota.toFixed(2)} collected, ${ivaDeductible.totalQuota.toFixed(2)} deductible, ${result.netResult.toFixed(2)} net result`,
    );

    return report;
  }

  /**
   * Calculate IVA collected from issued invoices
   */
  private calculateIvaCollected(
    invoices: ReportCalculationData['issuedInvoices'],
  ) {
    const rates = {
      21: { base: 0, quota: 0 },
      10: { base: 0, quota: 0 },
      4: { base: 0, quota: 0 },
    };

    let intraEUBase = 0;
    let intraEUQuota = 0;

    // Group invoices by tax rate
    for (const invoice of invoices) {
      // Skip exports (0% VAT)
      if (invoice.isExport) {
        continue;
      }

      // Handle intra-EU separately
      if (invoice.isIntraEU) {
        intraEUBase += invoice.subtotal;
        intraEUQuota += invoice.taxAmount;
        continue;
      }

      // Standard domestic invoices
      const rate = invoice.taxRate;
      if (rate === SPAIN_IVA_RATES.STANDARD) {
        rates[21].base += invoice.subtotal;
        rates[21].quota += invoice.taxAmount;
      } else if (rate === SPAIN_IVA_RATES.REDUCED) {
        rates[10].base += invoice.subtotal;
        rates[10].quota += invoice.taxAmount;
      } else if (rate === SPAIN_IVA_RATES.SUPER_REDUCED) {
        rates[4].base += invoice.subtotal;
        rates[4].quota += invoice.taxAmount;
      }
    }

    // Calculate total
    const totalQuota =
      rates[21].quota +
      rates[10].quota +
      rates[4].quota +
      intraEUQuota;

    return {
      base21: this.roundAmount(rates[21].base),
      quota21: this.roundAmount(rates[21].quota),
      base10: this.roundAmount(rates[10].base),
      quota10: this.roundAmount(rates[10].quota),
      base4: this.roundAmount(rates[4].base),
      quota4: this.roundAmount(rates[4].quota),
      intraEUAcquisitionsBase: intraEUBase > 0 ? this.roundAmount(intraEUBase) : undefined,
      intraEUAcquisitionsQuota: intraEUQuota > 0 ? this.roundAmount(intraEUQuota) : undefined,
      totalQuota: this.roundAmount(totalQuota),
    };
  }

  /**
   * Calculate IVA deductible from received invoices
   */
  private calculateIvaDeductible(
    invoices: ReportCalculationData['receivedInvoices'],
  ) {
    let currentOperationsBase = 0;
    let currentOperationsQuota = 0;
    let investmentGoodsBase = 0;
    let investmentGoodsQuota = 0;
    let importsQuota = 0;
    let intraEUQuota = 0;

    for (const invoice of invoices) {
      // Skip non-deductible
      if (!invoice.isDeductible) {
        continue;
      }

      // Apply deduction percentage if applicable
      const deductionMultiplier = (invoice.deductionPercentage || 100) / 100;
      const deductibleBase = invoice.subtotal * deductionMultiplier;
      const deductibleQuota = invoice.taxAmount * deductionMultiplier;

      // Categorize by type
      if (invoice.isImport) {
        importsQuota += deductibleQuota;
      } else if (invoice.isIntraEU) {
        intraEUQuota += deductibleQuota;
      } else if (invoice.type === 'INVESTMENT') {
        investmentGoodsBase += deductibleBase;
        investmentGoodsQuota += deductibleQuota;
      } else {
        // Current operations (most common)
        currentOperationsBase += deductibleBase;
        currentOperationsQuota += deductibleQuota;
      }
    }

    // Calculate total
    const totalQuota =
      currentOperationsQuota +
      investmentGoodsQuota +
      importsQuota +
      intraEUQuota;

    return {
      currentOperationsBase: this.roundAmount(currentOperationsBase),
      currentOperationsQuota: this.roundAmount(currentOperationsQuota),
      investmentGoodsBase: investmentGoodsBase > 0 ? this.roundAmount(investmentGoodsBase) : undefined,
      investmentGoodsQuota: investmentGoodsQuota > 0 ? this.roundAmount(investmentGoodsQuota) : undefined,
      importsQuota: importsQuota > 0 ? this.roundAmount(importsQuota) : undefined,
      intraEUQuota: intraEUQuota > 0 ? this.roundAmount(intraEUQuota) : undefined,
      totalQuota: this.roundAmount(totalQuota),
    };
  }

  /**
   * Calculate final result
   */
  private calculateResult(
    totalDevengada: number,
    totalDeducible: number,
    previousQuarter?: { toPay?: number; toReturn?: number },
  ) {
    // Gross result = collected - deductible
    const grossResult = CALCULATION_FORMULAS.calculateResultadoBruto(
      totalDevengada,
      totalDeducible,
    );

    // Adjustments (simplified for now)
    const adjustments = 0;
    const previousReturnsToDeduct = previousQuarter?.toReturn || 0;

    // Net result
    const netResult = CALCULATION_FORMULAS.calculateResultadoLiquidacion(
      grossResult,
      adjustments + previousReturnsToDeduct,
    );

    // Determine if to pay or to return
    const toPay = netResult > 0 ? netResult : undefined;
    const toReturn = netResult < 0 ? Math.abs(netResult) : undefined;

    return {
      grossResult: this.roundAmount(grossResult),
      previousQuarterProportion: undefined,
      proportionRegularization: undefined,
      previousReturnsToDeduct: previousReturnsToDeduct > 0 ? this.roundAmount(previousReturnsToDeduct) : undefined,
      netResult: this.roundAmount(netResult),
      toPay: toPay ? this.roundAmount(toPay) : undefined,
      toReturn: toReturn ? this.roundAmount(toReturn) : undefined,
    };
  }

  /**
   * Get date range for a period
   */
  private getDateRangeForPeriod(period: SpainReportPeriod): {
    from: Date;
    to: Date;
  } {
    if (!period.quarter) {
      throw new Error('Quarter is required for date range calculation');
    }

    const quarterInfo = QUARTERLY_PERIODS[period.quarter];
    const months = quarterInfo.months;

    const from = new Date(period.year, months[0] - 1, 1);
    const to = new Date(period.year, months[2], 0); // Last day of last month

    return { from, to };
  }

  /**
   * Round amount to 2 decimal places
   */
  private roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `ESP-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Validate calculation data
   */
  validateCalculationData(data: ReportCalculationData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check period
    if (!data.period.year || !data.period.quarter) {
      errors.push('Period must include year and quarter');
    }

    // Check data exists
    if (
      (!data.issuedInvoices || data.issuedInvoices.length === 0) &&
      (!data.receivedInvoices || data.receivedInvoices.length === 0)
    ) {
      errors.push('No invoices or expenses found for the period');
    }

    // Validate invoice data
    for (const invoice of data.issuedInvoices || []) {
      if (!invoice.date) {
        errors.push(`Invoice ${invoice.number} is missing date`);
      }
      if (invoice.taxRate === undefined || invoice.taxRate === null) {
        errors.push(`Invoice ${invoice.number} is missing tax rate`);
      }
      if (invoice.taxAmount === undefined || invoice.taxAmount === null) {
        errors.push(`Invoice ${invoice.number} is missing tax amount`);
      }
    }

    // Validate expense data
    for (const expense of data.receivedInvoices || []) {
      if (!expense.date) {
        errors.push(`Expense ${expense.number} is missing date`);
      }
      if (expense.isDeductible && expense.taxAmount === undefined) {
        errors.push(`Deductible expense ${expense.number} is missing tax amount`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if period is within filing deadline
   */
  isWithinFilingDeadline(period: SpainReportPeriod): boolean {
    if (!period.quarter) return false;

    const deadline = this.getFilingDeadline(period);
    const now = new Date();

    return now <= deadline;
  }

  /**
   * Get filing deadline for a period
   */
  getFilingDeadline(period: SpainReportPeriod): Date {
    if (!period.quarter) {
      throw new Error('Quarter is required for deadline calculation');
    }

    const deadlineInfo = {
      1: { month: 4, day: 20 },
      2: { month: 7, day: 20 },
      3: { month: 10, day: 20 },
      4: { month: 1, day: 30 }, // Next year
    }[period.quarter];

    const year =
      period.quarter === 4 ? period.year + 1 : period.year;

    return new Date(year, deadlineInfo.month - 1, deadlineInfo.day);
  }

  /**
   * Calculate days until deadline
   */
  getDaysUntilDeadline(period: SpainReportPeriod): number {
    const deadline = this.getFilingDeadline(period);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
