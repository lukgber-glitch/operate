/**
 * Daily Insight Processor
 * Generates proactive AI suggestions for users daily at 6 AM local time
 *
 * Features:
 * - Cash flow alerts (low balance, unusual spending)
 * - Tax deadline reminders (based on country)
 * - Overdue invoice alerts
 * - Upcoming bill reminders
 * - HR reminders (contracts expiring, leave balance low)
 */

import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../database/prisma.service';
import {
  InsightJobData,
  InsightResult,
  GeneratedInsight,
  InsightType,
  InsightPriority,
  InsightCategory,
} from './types';

export const DAILY_INSIGHT_QUEUE = 'daily-insights';

@Processor(DAILY_INSIGHT_QUEUE)
export class DailyInsightProcessor {
  private readonly logger = new Logger(DailyInsightProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('generate-insights')
  async handleDailyInsights(job: Job<InsightJobData>): Promise<InsightResult> {
    const startedAt = new Date();
    const { orgId } = job.data;

    this.logger.log(`Processing daily insights for organization ${orgId}`);

    try {
      await job.progress({
        stage: 'starting',
        message: 'Generating daily insights',
        percent: 0,
      });

      // Get organization details
      const org = await this.prisma.organisation.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          country: true,
          timezone: true,
        },
      });

      if (!org) {
        throw new Error(`Organization ${orgId} not found`);
      }

      const insights: GeneratedInsight[] = [];
      const categories = {
        cashFlow: 0,
        tax: 0,
        invoice: 0,
        bill: 0,
        hr: 0,
      };

      // 1. Generate Cash Flow Insights
      await job.progress({
        stage: 'cash_flow',
        message: 'Analyzing cash flow',
        percent: 20,
      });
      const cashFlowInsights = await this.generateCashFlowInsights(orgId);
      insights.push(...cashFlowInsights);
      categories.cashFlow = cashFlowInsights.length;

      // 2. Generate Tax Reminders
      await job.progress({
        stage: 'tax',
        message: 'Checking tax deadlines',
        percent: 40,
      });
      const taxInsights = await this.generateTaxReminders(orgId, org.country);
      insights.push(...taxInsights);
      categories.tax = taxInsights.length;

      // 3. Generate Invoice Alerts
      await job.progress({
        stage: 'invoices',
        message: 'Checking invoices',
        percent: 60,
      });
      const invoiceInsights = await this.generateInvoiceAlerts(orgId);
      insights.push(...invoiceInsights);
      categories.invoice = invoiceInsights.length;

      // 4. Generate Bill Reminders
      await job.progress({
        stage: 'bills',
        message: 'Checking bills',
        percent: 80,
      });
      const billInsights = await this.generateBillReminders(orgId);
      insights.push(...billInsights);
      categories.bill = billInsights.length;

      // 5. Generate HR Reminders
      await job.progress({
        stage: 'hr',
        message: 'Checking HR items',
        percent: 90,
      });
      const hrInsights = await this.generateHRReminders(orgId);
      insights.push(...hrInsights);
      categories.hr = hrInsights.length;

      // Save all insights to database
      await job.progress({
        stage: 'saving',
        message: 'Saving insights',
        percent: 95,
      });

      if (insights.length > 0) {
        await this.saveSuggestions(orgId, insights);
      }

      await job.progress({
        stage: 'completed',
        message: 'Insights generated successfully',
        percent: 100,
      });

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      const highPriorityCount = insights.filter(
        i => i.priority === InsightPriority.HIGH || i.priority === InsightPriority.URGENT,
      ).length;

      this.logger.log(
        `Daily insights completed for ${org.name}: ${insights.length} insights generated ` +
          `(${highPriorityCount} high priority) in ${duration}ms`,
      );

      return {
        jobId: job.id?.toString() || 'unknown',
        success: true,
        orgId,
        insightCount: insights.length,
        categories,
        highPriorityCount,
        startedAt,
        completedAt,
        duration,
      };
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      this.logger.error(`Daily insights job ${job.id} failed:`, error.message);

      return {
        jobId: job.id?.toString() || 'unknown',
        success: false,
        orgId,
        insightCount: 0,
        categories: {
          cashFlow: 0,
          tax: 0,
          invoice: 0,
          bill: 0,
          hr: 0,
        },
        highPriorityCount: 0,
        startedAt,
        completedAt,
        duration,
        errorMessage: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Generate cash flow insights
   */
  private async generateCashFlowInsights(orgId: string): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    try {
      // Get bank accounts with current balance
      const accounts = await this.prisma.bankAccount.findMany({
        where: { orgId },
        select: {
          id: true,
          name: true,
          currentBalance: true,
          currency: true,
        },
      });

      const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance || 0), 0);

      // Low balance warning (< €1000)
      if (totalBalance < 1000 && totalBalance > 0) {
        insights.push({
          type: InsightType.CASH_FLOW,
          priority: InsightPriority.HIGH,
          category: InsightCategory.CASH_FLOW,
          title: 'Low Cash Balance Alert',
          description: `Your total cash balance is ${this.formatCurrency(totalBalance)}. Consider reviewing upcoming expenses and receivables.`,
          actionLabel: 'View Cash Flow',
          actionType: 'navigate',
          actionParams: { path: '/finance/cash-flow' },
          data: { totalBalance, accountCount: accounts.length },
          expiresAt: this.getExpiryDate(24), // Expires in 24 hours
        });
      }

      // Check for unusual spending (compare last 7 days to previous 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(now.getDate() - 14);

      const [recentSpending, previousSpending] = await Promise.all([
        this.prisma.expense.aggregate({
          where: {
            orgId,
            date: { gte: sevenDaysAgo },
            status: { notIn: ['REJECTED'] },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            orgId,
            date: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
            status: { notIn: ['REJECTED'] },
          },
          _sum: { amount: true },
        }),
      ]);

      const recentAmount = Number(recentSpending._sum.amount || 0);
      const previousAmount = Number(previousSpending._sum.amount || 0);

      // Alert if spending increased by more than 50%
      if (previousAmount > 0 && recentAmount > previousAmount * 1.5) {
        const increase = ((recentAmount - previousAmount) / previousAmount) * 100;
        insights.push({
          type: InsightType.EXPENSE_ANOMALY,
          priority: InsightPriority.MEDIUM,
          category: InsightCategory.CASH_FLOW,
          title: 'Unusual Spending Detected',
          description: `Spending increased by ${increase.toFixed(0)}% this week (${this.formatCurrency(recentAmount)} vs ${this.formatCurrency(previousAmount)}).`,
          actionLabel: 'Review Expenses',
          actionType: 'navigate',
          actionParams: { path: '/finance/expenses' },
          data: { recentAmount, previousAmount, increase },
          expiresAt: this.getExpiryDate(24),
        });
      }
    } catch (error) {
      this.logger.error('Error generating cash flow insights:', error);
    }

    return insights;
  }

  /**
   * Generate tax deadline reminders
   */
  private async generateTaxReminders(orgId: string, country: string): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Find upcoming tax deadlines
      const deadlines = await this.prisma.taxDeadlineReminder.findMany({
        where: {
          organizationId: orgId,
          dueDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
          status: { in: ['PENDING', 'EXTENDED'] },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      });

      for (const deadline of deadlines) {
        const daysUntilDue = Math.ceil(
          (new Date(deadline.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        let priority = InsightPriority.MEDIUM;
        if (daysUntilDue <= 3) {
          priority = InsightPriority.URGENT;
        } else if (daysUntilDue <= 7) {
          priority = InsightPriority.HIGH;
        }

        insights.push({
          type: InsightType.TAX_DEADLINE,
          priority,
          category: InsightCategory.TAX,
          title: `Tax Deadline: ${deadline.taxType}`,
          description: `${deadline.taxType} is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} (${new Date(deadline.dueDate).toLocaleDateString()})`,
          actionLabel: 'Prepare Filing',
          actionType: 'navigate',
          actionParams: { path: `/tax/filing/${deadline.id}` },
          entityType: 'tax_deadline',
          entityId: deadline.id,
          data: { daysUntilDue, taxType: deadline.taxType },
          expiresAt: new Date(deadline.dueDate),
        });
      }
    } catch (error) {
      this.logger.error('Error generating tax reminders:', error);
    }

    return insights;
  }

  /**
   * Generate invoice alerts (overdue)
   */
  private async generateInvoiceAlerts(orgId: string): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    try {
      const now = new Date();

      // Find overdue invoices
      const overdueInvoices = await this.prisma.invoice.findMany({
        where: {
          orgId,
          status: 'SENT',
          dueDate: { lt: now },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
        select: {
          id: true,
          number: true,
          customerName: true,
          totalAmount: true,
          dueDate: true,
        },
      });

      if (overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

        insights.push({
          type: InsightType.INVOICE_REMINDER,
          priority: InsightPriority.HIGH,
          category: InsightCategory.INVOICE,
          title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length > 1 ? 's' : ''}`,
          description: `You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} totaling ${this.formatCurrency(totalOverdue)}. Consider sending reminders.`,
          actionLabel: 'Send Reminders',
          actionType: 'send_reminders',
          actionParams: { invoiceIds: overdueInvoices.map(i => i.id) },
          data: { count: overdueInvoices.length, totalAmount: totalOverdue },
          expiresAt: this.getExpiryDate(24),
        });
      }

      // Find invoices due soon (within 7 days)
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const dueSoonInvoices = await this.prisma.invoice.count({
        where: {
          orgId,
          status: 'SENT',
          dueDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
      });

      if (dueSoonInvoices > 0) {
        insights.push({
          type: InsightType.INVOICE_REMINDER,
          priority: InsightPriority.MEDIUM,
          category: InsightCategory.INVOICE,
          title: `${dueSoonInvoices} Invoice${dueSoonInvoices > 1 ? 's' : ''} Due Soon`,
          description: `${dueSoonInvoices} invoice${dueSoonInvoices > 1 ? 's are' : ' is'} due within the next 7 days.`,
          actionLabel: 'View Invoices',
          actionType: 'navigate',
          actionParams: { path: '/invoices?status=sent&due_soon=true' },
          data: { count: dueSoonInvoices },
          expiresAt: this.getExpiryDate(24),
        });
      }
    } catch (error) {
      this.logger.error('Error generating invoice alerts:', error);
    }

    return insights;
  }

  /**
   * Generate bill reminders (upcoming)
   */
  private async generateBillReminders(orgId: string): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(now.getDate() + 7);

      // Find bills due within 7 days
      const upcomingBills = await this.prisma.bill.findMany({
        where: {
          organisationId: orgId,
          paymentStatus: 'PENDING',
          dueDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        select: {
          id: true,
          vendorName: true,
          totalAmount: true,
          dueDate: true,
        },
      });

      for (const bill of upcomingBills) {
        const daysUntilDue = Math.ceil(
          (new Date(bill.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        let priority = InsightPriority.MEDIUM;
        if (daysUntilDue <= 2) {
          priority = InsightPriority.HIGH;
        }

        insights.push({
          type: InsightType.CASH_FLOW,
          priority,
          category: InsightCategory.BILL,
          title: `Bill Due: ${bill.vendorName}`,
          description: `Bill from ${bill.vendorName} (${this.formatCurrency(Number(bill.totalAmount))}) is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
          actionLabel: 'View Bill',
          actionType: 'navigate',
          actionParams: { path: `/finance/bills/${bill.id}` },
          entityType: 'bill',
          entityId: bill.id,
          data: { daysUntilDue, amount: Number(bill.totalAmount) },
          expiresAt: new Date(bill.dueDate),
        });
      }

      // Check for overdue bills
      const overdueBills = await this.prisma.bill.findMany({
        where: {
          organisationId: orgId,
          paymentStatus: 'PENDING',
          dueDate: { lt: now },
        },
        take: 5,
        select: {
          id: true,
          vendorName: true,
          totalAmount: true,
        },
      });

      if (overdueBills.length > 0) {
        const totalOverdue = overdueBills.reduce((sum, bill) => sum + Number(bill.totalAmount), 0);

        insights.push({
          type: InsightType.CASH_FLOW,
          priority: InsightPriority.URGENT,
          category: InsightCategory.BILL,
          title: `${overdueBills.length} Overdue Bill${overdueBills.length > 1 ? 's' : ''}`,
          description: `You have ${overdueBills.length} overdue bill${overdueBills.length > 1 ? 's' : ''} totaling ${this.formatCurrency(totalOverdue)}. Payment is needed urgently.`,
          actionLabel: 'View Bills',
          actionType: 'navigate',
          actionParams: { path: '/finance/bills?status=overdue' },
          data: { count: overdueBills.length, totalAmount: totalOverdue },
          expiresAt: this.getExpiryDate(24),
        });
      }
    } catch (error) {
      this.logger.error('Error generating bill reminders:', error);
    }

    return insights;
  }

  /**
   * Generate HR reminders
   */
  private async generateHRReminders(orgId: string): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];

    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Find employees with contracts expiring soon
      const employeesWithContracts = await this.prisma.employee.findMany({
        where: {
          orgId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          contracts: {
            where: {
              isActive: true,
              endDate: {
                gte: now,
                lte: thirtyDaysFromNow,
              },
            },
            select: {
              id: true,
              endDate: true,
              title: true,
            },
            take: 1,
          },
        },
        take: 10,
      });

      for (const employee of employeesWithContracts) {
        if (employee.contracts.length === 0) continue;
        const contract = employee.contracts[0];
        if (!contract.endDate) continue;

        const daysUntilExpiry = Math.ceil(
          (new Date(contract.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        let priority = InsightPriority.MEDIUM;
        if (daysUntilExpiry <= 7) {
          priority = InsightPriority.HIGH;
        }

        insights.push({
          type: InsightType.COMPLIANCE,
          priority,
          category: InsightCategory.HR,
          title: `Contract Expiring: ${employee.firstName} ${employee.lastName}`,
          description: `Employment contract for ${employee.firstName} ${employee.lastName} (${contract.title}) expires in ${daysUntilExpiry} days. Consider renewal or termination process.`,
          actionLabel: 'View Employee',
          actionType: 'navigate',
          actionParams: { path: `/hr/employees/${employee.id}` },
          entityType: 'employee',
          entityId: employee.id,
          data: { daysUntilExpiry, contractId: contract.id },
          expiresAt: new Date(contract.endDate),
        });
      }

      // Check for employees with low leave balance (calculate from entitlements)
      const currentYear = new Date().getFullYear();
      const employeesWithLeave = await this.prisma.employee.findMany({
        where: {
          orgId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          leaveEntitlements: {
            where: {
              year: currentYear,
              leaveType: 'ANNUAL', // Check annual leave
            },
            select: {
              totalDays: true,
              usedDays: true,
            },
          },
        },
        take: 50,
      });

      for (const employee of employeesWithLeave) {
        if (employee.leaveEntitlements.length === 0) continue;

        const entitlement = employee.leaveEntitlements[0];
        const remainingDays = Number(entitlement.totalDays) - Number(entitlement.usedDays);

        if (remainingDays <= 2 && remainingDays >= 0) {
          insights.push({
            type: InsightType.INSIGHT,
            priority: InsightPriority.LOW,
            category: InsightCategory.HR,
            title: `Low Leave Balance: ${employee.firstName} ${employee.lastName}`,
            description: `${employee.firstName} ${employee.lastName} has only ${remainingDays.toFixed(1)} leave day${remainingDays === 1 ? '' : 's'} remaining.`,
            actionLabel: 'View Details',
            actionType: 'navigate',
            actionParams: { path: `/hr/employees/${employee.id}/leave` },
            entityType: 'employee',
            entityId: employee.id,
            data: { remainingDays },
            expiresAt: this.getExpiryDate(72), // Expires in 3 days
          });
        }
      }
    } catch (error) {
      this.logger.error('Error generating HR reminders:', error);
    }

    return insights;
  }

  /**
   * Save generated insights to database as Suggestions
   */
  private async saveSuggestions(orgId: string, insights: GeneratedInsight[]): Promise<void> {
    try {
      // Delete old suggestions for this org (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await this.prisma.suggestion.deleteMany({
        where: {
          orgId,
          createdAt: { lt: sevenDaysAgo },
        },
      });

      // Create new suggestions (batch create for better performance)
      const suggestionData = insights.map(insight => ({
        orgId,
        userId: null, // Org-wide suggestion
        type: insight.type,
        priority: insight.priority,
        title: insight.title,
        description: insight.description,
        actionLabel: insight.actionLabel,
        entityType: insight.entityType,
        entityId: insight.entityId,
        data: insight.data || {},
        actionType: insight.actionType,
        actionParams: insight.actionParams || {},
        expiresAt: insight.expiresAt,
        status: 'PENDING' as const,
      }));

      await this.prisma.suggestion.createMany({
        data: suggestionData,
      });

      this.logger.debug(`Saved ${insights.length} suggestions for org ${orgId}`);
    } catch (error) {
      this.logger.error('Error saving suggestions:', error);
      throw error;
    }
  }

  /**
   * Get expiry date (hours from now)
   */
  private getExpiryDate(hours: number): Date {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date;
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  @OnQueueActive()
  onActive(job: Job<InsightJobData>): void {
    this.logger.log(`Daily insight job ${job.id} started for org ${job.data.orgId}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<InsightJobData>, result: InsightResult): void {
    this.logger.log(
      `Daily insight job ${job.id} completed: ${result.success ? 'SUCCESS' : 'FAILURE'} ` +
        `(${result.duration}ms, ${result.insightCount} insights)`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<InsightJobData>, error: Error): void {
    this.logger.error(`Daily insight job ${job.id} failed: ${error.message}`);
  }
}
