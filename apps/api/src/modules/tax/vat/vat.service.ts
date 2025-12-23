import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaxContextService } from '../shared/tax-context.service';

/**
 * VAT Service
 * Handles VAT period management and calculations
 */
@Injectable()
export class VatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxContext: TaxContextService,
  ) {}

  /**
   * Get VAT context with country-specific information
   */
  async getVatContext(orgId: string) {
    const context = await this.taxContext.getTaxContext(orgId);

    return {
      success: true,
      data: {
        country: context.country,
        vatRegistered: context.vatRegistered,
        vatNumber: context.vatNumber,
        vatScheme: context.vatScheme,
        taxAuthority: context.taxAuthority,
        taxAuthorityUrl: context.taxAuthorityUrl,
        filingFrequency: this.taxContext.getVatFilingFrequency(context.country),
        taxYearStartMonth: this.taxContext.getTaxYearStartMonth(context.country),
        currency: context.currency,
        timezone: context.timezone,
      },
    };
  }

  /**
   * Get VAT periods for an organization
   */
  async getVatPeriods(orgId: string, year?: string) {
    const where: any = { orgId };

    if (year) {
      const yearNum = parseInt(year, 10);
      where.year = yearNum;
    }

    const periods = await this.prisma.vatReturn.findMany({
      where,
      orderBy: {
        startDate: 'desc',
      },
      select: {
        id: true,
        period: true,
        year: true,
        quarter: true,
        month: true,
        startDate: true,
        endDate: true,
        status: true,
        totalSales: true,
        totalPurchases: true,
        vatOwed: true,
        vatRecoverable: true,
        netVat: true,
        dueDate: true,
        filedDate: true,
      },
    });

    return {
      success: true,
      data: periods,
    };
  }

  /**
   * Get current VAT period
   */
  async getCurrentVatPeriod(orgId: string) {
    const now = new Date();

    const period = await this.prisma.vatReturn.findFirst({
      where: {
        orgId,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      select: {
        id: true,
        period: true,
        year: true,
        quarter: true,
        month: true,
        startDate: true,
        endDate: true,
        status: true,
        totalSales: true,
        totalPurchases: true,
        vatOwed: true,
        vatRecoverable: true,
        netVat: true,
        dueDate: true,
        filedDate: true,
      },
    });

    return {
      success: true,
      data: period,
    };
  }

  /**
   * Get VAT period by ID
   */
  async getVatPeriodById(orgId: string, id: string) {
    const period = await this.prisma.vatReturn.findFirst({
      where: {
        id,
        orgId,
      },
      select: {
        id: true,
        period: true,
        year: true,
        quarter: true,
        month: true,
        startDate: true,
        endDate: true,
        status: true,
        totalSales: true,
        totalPurchases: true,
        vatOwed: true,
        vatRecoverable: true,
        netVat: true,
        dueDate: true,
        filedDate: true,
      },
    });

    return {
      success: true,
      data: period,
    };
  }

  /**
   * Get VAT transactions for a period
   */
  async getVatTransactions(orgId: string, periodId: string) {
    const period = await this.prisma.vatReturn.findFirst({
      where: {
        id: periodId,
        orgId,
      },
    });

    if (!period) {
      return {
        success: true,
        data: [],
      };
    }

    // Get all invoices (sales) and expenses (purchases) within the period
    const [invoices, expenses] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          orgId,
          issueDate: {
            gte: period.startDate,
            lte: period.endDate,
          },
        },
        select: {
          id: true,
          invoiceNumber: true,
          issueDate: true,
          subtotal: true,
          vatAmount: true,
          total: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.expense.findMany({
        where: {
          orgId,
          date: {
            gte: period.startDate,
            lte: period.endDate,
          },
        },
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          vatAmount: true,
          category: true,
        },
      }),
    ]);

    // Transform to VAT transactions format
    const transactions = [
      ...invoices.map((invoice) => ({
        id: invoice.id,
        date: invoice.issueDate.toISOString(),
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.client?.name || 'Unknown Client'}`,
        type: 'SALE' as const,
        netAmount: invoice.subtotal,
        vatAmount: invoice.vatAmount,
        vatRate: invoice.subtotal > 0 ? (invoice.vatAmount / invoice.subtotal) * 100 : 19,
        category: 'Sales',
        invoiceNumber: invoice.invoiceNumber,
      })),
      ...expenses.map((expense) => ({
        id: expense.id,
        date: expense.date.toISOString(),
        description: expense.description,
        type: 'PURCHASE' as const,
        netAmount: expense.amount - (expense.vatAmount || 0),
        vatAmount: expense.vatAmount || 0,
        vatRate: (expense.amount - (expense.vatAmount || 0)) > 0
          ? ((expense.vatAmount || 0) / (expense.amount - (expense.vatAmount || 0))) * 100
          : 19,
        category: expense.category || 'Other',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      success: true,
      data: transactions,
    };
  }

  /**
   * File VAT return
   */
  async fileVatReturn(orgId: string, periodId: string, userId: string) {
    const period = await this.prisma.vatReturn.update({
      where: {
        id: periodId,
        orgId,
      },
      data: {
        status: 'FILED',
        filedDate: new Date(),
      },
    });

    return {
      success: true,
      data: period,
      message: 'VAT return filed successfully',
    };
  }
}
