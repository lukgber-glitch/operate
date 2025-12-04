/**
 * AI Insights Service
 * Uses Claude AI to analyze business data and generate intelligent insights
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ClaudeService } from '../claude.service';
import {
  Insight,
  Anomaly,
  AnomalyType,
  SuggestionPriority,
  TrendDirection,
} from './suggestion.types';

interface BusinessDataSnapshot {
  revenue: {
    current: number;
    previous: number;
    trend: number;
  };
  expenses: {
    current: number;
    previous: number;
    trend: number;
  };
  invoices: {
    overdue: number;
    draft: number;
    total: number;
  };
  topExpenseCategories: Array<{
    category: string;
    amount: number;
  }>;
}

@Injectable()
export class AIInsightsService {
  private readonly logger = new Logger(AIInsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly claude: ClaudeService,
  ) {}

  /**
   * Generate AI-powered insights using Claude
   */
  async generateInsights(orgId: string): Promise<Insight[]> {
    this.logger.debug(`Generating AI insights for org ${orgId}`);

    try {
      // Gather business data
      const dataSnapshot = await this.gatherBusinessData(orgId);

      // Use Claude to analyze and generate insights
      const prompt = this.buildInsightsPrompt(dataSnapshot);
      const analysis = await this.claude.analyzeWithTools(prompt, []);

      // Parse Claude's response into structured insights
      return this.parseInsightsFromAnalysis(analysis);
    } catch (error) {
      this.logger.error('Error generating AI insights:', error);
      return [];
    }
  }

  /**
   * Detect anomalies in business data
   */
  async detectAnomalies(orgId: string): Promise<Anomaly[]> {
    this.logger.debug(`Detecting anomalies for org ${orgId}`);

    const anomalies: Anomaly[] = [];

    try {
      // Check for unusual expenses
      const unusualExpenses = await this.detectUnusualExpenses(orgId);
      anomalies.push(...unusualExpenses);

      // Check for payment delays
      const paymentDelays = await this.detectPaymentDelays(orgId);
      anomalies.push(...paymentDelays);

      // Check for revenue drops
      const revenueDrop = await this.detectRevenueDrop(orgId);
      if (revenueDrop) anomalies.push(revenueDrop);

      // Check for duplicate transactions
      const duplicates = await this.detectDuplicateTransactions(orgId);
      anomalies.push(...duplicates);
    } catch (error) {
      this.logger.error('Error detecting anomalies:', error);
    }

    return anomalies;
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(
    orgId: string,
    userId: string,
  ): Promise<string[]> {
    this.logger.debug(
      `Getting personalized recommendations for user ${userId} in org ${orgId}`,
    );

    try {
      // Get user's activity history
      const userActivity = await this.getUserActivity(userId);

      // Use Claude to generate recommendations
      const prompt = `Based on the following user activity, suggest 3-5 personalized actions they should take:

${JSON.stringify(userActivity, null, 2)}

Provide concise, actionable recommendations.`;

      const response = await this.claude.analyzeWithTools(prompt, []);

      // Extract recommendations from response
      return this.parseRecommendations(response);
    } catch (error) {
      this.logger.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Gather business data snapshot
   */
  private async gatherBusinessData(
    orgId: string,
  ): Promise<BusinessDataSnapshot> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      currentRevenue,
      lastRevenue,
      currentExpenses,
      lastExpenses,
      overdueInvoices,
      draftInvoices,
      totalInvoices,
      topExpenses,
    ] = await Promise.all([
      // Current month revenue
      this.prisma.invoice.aggregate({
        where: {
          orgId,
          status: { in: ['SENT', 'PAID'] },
          issueDate: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      // Last month revenue
      this.prisma.invoice.aggregate({
        where: {
          orgId,
          status: { in: ['SENT', 'PAID'] },
          issueDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { totalAmount: true },
      }),
      // Current month expenses
      this.prisma.expense.aggregate({
        where: {
          orgId,
          status: 'APPROVED',
          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      // Last month expenses
      this.prisma.expense.aggregate({
        where: {
          orgId,
          status: 'APPROVED',
          date: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),
      // Overdue invoices
      this.prisma.invoice.count({
        where: {
          orgId,
          status: 'SENT',
          dueDate: { lt: now },
        },
      }),
      // Draft invoices
      this.prisma.invoice.count({
        where: { orgId, status: 'DRAFT' },
      }),
      // Total invoices
      this.prisma.invoice.count({ where: { orgId } }),
      // Top expense categories
      this.prisma.expense.groupBy({
        by: ['category'],
        where: {
          orgId,
          status: 'APPROVED',
          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
    ]);

    const revenueCurrent = Number(currentRevenue._sum.totalAmount || 0);
    const revenuePrevious = Number(lastRevenue._sum.totalAmount || 0);
    const expensesCurrent = Number(currentExpenses._sum.amount || 0);
    const expensesPrevious = Number(lastExpenses._sum.amount || 0);

    return {
      revenue: {
        current: revenueCurrent,
        previous: revenuePrevious,
        trend: this.calculateTrend(revenueCurrent, revenuePrevious),
      },
      expenses: {
        current: expensesCurrent,
        previous: expensesPrevious,
        trend: this.calculateTrend(expensesCurrent, expensesPrevious),
      },
      invoices: {
        overdue: overdueInvoices,
        draft: draftInvoices,
        total: totalInvoices,
      },
      topExpenseCategories: topExpenses.map(e => ({
        category: e.category,
        amount: Number(e._sum.amount || 0),
      })),
    };
  }

  /**
   * Build prompt for Claude insights
   */
  private buildInsightsPrompt(data: BusinessDataSnapshot): string {
    return `Analyze this business data and provide 3-5 key insights:

Revenue: €${data.revenue.current.toFixed(2)} (${data.revenue.trend > 0 ? '+' : ''}${data.revenue.trend.toFixed(1)}% vs last month)
Expenses: €${data.expenses.current.toFixed(2)} (${data.expenses.trend > 0 ? '+' : ''}${data.expenses.trend.toFixed(1)}% vs last month)
Overdue Invoices: ${data.invoices.overdue}
Draft Invoices: ${data.invoices.draft}

Top Expense Categories:
${data.topExpenseCategories.map(c => `- ${c.category}: €${c.amount.toFixed(2)}`).join('\n')}

Provide insights in this JSON format:
{
  "insights": [
    {
      "title": "Brief title",
      "description": "Detailed description",
      "trend": "up|down|stable"
    }
  ]
}`;
  }

  /**
   * Parse insights from Claude's analysis
   */
  private parseInsightsFromAnalysis(analysis: string): Insight[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return (parsed.insights || []).map((insight: any, idx: number) => ({
          id: `ai_insight_${idx}_${Date.now()}`,
          title: insight.title,
          description: insight.description,
          trend: this.mapTrend(insight.trend),
          icon: 'sparkles',
        }));
      }
    } catch (error) {
      this.logger.error('Error parsing AI insights:', error);
    }

    return [];
  }

  /**
   * Detect unusual expenses
   */
  private async detectUnusualExpenses(orgId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    try {
      // Get average expense amounts per category
      const avgByCategory = await this.prisma.expense.groupBy({
        by: ['category'],
        where: {
          orgId,
          status: 'APPROVED',
          date: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
        _avg: { amount: true },
      });

      // Check recent expenses for outliers
      const recentExpenses = await this.prisma.expense.findMany({
        where: {
          orgId,
          status: { in: ['PENDING', 'APPROVED'] },
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      });

      for (const expense of recentExpenses) {
        const avg = avgByCategory.find(a => a.category === expense.category);
        if (avg && avg._avg.amount) {
          const avgAmount = Number(avg._avg.amount);
          const expenseAmount = Number(expense.amount);

          // If expense is 3x the average, flag as anomaly
          if (expenseAmount > avgAmount * 3) {
            anomalies.push({
              id: `anomaly_expense_${expense.id}`,
              type: AnomalyType.UNUSUAL_EXPENSE,
              title: 'Unusual expense detected',
              description: `Expense of ${expenseAmount.toFixed(2)} is significantly higher than average (${avgAmount.toFixed(2)}) for category ${expense.category}`,
              severity: SuggestionPriority.MEDIUM,
              detectedAt: new Date(),
              affectedEntity: {
                type: 'expense',
                id: expense.id,
                name: expense.description,
              },
              metrics: {
                expected: avgAmount,
                actual: expenseAmount,
                deviation: ((expenseAmount - avgAmount) / avgAmount) * 100,
              },
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Error detecting unusual expenses:', error);
    }

    return anomalies;
  }

  /**
   * Detect payment delays
   */
  private async detectPaymentDelays(orgId: string): Promise<Anomaly[]> {
    // This would check for invoices with unusual payment delays
    // Implementation depends on historical payment data
    return [];
  }

  /**
   * Detect revenue drop
   */
  private async detectRevenueDrop(orgId: string): Promise<Anomaly | null> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [current, previous] = await Promise.all([
        this.prisma.invoice.aggregate({
          where: {
            orgId,
            status: { in: ['SENT', 'PAID'] },
            issueDate: { gte: startOfMonth },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            orgId,
            status: { in: ['SENT', 'PAID'] },
            issueDate: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
          _sum: { totalAmount: true },
        }),
      ]);

      const currentRevenue = Number(current._sum.totalAmount || 0);
      const previousRevenue = Number(previous._sum.totalAmount || 0);

      if (previousRevenue > 0) {
        const dropPercentage =
          ((previousRevenue - currentRevenue) / previousRevenue) * 100;

        if (dropPercentage > 20) {
          return {
            id: `anomaly_revenue_drop_${Date.now()}`,
            type: AnomalyType.REVENUE_DROP,
            title: 'Significant revenue drop detected',
            description: `Revenue has decreased by ${dropPercentage.toFixed(1)}% compared to last month`,
            severity: SuggestionPriority.HIGH,
            detectedAt: new Date(),
            metrics: {
              expected: previousRevenue,
              actual: currentRevenue,
              deviation: -dropPercentage,
            },
          };
        }
      }
    } catch (error) {
      this.logger.error('Error detecting revenue drop:', error);
    }

    return null;
  }

  /**
   * Detect duplicate transactions
   */
  private async detectDuplicateTransactions(orgId: string): Promise<Anomaly[]> {
    // Similar to the expense optimization check
    return [];
  }

  /**
   * Get user activity
   */
  private async getUserActivity(userId: string): Promise<any> {
    // Get recent conversations and actions
    const recentActivity = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      take: 10,
      select: {
        title: true,
        contextType: true,
        lastMessageAt: true,
      },
    });

    return recentActivity;
  }

  /**
   * Parse recommendations from Claude response
   */
  private parseRecommendations(response: string): string[] {
    // Simple extraction - split by newlines and filter
    return response
      .split('\n')
      .filter(line => line.trim().length > 0 && line.match(/^[\d\-\*]/))
      .map(line => line.replace(/^[\d\-\*\.\)\s]+/, '').trim())
      .slice(0, 5);
  }

  /**
   * Calculate trend percentage
   */
  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Map trend string to enum
   */
  private mapTrend(trend: string): TrendDirection | undefined {
    switch (trend?.toLowerCase()) {
      case 'up':
        return TrendDirection.UP;
      case 'down':
        return TrendDirection.DOWN;
      case 'stable':
        return TrendDirection.STABLE;
      default:
        return undefined;
    }
  }
}
