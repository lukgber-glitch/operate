import { Prisma } from '@prisma/client';
/**
 * Tax Deduction Analyzer Service
 * Calculates tax deductions correctly per German tax law
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  EnhancedTransactionClassification,
  TaxCategory,
} from './types/tax-categories.types';
import { getEurLineInfo, isExpenseCategory } from './rules/eur-line-mapping';
import {
  getDeductionRuleForCategory,
  extractVatFromGross,
  calculateVat,
  VAT_RATES,
  calculateIncomeTax,
  calculateSolidaritySurcharge,
  DeductionRule,
} from './rules/german-tax-rules';

/**
 * Deduction analysis result for a single transaction
 */
export interface DeductionAnalysis {
  /** Is this expense tax deductible? */
  deductible: boolean;

  /** Gross amount (what was paid, in cents) */
  grossAmount: number;

  /** Net amount (excluding VAT, in cents) */
  netAmount: number;

  /** Deductible amount (in cents) */
  deductibleAmount: number;

  /** Deduction percentage (0-100) */
  deductionPercentage: number;

  /** VAT reclaimable amount (in cents) */
  vatReclaimable: number;

  /** VAT rate applied (0.07, 0.19, or 0) */
  vatRate: number;

  /** Net tax benefit (deduction + VAT, in cents) */
  netTaxBenefit: number;

  /** Tax category */
  taxCategory: TaxCategory;

  /** EÜR form line number */
  eurLineNumber: number;

  /** EÜR description */
  eurDescription: string;

  /** Documentation required */
  documentationRequired: string[];

  /** Warnings and special requirements */
  warnings: string[];

  /** Deduction rule applied */
  rule: DeductionRule;
}

/**
 * Quarterly deduction summary
 */
export interface QuarterlyDeductions {
  /** Quarter (1-4) */
  quarter: 1 | 2 | 3 | 4;

  /** Year */
  year: number;

  /** Total expenses (in cents) */
  totalExpenses: number;

  /** Total deductible amount (in cents) */
  totalDeductible: number;

  /** Total VAT reclaimable (in cents) */
  vatReclaimable: number;

  /** Breakdown by category */
  byCategory: Record<
    TaxCategory,
    {
      amount: number;
      deductible: number;
      vatReclaimable: number;
      count: number;
    }
  >;

  /** EÜR summary (line number -> total amount) */
  eurSummary: Record<number, number>;

  /** Transaction count */
  transactionCount: number;
}

/**
 * Annual tax estimation
 */
export interface AnnualTaxEstimation {
  /** Year */
  year: number;

  /** Estimated annual income (in cents) */
  estimatedIncome: number;

  /** Estimated annual expenses (in cents) */
  estimatedExpenses: number;

  /** Estimated deductions (in cents) */
  estimatedDeductions: number;

  /** Estimated taxable income (in cents) */
  estimatedTaxableIncome: number;

  /** Estimated income tax (in cents) */
  estimatedIncomeTax: number;

  /** Estimated solidarity surcharge (in cents) */
  estimatedSoli: number;

  /** Estimated total tax (income + soli, in cents) */
  estimatedTotalTax: number;

  /** VAT balance (receivable - payable, in cents) */
  estimatedVatBalance: number;

  /** Effective tax rate (percentage) */
  effectiveTaxRate: number;

  /** Tax bracket */
  taxBracket: string;

  /** Quarterly breakdown */
  quarters: QuarterlyDeductions[];
}

@Injectable()
export class TaxDeductionAnalyzerService {
  private readonly logger = new Logger(TaxDeductionAnalyzerService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('Tax Deduction Analyzer initialized');
  }

  /**
   * Analyze tax deduction for a single transaction
   */
  async analyzeDeduction(
    transaction: {
      amount: number;
      description: string;
      category?: string;
      currency?: string;
    },
    classification: EnhancedTransactionClassification,
  ): Promise<DeductionAnalysis> {
    const grossAmount = Math.abs(transaction.amount);
    const taxCategory = classification.tax.taxCategory;

    // Get deduction rule for this category
    const rule = getDeductionRuleForCategory(taxCategory);
    const eurInfo = getEurLineInfo(taxCategory);

    // Determine VAT rate
    let vatRate = 0;
    if (classification.tax.vatRate !== undefined) {
      vatRate = classification.tax.vatRate;
    } else if (classification.tax.vatReclaimable) {
      // Default to standard rate if not specified
      vatRate = VAT_RATES.STANDARD;
    }

    // Extract VAT from gross amount
    const { net: netAmount, vat: vatAmount } = extractVatFromGross(
      grossAmount,
      vatRate,
    );

    // Calculate deduction percentage
    let deductionPercentage = 0;
    if (typeof rule.percentage === 'number') {
      deductionPercentage = rule.percentage;
    } else if (rule.percentage === 'CALCULATED') {
      // Special case: Home office - use business percentage
      deductionPercentage = classification.business.businessPercentage;
    } else if (rule.percentage === 'FAHRTENBUCH_OR_1%') {
      // Car: use business percentage from classification
      deductionPercentage = classification.business.businessPercentage;
    }

    // Apply business percentage adjustment
    const adjustedPercentage =
      (deductionPercentage * classification.business.businessPercentage) / 100;

    // Calculate deductible amount (from net amount)
    const deductibleAmount = Math.round((netAmount * adjustedPercentage) / 100);

    // Calculate VAT reclaimable
    let vatReclaimable = 0;
    if (
      rule.vatReclaimable !== false &&
      classification.tax.vatReclaimable &&
      adjustedPercentage > 0
    ) {
      vatReclaimable = Math.round((vatAmount * adjustedPercentage) / 100);
    }

    // Calculate net tax benefit (simplified - assumes 42% marginal rate)
    const netTaxBenefit = Math.round(deductibleAmount * 0.42) + vatReclaimable;

    // Build warnings
    const warnings: string[] = [];

    // Check documentation requirements
    if (eurInfo.requiresDocumentation || rule.specialRequirements) {
      warnings.push('Dokumentation erforderlich');
    }

    // Check gift limit
    if (
      rule.maxAmountPerPersonPerYear &&
      grossAmount > rule.maxAmountPerPersonPerYear
    ) {
      warnings.push(
        `Geschenke: Maximum ${rule.maxAmountPerPersonPerYear / 100}€ pro Person/Jahr`,
      );
    }

    // Check home office limit
    if (
      rule.maxAmountPerYear &&
      deductibleAmount > rule.maxAmountPerYear
    ) {
      warnings.push(
        `Jährliches Maximum: ${rule.maxAmountPerYear / 100}€`,
      );
    }

    // Special requirements
    if (rule.specialRequirements) {
      warnings.push(...rule.specialRequirements);
    }

    // Add notes from rule
    if (rule.notes) {
      warnings.push(...rule.notes);
    }

    // Build documentation list
    const documentationRequired: string[] = [];
    if (Array.isArray(rule.documentation)) {
      documentationRequired.push(...rule.documentation);
    } else {
      documentationRequired.push(rule.documentation);
    }

    return {
      deductible: deductibleAmount > 0,
      grossAmount,
      netAmount,
      deductibleAmount,
      deductionPercentage: adjustedPercentage,
      vatReclaimable,
      vatRate,
      netTaxBenefit,
      taxCategory,
      eurLineNumber: eurInfo.lineNumber,
      eurDescription: eurInfo.germanDescription,
      documentationRequired,
      warnings,
      rule,
    };
  }

  /**
   * Calculate quarterly deductions for an organization
   */
  async calculateQuarterlyDeductions(
    orgId: string,
    quarter: 1 | 2 | 3 | 4,
    year: number,
  ): Promise<QuarterlyDeductions> {
    this.logger.log(
      `Calculating Q${quarter} ${year} deductions for org ${orgId}`,
    );

    // Determine date range for quarter
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const startDate = new Date(year, startMonth - 1, 1);
    const endDate = new Date(year, endMonth, 0, 23, 59, 59);

    // Fetch transactions for the quarter
    // Note: This is a simplified query - in production, you'd fetch from
    // a transactions table with proper classification metadata
    const transactions = await this.prisma.$queryRaw<
      Array<{
        amount: number;
        category: string;
        taxCategory: TaxCategory;
        deductibleAmount: number;
        vatReclaimable: number;
      }>
    >`
      SELECT
        amount,
        category,
        metadata->>'taxCategory' as "taxCategory",
        CAST(metadata->>'deductibleAmount' as INTEGER) as "deductibleAmount",
        CAST(metadata->>'vatReclaimable' as INTEGER) as "vatReclaimable"
      FROM "Transaction"
      WHERE "orgId" = ${orgId}
        AND date >= ${startDate}
        AND date <= ${endDate}
        AND metadata->>'taxCategory' IS NOT NULL
    `;

    // Aggregate by category
    const byCategory: QuarterlyDeductions['byCategory'] = {} as any;
    const eurSummary: Record<number, number> = {};
    let totalExpenses = 0;
    let totalDeductible = 0;
    let totalVatReclaimable = 0;

    for (const tx of transactions) {
      const taxCategory = tx.taxCategory as TaxCategory;
      const amount = Math.abs(Number(tx.amount) * 100); // Convert to cents
      const deductible = tx.deductibleAmount || 0;
      const vatReclaimable = tx.vatReclaimable || 0;

      // Only count expenses
      if (!isExpenseCategory(taxCategory)) {
        continue;
      }

      totalExpenses += amount;
      totalDeductible += deductible;
      totalVatReclaimable += vatReclaimable;

      // By category
      if (!byCategory[taxCategory]) {
        byCategory[taxCategory] = {
          amount: 0,
          deductible: 0,
          vatReclaimable: 0,
          count: 0,
        };
      }

      byCategory[taxCategory].amount += amount;
      byCategory[taxCategory].deductible += deductible;
      byCategory[taxCategory].vatReclaimable += vatReclaimable;
      byCategory[taxCategory].count += 1;

      // EÜR summary
      const eurInfo = getEurLineInfo(taxCategory);
      if (eurInfo.lineNumber > 0) {
        if (!eurSummary[eurInfo.lineNumber]) {
          eurSummary[eurInfo.lineNumber] = 0;
        }
        eurSummary[eurInfo.lineNumber] += deductible;
      }
    }

    return {
      quarter,
      year,
      totalExpenses,
      totalDeductible,
      vatReclaimable: totalVatReclaimable,
      byCategory,
      eurSummary,
      transactionCount: transactions.length,
    };
  }

  /**
   * Estimate annual tax liability
   */
  async estimateAnnualTaxSavings(
    orgId: string,
    year?: number,
  ): Promise<AnnualTaxEstimation> {
    const targetYear = year || new Date().getFullYear();

    this.logger.log(`Estimating annual tax for org ${orgId}, year ${targetYear}`);

    // Calculate all 4 quarters
    const quarters = await Promise.all([
      this.calculateQuarterlyDeductions(orgId, 1, targetYear),
      this.calculateQuarterlyDeductions(orgId, 2, targetYear),
      this.calculateQuarterlyDeductions(orgId, 3, targetYear),
      this.calculateQuarterlyDeductions(orgId, 4, targetYear),
    ]);

    // Aggregate annual totals
    const estimatedExpenses = quarters.reduce(
      (sum, q) => sum + q.totalExpenses,
      0,
    );
    const estimatedDeductions = quarters.reduce(
      (sum, q) => sum + q.totalDeductible,
      0,
    );
    const estimatedVatBalance = quarters.reduce(
      (sum, q) => sum + q.vatReclaimable,
      0,
    );

    // Fetch income (simplified - assumes metadata storage)
    const incomeResult = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT SUM(amount) as total
      FROM "Transaction"
      WHERE "orgId" = ${orgId}
        AND EXTRACT(YEAR FROM date) = ${targetYear}
        AND amount > 0
    `;

    const estimatedIncome = incomeResult[0]?.total
      ? Number(incomeResult[0].total) * 100
      : 0;

    // Calculate taxable income (in EUR)
    const taxableIncomeEur = (estimatedIncome - estimatedDeductions) / 100;

    // Calculate income tax
    const { tax: incomeTax, effectiveRate, bracket } = calculateIncomeTax(
      taxableIncomeEur,
    );

    // Calculate solidarity surcharge
    const soli = calculateSolidaritySurcharge(incomeTax);

    // Convert to cents
    const estimatedIncomeTax = incomeTax * 100;
    const estimatedSoli = soli * 100;
    const estimatedTotalTax = estimatedIncomeTax + estimatedSoli;

    return {
      year: targetYear,
      estimatedIncome,
      estimatedExpenses,
      estimatedDeductions,
      estimatedTaxableIncome: estimatedIncome - estimatedDeductions,
      estimatedIncomeTax,
      estimatedSoli,
      estimatedTotalTax,
      estimatedVatBalance,
      effectiveTaxRate: effectiveRate * 100, // as percentage
      taxBracket: bracket,
      quarters,
    };
  }

  /**
   * Calculate VAT amount from gross
   */
  calculateVat(grossAmount: number, vatRate: number): number {
    return calculateVat(grossAmount, vatRate);
  }

  /**
   * Extract VAT from gross (reverse calculation)
   */
  extractVatFromGross(
    grossAmount: number,
    vatRate: number,
  ): { net: number; vat: number } {
    return extractVatFromGross(grossAmount, vatRate);
  }

  /**
   * Get deduction rule for a category
   */
  getDeductionRule(category: TaxCategory): DeductionRule {
    return getDeductionRuleForCategory(category);
  }

  /**
   * Analyze multiple transactions in batch
   */
  async analyzeBatchDeductions(
    transactions: Array<{
      amount: number;
      description: string;
      category?: string;
      classification: EnhancedTransactionClassification;
    }>,
  ): Promise<DeductionAnalysis[]> {
    this.logger.log(`Analyzing ${transactions.length} transactions`);

    return Promise.all(
      transactions.map((tx) =>
        this.analyzeDeduction(
          {
            amount: tx.amount,
            description: tx.description,
            category: tx.category,
          },
          tx.classification,
        ),
      ),
    );
  }

  /**
   * Get tax summary for organization (all-time)
   */
  async getTaxSummary(orgId: string): Promise<{
    totalExpenses: number;
    totalDeductible: number;
    totalVatReclaimable: number;
    byCategoryAllTime: Record<
      TaxCategory,
      {
        amount: number;
        deductible: number;
        count: number;
      }
    >;
  }> {
    const result = await this.prisma.$queryRaw<
      Array<{
        taxCategory: TaxCategory;
        totalAmount: bigint;
        totalDeductible: bigint;
        totalVatReclaimable: bigint;
        count: bigint;
      }>
    >`
      SELECT
        metadata->>'taxCategory' as "taxCategory",
        SUM(ABS(amount)) as "totalAmount",
        SUM(CAST(metadata->>'deductibleAmount' as INTEGER)) as "totalDeductible",
        SUM(CAST(metadata->>'vatReclaimable' as INTEGER)) as "totalVatReclaimable",
        COUNT(*) as count
      FROM "Transaction"
      WHERE "orgId" = ${orgId}
        AND metadata->>'taxCategory' IS NOT NULL
        AND amount < 0
      GROUP BY metadata->>'taxCategory'
    `;

    const byCategoryAllTime: Record<TaxCategory, any> = {} as any;
    let totalExpenses = 0;
    let totalDeductible = 0;
    let totalVatReclaimable = 0;

    for (const row of result) {
      const category = row.taxCategory as TaxCategory;
      const amount = Number(row.totalAmount) * 100;
      const deductible = Number(row.totalDeductible || 0);
      const vatReclaimable = Number(row.totalVatReclaimable || 0);
      const count = Number(row.count);

      totalExpenses += amount;
      totalDeductible += deductible;
      totalVatReclaimable += vatReclaimable;

      byCategoryAllTime[category] = {
        amount,
        deductible,
        count,
      };
    }

    return {
      totalExpenses,
      totalDeductible,
      totalVatReclaimable,
      byCategoryAllTime,
    };
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    return !!this.prisma;
  }
}
