/**
 * Reduce Expenses Action Handler
 * AI-powered expense reduction recommendations and insights
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { PrismaService } from '../../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

interface ExpenseInsight {
  type: 'duplicate' | 'subscription' | 'high_category' | 'increase' | 'unused';
  title: string;
  description: string;
  potentialSavings: number;
  severity: 'low' | 'medium' | 'high';
  affectedExpenses: string[];
  recommendation: string;
}

@Injectable()
export class ReduceExpensesHandler extends BaseActionHandler {
  constructor(private prisma: PrismaService) {
    super('ReduceExpensesHandler');
  }

  get actionType(): ActionType {
    return ActionType.REDUCE_EXPENSES;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'timeframe',
        type: 'string',
        required: false,
        description: 'Analysis timeframe: month, quarter, or year',
        default: 'month',
        validation: (value) => ['month', 'quarter', 'year'].includes(value),
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'reports:generate')) {
        return this.error(
          'You do not have permission to view expense analysis',
          'PERMISSION_DENIED',
        );
      }

      const timeframe = params.timeframe || 'month';
      const startDate = this.getStartDate(timeframe);

      // Fetch expenses for analysis
      const expenses = await this.prisma.expense.findMany({
        where: {
          orgId: context.organizationId,
          date: { gte: startDate },
        },
        orderBy: { date: 'desc' },
      });

      if (expenses.length === 0) {
        return this.success(
          'No expenses found in the selected timeframe',
          undefined,
          'ExpenseAnalysis',
          {
            insights: [],
            totalPotentialSavings: 0,
            expensesAnalyzed: 0,
          },
        );
      }

      // Run all analysis algorithms
      const insights = await this.analyzeExpenses(
        expenses,
        context.organizationId,
      );

      // Calculate total potential savings
      const totalPotentialSavings = insights.reduce(
        (sum, insight) => sum + insight.potentialSavings,
        0,
      );

      // Format results
      const message = this.formatMessage(
        insights,
        totalPotentialSavings,
        expenses.length,
        timeframe,
      );

      this.logger.log(
        `Expense reduction analysis completed for org ${context.organizationId}: ${insights.length} insights, ${totalPotentialSavings.toFixed(2)} EUR potential savings`,
      );

      return this.success(message, undefined, 'ExpenseAnalysis', {
        insights: insights.map((i) => ({
          type: i.type,
          title: i.title,
          description: i.description,
          potentialSavings: i.potentialSavings,
          severity: i.severity,
          recommendation: i.recommendation,
        })),
        totalPotentialSavings,
        expensesAnalyzed: expenses.length,
        timeframe,
      });
    } catch (error) {
      this.logger.error('Failed to analyze expenses:', error);
      return this.error(
        'Failed to generate expense reduction recommendations',
        error.message || 'Unknown error',
      );
    }
  }

  /**
   * Analyze expenses and generate insights
   */
  private async analyzeExpenses(
    expenses: any[],
    organizationId: string,
  ): Promise<ExpenseInsight[]> {
    const insights: ExpenseInsight[] = [];

    // 1. Find duplicate/similar expenses
    const duplicateInsights = this.findDuplicates(expenses);
    insights.push(...duplicateInsights);

    // 2. Identify recurring subscriptions
    const subscriptionInsights = await this.findSubscriptions(
      expenses,
      organizationId,
    );
    insights.push(...subscriptionInsights);

    // 3. Analyze high-spending categories
    const categoryInsights = this.analyzeCategories(expenses);
    insights.push(...categoryInsights);

    // 4. Detect month-over-month increases
    const increaseInsights = await this.findIncreases(expenses, organizationId);
    insights.push(...increaseInsights);

    // 5. Find potentially unused services
    const unusedInsights = await this.findUnused(expenses, organizationId);
    insights.push(...unusedInsights);

    // Sort by severity and potential savings
    return insights.sort((a, b) => {
      const severityWeight = { high: 3, medium: 2, low: 1 };
      const severityDiff =
        severityWeight[b.severity] - severityWeight[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.potentialSavings - a.potentialSavings;
    });
  }

  /**
   * Find duplicate or very similar expenses (potential double charges)
   */
  private findDuplicates(expenses: any[]): ExpenseInsight[] {
    const insights: ExpenseInsight[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < expenses.length; i++) {
      if (processed.has(expenses[i].id)) continue;

      const duplicates = [];
      for (let j = i + 1; j < expenses.length; j++) {
        if (processed.has(expenses[j].id)) continue;

        // Check if expenses are similar
        if (this.areSimilarExpenses(expenses[i], expenses[j])) {
          duplicates.push(expenses[j]);
          processed.add(expenses[j].id);
        }
      }

      if (duplicates.length > 0) {
        const totalDuplicateAmount = duplicates.reduce(
          (sum, e) => sum + Number(e.amount),
          0,
        );

        insights.push({
          type: 'duplicate',
          title: 'Potential Duplicate Charges',
          description: `Found ${duplicates.length + 1} similar charges for "${expenses[i].description}" (${expenses[i].vendorName || 'Unknown vendor'})`,
          potentialSavings: totalDuplicateAmount,
          severity: totalDuplicateAmount > 100 ? 'high' : 'medium',
          affectedExpenses: [expenses[i].id, ...duplicates.map((d) => d.id)],
          recommendation:
            'Review these charges for potential duplicates or billing errors. Contact the vendor if necessary.',
        });

        processed.add(expenses[i].id);
      }
    }

    return insights;
  }

  /**
   * Check if two expenses are similar (same vendor, similar amount, close dates)
   */
  private areSimilarExpenses(expense1: any, expense2: any): boolean {
    // Same vendor or similar description
    const sameVendor =
      expense1.vendorName &&
      expense2.vendorName &&
      expense1.vendorName.toLowerCase() === expense2.vendorName.toLowerCase();

    const similarDescription =
      this.calculateSimilarity(
        expense1.description.toLowerCase(),
        expense2.description.toLowerCase(),
      ) > 0.7;

    if (!sameVendor && !similarDescription) return false;

    // Similar amount (within 5%)
    const amount1 = Number(expense1.amount);
    const amount2 = Number(expense2.amount);
    const amountDiff = Math.abs(amount1 - amount2);
    const similarAmount = amountDiff / Math.max(amount1, amount2) < 0.05;

    if (!similarAmount) return false;

    // Close dates (within 7 days)
    const date1 = new Date(expense1.date);
    const date2 = new Date(expense2.date);
    const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / 86400000;
    const closeDates = daysDiff <= 7;

    return closeDates;
  }

  /**
   * Calculate string similarity (simple Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));

    const words1Array = Array.from(words1);
    const words2Array = Array.from(words2);
    const intersection = new Set(
      words1Array.filter((word) => words2.has(word)),
    );
    const union = new Set([...words1Array, ...words2Array]);

    return intersection.size / union.size;
  }

  /**
   * Identify recurring subscriptions
   */
  private async findSubscriptions(
    expenses: any[],
    organizationId: string,
  ): Promise<ExpenseInsight[]> {
    const insights: ExpenseInsight[] = [];

    // Group by vendor
    const byVendor = this.groupBy(expenses, 'vendorName');

    for (const [vendor, vendorExpenses] of Object.entries(byVendor)) {
      if (!vendor || vendor === 'null') continue;

      // Check if expenses are recurring (similar amounts, regular intervals)
      const recurring = this.isRecurring(vendorExpenses as any[]);

      if (recurring.isRecurring && (vendorExpenses as any[]).length >= 2) {
        const monthlyAmount = recurring.averageAmount;
        const annualAmount = monthlyAmount * 12;

        insights.push({
          type: 'subscription',
          title: `Recurring Subscription: ${vendor}`,
          description: `${(vendorExpenses as any[]).length} recurring charges detected, averaging ${this.formatCurrency(monthlyAmount)}/month`,
          potentialSavings: monthlyAmount * 3, // Assume 3 months potential savings if optimized
          severity: monthlyAmount > 50 ? 'medium' : 'low',
          affectedExpenses: (vendorExpenses as any[]).map((e) => e.id),
          recommendation: `Review this subscription (${this.formatCurrency(annualAmount)}/year). Consider: negotiating a better rate, finding alternatives, or canceling if unused.`,
        });
      }
    }

    return insights;
  }

  /**
   * Check if expenses are recurring
   */
  private isRecurring(expenses: any[]): {
    isRecurring: boolean;
    averageAmount: number;
  } {
    if (expenses.length < 2) {
      return { isRecurring: false, averageAmount: 0 };
    }

    // Calculate average amount
    const amounts = expenses.map((e) => Number(e.amount));
    const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

    // Check if amounts are similar (within 10%)
    const similarAmounts = amounts.every(
      (amount) => Math.abs(amount - avgAmount) / avgAmount < 0.1,
    );

    if (!similarAmounts) {
      return { isRecurring: false, averageAmount: 0 };
    }

    // Check if dates are regularly spaced
    const dates = expenses
      .map((e) => new Date(e.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const daysDiff =
        (dates[i].getTime() - dates[i - 1].getTime()) / 86400000;
      intervals.push(daysDiff);
    }

    // Check if intervals are similar (within 7 days of monthly/weekly pattern)
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const isMonthly = Math.abs(avgInterval - 30) < 7;
    const isWeekly = Math.abs(avgInterval - 7) < 3;
    const isQuarterly = Math.abs(avgInterval - 90) < 14;

    return {
      isRecurring: isMonthly || isWeekly || isQuarterly,
      averageAmount: avgAmount,
    };
  }

  /**
   * Analyze spending by category
   */
  private analyzeCategories(expenses: any[]): ExpenseInsight[] {
    const insights: ExpenseInsight[] = [];

    // Group by category
    const byCategory = this.groupBy(expenses, 'category');

    // Calculate total spending
    const totalSpending = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    // Find high-spending categories (> 20% of total)
    for (const [category, categoryExpenses] of Object.entries(byCategory)) {
      const categoryTotal = (categoryExpenses as any[]).reduce(
        (sum, e) => sum + Number(e.amount),
        0,
      );
      const percentage = (categoryTotal / totalSpending) * 100;

      if (percentage > 20) {
        insights.push({
          type: 'high_category',
          title: `High Spending Category: ${category}`,
          description: `${percentage.toFixed(1)}% of total expenses (${this.formatCurrency(categoryTotal)})`,
          potentialSavings: categoryTotal * 0.1, // Assume 10% reduction potential
          severity: percentage > 40 ? 'high' : 'medium',
          affectedExpenses: (categoryExpenses as any[]).map((e) => e.id),
          recommendation: `This category represents ${percentage.toFixed(1)}% of your spending. Look for optimization opportunities: negotiate better rates, find cheaper alternatives, or reduce usage.`,
        });
      }
    }

    return insights;
  }

  /**
   * Find categories with month-over-month increases
   */
  private async findIncreases(
    expenses: any[],
    organizationId: string,
  ): Promise<ExpenseInsight[]> {
    const insights: ExpenseInsight[] = [];

    // Get expenses from previous period for comparison
    const oldestDate = expenses.reduce(
      (min, e) => (new Date(e.date) < min ? new Date(e.date) : min),
      new Date(expenses[0].date),
    );

    const periodLength = Date.now() - oldestDate.getTime();
    const previousStartDate = new Date(oldestDate.getTime() - periodLength);

    const previousExpenses = await this.prisma.expense.findMany({
      where: {
        orgId: organizationId,
        date: { gte: previousStartDate, lt: oldestDate },
      },
    });

    // Compare spending by category
    const currentByCategory = this.groupBy(expenses, 'category');
    const previousByCategory = this.groupBy(previousExpenses, 'category');

    for (const [category, currentExpenses] of Object.entries(
      currentByCategory,
    )) {
      const currentTotal = (currentExpenses as any[]).reduce(
        (sum, e) => sum + Number(e.amount),
        0,
      );

      const previousTotal = previousByCategory[category]
        ? (previousByCategory[category] as any[]).reduce(
            (sum, e) => sum + Number(e.amount),
            0,
          )
        : 0;

      if (previousTotal === 0) continue;

      const increase = currentTotal - previousTotal;
      const increasePercentage = (increase / previousTotal) * 100;

      // Flag increases > 20%
      if (increasePercentage > 20) {
        insights.push({
          type: 'increase',
          title: `Spending Increase: ${category}`,
          description: `${increasePercentage.toFixed(1)}% increase from previous period (${this.formatCurrency(increase)})`,
          potentialSavings: increase * 0.5, // Assume could reduce half the increase
          severity: increasePercentage > 50 ? 'high' : 'medium',
          affectedExpenses: (currentExpenses as any[]).map((e) => e.id),
          recommendation: `Spending in ${category} increased by ${increasePercentage.toFixed(1)}%. Investigate the cause: price increases, higher usage, or one-time expenses?`,
        });
      }
    }

    return insights;
  }

  /**
   * Find potentially unused subscriptions/services
   */
  private async findUnused(
    expenses: any[],
    organizationId: string,
  ): Promise<ExpenseInsight[]> {
    const insights: ExpenseInsight[] = [];

    // Group by vendor to find subscriptions
    const byVendor = this.groupBy(expenses, 'vendorName');

    for (const [vendor, vendorExpenses] of Object.entries(byVendor)) {
      if (!vendor || vendor === 'null') continue;

      const sortedExpenses = (vendorExpenses as any[]).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      const mostRecent = sortedExpenses[0];
      const daysSinceLastCharge =
        (Date.now() - new Date(mostRecent.date).getTime()) / 86400000;

      // If it's a recurring subscription but no charge in 60+ days
      const recurring = this.isRecurring(vendorExpenses as any[]);
      if (recurring.isRecurring && daysSinceLastCharge > 60) {
        insights.push({
          type: 'unused',
          title: `Potentially Inactive: ${vendor}`,
          description: `No charges in ${Math.floor(daysSinceLastCharge)} days (was ${this.formatCurrency(recurring.averageAmount)}/period)`,
          potentialSavings: recurring.averageAmount * 3, // Assume 3 periods savings
          severity: 'low',
          affectedExpenses: (vendorExpenses as any[]).map((e) => e.id),
          recommendation: `This service appears inactive. Verify if still needed or if billing was moved elsewhere. Consider canceling if unused.`,
        });
      }
    }

    return insights;
  }

  /**
   * Format analysis results as a message
   */
  private formatMessage(
    insights: ExpenseInsight[],
    totalSavings: number,
    expenseCount: number,
    timeframe: string,
  ): string {
    const formatCurrency = (amount: number) => this.formatCurrency(amount);

    let message = `💰 **Expense Reduction Analysis** (${timeframe})\n\n`;
    message += `Analyzed ${expenseCount} expenses\n`;
    message += `Found ${insights.length} opportunities\n`;
    message += `**Potential savings: ${formatCurrency(totalSavings)}**\n\n`;

    if (insights.length === 0) {
      message += `✅ Great job! No major optimization opportunities found.\n`;
      return message;
    }

    message += `**Top Recommendations:**\n\n`;

    // Show top 5 insights
    const topInsights = insights.slice(0, 5);
    topInsights.forEach((insight, index) => {
      const icon = this.getSeverityIcon(insight.severity);
      message += `${icon} **${insight.title}**\n`;
      message += `   ${insight.description}\n`;
      message += `   💵 Potential savings: ${formatCurrency(insight.potentialSavings)}\n`;
      message += `   📋 ${insight.recommendation}\n\n`;
    });

    if (insights.length > 5) {
      message += `_...and ${insights.length - 5} more insights_\n\n`;
    }

    message += `**Next Steps:**\n`;
    message += `• Review flagged expenses in detail\n`;
    message += `• Contact vendors to negotiate better rates\n`;
    message += `• Cancel or downgrade unused services\n`;
    message += `• Set up alerts for unusual spending patterns\n`;

    return message;
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Get start date based on timeframe
   */
  private getStartDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  /**
   * Group array by property
   */
  private groupBy(
    array: any[],
    property: string,
  ): Record<string, any[]> {
    return array.reduce((groups, item) => {
      const key = item[property] || 'unknown';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }
}
