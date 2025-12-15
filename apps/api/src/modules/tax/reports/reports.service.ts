import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaxContextService } from '../shared/tax-context.service';

/**
 * Tax Reports Service
 * Handles tax report generation and calculations
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxContext: TaxContextService,
  ) {}

  /**
   * Get comprehensive tax report for a year
   */
  async getTaxReport(orgId: string, year: string) {
    const yearNum = parseInt(year, 10);
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59);

    // Get all financial data for the year
    const [invoices, expenses, deductions, vatReturns] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          orgId,
          issueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          subtotal: true,
          vatAmount: true,
          total: true,
        },
      }),
      this.prisma.expense.findMany({
        where: {
          orgId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
          vatAmount: true,
          category: true,
        },
      }),
      this.prisma.taxDeduction.findMany({
        where: {
          orgId,
          taxYear: yearNum,
        },
        select: {
          amount: true,
          category: true,
          status: true,
        },
      }),
      this.prisma.vATReturn.findMany({
        where: {
          orgId,
          year: yearNum,
        },
        select: {
          vatOwed: true,
          vatRecoverable: true,
          netVat: true,
        },
      }),
    ]);

    // Calculate totals
    const totalIncome = invoices.reduce((sum: number, inv: any) => sum + inv.subtotal, 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const totalDeductions = deductions
      .filter((d: any) => d.status === 'CONFIRMED')
      .reduce((sum: number, d: any) => sum + d.amount, 0);

    const taxableIncome = totalIncome - totalExpenses - totalDeductions;
    const estimatedTax = this.calculateIncomeTax(taxableIncome);

    const vatOwed = vatReturns.reduce((sum: number, vat: any) => sum + vat.vatOwed, 0);
    const vatRecoverable = vatReturns.reduce((sum: number, vat: any) => sum + vat.vatRecoverable, 0);
    const netVat = vatReturns.reduce((sum: number, vat: any) => sum + vat.netVat, 0);

    // Group deductions by category
    const deductionsByCategory = this.groupDeductionsByCategory(deductions);

    // Get tax deadlines
    const deadlines = await this.getYearDeadlines(orgId, yearNum);

    // Calculate compliance score
    const compliance = await this.calculateCompliance(orgId);

    return {
      success: true,
      data: {
        summary: {
          year: year,
          totalIncome,
          totalExpenses,
          taxableIncome,
          estimatedTax,
          totalDeductions,
          vatOwed,
          vatRecoverable,
          netVat,
        },
        deductionsByCategory,
        deadlines,
        compliance,
      },
    };
  }

  /**
   * Export tax report
   */
  async exportTaxReport(
    orgId: string,
    year: string,
    format: 'PDF' | 'EXCEL' | 'CSV',
  ): Promise<Buffer> {
    const report = await this.getTaxReport(orgId, year);

    // For now, return a simple CSV as a placeholder
    // In production, you'd use libraries like PDFKit, ExcelJS, etc.
    if (format === 'CSV') {
      const csv = this.generateCSV(report.data);
      return Buffer.from(csv, 'utf-8');
    }

    // Placeholder for PDF and Excel
    return Buffer.from(`Tax Report ${year} - ${format} format coming soon`, 'utf-8');
  }

  /**
   * Get tax deadlines
   */
  async getTaxDeadlines(orgId: string, upcomingOnly: boolean) {
    const now = new Date();
    const where: any = { orgId };

    if (upcomingOnly) {
      where.dueDate = {
        gte: now,
      };
    }

    const deadlines = await this.prisma.taxDeadline.findMany({
      where,
      orderBy: {
        dueDate: 'asc',
      },
      select: {
        id: true,
        name: true,
        type: true,
        dueDate: true,
        status: true,
        description: true,
        priority: true,
      },
    });

    return {
      success: true,
      data: deadlines,
    };
  }

  /**
   * Mark deadline as completed
   */
  async markDeadlineCompleted(orgId: string, deadlineId: string) {
    const deadline = await this.prisma.taxDeadline.update({
      where: {
        id: deadlineId,
        orgId,
      },
      data: {
        status: 'COMPLETED',
      },
    });

    return {
      success: true,
      data: deadline,
      message: 'Deadline marked as completed',
    };
  }

  /**
   * Get compliance status
   */
  async getComplianceStatus(orgId: string) {
    const compliance = await this.calculateCompliance(orgId);

    return {
      success: true,
      data: compliance,
    };
  }

  // Helper methods

  /**
   * German income tax calculation (Einkommensteuer)
   * Updated for tax year 2025
   *
   * Tax brackets 2025:
   * - EUR 0 - 12,096: 0% (Grundfreibetrag)
   * - EUR 12,097 - 17,005: 14% - 24% (first progression zone)
   * - EUR 17,006 - 66,760: 24% - 42% (second progression zone)
   * - EUR 66,761 - 277,825: 42% (proportional zone)
   * - Above EUR 277,825: 45% (Reichensteuer)
   *
   * Source: § 32a EStG, updated annually by Bundesfinanzministerium
   *
   * @param taxableIncome Taxable income in cents (for precision)
   * @param year Tax year (defaults to 2025)
   * @returns Calculated income tax in cents
   */
  private calculateIncomeTax(taxableIncome: number, year: number = 2025): number {
    // Convert from cents if needed (amount > 1M likely in cents)
    const income = taxableIncome > 1000000 ? taxableIncome / 100 : taxableIncome;

    // Tax year specific brackets
    const brackets = this.getTaxBrackets(year);

    if (income <= brackets.grundfreibetrag) {
      return 0;
    }

    if (income <= brackets.zone1End) {
      // First progression zone: formula (a * y + b) * y
      const y = (income - brackets.grundfreibetrag) / 10000;
      return Math.round((brackets.zone1A * y + brackets.zone1B) * y);
    }

    if (income <= brackets.zone2End) {
      // Second progression zone: formula (a * z + b) * z + c
      const z = (income - brackets.zone1End) / 10000;
      return Math.round((brackets.zone2A * z + brackets.zone2B) * z + brackets.zone2C);
    }

    if (income <= brackets.zone3End) {
      // Proportional zone: 42%
      return Math.round(0.42 * income - brackets.zone3Subtract);
    }

    // Reichensteuer: 45%
    return Math.round(0.45 * income - brackets.zone4Subtract);
  }

  /**
   * Get tax brackets for a specific year
   * Source: Bundesfinanzministerium (BMF)
   */
  private getTaxBrackets(year: number): {
    grundfreibetrag: number;
    zone1End: number;
    zone1A: number;
    zone1B: number;
    zone2End: number;
    zone2A: number;
    zone2B: number;
    zone2C: number;
    zone3End: number;
    zone3Subtract: number;
    zone4Subtract: number;
  } {
    // German income tax brackets by year
    const brackets: Record<number, any> = {
      2025: {
        grundfreibetrag: 12096,
        zone1End: 17005,
        zone1A: 922.98,
        zone1B: 1400,
        zone2End: 66760,
        zone2A: 181.19,
        zone2B: 2397,
        zone2C: 1025.38,
        zone3End: 277825,
        zone3Subtract: 10602.13,
        zone4Subtract: 18936.88,
      },
      2024: {
        grundfreibetrag: 11604,
        zone1End: 17005,
        zone1A: 932.30,
        zone1B: 1400,
        zone2End: 66760,
        zone2A: 181.19,
        zone2B: 2397,
        zone2C: 991.21,
        zone3End: 277825,
        zone3Subtract: 10636.31,
        zone4Subtract: 18971.06,
      },
      2023: {
        grundfreibetrag: 10908,
        zone1End: 15999,
        zone1A: 979.18,
        zone1B: 1400,
        zone2End: 62809,
        zone2A: 192.59,
        zone2B: 2397,
        zone2C: 966.53,
        zone3End: 277825,
        zone3Subtract: 9972.98,
        zone4Subtract: 18307.73,
      },
    };

    // Default to 2025 if year not found
    return brackets[year] || brackets[2025];
  }

  private groupDeductionsByCategory(deductions: any[]) {
    const grouped = deductions.reduce((acc, deduction) => {
      if (deduction.status !== 'CONFIRMED') return acc;

      const category = deduction.category || 'Other';
      if (!acc[category]) {
        acc[category] = {
          category,
          count: 0,
          totalAmount: 0,
          potentialSaving: 0,
        };
      }
      acc[category].count++;
      acc[category].totalAmount += deduction.amount;
      acc[category].potentialSaving += deduction.amount * 0.42; // Assuming 42% tax bracket
      return acc;
    }, {});

    return Object.values(grouped);
  }

  private async getYearDeadlines(orgId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const deadlines = await this.prisma.taxDeadline.findMany({
      where: {
        orgId,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      select: {
        id: true,
        name: true,
        type: true,
        dueDate: true,
        status: true,
        description: true,
        priority: true,
      },
    });

    return deadlines;
  }

  private async calculateCompliance(orgId: string) {
    const now = new Date();
    const issues: any[] = [];

    // Check for overdue deadlines
    const overdueDeadlines = await this.prisma.taxDeadline.count({
      where: {
        orgId,
        dueDate: {
          lt: now,
        },
        status: {
          not: 'COMPLETED',
        },
      },
    });

    if (overdueDeadlines > 0) {
      issues.push({
        type: 'OVERDUE_DEADLINES',
        severity: 'HIGH',
        message: `You have ${overdueDeadlines} overdue tax deadline(s)`,
      });
    }

    // Check for unfiled VAT returns
    const unfiledVAT = await this.prisma.vATReturn.count({
      where: {
        orgId,
        status: 'OPEN',
        dueDate: {
          lt: now,
        },
      },
    });

    if (unfiledVAT > 0) {
      issues.push({
        type: 'UNFILED_VAT',
        severity: 'HIGH',
        message: `You have ${unfiledVAT} unfiled VAT return(s)`,
      });
    }

    // Calculate score (100 - 10 points per issue)
    const score = Math.max(0, 100 - issues.length * 10);

    return {
      score,
      issues,
    };
  }

  private generateCSV(data: any): string {
    const lines: string[] = [];

    // Summary section
    lines.push('TAX REPORT SUMMARY');
    lines.push(`Year,${data.summary.year}`);
    lines.push(`Total Income,${data.summary.totalIncome}`);
    lines.push(`Total Expenses,${data.summary.totalExpenses}`);
    lines.push(`Total Deductions,${data.summary.totalDeductions}`);
    lines.push(`Taxable Income,${data.summary.taxableIncome}`);
    lines.push(`Estimated Tax,${data.summary.estimatedTax}`);
    lines.push(`VAT Owed,${data.summary.vatOwed}`);
    lines.push(`VAT Recoverable,${data.summary.vatRecoverable}`);
    lines.push(`Net VAT,${data.summary.netVat}`);
    lines.push('');

    // Deductions by category
    lines.push('DEDUCTIONS BY CATEGORY');
    lines.push('Category,Count,Total Amount,Potential Saving');
    data.deductionsByCategory.forEach((cat: any) => {
      lines.push(`${cat.category},${cat.count},${cat.totalAmount},${cat.potentialSaving}`);
    });

    return lines.join('\n');
  }
}
