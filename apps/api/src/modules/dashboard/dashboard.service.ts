import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InvoiceStatus, BillStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CashFlowDataPoint {
  date: string;
  inflow: number;
  outflow: number;
}

interface CashFlowSummary {
  inflow: number;
  outflow: number;
  net: number;
  trend: 'up' | 'down' | 'stable';
  data: CashFlowDataPoint[];
}

interface AgingBucket {
  range: string;
  amount: number;
}

interface ReceivablesSummary {
  total: number;
  overdue: number;
  current: number;
  agingBuckets: AgingBucket[];
}

interface PayablesSummary {
  total: number;
  overdue: number;
  upcoming: number;
  agingBuckets: AgingBucket[];
}

interface RunwaySummary {
  months: number;
  burnRate: number;
  cashBalance: number;
  projectedZeroDate: string | null;
}

/**
 * Dashboard Service
 * Business logic for dashboard widgets and metrics
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get cash flow summary for the last N days
   */
  async getCashFlowSummary(
    orgId: string,
    days: number,
  ): Promise<CashFlowSummary> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get paid invoices (inflow)
      const paidInvoices = await this.prisma.invoice.findMany({
        where: {
          orgId,
          status: InvoiceStatus.PAID,
          paidDate: {
            gte: startDate,
          },
        },
        select: {
          totalAmount: true,
          paidDate: true,
        },
      });

      // Get paid expenses (outflow)
      const paidExpenses = await this.prisma.expense.findMany({
        where: {
          orgId,
          date: {
            gte: startDate,
          },
        },
        select: {
          amount: true,
          date: true,
        },
      });

      // Get paid bills (outflow)
      const paidBills = await this.prisma.bill.findMany({
        where: {
          organisationId: orgId,
          paidDate: {
            gte: startDate,
          },
        },
        select: {
          totalAmount: true,
          paidDate: true,
        },
      });

      // Calculate daily totals
      const dailyData = new Map<string, { inflow: number; outflow: number }>();

      // Process invoices (inflow)
      paidInvoices.forEach((invoice) => {
        if (invoice.paidDate) {
          const dateKey = invoice.paidDate.toISOString().split('T')[0];
          const existing = dailyData.get(dateKey) || { inflow: 0, outflow: 0 };
          existing.inflow += this.toNumber(invoice.totalAmount);
          dailyData.set(dateKey, existing);
        }
      });

      // Process expenses (outflow)
      paidExpenses.forEach((expense) => {
        const dateKey = expense.date.toISOString().split('T')[0];
        const existing = dailyData.get(dateKey) || { inflow: 0, outflow: 0 };
        existing.outflow += this.toNumber(expense.amount);
        dailyData.set(dateKey, existing);
      });

      // Process bills (outflow)
      paidBills.forEach((bill) => {
        if (bill.paidDate) {
          const dateKey = bill.paidDate.toISOString().split('T')[0];
          const existing = dailyData.get(dateKey) || { inflow: 0, outflow: 0 };
          existing.outflow += this.toNumber(bill.totalAmount);
          dailyData.set(dateKey, existing);
        }
      });

      // Convert to array and sort by date
      const data: CashFlowDataPoint[] = Array.from(dailyData.entries())
        .map(([date, values]) => ({
          date,
          inflow: Math.round(values.inflow * 100) / 100,
          outflow: Math.round(values.outflow * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate totals
      const inflow = data.reduce((sum, item) => sum + item.inflow, 0);
      const outflow = data.reduce((sum, item) => sum + item.outflow, 0);
      const net = inflow - outflow;

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (data.length >= 2) {
        const recentDays = Math.floor(data.length / 2);
        const recentNet = data
          .slice(-recentDays)
          .reduce((sum, item) => sum + (item.inflow - item.outflow), 0);
        const olderNet = data
          .slice(0, recentDays)
          .reduce((sum, item) => sum + (item.inflow - item.outflow), 0);

        if (recentNet > olderNet * 1.1) {
          trend = 'up';
        } else if (recentNet < olderNet * 0.9) {
          trend = 'down';
        }
      }

      return {
        inflow: Math.round(inflow * 100) / 100,
        outflow: Math.round(outflow * 100) / 100,
        net: Math.round(net * 100) / 100,
        trend,
        data,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get cash flow summary for org ${orgId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get accounts receivable summary
   */
  async getReceivablesSummary(orgId: string): Promise<ReceivablesSummary> {
    try {
      const today = new Date();

      // Get all unpaid invoices
      const unpaidInvoices = await this.prisma.invoice.findMany({
        where: {
          orgId,
          status: {
            in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
          },
        },
        select: {
          totalAmount: true,
          dueDate: true,
        },
      });

      // Calculate totals and aging
      let total = 0;
      let overdue = 0;
      let current = 0;

      const aging = {
        current: 0, // Not yet due
        days30: 0, // 1-30 days overdue
        days60: 0, // 31-60 days overdue
        days90: 0, // 61-90 days overdue
        days90Plus: 0, // 90+ days overdue
      };

      unpaidInvoices.forEach((invoice) => {
        const amount = this.toNumber(invoice.totalAmount);
        total += amount;

        const daysOverdue = Math.floor(
          (today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysOverdue < 0) {
          // Not yet due
          current += amount;
          aging.current += amount;
        } else {
          overdue += amount;

          if (daysOverdue <= 30) {
            aging.days30 += amount;
          } else if (daysOverdue <= 60) {
            aging.days60 += amount;
          } else if (daysOverdue <= 90) {
            aging.days90 += amount;
          } else {
            aging.days90Plus += amount;
          }
        }
      });

      // Build aging buckets
      const agingBuckets: AgingBucket[] = [
        {
          range: 'Current',
          amount: Math.round(aging.current * 100) / 100,
        },
        { range: '1-30 days', amount: Math.round(aging.days30 * 100) / 100 },
        { range: '31-60 days', amount: Math.round(aging.days60 * 100) / 100 },
        { range: '61-90 days', amount: Math.round(aging.days90 * 100) / 100 },
        {
          range: '90+ days',
          amount: Math.round(aging.days90Plus * 100) / 100,
        },
      ];

      return {
        total: Math.round(total * 100) / 100,
        overdue: Math.round(overdue * 100) / 100,
        current: Math.round(current * 100) / 100,
        agingBuckets,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get receivables summary for org ${orgId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get accounts payable summary
   */
  async getPayablesSummary(orgId: string): Promise<PayablesSummary> {
    try {
      const today = new Date();
      const next30Days = new Date();
      next30Days.setDate(next30Days.getDate() + 30);

      // Get all unpaid bills
      const unpaidBills = await this.prisma.bill.findMany({
        where: {
          organisationId: orgId,
          status: {
            in: [BillStatus.PENDING, BillStatus.APPROVED],
          },
        },
        select: {
          totalAmount: true,
          dueDate: true,
        },
      });

      // Calculate totals and aging
      let total = 0;
      let overdue = 0;
      let upcoming = 0;

      const aging = {
        upcoming: 0, // Due in next 30 days
        current: 0, // Due today
        days30: 0, // 1-30 days overdue
        days60: 0, // 31-60 days overdue
        days90Plus: 0, // 60+ days overdue
      };

      unpaidBills.forEach((bill) => {
        const amount = this.toNumber(bill.totalAmount);
        total += amount;

        const daysOverdue = Math.floor(
          (today.getTime() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysOverdue < 0) {
          // Not yet due
          upcoming += amount;
          aging.upcoming += amount;
        } else if (daysOverdue === 0) {
          // Due today
          aging.current += amount;
        } else {
          overdue += amount;

          if (daysOverdue <= 30) {
            aging.days30 += amount;
          } else if (daysOverdue <= 60) {
            aging.days60 += amount;
          } else {
            aging.days90Plus += amount;
          }
        }
      });

      // Build aging buckets
      const agingBuckets: AgingBucket[] = [
        {
          range: 'Upcoming',
          amount: Math.round(aging.upcoming * 100) / 100,
        },
        { range: 'Due today', amount: Math.round(aging.current * 100) / 100 },
        { range: '1-30 days', amount: Math.round(aging.days30 * 100) / 100 },
        { range: '31-60 days', amount: Math.round(aging.days60 * 100) / 100 },
        {
          range: '60+ days',
          amount: Math.round(aging.days90Plus * 100) / 100,
        },
      ];

      return {
        total: Math.round(total * 100) / 100,
        overdue: Math.round(overdue * 100) / 100,
        upcoming: Math.round(upcoming * 100) / 100,
        agingBuckets,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get payables summary for org ${orgId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get cash runway summary
   */
  async getRunwaySummary(orgId: string): Promise<RunwaySummary> {
    try {
      // Calculate monthly burn rate from last 90 days
      const last90Days = new Date();
      last90Days.setDate(last90Days.getDate() - 90);

      // Get expenses and bills for burn rate
      const [expenses, bills] = await Promise.all([
        this.prisma.expense.findMany({
          where: {
            orgId,
            date: {
              gte: last90Days,
            },
          },
          select: {
            amount: true,
          },
        }),
        this.prisma.bill.findMany({
          where: {
            organisationId: orgId,
            paidDate: {
              gte: last90Days,
            },
          },
          select: {
            totalAmount: true,
          },
        }),
      ]);

      // Calculate total burn in last 90 days
      const totalBurn =
        expenses.reduce((sum, exp) => sum + this.toNumber(exp.amount), 0) +
        bills.reduce((sum, bill) => sum + this.toNumber(bill.totalAmount), 0);

      // Monthly burn rate (90 days = 3 months)
      const burnRate = totalBurn / 3;

      // Get current cash balance from bank accounts
      const bankAccounts = await this.prisma.bankAccount.findMany({
        where: {
          orgId,
          isActive: true,
        },
        select: {
          currentBalance: true,
        },
      });

      const cashBalance = bankAccounts.reduce(
        (sum, account) =>
          sum + (account.currentBalance ? this.toNumber(account.currentBalance) : 0),
        0,
      );

      // Calculate runway in months
      let months = 0;
      let projectedZeroDate: string | null = null;

      if (burnRate > 0) {
        months = cashBalance / burnRate;

        // Calculate projected zero date
        if (months > 0 && months < 100) {
          // Cap at 100 months for realistic projections
          const zeroDate = new Date();
          zeroDate.setMonth(zeroDate.getMonth() + Math.floor(months));
          projectedZeroDate = zeroDate.toISOString().split('T')[0];
        }
      }

      return {
        months: Math.round(months * 10) / 10, // Round to 1 decimal
        burnRate: Math.round(burnRate * 100) / 100,
        cashBalance: Math.round(cashBalance * 100) / 100,
        projectedZeroDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get runway summary for org ${orgId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Helper to convert Prisma Decimal to number
   */
  private toNumber(value: Decimal | number): number {
    if (value instanceof Decimal) {
      return value.toNumber();
    }
    return value;
  }
}
