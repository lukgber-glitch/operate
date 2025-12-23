import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Cash Flow Forecast Service
 *
 * Analyzes recurring income and expenses to project future cash balances
 * and identify potential shortfalls for proactive financial planning.
 */

export interface CashFlowForecastMonth {
  month: string; // YYYY-MM format
  startDate: Date;
  endDate: Date;
  projectedIncome: number;
  projectedExpenses: number;
  netCashFlow: number;
  cumulativeBalance: number;
  confidence: number; // 0-1 confidence score
  hasShortfall: boolean;
}

export interface RecurringPattern {
  id: string;
  type: 'income' | 'expense';
  description: string;
  averageAmount: number;
  frequency: 'monthly' | 'weekly' | 'quarterly' | 'annual';
  lastOccurrence: Date;
  confidence: number;
  occurrences: number;
}

export interface CashFlowForecast {
  organisationId: string;
  currentBalance: number;
  forecastMonths: CashFlowForecastMonth[];
  recurringIncome: RecurringPattern[];
  recurringExpenses: RecurringPattern[];
  potentialShortfalls: Array<{
    month: string;
    shortfallAmount: number;
    daysUntil: number;
  }>;
  generatedAt: Date;
}

@Injectable()
export class CashFlowForecastService {
  private readonly logger = new Logger(CashFlowForecastService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate multi-month cash flow forecast
   *
   * @param organisationId - Organisation ID
   * @param months - Number of months to forecast (default 3)
   * @returns Cash flow forecast with projections and shortfall warnings
   */
  async generateForecast(
    organisationId: string,
    months = 3,
  ): Promise<CashFlowForecast> {
    this.logger.log(
      `Generating ${months}-month cash flow forecast for org ${organisationId}`,
    );

    // Get current bank balance from all active accounts
    const currentBalance = await this.getCurrentBalance(organisationId);

    // Analyze historical transactions to detect patterns
    const recurringIncome = await this.analyzeRecurringIncome(organisationId);
    const recurringExpenses =
      await this.analyzeRecurringExpenses(organisationId);

    // Analyze upcoming scheduled payments
    const scheduledPayments =
      await this.getScheduledPayments(organisationId, months);

    // Analyze upcoming invoices
    const upcomingInvoices = await this.getUpcomingInvoices(
      organisationId,
      months,
    );

    // Analyze upcoming bills
    const upcomingBills = await this.getUpcomingBills(organisationId, months);

    // Generate month-by-month projections
    const forecastMonths = this.projectMonthlyBalances(
      currentBalance,
      months,
      recurringIncome,
      recurringExpenses,
      scheduledPayments,
      upcomingInvoices,
      upcomingBills,
    );

    // Identify potential shortfalls
    const potentialShortfalls = this.identifyShortfalls(forecastMonths);

    const forecast: CashFlowForecast = {
      organisationId,
      currentBalance,
      forecastMonths,
      recurringIncome,
      recurringExpenses,
      potentialShortfalls,
      generatedAt: new Date(),
    };

    this.logger.log(
      `Forecast complete: ${potentialShortfalls.length} potential shortfalls identified`,
    );

    return forecast;
  }

  /**
   * Get current total balance across all active bank accounts
   */
  private async getCurrentBalance(organisationId: string): Promise<number> {
    const accounts = await this.prisma.bankAccount.findMany({
      where: {
        orgId: organisationId,
        isActive: true,
      },
      select: {
        currentBalance: true,
      },
    });

    const total = accounts.reduce((sum, account) => {
      return sum + (account.currentBalance?.toNumber() || 0);
    }, 0);

    return total;
  }

  /**
   * Analyze recurring income patterns from historical invoices
   */
  private async analyzeRecurringIncome(
    organisationId: string,
  ): Promise<RecurringPattern[]> {
    const patterns: RecurringPattern[] = [];

    // 1. Analyze recurring invoices
    const recurringInvoices = await this.prisma.recurringInvoice.findMany({
      where: {
        organisationId: organisationId,
        isActive: true,
      },
      select: {
        id: true,
        notes: true,
        lineItems: true,
        frequency: true,
        lastRunDate: true,
      },
    });

    for (const invoice of recurringInvoices) {
      // Calculate total from lineItems JSON
      let totalAmount = 0;
      if (Array.isArray(invoice.lineItems)) {
        totalAmount = (invoice.lineItems as any[]).reduce((sum, item) => {
          return sum + (item.amount || item.total || 0);
        }, 0);
      }

      patterns.push({
        id: invoice.id,
        type: 'income',
        description: invoice.notes || 'Recurring invoice',
        averageAmount: totalAmount,
        frequency: this.mapFrequency(invoice.frequency),
        lastOccurrence: invoice.lastRunDate || new Date(),
        confidence: 0.95, // High confidence for explicit recurring invoices
        occurrences: 12, // Estimated based on subscription
      });
    }

    // 2. Detect patterns from historical paid invoices
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organisationId,
        status: 'PAID',
        paidDate: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        customerName: true,
        totalAmount: true,
        paidDate: true,
      },
      orderBy: {
        paidDate: 'asc',
      },
    });

    // Group by customer and detect frequency
    const customerGroups = this.groupByCustomer(paidInvoices);
    for (const [customerName, invoices] of Object.entries(customerGroups)) {
      if (invoices.length >= 2) {
        const avgAmount =
          invoices.reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0) /
          invoices.length;
        const frequency = this.detectFrequency(
          invoices.map((i) => i.paidDate!),
        );

        if (frequency) {
          patterns.push({
            id: `customer-${customerName}`,
            type: 'income',
            description: `Income from ${customerName}`,
            averageAmount: avgAmount,
            frequency,
            lastOccurrence: invoices[invoices.length - 1].paidDate!,
            confidence: Math.min(0.7 + invoices.length * 0.05, 0.95),
            occurrences: invoices.length,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Analyze recurring expense patterns from historical bills and expenses
   */
  private async analyzeRecurringExpenses(
    organisationId: string,
  ): Promise<RecurringPattern[]> {
    const patterns: RecurringPattern[] = [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 1. Analyze recurring bills
    const bills = await this.prisma.bill.findMany({
      where: {
        organisationId,
        paidDate: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        vendorName: true,
        totalAmount: true,
        paidDate: true,
      },
      orderBy: {
        paidDate: 'asc',
      },
    });

    const vendorGroups = this.groupByVendor(bills);
    for (const [vendorName, billList] of Object.entries(vendorGroups)) {
      if (billList.length >= 2) {
        const avgAmount =
          billList.reduce((sum, bill) => sum + bill.totalAmount.toNumber(), 0) /
          billList.length;
        const frequency = this.detectFrequency(
          billList.map((b) => b.paidDate!),
        );

        if (frequency) {
          patterns.push({
            id: `vendor-${vendorName}`,
            type: 'expense',
            description: `Bills from ${vendorName}`,
            averageAmount: avgAmount,
            frequency,
            lastOccurrence: billList[billList.length - 1].paidDate!,
            confidence: Math.min(0.7 + billList.length * 0.05, 0.95),
            occurrences: billList.length,
          });
        }
      }
    }

    // 2. Analyze recurring expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        orgId: organisationId,
        date: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        category: true,
        amount: true,
        date: true,
        description: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by category to detect recurring patterns
    const categoryGroups = this.groupByCategory(expenses);
    for (const [category, expenseList] of Object.entries(categoryGroups)) {
      if (expenseList.length >= 3) {
        const avgAmount =
          expenseList.reduce((sum, exp) => sum + exp.amount.toNumber(), 0) /
          expenseList.length;
        const frequency = this.detectFrequency(expenseList.map((e) => e.date));

        if (frequency) {
          patterns.push({
            id: `category-${category}`,
            type: 'expense',
            description: `${category} expenses`,
            averageAmount: avgAmount,
            frequency,
            lastOccurrence: expenseList[expenseList.length - 1].date,
            confidence: Math.min(0.6 + expenseList.length * 0.05, 0.9),
            occurrences: expenseList.length,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Get scheduled payments for the forecast period
   */
  private async getScheduledPayments(
    organisationId: string,
    months: number,
  ): Promise<Array<{ date: Date; amount: number; description: string }>> {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const scheduled = await this.prisma.scheduledPayment.findMany({
      where: {
        organisationId,
        status: 'PENDING',
        scheduledDate: {
          lte: endDate,
        },
      },
      select: {
        scheduledDate: true,
        amount: true,
        notes: true,
      },
    });

    return scheduled.map((s) => ({
      date: s.scheduledDate,
      amount: s.amount.toNumber(),
      description: s.notes || 'Scheduled payment',
    }));
  }

  /**
   * Get upcoming unpaid invoices
   */
  private async getUpcomingInvoices(
    organisationId: string,
    months: number,
  ): Promise<Array<{ date: Date; amount: number; description: string }>> {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organisationId,
        status: {
          in: ['SENT', 'OVERDUE'],
        },
        dueDate: {
          lte: endDate,
        },
      },
      select: {
        dueDate: true,
        totalAmount: true,
        customerName: true,
      },
    });

    return invoices.map((inv) => ({
      date: inv.dueDate,
      amount: inv.totalAmount.toNumber(),
      description: `Invoice from ${inv.customerName}`,
    }));
  }

  /**
   * Get upcoming unpaid bills
   */
  private async getUpcomingBills(
    organisationId: string,
    months: number,
  ): Promise<Array<{ date: Date; amount: number; description: string }>> {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const bills = await this.prisma.bill.findMany({
      where: {
        organisationId,
        paymentStatus: 'PENDING',
        status: {
          in: ['PENDING', 'APPROVED', 'OVERDUE'],
        },
        dueDate: {
          lte: endDate,
        },
      },
      select: {
        dueDate: true,
        totalAmount: true,
        vendorName: true,
      },
    });

    return bills.map((bill) => ({
      date: bill.dueDate,
      amount: -bill.totalAmount.toNumber(), // Negative for expenses
      description: `Bill from ${bill.vendorName}`,
    }));
  }

  /**
   * Project monthly balances based on all data
   */
  private projectMonthlyBalances(
    startingBalance: number,
    months: number,
    recurringIncome: RecurringPattern[],
    recurringExpenses: RecurringPattern[],
    scheduledPayments: Array<{ date: Date; amount: number; description: string }>,
    upcomingInvoices: Array<{ date: Date; amount: number; description: string }>,
    upcomingBills: Array<{ date: Date; amount: number; description: string }>,
  ): CashFlowForecastMonth[] {
    const forecastMonths: CashFlowForecastMonth[] = [];
    let cumulativeBalance = startingBalance;

    const now = new Date();

    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

      // Calculate projected income from recurring patterns
      let projectedIncome = 0;
      let incomeConfidence = 0;

      for (const pattern of recurringIncome) {
        const occurrencesInMonth = this.getOccurrencesInMonth(
          pattern.frequency,
          monthStart,
        );
        projectedIncome += pattern.averageAmount * occurrencesInMonth;
        incomeConfidence += pattern.confidence;
      }

      // Add upcoming invoices for this month
      const monthInvoices = upcomingInvoices.filter(
        (inv) => inv.date >= monthStart && inv.date <= monthEnd,
      );
      projectedIncome += monthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

      // Calculate projected expenses from recurring patterns
      let projectedExpenses = 0;
      let expenseConfidence = 0;

      for (const pattern of recurringExpenses) {
        const occurrencesInMonth = this.getOccurrencesInMonth(
          pattern.frequency,
          monthStart,
        );
        projectedExpenses += pattern.averageAmount * occurrencesInMonth;
        expenseConfidence += pattern.confidence;
      }

      // Add scheduled payments for this month
      const monthScheduled = scheduledPayments.filter(
        (sp) => sp.date >= monthStart && sp.date <= monthEnd,
      );
      projectedExpenses += monthScheduled.reduce(
        (sum, sp) => sum + sp.amount,
        0,
      );

      // Add upcoming bills for this month
      const monthBills = upcomingBills.filter(
        (bill) => bill.date >= monthStart && bill.date <= monthEnd,
      );
      projectedExpenses += monthBills.reduce(
        (sum, bill) => sum + Math.abs(bill.amount),
        0,
      );

      const netCashFlow = projectedIncome - projectedExpenses;
      cumulativeBalance += netCashFlow;

      // Calculate overall confidence (weighted average)
      const totalPatterns =
        recurringIncome.length + recurringExpenses.length || 1;
      const confidence =
        (incomeConfidence + expenseConfidence) / totalPatterns;

      forecastMonths.push({
        month: monthKey,
        startDate: monthStart,
        endDate: monthEnd,
        projectedIncome: Math.round(projectedIncome * 100) / 100,
        projectedExpenses: Math.round(projectedExpenses * 100) / 100,
        netCashFlow: Math.round(netCashFlow * 100) / 100,
        cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
        confidence: Math.min(Math.max(confidence, 0), 1),
        hasShortfall: cumulativeBalance < 0,
      });
    }

    return forecastMonths;
  }

  /**
   * Identify months with potential cash shortfalls
   */
  private identifyShortfalls(
    forecastMonths: CashFlowForecastMonth[],
  ): Array<{ month: string; shortfallAmount: number; daysUntil: number }> {
    const shortfalls: Array<{
      month: string;
      shortfallAmount: number;
      daysUntil: number;
    }> = [];
    const now = new Date();

    for (const month of forecastMonths) {
      if (month.hasShortfall) {
        const daysUntil = Math.ceil(
          (month.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        shortfalls.push({
          month: month.month,
          shortfallAmount: Math.abs(month.cumulativeBalance),
          daysUntil,
        });
      }
    }

    return shortfalls;
  }

  /**
   * Helper: Group invoices by customer
   */
  private groupByCustomer<T extends { customerName: string }>(
    items: T[],
  ): Record<string, T[]> {
    return items.reduce(
      (groups, item) => {
        const key = item.customerName;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * Helper: Group bills by vendor
   */
  private groupByVendor<T extends { vendorName: string }>(
    items: T[],
  ): Record<string, T[]> {
    return items.reduce(
      (groups, item) => {
        const key = item.vendorName;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * Helper: Group expenses by category
   */
  private groupByCategory<T extends { category?: string | null }>(
    items: T[],
  ): Record<string, T[]> {
    return items.reduce(
      (groups, item) => {
        const key = item.category || 'Uncategorized';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * Detect frequency pattern from dates
   */
  private detectFrequency(
    dates: Date[],
  ): 'monthly' | 'weekly' | 'quarterly' | 'annual' | null {
    if (dates.length < 2) return null;

    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = Math.round(
        (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24),
      );
      intervals.push(daysDiff);
    }

    const avgInterval =
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

    // Determine frequency based on average interval
    if (avgInterval >= 6 && avgInterval <= 8) return 'weekly';
    if (avgInterval >= 25 && avgInterval <= 35) return 'monthly';
    if (avgInterval >= 85 && avgInterval <= 95) return 'quarterly';
    if (avgInterval >= 350 && avgInterval <= 380) return 'annual';

    return null;
  }

  /**
   * Map frequency string to standard format
   */
  private mapFrequency(
    frequency: string,
  ): 'monthly' | 'weekly' | 'quarterly' | 'annual' {
    const upper = frequency.toUpperCase();
    // Handle RecurringFrequency enum values: DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY
    if (upper === 'WEEKLY' || upper === 'BIWEEKLY') return 'weekly';
    if (upper === 'QUARTERLY') return 'quarterly';
    if (upper === 'YEARLY') return 'annual';
    if (upper === 'MONTHLY') return 'monthly';
    // Fallback for other string formats
    const lower = frequency.toLowerCase();
    if (lower.includes('week')) return 'weekly';
    if (lower.includes('quarter')) return 'quarterly';
    if (lower.includes('year') || lower.includes('annual')) return 'annual';
    return 'monthly';
  }

  /**
   * Calculate how many times a pattern occurs in a month
   */
  private getOccurrencesInMonth(
    frequency: 'monthly' | 'weekly' | 'quarterly' | 'annual',
    monthStart: Date,
  ): number {
    switch (frequency) {
      case 'weekly':
        return 4.33; // Average weeks per month
      case 'monthly':
        return 1;
      case 'quarterly':
        return 0.33; // 1 occurrence every 3 months
      case 'annual':
        return 0.083; // 1 occurrence every 12 months
      default:
        return 0;
    }
  }
}
