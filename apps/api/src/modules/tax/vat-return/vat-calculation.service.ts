import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/**
 * VAT Calculation Result
 */
export interface VatCalculation {
  period: string;
  periodStart: Date;
  periodEnd: Date;

  // Output VAT (from invoices)
  umsaetze: {
    steuerpflichtig19: number; // KZ 81 - Net amount at 19%
    steuer19: number; // VAT at 19%
    steuerpflichtig7: number; // KZ 86 - Net amount at 7%
    steuer7: number; // VAT at 7%
    steuerfrei: number; // KZ 43 - Tax-free revenue
    euLieferungen: number; // KZ 41 - EU deliveries (tax-free)
    reverseCharge: number; // KZ 60 - Reverse charge revenue
  };

  // Input VAT (from expenses)
  vorsteuer: {
    abziehbar: number; // KZ 66 - Deductible input VAT
    innergemeinschaftlich: number; // KZ 61 - EU acquisitions input VAT
    einfuhr: number; // KZ 62 - Import VAT
  };

  // Result
  zahllast: number; // KZ 83 - Net VAT payable (if positive)
  erstattung: number; // Refund amount (if zahllast is negative)

  // Supporting data
  invoiceCount: number;
  expenseCount: number;
  confidence: number;
  warnings: string[];
}

/**
 * VAT Calculation Service
 *
 * Automatically calculates VAT return data from invoices and expenses.
 * Generates ELSTER-compatible calculations for German VAT returns (UStVA).
 */
@Injectable()
export class VatCalculationService {
  private readonly logger = new Logger(VatCalculationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate VAT for a specific period
   *
   * @param organizationId Organization ID
   * @param period Period string (e.g., "2025-Q1", "2025-01")
   * @returns VAT calculation result
   */
  async calculateVat(
    organizationId: string,
    period: string,
  ): Promise<VatCalculation> {
    this.logger.log(
      `Calculating VAT for organization ${organizationId}, period ${period}`,
    );

    const { periodStart, periodEnd } = this.parsePeriod(period);

    // Get all finalized invoices in period
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organizationId,
        issueDate: { gte: periodStart, lte: periodEnd },
        status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      include: { items: true },
    });

    // Calculate output VAT by rate
    const outputVat = this.calculateOutputVat(invoices);

    // Get all deductible expenses in period
    const expenses = await this.getDeductibleExpenses(
      organizationId,
      periodStart,
      periodEnd,
    );

    // Calculate input VAT
    const inputVat = this.calculateInputVat(expenses);

    // Net VAT calculation
    const totalOutputVat = outputVat.steuer19 + outputVat.steuer7;
    const totalInputVat =
      inputVat.abziehbar + inputVat.innergemeinschaftlich + inputVat.einfuhr;
    const zahllast = totalOutputVat - totalInputVat;

    // Calculate confidence and generate warnings
    const confidence = this.calculateConfidence(invoices, expenses);
    const warnings = this.generateWarnings(invoices, expenses, outputVat);

    return {
      period,
      periodStart,
      periodEnd,
      umsaetze: {
        steuerpflichtig19: outputVat.steuerpflichtig19,
        steuer19: outputVat.steuer19,
        steuerpflichtig7: outputVat.steuerpflichtig7,
        steuer7: outputVat.steuer7,
        steuerfrei: outputVat.steuerfrei,
        euLieferungen: outputVat.euLieferungen,
        reverseCharge: outputVat.reverseCharge,
      },
      vorsteuer: inputVat,
      zahllast: zahllast > 0 ? zahllast : 0,
      erstattung: zahllast < 0 ? Math.abs(zahllast) : 0,
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
      confidence,
      warnings,
    };
  }

  /**
   * Calculate output VAT from invoices
   */
  private calculateOutputVat(invoices: any[]) {
    let steuerpflichtig19 = 0;
    let steuer19 = 0;
    let steuerpflichtig7 = 0;
    let steuer7 = 0;
    let steuerfrei = 0;
    let euLieferungen = 0;
    let reverseCharge = 0;

    for (const invoice of invoices) {
      const netAmount = Number(invoice.subtotal || 0);
      const vatRate = Number(invoice.vatRate || 0);
      const vatAmount = Number(invoice.vatAmount || 0);

      // Reverse charge transactions (B2B services from EU)
      if (invoice.reverseCharge) {
        reverseCharge += netAmount;
        continue;
      }

      // EU deliveries (intra-community supply)
      // Check if customer has valid EU VAT ID (not German)
      const isEuDelivery =
        invoice.customerVatId &&
        invoice.customerVatId.length > 2 &&
        !invoice.customerVatId.startsWith('DE') &&
        this.isValidEuVatId(invoice.customerVatId);

      if (isEuDelivery) {
        euLieferungen += netAmount;
        continue;
      }

      // Domestic revenue by VAT rate
      if (vatRate === 0.19 || vatRate === 19) {
        steuerpflichtig19 += netAmount;
        steuer19 += vatAmount;
      } else if (vatRate === 0.07 || vatRate === 7) {
        steuerpflichtig7 += netAmount;
        steuer7 += vatAmount;
      } else if (vatRate === 0) {
        steuerfrei += netAmount;
      } else {
        // Unknown VAT rate - log warning
        this.logger.warn(
          `Unknown VAT rate ${vatRate} on invoice ${invoice.id}`,
        );
        steuerfrei += netAmount;
      }
    }

    return {
      steuerpflichtig19,
      steuer19,
      steuerpflichtig7,
      steuer7,
      steuerfrei,
      euLieferungen,
      reverseCharge,
    };
  }

  /**
   * Get deductible expenses for the period
   */
  private async getDeductibleExpenses(
    orgId: string,
    start: Date,
    end: Date,
  ): Promise<any[]> {
    return this.prisma.expense.findMany({
      where: {
        orgId,
        date: { gte: start, lte: end },
        status: { in: ['APPROVED', 'REIMBURSED'] },
        isDeductible: true,
      },
    });
  }

  /**
   * Calculate input VAT from expenses
   */
  private calculateInputVat(expenses: any[]) {
    let abziehbar = 0;
    let innergemeinschaftlich = 0;
    let einfuhr = 0;

    for (const expense of expenses) {
      const vatAmount = Number(expense.vatAmount || 0);

      if (vatAmount <= 0) {
        continue;
      }

      // Check if it's an EU acquisition
      const isEuAcquisition =
        expense.vendorVatId &&
        expense.vendorVatId.length > 2 &&
        !expense.vendorVatId.startsWith('DE') &&
        this.isValidEuVatId(expense.vendorVatId);

      if (isEuAcquisition) {
        innergemeinschaftlich += vatAmount;
      } else if (expense.category === 'IMPORT' || expense.subcategory === 'import') {
        einfuhr += vatAmount;
      } else {
        abziehbar += vatAmount;
      }
    }

    return { abziehbar, innergemeinschaftlich, einfuhr };
  }

  /**
   * Parse period string to date range
   *
   * @param period Format: "2025-Q1" or "2025-01"
   */
  private parsePeriod(period: string): {
    periodStart: Date;
    periodEnd: Date;
  } {
    const parts = period.split('-');
    const year = parseInt(parts[0], 10);

    if (parts[1].startsWith('Q')) {
      // Quarterly
      const quarter = parseInt(parts[1].substring(1), 10);
      const startMonth = (quarter - 1) * 3;
      const endMonth = startMonth + 3;

      return {
        periodStart: new Date(year, startMonth, 1),
        periodEnd: new Date(year, endMonth, 0, 23, 59, 59, 999),
      };
    } else {
      // Monthly
      const month = parseInt(parts[1], 10);

      return {
        periodStart: new Date(year, month - 1, 1),
        periodEnd: new Date(year, month, 0, 23, 59, 59, 999),
      };
    }
  }

  /**
   * Validate EU VAT ID format
   */
  private isValidEuVatId(vatId: string): boolean {
    if (!vatId || vatId.length < 3) {
      return false;
    }

    const countryCode = vatId.substring(0, 2).toUpperCase();
    const euCountries = [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
    ];

    return euCountries.includes(countryCode);
  }

  /**
   * Calculate confidence score (0-100)
   */
  private calculateConfidence(
    invoices: any[],
    expenses: any[],
  ): number {
    let score = 100;

    // Reduce confidence if no invoices or expenses
    if (invoices.length === 0) {
      score -= 30;
    }

    if (expenses.length === 0) {
      score -= 20;
    }

    // Reduce confidence for invoices without VAT amount
    const invoicesWithoutVat = invoices.filter(
      (inv) => !inv.vatAmount && Number(inv.vatRate || 0) > 0,
    );
    if (invoicesWithoutVat.length > 0) {
      score -= Math.min(20, invoicesWithoutVat.length * 2);
    }

    // Reduce confidence for expenses without VAT details
    const expensesWithoutVat = expenses.filter(
      (exp) => !exp.vatAmount && !exp.vatRate,
    );
    if (expensesWithoutVat.length > 0) {
      score -= Math.min(15, expensesWithoutVat.length * 2);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate warnings for VAT calculation
   */
  private generateWarnings(
    invoices: any[],
    expenses: any[],
    outputVat: any,
  ): string[] {
    const warnings: string[] = [];

    // No revenue warning
    if (
      outputVat.steuerpflichtig19 === 0 &&
      outputVat.steuerpflichtig7 === 0 &&
      outputVat.steuerfrei === 0 &&
      outputVat.euLieferungen === 0
    ) {
      warnings.push('No revenue reported for this period');
    }

    // Missing VAT amounts
    const invoicesWithoutVat = invoices.filter(
      (inv) => !inv.vatAmount && Number(inv.vatRate || 0) > 0,
    );
    if (invoicesWithoutVat.length > 0) {
      warnings.push(
        `${invoicesWithoutVat.length} invoice(s) missing VAT amount`,
      );
    }

    // EU deliveries without VAT ID
    const euDeliveriesWithoutVatId = invoices.filter(
      (inv) =>
        inv.customerVatId &&
        !inv.customerVatId.startsWith('DE') &&
        !this.isValidEuVatId(inv.customerVatId),
    );
    if (euDeliveriesWithoutVatId.length > 0) {
      warnings.push(
        `${euDeliveriesWithoutVatId.length} EU delivery/ies with invalid VAT ID`,
      );
    }

    // Large VAT amount
    const totalVat = outputVat.steuer19 + outputVat.steuer7;
    if (totalVat > 1000000) {
      // > €1M
      warnings.push(
        'VAT amount is unusually large (>€1,000,000), please verify',
      );
    }

    // Expenses without VAT details
    const expensesWithoutVat = expenses.filter(
      (exp) => !exp.vatAmount && !exp.vatRate,
    );
    if (expensesWithoutVat.length > 0) {
      warnings.push(
        `${expensesWithoutVat.length} expense(s) missing VAT information`,
      );
    }

    return warnings;
  }

  /**
   * Get VAT calculation summary as text
   */
  getCalculationSummary(calculation: VatCalculation): string {
    const lines: string[] = [];

    lines.push(`VAT Calculation for ${calculation.period}`);
    lines.push(`Period: ${calculation.periodStart.toLocaleDateString()} - ${calculation.periodEnd.toLocaleDateString()}`);
    lines.push('');

    lines.push('Output VAT (Revenue):');
    lines.push(
      `  19% Revenue: €${(calculation.umsaetze.steuerpflichtig19 / 100).toFixed(2)}`,
    );
    lines.push(
      `  19% VAT: €${(calculation.umsaetze.steuer19 / 100).toFixed(2)}`,
    );
    lines.push(
      `  7% Revenue: €${(calculation.umsaetze.steuerpflichtig7 / 100).toFixed(2)}`,
    );
    lines.push(
      `  7% VAT: €${(calculation.umsaetze.steuer7 / 100).toFixed(2)}`,
    );
    lines.push(
      `  Tax-free: €${(calculation.umsaetze.steuerfrei / 100).toFixed(2)}`,
    );
    lines.push(
      `  EU Deliveries: €${(calculation.umsaetze.euLieferungen / 100).toFixed(2)}`,
    );
    lines.push('');

    lines.push('Input VAT (Expenses):');
    lines.push(
      `  Deductible: €${(calculation.vorsteuer.abziehbar / 100).toFixed(2)}`,
    );
    lines.push(
      `  EU Acquisitions: €${(calculation.vorsteuer.innergemeinschaftlich / 100).toFixed(2)}`,
    );
    lines.push(
      `  Import: €${(calculation.vorsteuer.einfuhr / 100).toFixed(2)}`,
    );
    lines.push('');

    lines.push('Result:');
    if (calculation.zahllast > 0) {
      lines.push(
        `  VAT Payable: €${(calculation.zahllast / 100).toFixed(2)}`,
      );
    } else {
      lines.push(
        `  VAT Refund: €${(calculation.erstattung / 100).toFixed(2)}`,
      );
    }
    lines.push('');

    lines.push(`Invoices: ${calculation.invoiceCount}`);
    lines.push(`Expenses: ${calculation.expenseCount}`);
    lines.push(`Confidence: ${calculation.confidence}%`);

    if (calculation.warnings.length > 0) {
      lines.push('');
      lines.push('Warnings:');
      calculation.warnings.forEach((warning) => {
        lines.push(`  - ${warning}`);
      });
    }

    return lines.join('\n');
  }
}
