import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Tax Reports Service
 * Handles tax report generation and calculations
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private calculateIncomeTax(taxableIncome: number): number {
    // Simplified German income tax calculation
    // This is a simplified version - actual calculation is more complex
    if (taxableIncome <= 10908) return 0;
    if (taxableIncome <= 15999) {
      const y = (taxableIncome - 10908) / 10000;
      return Math.round((979.18 * y + 1400) * y);
    }
    if (taxableIncome <= 62809) {
      const z = (taxableIncome - 15999) / 10000;
      return Math.round((192.59 * z + 2397) * z + 966.53);
    }
    if (taxableIncome <= 277825) {
      return Math.round(0.42 * taxableIncome - 9972.98);
    }
    return Math.round(0.45 * taxableIncome - 18307.73);
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
