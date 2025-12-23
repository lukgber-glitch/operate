import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

interface ScoreComponents {
  cashFlow: number;
  arHealth: number;
  apHealth: number;
  taxCompliance: number;
  profitability: number;
  runway: number;
}

interface ScoreMetrics {
  cashBalance: number;
  monthlyBurn: number;
  runwayMonths: number;
  totalAR: number;
  overdueAR: number;
  totalBills: number;
  lateBills: number;
  overdueFilings: number;
  revenue: number;
  expenses: number;
  profitMargin: number;
}

@Injectable()
export class HealthScoreService {
  private readonly logger = new Logger(HealthScoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate cash flow score based on runway months
   * @param cashBalance Current cash balance
   * @param monthlyBurn Average monthly burn rate
   * @returns Score from 0-100
   */
  private calculateCashFlowScore(
    cashBalance: number,
    monthlyBurn: number,
  ): number {
    if (monthlyBurn <= 0) return 100; // No burn means healthy
    const runwayMonths = cashBalance / monthlyBurn;

    if (runwayMonths >= 6) return 100;
    if (runwayMonths >= 3) return 80;
    if (runwayMonths >= 1) return 60;
    if (runwayMonths >= 0.5) return 40;
    return 20;
  }

  /**
   * Calculate AR (Accounts Receivable) health score
   * @param totalAR Total accounts receivable
   * @param overdueAR Overdue accounts receivable
   * @returns Score from 0-100
   */
  private calculateARScore(totalAR: number, overdueAR: number): number {
    if (totalAR === 0) return 100; // No AR means no collection issues
    const overduePercent = (overdueAR / totalAR) * 100;

    if (overduePercent === 0) return 100;
    if (overduePercent < 10) return 80;
    if (overduePercent < 25) return 60;
    if (overduePercent < 50) return 40;
    return 20;
  }

  /**
   * Calculate AP (Accounts Payable) health score
   * @param totalBills Total number of bills
   * @param lateBills Number of late bills
   * @returns Score from 0-100
   */
  private calculateAPScore(totalBills: number, lateBills: number): number {
    if (totalBills === 0) return 100; // No bills means no payment issues
    const latePercent = (lateBills / totalBills) * 100;

    if (latePercent === 0) return 100;
    if (latePercent < 10) return 80;
    if (latePercent < 25) return 60;
    if (latePercent < 50) return 40;
    return 20;
  }

  /**
   * Calculate tax compliance score
   * @param overdueFilings Number of overdue tax filings
   * @returns Score from 0-100
   */
  private calculateTaxScore(overdueFilings: number): number {
    if (overdueFilings === 0) return 100;
    if (overdueFilings === 1) return 60;
    if (overdueFilings === 2) return 40;
    return 20;
  }

  /**
   * Calculate profitability score
   * @param revenue Total revenue
   * @param expenses Total expenses
   * @returns Score from 0-100
   */
  private calculateProfitabilityScore(
    revenue: number,
    expenses: number,
  ): number {
    if (revenue === 0) return 50; // No revenue yet
    const margin = ((revenue - expenses) / revenue) * 100;

    if (margin > 20) return 100;
    if (margin > 10) return 80;
    if (margin > 5) return 60;
    if (margin > 0) return 40;
    return 20;
  }

  /**
   * Calculate runway score
   * @param monthsRunway Number of months of runway
   * @returns Score from 0-100
   */
  private calculateRunwayScore(monthsRunway: number): number {
    if (monthsRunway >= 12) return 100;
    if (monthsRunway >= 6) return 80;
    if (monthsRunway >= 3) return 60;
    if (monthsRunway >= 1) return 40;
    return 20;
  }

  /**
   * Calculate overall weighted score
   * @param scores Component scores
   * @returns Weighted overall score from 0-100
   */
  private calculateOverall(scores: ScoreComponents): number {
    return Math.round(
      scores.cashFlow * 0.25 +
        scores.arHealth * 0.2 +
        scores.apHealth * 0.15 +
        scores.taxCompliance * 0.15 +
        scores.profitability * 0.15 +
        scores.runway * 0.1,
    );
  }

  /**
   * Get financial metrics for an organization
   * @param organisationId Organization ID
   * @returns Financial metrics
   */
  private async getFinancialMetrics(
    organisationId: string,
  ): Promise<ScoreMetrics> {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Get cash balance from bank accounts
    const bankAccounts = await this.prisma.plaidBankAccount.findMany({
      where: { orgId: organisationId },
      select: { availableBalance: true },
    });

    const cashBalance = bankAccounts.reduce(
      (sum, acc) => sum + Number(acc.availableBalance || 0),
      0,
    );

    // Get expenses for last 3 months to calculate burn rate
    const recentExpenses = await this.prisma.transaction.aggregate({
      where: {
        orgId: organisationId,
        date: { gte: threeMonthsAgo },
        amount: { lt: 0 }, // Expenses are negative
      },
      _sum: { amount: true },
    });

    const monthlyBurn = Math.abs(Number(recentExpenses._sum.amount || 0) / 3);
    const runwayMonths = monthlyBurn > 0 ? cashBalance / monthlyBurn : 12;

    // Get AR data (unpaid invoices)
    const arData = await this.prisma.$queryRaw<
      Array<{ totalAR: number; overdueAR: number }>
    >`
      SELECT
        COALESCE(SUM(amount), 0) as "totalAR",
        COALESCE(SUM(CASE WHEN "dueDate" < CURRENT_DATE THEN amount ELSE 0 END), 0) as "overdueAR"
      FROM "Invoice"
      WHERE "organisationId" = ${organisationId}
        AND status = 'SENT'
    `;

    const { totalAR = 0, overdueAR = 0 } = arData[0] || {};

    // Get AP data (unpaid bills)
    const apData = await this.prisma.$queryRaw<
      Array<{ totalBills: bigint; lateBills: bigint }>
    >`
      SELECT
        COUNT(*) as "totalBills",
        COUNT(CASE WHEN "dueDate" < CURRENT_DATE THEN 1 END) as "lateBills"
      FROM "Bill"
      WHERE "organisationId" = ${organisationId}
        AND status = 'PENDING'
    `;

    const { totalBills = BigInt(0), lateBills = BigInt(0) } = apData[0] || {};

    // Get overdue tax filings
    const overdueTaxFilings = await this.prisma.taxDeadlineReminder.count({
      where: {
        organizationId: organisationId,
        dueDate: { lt: now },
        status: 'PENDING',
      },
    });

    // Get revenue and expenses for last month
    const monthlyTransactions = await this.prisma.transaction.aggregate({
      where: {
        orgId: organisationId,
        date: { gte: oneMonthAgo },
      },
      _sum: { amount: true },
    });

    const recentRevenue = await this.prisma.transaction.aggregate({
      where: {
        orgId: organisationId,
        date: { gte: oneMonthAgo },
        amount: { gt: 0 }, // Revenue is positive
      },
      _sum: { amount: true },
    });

    const recentExpensesMonth = await this.prisma.transaction.aggregate({
      where: {
        orgId: organisationId,
        date: { gte: oneMonthAgo },
        amount: { lt: 0 }, // Expenses are negative
      },
      _sum: { amount: true },
    });

    const revenue = Number(recentRevenue._sum.amount || 0);
    const expenses = Math.abs(Number(recentExpensesMonth._sum.amount || 0));
    const profitMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;

    return {
      cashBalance,
      monthlyBurn,
      runwayMonths,
      totalAR: Number(totalAR),
      overdueAR: Number(overdueAR),
      totalBills: Number(totalBills),
      lateBills: Number(lateBills),
      overdueFilings: overdueTaxFilings,
      revenue,
      expenses,
      profitMargin,
    };
  }

  /**
   * Generate insights based on scores and metrics
   * @param scores Component scores
   * @param metrics Financial metrics
   * @returns Array of insight strings
   */
  private generateInsights(
    scores: ScoreComponents,
    metrics: ScoreMetrics,
  ): string[] {
    const insights: string[] = [];

    // Cash flow insights
    if (scores.cashFlow < 60) {
      insights.push(
        `Your cash flow needs attention. You have ${metrics.runwayMonths.toFixed(1)} months of runway remaining.`,
      );
    } else if (scores.cashFlow >= 80) {
      insights.push(
        `Your cash flow is healthy with ${metrics.runwayMonths.toFixed(1)} months of runway.`,
      );
    }

    // AR insights
    if (scores.arHealth < 60) {
      const overduePercent = (metrics.overdueAR / metrics.totalAR) * 100;
      insights.push(
        `${overduePercent.toFixed(0)}% of your accounts receivable is overdue. Consider sending payment reminders.`,
      );
    }

    // AP insights
    if (scores.apHealth < 60) {
      const latePercent = (metrics.lateBills / metrics.totalBills) * 100;
      insights.push(
        `${latePercent.toFixed(0)}% of your bills are being paid late. This may damage vendor relationships.`,
      );
    }

    // Tax insights
    if (scores.taxCompliance < 100) {
      insights.push(
        `You have ${metrics.overdueFilings} overdue tax filing(s). File immediately to avoid penalties.`,
      );
    }

    // Profitability insights
    if (scores.profitability < 60) {
      insights.push(
        `Your profit margin is ${metrics.profitMargin.toFixed(1)}%. Consider ways to increase revenue or reduce costs.`,
      );
    } else if (scores.profitability >= 80) {
      insights.push(
        `Strong profitability with a ${metrics.profitMargin.toFixed(1)}% profit margin.`,
      );
    }

    return insights;
  }

  /**
   * Generate recommendations based on scores
   * @param scores Component scores
   * @returns Array of recommendation strings
   */
  private generateRecommendations(scores: ScoreComponents): string[] {
    const recommendations: string[] = [];

    if (scores.arHealth < 60) {
      recommendations.push(
        'Send payment reminders to clients with overdue invoices',
      );
      recommendations.push(
        'Consider offering early payment discounts to improve cash collection',
      );
    }

    if (scores.cashFlow < 60) {
      recommendations.push(
        'Review and reduce non-essential expenses to improve runway',
      );
      recommendations.push(
        'Accelerate collections from outstanding invoices',
      );
    }

    if (scores.apHealth < 60) {
      recommendations.push('Set up automated bill payment to avoid late fees');
      recommendations.push('Negotiate extended payment terms with vendors');
    }

    if (scores.taxCompliance < 100) {
      recommendations.push(
        'File overdue tax returns immediately to avoid penalties and interest',
      );
      recommendations.push(
        'Set up automated reminders for upcoming tax deadlines',
      );
    }

    if (scores.profitability < 60) {
      recommendations.push('Analyze expense categories to identify cost savings');
      recommendations.push(
        'Review pricing strategy to improve profit margins',
      );
    }

    if (scores.runway < 60) {
      recommendations.push(
        'Consider raising additional capital or a line of credit',
      );
      recommendations.push('Focus on extending runway through cost optimization');
    }

    return recommendations;
  }

  /**
   * Calculate health score for an organization
   * @param organisationId Organization ID
   * @returns Calculated health score
   */
  async calculateScore(organisationId: string) {
    this.logger.log(`Calculating health score for org: ${organisationId}`);

    // Get financial metrics
    const metrics = await this.getFinancialMetrics(organisationId);

    // Calculate component scores
    const scores: ScoreComponents = {
      cashFlow: this.calculateCashFlowScore(
        metrics.cashBalance,
        metrics.monthlyBurn,
      ),
      arHealth: this.calculateARScore(metrics.totalAR, metrics.overdueAR),
      apHealth: this.calculateAPScore(metrics.totalBills, metrics.lateBills),
      taxCompliance: this.calculateTaxScore(metrics.overdueFilings),
      profitability: this.calculateProfitabilityScore(
        metrics.revenue,
        metrics.expenses,
      ),
      runway: this.calculateRunwayScore(metrics.runwayMonths),
    };

    // Calculate overall score
    const overallScore = this.calculateOverall(scores);

    // Generate insights and recommendations
    const insights = this.generateInsights(scores, metrics);
    const recommendations = this.generateRecommendations(scores);

    // Save to database
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const healthScore = await this.prisma.businessHealthScore.upsert({
      where: {
        organisationId_date: {
          organisationId,
          date: today,
        },
      },
      update: {
        overallScore,
        cashFlowScore: scores.cashFlow,
        arHealthScore: scores.arHealth,
        apHealthScore: scores.apHealth,
        taxComplianceScore: scores.taxCompliance,
        profitabilityScore: scores.profitability,
        runwayScore: scores.runway,
        metrics: metrics as unknown as Prisma.InputJsonValue,
        insights,
        recommendations,
      },
      create: {
        organisationId,
        date: today,
        overallScore,
        cashFlowScore: scores.cashFlow,
        arHealthScore: scores.arHealth,
        apHealthScore: scores.apHealth,
        taxComplianceScore: scores.taxCompliance,
        profitabilityScore: scores.profitability,
        runwayScore: scores.runway,
        metrics: metrics as unknown as Prisma.InputJsonValue,
        insights,
        recommendations,
      },
    });

    this.logger.log(
      `Health score calculated: ${overallScore} for org: ${organisationId}`,
    );

    return healthScore;
  }

  /**
   * Get current health score for an organization
   * @param organisationId Organization ID
   * @returns Current health score or null
   */
  async getCurrentScore(organisationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const score = await this.prisma.businessHealthScore.findUnique({
      where: {
        organisationId_date: {
          organisationId,
          date: today,
        },
      },
    });

    // If no score for today, calculate it
    if (!score) {
      return this.calculateScore(organisationId);
    }

    return score;
  }

  /**
   * Get historical health scores
   * @param organisationId Organization ID
   * @param days Number of days to look back
   * @returns Historical health scores
   */
  async getHistory(organisationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.prisma.businessHealthScore.findMany({
      where: {
        organisationId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get detailed score breakdown
   * @param organisationId Organization ID
   * @returns Detailed breakdown
   */
  async getBreakdown(organisationId: string) {
    const score = await this.getCurrentScore(organisationId);

    if (!score) {
      return null;
    }

    return {
      overall: score.overallScore,
      components: {
        cashFlow: {
          score: score.cashFlowScore,
          weight: 25,
          description: 'Cash flow and runway health',
        },
        arHealth: {
          score: score.arHealthScore,
          weight: 20,
          description: 'Accounts receivable collection',
        },
        apHealth: {
          score: score.apHealthScore,
          weight: 15,
          description: 'Accounts payable timeliness',
        },
        taxCompliance: {
          score: score.taxComplianceScore,
          weight: 15,
          description: 'Tax filing compliance',
        },
        profitability: {
          score: score.profitabilityScore,
          weight: 15,
          description: 'Profit margins',
        },
        runway: {
          score: score.runwayScore,
          weight: 10,
          description: 'Months of runway remaining',
        },
      },
      metrics: score.metrics,
      insights: score.insights,
      recommendations: score.recommendations,
      date: score.date,
    };
  }

  /**
   * Get AI-powered recommendations
   * @param organisationId Organization ID
   * @returns Recommendations
   */
  async getRecommendations(organisationId: string) {
    const score = await this.getCurrentScore(organisationId);

    if (!score) {
      return [];
    }

    return score.recommendations;
  }
}
