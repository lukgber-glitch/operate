import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';

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
      // Use tolerance for floating point comparison (handles 0.19, 19, 19.0, etc.)
      const normalizedRate = vatRate > 1 ? vatRate : vatRate * 100;

      if (Math.abs(normalizedRate - 19) < 0.01) {
        steuerpflichtig19 += netAmount;
        steuer19 += vatAmount;
      } else if (Math.abs(normalizedRate - 7) < 0.01) {
        steuerpflichtig7 += netAmount;
        steuer7 += vatAmount;
      } else if (Math.abs(normalizedRate) < 0.01) {
        steuerfrei += netAmount;
      } else {
        // Unknown VAT rate - log warning
        this.logger.warn(
          `Unknown VAT rate ${vatRate} (normalized: ${normalizedRate}) on invoice ${invoice.id}`,
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
   * Valid period formats:
   * - "2025-01" to "2025-12" (monthly)
   * - "2025-Q1" to "2025-Q4" (quarterly)
   * - "2025" (annual)
   */
  private readonly PERIOD_PATTERNS = {
    monthly: /^(\d{4})-(0[1-9]|1[0-2])$/,
    quarterly: /^(\d{4})-Q([1-4])$/i,
    annual: /^(\d{4})$/,
  };

  /**
   * Validate period string format
   * @param period The period string to validate
   * @returns Object with isValid flag and parsed components
   */
  private validatePeriodFormat(period: string): {
    isValid: boolean;
    type: 'monthly' | 'quarterly' | 'annual' | null;
    year: number | null;
    period: number | null;
    error?: string;
  } {
    if (!period || typeof period !== 'string') {
      return { isValid: false, type: null, year: null, period: null, error: 'Period is required' };
    }

    const trimmedPeriod = period.trim();

    // Check monthly format
    const monthlyMatch = trimmedPeriod.match(this.PERIOD_PATTERNS.monthly);
    if (monthlyMatch) {
      const year = parseInt(monthlyMatch[1], 10);
      const month = parseInt(monthlyMatch[2], 10);
      if (year >= 2000 && year <= 2100) {
        return { isValid: true, type: 'monthly', year, period: month };
      }
      return { isValid: false, type: null, year: null, period: null, error: 'Year must be between 2000 and 2100' };
    }

    // Check quarterly format
    const quarterlyMatch = trimmedPeriod.match(this.PERIOD_PATTERNS.quarterly);
    if (quarterlyMatch) {
      const year = parseInt(quarterlyMatch[1], 10);
      const quarter = parseInt(quarterlyMatch[2], 10);
      if (year >= 2000 && year <= 2100) {
        return { isValid: true, type: 'quarterly', year, period: quarter };
      }
      return { isValid: false, type: null, year: null, period: null, error: 'Year must be between 2000 and 2100' };
    }

    // Check annual format
    const annualMatch = trimmedPeriod.match(this.PERIOD_PATTERNS.annual);
    if (annualMatch) {
      const year = parseInt(annualMatch[1], 10);
      if (year >= 2000 && year <= 2100) {
        return { isValid: true, type: 'annual', year, period: null };
      }
      return { isValid: false, type: null, year: null, period: null, error: 'Year must be between 2000 and 2100' };
    }

    return {
      isValid: false,
      type: null,
      year: null,
      period: null,
      error: `Invalid period format "${period}". Expected: "2025-01" (monthly), "2025-Q1" (quarterly), or "2025" (annual)`,
    };
  }

  /**
   * Parse period string to date range
   *
   * @param period Format: "2025-Q1", "2025-01", or "2025"
   * @throws Error if period format is invalid
   */
  private parsePeriod(period: string): {
    periodStart: Date;
    periodEnd: Date;
  } {
    const validation = this.validatePeriodFormat(period);

    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid period format');
    }

    const year = validation.year!;

    switch (validation.type) {
      case 'quarterly': {
        const quarter = validation.period!;
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 3;
        return {
          periodStart: new Date(year, startMonth, 1),
          periodEnd: new Date(year, endMonth, 0, 23, 59, 59, 999),
        };
      }
      case 'monthly': {
        const month = validation.period!;
        return {
          periodStart: new Date(year, month - 1, 1),
          periodEnd: new Date(year, month, 0, 23, 59, 59, 999),
        };
      }
      case 'annual': {
        return {
          periodStart: new Date(year, 0, 1),
          periodEnd: new Date(year, 11, 31, 23, 59, 59, 999),
        };
      }
      default:
        throw new Error('Invalid period type');
    }
  }

  /**
   * EU country codes and VAT ID format patterns
   * Format: [countryCode]: { pattern: RegExp, checksum?: (vatId: string) => boolean }
   */
  private readonly EU_VAT_FORMATS: Record<string, { pattern: RegExp; name: string }> = {
    AT: { pattern: /^ATU\d{8}$/, name: 'Austria' },
    BE: { pattern: /^BE[01]\d{9}$/, name: 'Belgium' },
    BG: { pattern: /^BG\d{9,10}$/, name: 'Bulgaria' },
    HR: { pattern: /^HR\d{11}$/, name: 'Croatia' },
    CY: { pattern: /^CY\d{8}[A-Z]$/, name: 'Cyprus' },
    CZ: { pattern: /^CZ\d{8,10}$/, name: 'Czech Republic' },
    DK: { pattern: /^DK\d{8}$/, name: 'Denmark' },
    EE: { pattern: /^EE\d{9}$/, name: 'Estonia' },
    FI: { pattern: /^FI\d{8}$/, name: 'Finland' },
    FR: { pattern: /^FR[A-Z0-9]{2}\d{9}$/, name: 'France' },
    DE: { pattern: /^DE\d{9}$/, name: 'Germany' },
    EL: { pattern: /^EL\d{9}$/, name: 'Greece' }, // Greece uses EL, not GR
    GR: { pattern: /^(EL|GR)\d{9}$/, name: 'Greece' }, // Accept both for compatibility
    HU: { pattern: /^HU\d{8}$/, name: 'Hungary' },
    IE: { pattern: /^IE(\d{7}[A-Z]{1,2}|\d[A-Z+*]\d{5}[A-Z])$/, name: 'Ireland' },
    IT: { pattern: /^IT\d{11}$/, name: 'Italy' },
    LV: { pattern: /^LV\d{11}$/, name: 'Latvia' },
    LT: { pattern: /^LT(\d{9}|\d{12})$/, name: 'Lithuania' },
    LU: { pattern: /^LU\d{8}$/, name: 'Luxembourg' },
    MT: { pattern: /^MT\d{8}$/, name: 'Malta' },
    NL: { pattern: /^NL\d{9}B\d{2}$/, name: 'Netherlands' },
    PL: { pattern: /^PL\d{10}$/, name: 'Poland' },
    PT: { pattern: /^PT\d{9}$/, name: 'Portugal' },
    RO: { pattern: /^RO\d{2,10}$/, name: 'Romania' },
    SK: { pattern: /^SK\d{10}$/, name: 'Slovakia' },
    SI: { pattern: /^SI\d{8}$/, name: 'Slovenia' },
    ES: { pattern: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/, name: 'Spain' },
    SE: { pattern: /^SE\d{12}$/, name: 'Sweden' },
  };

  /**
   * Validate EU VAT ID format with country-specific pattern matching
   * @param vatId The VAT ID to validate (e.g., "DE123456789", "ATU12345678")
   * @returns true if the VAT ID matches the expected format for the country
   */
  private isValidEuVatId(vatId: string): boolean {
    if (!vatId || vatId.length < 3) {
      return false;
    }

    const upperVatId = vatId.toUpperCase().replace(/\s/g, '');
    const countryCode = upperVatId.substring(0, 2);

    // Check if it's an EU country
    const format = this.EU_VAT_FORMATS[countryCode];
    if (!format) {
      return false;
    }

    // Validate against country-specific pattern
    return format.pattern.test(upperVatId);
  }

  /**
   * Get the country name from a VAT ID
   */
  private getCountryFromVatId(vatId: string): string | null {
    if (!vatId || vatId.length < 2) return null;
    const countryCode = vatId.substring(0, 2).toUpperCase();
    return this.EU_VAT_FORMATS[countryCode]?.name || null;
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
