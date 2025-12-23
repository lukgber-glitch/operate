/**
 * Expense Suggestions Generator
 * Generates suggestions related to expenses (pending categorization, approvals, etc.)
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
  Optimization,
  OptimizationEffort,
} from '../suggestion.types';

@Injectable()
export class ExpenseSuggestionsGenerator extends BaseSuggestionGenerator {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async generate(context: SuggestionContext): Promise<GeneratorResult> {
    this.logger.debug(`Generating expense suggestions for org ${context.orgId}`);

    const suggestions: Suggestion[] = [];
    const insights: Insight[] = [];
    const optimizations: Optimization[] = [];

    try {
      // Check pending approvals
      const approvalResult = await this.checkPendingApprovals(context);
      suggestions.push(...approvalResult.suggestions);

      // Check uncategorized expenses
      const uncategorizedResult = await this.checkUncategorizedExpenses(context);
      suggestions.push(...uncategorizedResult.suggestions);

      // Check missing receipts
      const missingReceiptsResult = await this.checkMissingReceipts(context);
      suggestions.push(...missingReceiptsResult.suggestions);

      // Get expense insights
      const expenseInsights = await this.getExpenseInsights(context);
      insights.push(...expenseInsights);

      // Get optimization suggestions
      const expenseOptimizations = await this.getOptimizations(context);
      optimizations.push(...expenseOptimizations);

      return {
        suggestions,
        insights,
        reminders: [],
        optimizations,
      };
    } catch (error) {
      this.logger.error('Error generating expense suggestions:', error);
      return this.emptyResult();
    }
  }

  /**
   * Check for pending approvals
   */
  private async checkPendingApprovals(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    const pendingExpenses = await this.prisma.expense.findMany({
      where: {
        orgId: context.orgId,
        status: 'PENDING',
      },
      select: {
        id: true,
        description: true,
        amount: true,
        currency: true,
        submittedBy: true,
      },
      take: 10,
    });

    if (pendingExpenses.length === 0) {
      return { suggestions: [] };
    }

    const totalAmount = pendingExpenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0,
    );

    const suggestion: Suggestion = {
      id: this.createSuggestionId('expense', 'approvals', context.orgId),
      type: SuggestionType.QUICK_ACTION,
      title: `${pendingExpenses.length} expense${pendingExpenses.length > 1 ? 's' : ''} pending approval`,
      description: `You have ${pendingExpenses.length} expense${pendingExpenses.length > 1 ? 's' : ''} waiting for approval (total: ${this.formatCurrency(totalAmount)}).`,
      action: {
        type: 'review_expenses',
        label: 'Review Now',
        params: { path: '/expenses?status=pending' },
      },
      priority: SuggestionPriority.MEDIUM,
      dismissible: true,
      metadata: {
        count: pendingExpenses.length,
        totalAmount,
        expenseIds: pendingExpenses.map(e => e.id),
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check for uncategorized expenses
   */
  private async checkUncategorizedExpenses(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    const uncategorizedCount = await this.prisma.expense.count({
      where: {
        orgId: context.orgId,
        category: 'OTHER',
        status: { not: 'REJECTED' },
      },
    });

    if (uncategorizedCount === 0) {
      return { suggestions: [] };
    }

    const suggestion: Suggestion = {
      id: this.createSuggestionId('expense', 'uncategorized', context.orgId),
      type: SuggestionType.TIP,
      title: `${uncategorizedCount} expense${uncategorizedCount > 1 ? 's' : ''} need categorization`,
      description: `Categorizing expenses helps with tax deductions and financial reporting.`,
      action: {
        type: 'navigate',
        label: 'Categorize Now',
        params: { path: '/expenses?category=other' },
      },
      priority: SuggestionPriority.LOW,
      dismissible: true,
      metadata: {
        count: uncategorizedCount,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check for missing receipts
   */
  private async checkMissingReceipts(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const missingReceiptsCount = await this.prisma.expense.count({
      where: {
        orgId: context.orgId,
        receiptUrl: null,
        status: { in: ['PENDING', 'APPROVED'] },
        date: { gte: threeMonthsAgo },
      },
    });

    if (missingReceiptsCount === 0) {
      return { suggestions: [] };
    }

    const suggestion: Suggestion = {
      id: this.createSuggestionId('expense', 'receipts', context.orgId),
      type: SuggestionType.WARNING,
      title: `${missingReceiptsCount} expense${missingReceiptsCount > 1 ? 's' : ''} missing receipts`,
      description: `${missingReceiptsCount} recent expense${missingReceiptsCount > 1 ? 's' : ''} ${missingReceiptsCount > 1 ? 'are' : 'is'} missing receipt attachments. This may be required for tax compliance.`,
      action: {
        type: 'navigate',
        label: 'Add Receipts',
        params: { path: '/expenses?missing_receipts=true' },
      },
      priority: SuggestionPriority.MEDIUM,
      dismissible: true,
      metadata: {
        count: missingReceiptsCount,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Get expense insights
   */
  private async getExpenseInsights(
    context: SuggestionContext,
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Current month expenses
      const [currentMonthExpenses, lastMonthExpenses] = await Promise.all([
        this.prisma.expense.aggregate({
          where: {
            orgId: context.orgId,
            status: { in: ['APPROVED', 'PENDING'] },
            date: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            orgId: context.orgId,
            status: { in: ['APPROVED', 'PENDING'] },
            date: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const currentExpenses = Number(currentMonthExpenses._sum.amount || 0);
      const lastExpenses = Number(lastMonthExpenses._sum.amount || 0);

      if (currentExpenses > 0 || lastExpenses > 0) {
        const percentChange = this.calculatePercentageChange(
          currentExpenses,
          lastExpenses,
        );

        let trend: TrendDirection = TrendDirection.STABLE;
        if (Math.abs(percentChange) > 10) {
          trend = percentChange > 0 ? TrendDirection.UP : TrendDirection.DOWN;
        }

        const comparisonText =
          lastExpenses > 0
            ? `${Math.abs(percentChange).toFixed(1)}% vs last month (${this.formatCurrency(lastExpenses)})`
            : 'No comparison available';

        insights.push({
          id: this.createSuggestionId('insight', 'expenses', context.orgId),
          title: 'Monthly Expenses',
          description: `Current month expenses: ${this.formatCurrency(currentExpenses)}`,
          trend,
          value: currentExpenses,
          comparison: comparisonText,
          icon: 'trending-down',
          period: 'month',
        });
      }

      // Top expense category
      const topCategory = await this.prisma.expense.groupBy({
        by: ['category'],
        where: {
          orgId: context.orgId,
          status: { in: ['APPROVED', 'PENDING'] },
          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 1,
      });

      if (topCategory.length > 0 && topCategory[0].category !== 'OTHER') {
        const categoryAmount = Number(topCategory[0]._sum.amount || 0);
        insights.push({
          id: this.createSuggestionId('insight', 'top_category', context.orgId),
          title: 'Top Expense Category',
          description: `${topCategory[0].category}: ${this.formatCurrency(categoryAmount)} this month`,
          icon: 'pie-chart',
          period: 'month',
          metadata: {
            category: topCategory[0].category,
            amount: categoryAmount,
          },
        });
      }
    } catch (error) {
      this.logger.error('Error generating expense insights:', error);
    }

    return insights;
  }

  /**
   * Get optimization suggestions
   */
  private async getOptimizations(
    context: SuggestionContext,
  ): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    try {
      // Check for potential duplicate expenses
      const recentExpenses = await this.prisma.expense.findMany({
        where: {
          orgId: context.orgId,
          status: { in: ['APPROVED', 'PENDING'] },
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: {
          id: true,
          description: true,
          amount: true,
          date: true,
          vendorName: true,
        },
      });

      // Simple duplicate detection (same amount, vendor, and close dates)
      const potentialDuplicates = new Map<string, any[]>();

      for (const expense of recentExpenses) {
        const key = `${expense.vendorName}_${expense.amount}`;
        if (!potentialDuplicates.has(key)) {
          potentialDuplicates.set(key, []);
        }
        potentialDuplicates.get(key)!.push(expense);
      }

      const duplicateGroups = Array.from(potentialDuplicates.values()).filter(
        group => group.length > 1,
      );

      if (duplicateGroups.length > 0) {
        optimizations.push({
          id: this.createSuggestionId('optimization', 'duplicates', context.orgId),
          title: 'Potential duplicate expenses detected',
          description: `Found ${duplicateGroups.length} group${duplicateGroups.length > 1 ? 's' : ''} of potentially duplicate expenses that should be reviewed.`,
          effort: OptimizationEffort.LOW,
          category: 'data-quality',
          action: {
            type: 'review_duplicates',
            label: 'Review Duplicates',
            params: { path: '/expenses?duplicates=true' },
          },
        });
      }

      // Check for tax-deductible expenses
      const deductibleCategories = [
        'OFFICE_SUPPLIES',
        'TRAVEL',
        'PROFESSIONAL_SERVICES',
        'SOFTWARE',
        'MARKETING',
      ];

      const deductibleExpenses = await this.prisma.expense.aggregate({
        where: {
          orgId: context.orgId,
          status: 'APPROVED',
          category: { in: deductibleCategories },
          date: {
            gte: new Date(new Date().getFullYear(), 0, 1), // Start of year
          },
        },
        _sum: { amount: true },
      });

      const deductibleAmount = Number(deductibleExpenses._sum.amount || 0);

      if (deductibleAmount > 1000) {
        optimizations.push({
          id: this.createSuggestionId('optimization', 'deductions', context.orgId),
          title: 'Tax-deductible expenses identified',
          description: `You have ${this.formatCurrency(deductibleAmount)} in tax-deductible expenses this year. Make sure these are properly documented for tax filing.`,
          potentialSaving: deductibleAmount * 0.3, // Estimate 30% tax rate
          effort: OptimizationEffort.LOW,
          category: 'tax-optimization',
          action: {
            type: 'generate_report',
            label: 'Generate Report',
            params: { reportType: 'deductible_expenses' },
          },
        });
      }
    } catch (error) {
      this.logger.error('Error generating expense optimizations:', error);
    }

    return optimizations;
  }
}
