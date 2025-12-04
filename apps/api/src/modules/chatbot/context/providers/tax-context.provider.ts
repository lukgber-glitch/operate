/**
 * Tax Context Provider
 * Provides context about tax-related entities and summaries
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BaseContextProvider } from './base-context.provider';

@Injectable()
export class TaxContextProvider extends BaseContextProvider {
  entityType = 'tax-summary';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Get tax summary for a period
   */
  async getTaxSummaryContext(
    orgId: string,
    year: number,
    quarter?: number,
  ): Promise<any> {
    const startDate = quarter
      ? new Date(year, (quarter - 1) * 3, 1)
      : new Date(year, 0, 1);

    const endDate = quarter
      ? new Date(year, quarter * 3, 0, 23, 59, 59)
      : new Date(year, 11, 31, 23, 59, 59);

    // Get invoices in period
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId,
        status: { in: ['PENDING', 'PAID'] },
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        number: true,
        totalAmount: true,
        taxAmount: true,
        vatRate: true,
        status: true,
      },
    });

    // Get expenses in period
    const expenses = await this.prisma.expense.findMany({
      where: {
        orgId,
        status: { in: ['APPROVED', 'REIMBURSED'] },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        amount: true,
        vatAmount: true,
        vatRate: true,
        isDeductible: true,
      },
    });

    // Calculate totals
    const invoiceTotal = invoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount.toString()),
      0,
    );

    const invoiceVAT = invoices.reduce(
      (sum, inv) => sum + parseFloat(inv.taxAmount?.toString() || '0'),
      0,
    );

    const expenseTotal = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount.toString()),
      0,
    );

    const deductibleExpenses = expenses
      .filter(exp => exp.isDeductible)
      .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

    const expenseVAT = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.vatAmount?.toString() || '0'),
      0,
    );

    const netVAT = invoiceVAT - expenseVAT;

    return {
      period: quarter ? `Q${quarter} ${year}` : `${year}`,
      invoiceCount: invoices.length,
      invoiceTotal,
      invoiceVAT,
      expenseCount: expenses.length,
      expenseTotal,
      deductibleExpenses,
      expenseVAT,
      netVAT,
      netVATStatus: netVAT > 0 ? 'payable' : 'refundable',
    };
  }

  protected async fetchEntity(entityId: string, orgId: string): Promise<any> {
    // For tax summaries, entityId could be like "2024-Q1" or "2024"
    const [yearStr, quarterStr] = entityId.split('-Q');
    const year = parseInt(yearStr, 10);
    const quarter = quarterStr ? parseInt(quarterStr, 10) : undefined;

    return this.getTaxSummaryContext(orgId, year, quarter);
  }

  getSummary(taxSummary: any): string {
    const netVAT = this.formatCurrency(Math.abs(taxSummary.netVAT));
    const status = taxSummary.netVATStatus === 'payable' ? 'to pay' : 'refund';

    return `Tax summary for ${taxSummary.period}: ${taxSummary.invoiceCount} invoices, ${taxSummary.expenseCount} expenses, ${netVAT} VAT ${status}`;
  }

  getRelevantFields(taxSummary: any): Record<string, any> {
    return {
      period: taxSummary.period,
      invoiceCount: taxSummary.invoiceCount,
      invoiceTotal: taxSummary.invoiceTotal,
      invoiceVAT: taxSummary.invoiceVAT,
      expenseCount: taxSummary.expenseCount,
      expenseTotal: taxSummary.expenseTotal,
      deductibleExpenses: taxSummary.deductibleExpenses,
      expenseVAT: taxSummary.expenseVAT,
      netVAT: taxSummary.netVAT,
      netVATStatus: taxSummary.netVATStatus,
    };
  }

  getSuggestedActions(taxSummary: any): string[] {
    const suggestions: string[] = [];

    if (taxSummary.netVATStatus === 'payable') {
      suggestions.push('File VAT return for this period');
      suggestions.push('Schedule VAT payment');
      suggestions.push('Download VAT report');
    } else {
      suggestions.push('Request VAT refund');
      suggestions.push('File VAT return for this period');
      suggestions.push('Download VAT report');
    }

    suggestions.push('View detailed transaction breakdown');
    suggestions.push('Export data for tax advisor');
    suggestions.push('Compare with previous period');

    return suggestions.slice(0, 5);
  }
}
