/**
 * Invoice Suggestions Generator
 * Generates suggestions related to invoices (overdue, drafts, etc.)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { BaseSuggestionGenerator } from './base.generator';
import {
  GeneratorResult,
  Suggestion,
  SuggestionContext,
  SuggestionPriority,
  SuggestionType,
  Insight,
  TrendDirection,
} from '../suggestion.types';

@Injectable()
export class InvoiceSuggestionsGenerator extends BaseSuggestionGenerator {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async generate(context: SuggestionContext): Promise<GeneratorResult> {
    this.logger.debug(`Generating invoice suggestions for org ${context.orgId}`);

    const suggestions: Suggestion[] = [];
    const insights: Insight[] = [];

    try {
      // Get overdue invoices
      const overdueResult = await this.checkOverdueInvoices(context);
      suggestions.push(...overdueResult.suggestions);

      // Get draft invoices
      const draftResult = await this.checkDraftInvoices(context);
      suggestions.push(...draftResult.suggestions);

      // Get unpaid invoices nearing due date
      const dueSoonResult = await this.checkInvoicesDueSoon(context);
      suggestions.push(...dueSoonResult.suggestions);

      // Get revenue insights
      const revenueInsights = await this.getRevenueInsights(context);
      insights.push(...revenueInsights);

      return {
        suggestions,
        insights,
        reminders: [],
        optimizations: [],
      };
    } catch (error) {
      this.logger.error('Error generating invoice suggestions:', error);
      return this.emptyResult();
    }
  }

  /**
   * Check for overdue invoices
   */
  private async checkOverdueInvoices(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    const now = new Date();

    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId: context.orgId,
        status: 'SENT',
        dueDate: { lt: now },
      },
      select: {
        id: true,
        number: true,
        customerName: true,
        totalAmount: true,
        currency: true,
        dueDate: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    if (overdueInvoices.length === 0) {
      return { suggestions: [] };
    }

    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    const invoiceIds = overdueInvoices.map(inv => inv.id);
    const invoiceNumbers = overdueInvoices
      .slice(0, 3)
      .map(inv => inv.number)
      .join(', ');

    const description =
      overdueInvoices.length <= 3
        ? `Invoices ${invoiceNumbers} are overdue. Total: ${this.formatCurrency(totalOverdue)}`
        : `${overdueInvoices.length} invoices are overdue (${invoiceNumbers}, ...). Total: ${this.formatCurrency(totalOverdue)}`;

    const suggestion: Suggestion = {
      id: this.createSuggestionId('invoice', 'overdue', context.orgId),
      type: SuggestionType.WARNING,
      title: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}`,
      description,
      action: {
        type: 'send_reminders',
        label: 'Send Reminders',
        params: { invoiceIds },
        confirmation: true,
      },
      priority: SuggestionPriority.HIGH,
      dismissible: true,
      metadata: {
        count: overdueInvoices.length,
        totalAmount: totalOverdue,
        invoiceIds,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check for draft invoices
   */
  private async checkDraftInvoices(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    const draftInvoices = await this.prisma.invoice.count({
      where: {
        orgId: context.orgId,
        status: 'DRAFT',
      },
    });

    if (draftInvoices === 0) {
      return { suggestions: [] };
    }

    const suggestion: Suggestion = {
      id: this.createSuggestionId('invoice', 'drafts', context.orgId),
      type: SuggestionType.QUICK_ACTION,
      title: `${draftInvoices} draft invoice${draftInvoices > 1 ? 's' : ''}`,
      description: `You have ${draftInvoices} draft invoice${draftInvoices > 1 ? 's' : ''} waiting to be finalized and sent.`,
      action: {
        type: 'navigate',
        label: 'Review Drafts',
        params: { path: '/invoices?status=draft' },
      },
      priority: SuggestionPriority.MEDIUM,
      dismissible: true,
      metadata: {
        count: draftInvoices,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check for invoices due soon
   */
  private async checkInvoicesDueSoon(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const dueSoonInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId: context.orgId,
        status: 'SENT',
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      select: {
        id: true,
        number: true,
        customerName: true,
        totalAmount: true,
        currency: true,
        dueDate: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    if (dueSoonInvoices.length === 0) {
      return { suggestions: [] };
    }

    const totalAmount = dueSoonInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    const suggestion: Suggestion = {
      id: this.createSuggestionId('invoice', 'due_soon', context.orgId),
      type: SuggestionType.TIP,
      title: `${dueSoonInvoices.length} invoice${dueSoonInvoices.length > 1 ? 's' : ''} due within 7 days`,
      description: `${dueSoonInvoices.length} unpaid invoice${dueSoonInvoices.length > 1 ? 's' : ''} (total: ${this.formatCurrency(totalAmount)}) will be due within the next week.`,
      action: {
        type: 'navigate',
        label: 'View Details',
        params: { path: '/invoices?status=sent&due_soon=true' },
      },
      priority: SuggestionPriority.MEDIUM,
      dismissible: true,
      metadata: {
        count: dueSoonInvoices.length,
        totalAmount,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Get revenue insights
   */
  private async getRevenueInsights(
    context: SuggestionContext,
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    try {
      // Current month revenue
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [currentMonthRevenue, lastMonthRevenue] = await Promise.all([
        this.prisma.invoice.aggregate({
          where: {
            orgId: context.orgId,
            status: { in: ['SENT', 'PAID'] },
            issueDate: { gte: startOfMonth },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            orgId: context.orgId,
            status: { in: ['SENT', 'PAID'] },
            issueDate: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
          _sum: { totalAmount: true },
        }),
      ]);

      const currentRevenue = Number(currentMonthRevenue._sum.totalAmount || 0);
      const lastRevenue = Number(lastMonthRevenue._sum.totalAmount || 0);

      if (currentRevenue > 0 || lastRevenue > 0) {
        const percentChange = this.calculatePercentageChange(
          currentRevenue,
          lastRevenue,
        );

        let trend: TrendDirection = TrendDirection.STABLE;
        if (Math.abs(percentChange) > 5) {
          trend = percentChange > 0 ? TrendDirection.UP : TrendDirection.DOWN;
        }

        const comparisonText =
          lastRevenue > 0
            ? `${Math.abs(percentChange).toFixed(1)}% vs last month (${this.formatCurrency(lastRevenue)})`
            : 'No comparison available';

        insights.push({
          id: this.createSuggestionId('insight', 'revenue', context.orgId),
          title: 'Monthly Revenue',
          description: `Current month revenue: ${this.formatCurrency(currentRevenue)}`,
          trend,
          value: currentRevenue,
          comparison: comparisonText,
          icon: 'trending-up',
          period: 'month',
        });
      }

      // Top customer
      const topCustomer = await this.prisma.invoice.groupBy({
        by: ['customerName'],
        where: {
          orgId: context.orgId,
          status: { in: ['SENT', 'PAID'] },
          issueDate: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 1,
      });

      if (topCustomer.length > 0) {
        const customerRevenue = Number(topCustomer[0]._sum.totalAmount || 0);
        insights.push({
          id: this.createSuggestionId('insight', 'top_customer', context.orgId),
          title: 'Top Customer',
          description: `${topCustomer[0].customerName}: ${this.formatCurrency(customerRevenue)} this month`,
          icon: 'star',
          period: 'month',
          metadata: {
            customerName: topCustomer[0].customerName,
            revenue: customerRevenue,
          },
        });
      }

      // Average payment time
      const paidInvoices = await this.prisma.invoice.findMany({
        where: {
          orgId: context.orgId,
          status: 'PAID',
          paidDate: { not: null },
          issueDate: { gte: startOfLastMonth },
        },
        select: {
          issueDate: true,
          paidDate: true,
        },
        take: 50,
      });

      if (paidInvoices.length > 0) {
        const avgDays =
          paidInvoices.reduce((sum, inv) => {
            if (inv.paidDate) {
              return sum + this.getDaysBetween(inv.issueDate, inv.paidDate);
            }
            return sum;
          }, 0) / paidInvoices.length;

        insights.push({
          id: this.createSuggestionId('insight', 'payment_time', context.orgId),
          title: 'Average Payment Time',
          description: `Customers pay on average in ${Math.round(avgDays)} days`,
          icon: 'clock',
          period: 'recent',
          metadata: {
            avgDays: Math.round(avgDays),
            sampleSize: paidInvoices.length,
          },
        });
      }
    } catch (error) {
      this.logger.error('Error generating revenue insights:', error);
    }

    return insights;
  }
}
