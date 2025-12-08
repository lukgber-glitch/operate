import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { ClaudeService } from '@/modules/chatbot/claude.service';
import {
  DailyBriefing,
  WeeklyBriefing,
  BriefingContext,
  FinancialDataSnapshot,
  BriefingAlert,
  BriefingSuggestion,
  BriefingSummary,
  WeekSummary,
} from './briefing.types';
import { InvoiceStatus, BillStatus, PaymentStatus } from '@prisma/client';

/**
 * Briefing Service
 * Generates AI-powered daily and weekly financial briefings
 *
 * This service is critical for the "fully automatic" vision - providing
 * proactive insights without the user needing to ask.
 */
@Injectable()
export class BriefingService {
  private readonly logger = new Logger(BriefingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly claudeService: ClaudeService,
  ) {}

  /**
   * Generate daily briefing for an organization
   */
  async generateDailyBriefing(context: BriefingContext): Promise<DailyBriefing> {
    const startTime = Date.now();
    this.logger.log(`Generating daily briefing for org ${context.orgId}`);

    try {
      // Gather financial data snapshot
      const snapshot = await this.gatherFinancialData(context);

      // Generate summary metrics
      const summary = this.calculateSummary(snapshot);

      // Generate alerts based on data
      const alerts = this.generateAlerts(snapshot, summary);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(snapshot, summary, context);

      // Generate AI insights using Claude
      const insights = await this.generateAIInsights(snapshot, summary, context);

      // Generate greeting based on time of day
      const greeting = this.generateGreeting(context.date);

      const briefing: DailyBriefing = {
        date: context.date.toISOString().split('T')[0],
        greeting,
        summary,
        alerts: alerts.sort((a, b) => b.priority - a.priority),
        suggestions: suggestions.sort((a, b) => {
          const priorityMap = { high: 3, medium: 2, low: 1 };
          return priorityMap[b.priority] - priorityMap[a.priority];
        }),
        insights,
        generatedAt: new Date(),
      };

      const duration = Date.now() - startTime;
      this.logger.log(`Daily briefing generated in ${duration}ms`);

      return briefing;
    } catch (error) {
      this.logger.error('Error generating daily briefing:', error);
      throw error;
    }
  }

  /**
   * Generate weekly briefing
   */
  async generateWeeklyBriefing(context: BriefingContext): Promise<WeeklyBriefing> {
    this.logger.log(`Generating weekly briefing for org ${context.orgId}`);

    // Get daily briefing first
    const dailyBriefing = await this.generateDailyBriefing(context);

    // Calculate week boundaries
    const weekStart = new Date(context.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Calculate week number
    const startOfYear = new Date(context.date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((context.date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

    // Gather weekly data
    const weekSummary = await this.calculateWeekSummary(context.orgId, weekStart, weekEnd);

    return {
      ...dailyBriefing,
      weekNumber,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      weekSummary,
    };
  }

  /**
   * Gather all financial data for the briefing
   */
  private async gatherFinancialData(context: BriefingContext): Promise<FinancialDataSnapshot> {
    const { orgId, date } = context;

    // Get bank accounts and balances
    const bankAccounts = await this.prisma.bankAccountNew.findMany({
      where: {
        bankConnection: {
          orgId,
          status: 'ACTIVE',
        },
        isActive: true,
      },
      include: {
        bankConnection: {
          select: {
            institutionName: true,
          },
        },
      },
    });

    // Get pending invoices
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
      },
      select: {
        id: true,
        number: true,
        customerName: true,
        totalAmount: true,
        dueDate: true,
        status: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Get overdue invoices
    const overdueInvoices = pendingInvoices.filter(
      inv => inv.status === InvoiceStatus.OVERDUE || inv.dueDate < date
    );

    // Get upcoming bills (next 30 days)
    const thirtyDaysFromNow = new Date(date);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingBills = await this.prisma.bill.findMany({
      where: {
        organisationId: orgId,
        dueDate: {
          gte: date,
          lte: thirtyDaysFromNow,
        },
        paymentStatus: { not: PaymentStatus.COMPLETED },
      },
      select: {
        id: true,
        billNumber: true,
        vendorName: true,
        totalAmount: true,
        dueDate: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Get overdue bills
    const overdueBills = await this.prisma.bill.findMany({
      where: {
        organisationId: orgId,
        dueDate: { lt: date },
        paymentStatus: { not: PaymentStatus.COMPLETED },
      },
      select: {
        id: true,
        billNumber: true,
        vendorName: true,
        totalAmount: true,
        dueDate: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Get recent transactions (last 7 days)
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await this.prisma.bankTransactionNew.findMany({
      where: {
        bankAccount: {
          bankConnection: {
            orgId,
          },
        },
        bookingDate: {
          gte: sevenDaysAgo,
          lte: date,
        },
      },
      select: {
        id: true,
        description: true,
        amount: true,
        bookingDate: true,
        transactionType: true,
      },
      orderBy: {
        bookingDate: 'desc',
      },
      take: 10,
    });

    // Calculate previous balance (7 days ago)
    const previousBalanceData = await this.prisma.bankAccountNew.aggregate({
      where: {
        bankConnection: {
          orgId,
          status: 'ACTIVE',
        },
        isActive: true,
      },
      _sum: {
        currentBalance: true,
      },
    });

    return {
      bankAccounts: bankAccounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        balance: Number(acc.currentBalance || 0),
        currency: acc.currency,
        lastUpdated: acc.lastBalanceUpdate || new Date(),
      })),
      invoices: {
        pending: pendingInvoices
          .filter(inv => !overdueInvoices.includes(inv))
          .map(inv => ({
            id: inv.id,
            number: inv.number,
            customerName: inv.customerName,
            amount: Number(inv.totalAmount),
            dueDate: inv.dueDate,
          })),
        overdue: overdueInvoices.map(inv => {
          const daysOverdue = Math.floor((date.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: inv.id,
            number: inv.number,
            customerName: inv.customerName,
            amount: Number(inv.totalAmount),
            dueDate: inv.dueDate,
            daysOverdue,
          };
        }),
      },
      bills: {
        upcoming: upcomingBills.map(bill => {
          const daysUntilDue = Math.ceil((bill.dueDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: bill.id,
            billNumber: bill.billNumber || 'N/A',
            vendorName: bill.vendorName,
            amount: Number(bill.totalAmount),
            dueDate: bill.dueDate,
            daysUntilDue,
          };
        }),
        overdue: overdueBills.map(bill => {
          const daysOverdue = Math.floor((date.getTime() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: bill.id,
            billNumber: bill.billNumber || 'N/A',
            vendorName: bill.vendorName,
            amount: Number(bill.totalAmount),
            dueDate: bill.dueDate,
            daysOverdue,
          };
        }),
      },
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: Number(tx.amount),
        date: tx.bookingDate,
        type: tx.transactionType === 'CREDIT' ? 'credit' as const : 'debit' as const,
      })),
      previousBalance: Number(previousBalanceData._sum.currentBalance || 0),
    };
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummary(snapshot: FinancialDataSnapshot): BriefingSummary {
    const totalBalance = snapshot.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const previousBalance = snapshot.previousBalance || totalBalance;
    const cashChange = totalBalance - previousBalance;
    const cashChangePercent = previousBalance !== 0 ? (cashChange / previousBalance) * 100 : 0;

    const pendingInvoicesAmount = snapshot.invoices.pending.reduce((sum, inv) => sum + inv.amount, 0);
    const overdueInvoicesAmount = snapshot.invoices.overdue.reduce((sum, inv) => sum + inv.amount, 0);
    const upcomingBillsAmount = snapshot.bills.upcoming.reduce((sum, bill) => sum + bill.amount, 0);
    const overdueBillsAmount = snapshot.bills.overdue.reduce((sum, bill) => sum + bill.amount, 0);

    return {
      cashPosition: totalBalance,
      cashChange,
      cashChangePercent,
      pendingInvoices: snapshot.invoices.pending.length,
      pendingInvoicesAmount,
      overdueInvoices: snapshot.invoices.overdue.length,
      overdueInvoicesAmount,
      upcomingBills: snapshot.bills.upcoming.length,
      upcomingBillsAmount,
      overdueBills: snapshot.bills.overdue.length,
      overdueBillsAmount,
      recentTransactions: snapshot.recentTransactions.length,
      currency: snapshot.bankAccounts[0]?.currency || 'EUR',
    };
  }

  /**
   * Generate alerts based on financial data
   */
  private generateAlerts(snapshot: FinancialDataSnapshot, summary: BriefingSummary): BriefingAlert[] {
    const alerts: BriefingAlert[] = [];

    // Critical: Overdue bills
    if (summary.overdueBills > 0) {
      alerts.push({
        id: 'overdue-bills',
        type: 'critical',
        title: `${summary.overdueBills} Overdue Bill${summary.overdueBills > 1 ? 's' : ''}`,
        description: `You have ${summary.overdueBills} overdue bill(s) totaling ${summary.currency} ${summary.overdueBillsAmount.toFixed(2)}. Immediate action required.`,
        priority: 100,
        action: {
          label: 'View Overdue Bills',
          url: '/finance/bills?filter=overdue',
        },
      });
    }

    // Warning: Overdue invoices
    if (summary.overdueInvoices > 0) {
      alerts.push({
        id: 'overdue-invoices',
        type: 'warning',
        title: `${summary.overdueInvoices} Overdue Invoice${summary.overdueInvoices > 1 ? 's' : ''}`,
        description: `${summary.overdueInvoices} invoice(s) totaling ${summary.currency} ${summary.overdueInvoicesAmount.toFixed(2)} are overdue. Consider following up.`,
        priority: 80,
        action: {
          label: 'View Overdue Invoices',
          url: '/finance/invoices?filter=overdue',
        },
      });
    }

    // Warning: Bills due soon (within 7 days)
    const billsDueSoon = snapshot.bills.upcoming.filter(b => b.daysUntilDue <= 7);
    if (billsDueSoon.length > 0) {
      const amount = billsDueSoon.reduce((sum, b) => sum + b.amount, 0);
      alerts.push({
        id: 'bills-due-soon',
        type: 'warning',
        title: `${billsDueSoon.length} Bill${billsDueSoon.length > 1 ? 's' : ''} Due This Week`,
        description: `You have ${billsDueSoon.length} bill(s) totaling ${summary.currency} ${amount.toFixed(2)} due within 7 days.`,
        priority: 70,
        action: {
          label: 'Review Bills',
          url: '/finance/bills?filter=upcoming',
        },
      });
    }

    // Info: Low cash balance
    if (summary.cashPosition < 10000 && summary.cashChange < 0) {
      alerts.push({
        id: 'low-cash-balance',
        type: 'warning',
        title: 'Low Cash Balance',
        description: `Your cash balance is ${summary.currency} ${summary.cashPosition.toFixed(2)} and decreasing. Monitor cash flow carefully.`,
        priority: 60,
      });
    }

    // Success: Positive cash flow
    if (summary.cashChange > 0 && summary.cashChangePercent > 5) {
      alerts.push({
        id: 'positive-cash-flow',
        type: 'success',
        title: 'Positive Cash Flow',
        description: `Your cash balance increased by ${summary.cashChangePercent.toFixed(1)}% over the past week. Great work!`,
        priority: 30,
      });
    }

    return alerts;
  }

  /**
   * Generate actionable suggestions
   */
  private async generateSuggestions(
    snapshot: FinancialDataSnapshot,
    summary: BriefingSummary,
    context: BriefingContext,
  ): Promise<BriefingSuggestion[]> {
    const suggestions: BriefingSuggestion[] = [];

    // High priority: Chase overdue invoices
    if (summary.overdueInvoices > 0) {
      const topOverdueInvoice = snapshot.invoices.overdue
        .sort((a, b) => b.amount - a.amount)[0];

      if (topOverdueInvoice) {
        suggestions.push({
          id: 'chase-overdue-invoice',
          text: `Send payment reminder to ${topOverdueInvoice.customerName} for invoice ${topOverdueInvoice.number} (${summary.currency} ${topOverdueInvoice.amount.toFixed(2)}, ${topOverdueInvoice.daysOverdue} days overdue)`,
          priority: 'high',
          category: 'invoice',
          estimatedImpact: `Recover ${summary.currency} ${topOverdueInvoice.amount.toFixed(2)}`,
          action: {
            label: 'Send Reminder',
            url: `/finance/invoices/${topOverdueInvoice.id}`,
          },
        });
      }
    }

    // High priority: Pay overdue bills
    if (summary.overdueBills > 0) {
      const topOverdueBill = snapshot.bills.overdue
        .sort((a, b) => b.daysOverdue - a.daysOverdue)[0];

      if (topOverdueBill) {
        suggestions.push({
          id: 'pay-overdue-bill',
          text: `Pay overdue bill from ${topOverdueBill.vendorName} (${summary.currency} ${topOverdueBill.amount.toFixed(2)}, ${topOverdueBill.daysOverdue} days overdue)`,
          priority: 'high',
          category: 'bill',
          estimatedImpact: 'Avoid late fees and maintain vendor relationships',
          action: {
            label: 'Pay Now',
            url: `/finance/bills/${topOverdueBill.id}`,
          },
        });
      }
    }

    // Medium priority: Approve pending bills
    const pendingBills = await this.prisma.bill.count({
      where: {
        organisationId: context.orgId,
        status: 'PENDING_APPROVAL',
      },
    });

    if (pendingBills > 0) {
      suggestions.push({
        id: 'approve-bills',
        text: `Review and approve ${pendingBills} pending bill${pendingBills > 1 ? 's' : ''}`,
        priority: 'medium',
        category: 'bill',
        action: {
          label: 'Review Bills',
          url: '/finance/bills?filter=pending',
        },
      });
    }

    // Medium priority: Review cash flow
    if (summary.upcomingBillsAmount > summary.cashPosition) {
      const shortfall = summary.upcomingBillsAmount - summary.cashPosition;
      suggestions.push({
        id: 'cash-flow-warning',
        text: `Upcoming bills (${summary.currency} ${summary.upcomingBillsAmount.toFixed(2)}) exceed current cash balance. Consider collecting receivables or arranging funding.`,
        priority: 'high',
        category: 'cash-flow',
        estimatedImpact: `Address ${summary.currency} ${shortfall.toFixed(2)} shortfall`,
      });
    }

    return suggestions;
  }

  /**
   * Generate AI insights using Claude
   */
  private async generateAIInsights(
    snapshot: FinancialDataSnapshot,
    summary: BriefingSummary,
    context: BriefingContext,
  ): Promise<string[]> {
    try {
      const prompt = this.buildInsightsPrompt(snapshot, summary);

      const response = await this.claudeService.chat(
        [{ role: 'user', content: prompt }],
        'You are a financial advisor for small businesses. Provide concise, actionable insights.',
      );

      // Parse insights from AI response (expect bullet points or numbered list)
      const insights = response.content
        .split('\n')
        .filter(line => line.trim().match(/^[-•*\d.]/))
        .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
        .filter(line => line.length > 0);

      return insights.slice(0, 5); // Return top 5 insights
    } catch (error) {
      this.logger.error('Error generating AI insights:', error);
      // Return fallback insights if AI fails
      return this.generateFallbackInsights(summary);
    }
  }

  /**
   * Build prompt for AI insights
   */
  private buildInsightsPrompt(snapshot: FinancialDataSnapshot, summary: BriefingSummary): string {
    return `Generate a friendly, concise daily financial briefing for a business owner.

Financial Data:
- Cash balance: ${summary.currency} ${summary.cashPosition.toFixed(2)} (${summary.cashChangePercent >= 0 ? '+' : ''}${summary.cashChangePercent.toFixed(1)}% change)
- Pending invoices: ${summary.pendingInvoices} worth ${summary.currency} ${summary.pendingInvoicesAmount.toFixed(2)}
- Overdue invoices: ${summary.overdueInvoices} worth ${summary.currency} ${summary.overdueInvoicesAmount.toFixed(2)}
- Upcoming bills (30 days): ${summary.upcomingBills} worth ${summary.currency} ${summary.upcomingBillsAmount.toFixed(2)}
- Overdue bills: ${summary.overdueBills} worth ${summary.currency} ${summary.overdueBillsAmount.toFixed(2)}
- Recent transactions: ${summary.recentTransactions}

Top Overdue Invoice: ${snapshot.invoices.overdue[0] ? `${snapshot.invoices.overdue[0].customerName} - ${summary.currency} ${snapshot.invoices.overdue[0].amount.toFixed(2)} (${snapshot.invoices.overdue[0].daysOverdue} days overdue)` : 'None'}

Top Upcoming Bill: ${snapshot.bills.upcoming[0] ? `${snapshot.bills.upcoming[0].vendorName} - ${summary.currency} ${snapshot.bills.upcoming[0].amount.toFixed(2)} (due in ${snapshot.bills.upcoming[0].daysUntilDue} days)` : 'None'}

Provide 3-5 brief, actionable insights in bullet point format. Focus on:
1. Most urgent financial matters
2. Opportunities to improve cash flow
3. Potential risks to watch
4. Positive trends to celebrate

Keep each insight to one sentence. Be specific with numbers and names where relevant.`;
  }

  /**
   * Generate fallback insights if AI fails
   */
  private generateFallbackInsights(summary: BriefingSummary): string[] {
    const insights: string[] = [];

    if (summary.overdueInvoices > 0) {
      insights.push(`Focus on collecting ${summary.overdueInvoices} overdue invoice(s) worth ${summary.currency} ${summary.overdueInvoicesAmount.toFixed(2)}`);
    }

    if (summary.overdueBills > 0) {
      insights.push(`Address ${summary.overdueBills} overdue bill(s) totaling ${summary.currency} ${summary.overdueBillsAmount.toFixed(2)} to maintain vendor relationships`);
    }

    if (summary.cashChangePercent > 5) {
      insights.push(`Cash position improved by ${summary.cashChangePercent.toFixed(1)}% this week`);
    } else if (summary.cashChangePercent < -5) {
      insights.push(`Cash position decreased by ${Math.abs(summary.cashChangePercent).toFixed(1)}% - monitor spending carefully`);
    }

    if (summary.upcomingBills > 0) {
      insights.push(`Plan for ${summary.upcomingBills} upcoming bill(s) worth ${summary.currency} ${summary.upcomingBillsAmount.toFixed(2)} in the next 30 days`);
    }

    return insights.slice(0, 5);
  }

  /**
   * Generate greeting based on time of day
   */
  private generateGreeting(date: Date): string {
    const hour = date.getHours();

    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }

  /**
   * Calculate weekly summary
   */
  private async calculateWeekSummary(
    orgId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<WeekSummary> {
    // Get invoices issued this week
    const invoicesIssued = await this.prisma.invoice.count({
      where: {
        orgId,
        issueDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Get invoices paid this week
    const invoicesPaid = await this.prisma.invoice.count({
      where: {
        orgId,
        paidDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: InvoiceStatus.PAID,
      },
    });

    // Get bills paid this week
    const billsPaid = await this.prisma.bill.count({
      where: {
        organisationId: orgId,
        paidDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: BillStatus.PAID,
      },
    });

    // Calculate revenue (paid invoices)
    const revenueData = await this.prisma.invoice.aggregate({
      where: {
        orgId,
        paidDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: InvoiceStatus.PAID,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Calculate expenses (paid bills)
    const expensesData = await this.prisma.bill.aggregate({
      where: {
        organisationId: orgId,
        paidDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: BillStatus.PAID,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = Number(revenueData._sum.totalAmount || 0);
    const totalExpenses = Number(expensesData._sum.totalAmount || 0);

    // Get top expense categories
    const categoryExpenses = await this.prisma.bill.groupBy({
      by: ['categoryId'],
      where: {
        organisationId: orgId,
        paidDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: BillStatus.PAID,
        categoryId: { not: null },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    const topExpenseCategories = categoryExpenses
      .map(cat => ({
        category: cat.categoryId || 'Uncategorized',
        amount: Number(cat._sum.totalAmount || 0),
        count: cat._count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalRevenue,
      totalExpenses,
      netCashFlow: totalRevenue - totalExpenses,
      invoicesIssued,
      invoicesPaid,
      billsPaid,
      topExpenseCategories,
    };
  }
}
