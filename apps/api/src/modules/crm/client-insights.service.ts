import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import {
  ClientInsightsDto,
  RevenueBreakdownDto,
  PaymentAnalyticsDto,
  InvoiceAnalyticsDto,
  ClientLifetimeValueDto,
  RiskAssessmentDto,
  SeasonalPatternsDto,
  TopPerformersDto,
  TopPerformerDto,
  AtRiskClientsDto,
  AtRiskClientDto,
  ClientTrendsDto,
  PaymentVelocityTrend,
  ClientSegment,
  ChurnRiskLevel,
  TimeRange,
} from './dto/client-insights.dto';

@Injectable()
export class ClientInsightsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // FULL CLIENT INSIGHTS
  // ============================================================================

  async getClientInsights(
    clientId: string,
    orgId: string,
    timeRange: TimeRange = TimeRange.ALL_TIME,
  ): Promise<ClientInsightsDto> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, orgId },
      include: {
        invoices: {
          orderBy: { issueDate: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const [revenue, payments, invoices, lifetimeValue, risk, seasonalPatterns] =
      await Promise.all([
        this.calculateRevenueBreakdown(clientId, orgId),
        this.calculatePaymentAnalytics(clientId, orgId),
        this.calculateInvoiceAnalytics(clientId, orgId),
        this.calculateClientLifetimeValue(clientId, orgId),
        this.calculateRiskAssessment(clientId, orgId),
        this.detectSeasonalPatterns(clientId, orgId),
      ]);

    const segment = await this.determineClientSegment(clientId, orgId);
    const opportunities = this.identifyOpportunities(
      revenue,
      payments,
      invoices,
      risk,
    );

    return {
      clientId: client.id,
      clientNumber: client.clientNumber,
      clientName: client.name,
      segment,
      revenue,
      payments,
      invoices,
      lifetimeValue,
      risk,
      seasonalPatterns,
      opportunities,
      calculatedAt: new Date(),
    };
  }

  // ============================================================================
  // REVENUE BREAKDOWN
  // ============================================================================

  async calculateRevenueBreakdown(
    clientId: string,
    orgId: string,
  ): Promise<RevenueBreakdownDto> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Get all paid invoices
    const [
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      thisYearRevenue,
      lastYearRevenue,
      last6MonthsData,
      orgTotalRevenue,
    ] = await Promise.all([
      this.sumInvoices(clientId, { status: InvoiceStatus.PAID }),
      this.sumInvoices(clientId, {
        status: InvoiceStatus.PAID,
        issueDate: { gte: thisMonthStart },
      }),
      this.sumInvoices(clientId, {
        status: InvoiceStatus.PAID,
        issueDate: { gte: lastMonthStart, lte: lastMonthEnd },
      }),
      this.sumInvoices(clientId, {
        status: InvoiceStatus.PAID,
        issueDate: { gte: thisYearStart },
      }),
      this.sumInvoices(clientId, {
        status: InvoiceStatus.PAID,
        issueDate: { gte: lastYearStart, lte: lastYearEnd },
      }),
      this.getMonthlyRevenue(clientId, sixMonthsAgo),
      this.getOrgTotalRevenue(orgId),
    ]);

    const monthOverMonthGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    const yearOverYearGrowth =
      lastYearRevenue > 0
        ? ((thisYearRevenue - lastYearRevenue) / lastYearRevenue) * 100
        : 0;

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { createdAt: true },
    });

    const monthsSinceCreation = client
      ? Math.max(
          1,
          Math.floor(
            (now.getTime() - client.createdAt.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        )
      : 1;

    const averageMonthlyRevenue = totalRevenue / monthsSinceCreation;

    const revenueContributionPercentage =
      orgTotalRevenue > 0 ? (totalRevenue / orgTotalRevenue) * 100 : 0;

    return {
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      monthOverMonthGrowth: Number(monthOverMonthGrowth.toFixed(2)),
      thisYearRevenue,
      lastYearRevenue,
      yearOverYearGrowth: Number(yearOverYearGrowth.toFixed(2)),
      averageMonthlyRevenue: Number(averageMonthlyRevenue.toFixed(2)),
      revenueContributionPercentage: Number(
        revenueContributionPercentage.toFixed(2),
      ),
      last6MonthsRevenue: last6MonthsData,
    };
  }

  // ============================================================================
  // PAYMENT ANALYTICS
  // ============================================================================

  async calculatePaymentAnalytics(
    clientId: string,
    orgId: string,
  ): Promise<PaymentAnalyticsDto> {
    const [paidInvoices, unpaidInvoices, overdueInvoices] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          clientId,
          orgId,
          status: InvoiceStatus.PAID,
          paidDate: { not: null },
        },
        select: { dueDate: true, paidDate: true, issueDate: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          clientId,
          orgId,
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.VIEWED] },
        },
        select: { totalAmount: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          clientId,
          orgId,
          status: InvoiceStatus.OVERDUE,
        },
        select: { totalAmount: true, dueDate: true },
      }),
    ]);

    const outstandingBalance = unpaidInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    // Calculate average payment days
    const paymentDelays = paidInvoices
      .filter((inv) => inv.paidDate && inv.dueDate)
      .map((inv) => {
        const paid = new Date(inv.paidDate!).getTime();
        const due = new Date(inv.dueDate).getTime();
        return (paid - due) / (1000 * 60 * 60 * 24);
      });

    const averagePaymentDays =
      paymentDelays.length > 0
        ? paymentDelays.reduce((sum, d) => sum + d, 0) / paymentDelays.length
        : 0;

    // Last 30 days payment average
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentPaymentDelays = paidInvoices
      .filter(
        (inv) =>
          inv.paidDate &&
          inv.dueDate &&
          new Date(inv.paidDate) >= thirtyDaysAgo,
      )
      .map((inv) => {
        const paid = new Date(inv.paidDate!).getTime();
        const due = new Date(inv.dueDate).getTime();
        return (paid - due) / (1000 * 60 * 60 * 24);
      });

    const averagePaymentDaysLast30Days =
      recentPaymentDelays.length > 0
        ? recentPaymentDelays.reduce((sum, d) => sum + d, 0) /
          recentPaymentDelays.length
        : averagePaymentDays;

    // Determine payment velocity trend
    let paymentVelocityTrend: PaymentVelocityTrend;
    if (recentPaymentDelays.length < 2) {
      paymentVelocityTrend = PaymentVelocityTrend.INSUFFICIENT_DATA;
    } else if (averagePaymentDaysLast30Days < averagePaymentDays - 2) {
      paymentVelocityTrend = PaymentVelocityTrend.IMPROVING;
    } else if (averagePaymentDaysLast30Days > averagePaymentDays + 2) {
      paymentVelocityTrend = PaymentVelocityTrend.DECLINING;
    } else {
      paymentVelocityTrend = PaymentVelocityTrend.STABLE;
    }

    // On-time payment rate
    const onTimePayments = paymentDelays.filter((d) => d <= 0).length;
    const onTimePaymentRate =
      paymentDelays.length > 0
        ? (onTimePayments / paymentDelays.length) * 100
        : 100;

    // Payment reliability score (0-100)
    const paymentReliabilityScore = this.calculatePaymentReliabilityScore(
      averagePaymentDays,
      onTimePaymentRate,
      overdueInvoices.length,
    );

    // Invoice paid ratio
    const totalInvoices = await this.prisma.invoice.count({
      where: { clientId, orgId },
    });
    const invoicePaidRatio =
      totalInvoices > 0 ? paidInvoices.length / totalInvoices : 0;

    // Overdue analysis
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );
    const now = new Date();
    const longestOverdueDays =
      overdueInvoices.length > 0
        ? Math.max(
            ...overdueInvoices.map(
              (inv) =>
                (now.getTime() - new Date(inv.dueDate).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 0;

    // Last payment info
    const lastPayment = paidInvoices.length > 0 ? paidInvoices[0] : null;
    const lastPaymentDate = lastPayment?.paidDate || null;
    const daysSinceLastPayment = lastPaymentDate
      ? Math.floor(
          (now.getTime() - new Date(lastPaymentDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      outstandingBalance: Number(outstandingBalance.toFixed(2)),
      averagePaymentDays: Number(averagePaymentDays.toFixed(1)),
      averagePaymentDaysLast30Days: Number(
        averagePaymentDaysLast30Days.toFixed(1),
      ),
      paymentVelocityTrend,
      paymentReliabilityScore: Number(paymentReliabilityScore.toFixed(0)),
      onTimePaymentRate: Number(onTimePaymentRate.toFixed(1)),
      invoicePaidRatio: Number(invoicePaidRatio.toFixed(2)),
      overdueInvoicesCount: overdueInvoices.length,
      overdueAmount: Number(overdueAmount.toFixed(2)),
      longestOverdueDays: Number(longestOverdueDays.toFixed(0)),
      lastPaymentDate,
      daysSinceLastPayment,
    };
  }

  // ============================================================================
  // INVOICE ANALYTICS
  // ============================================================================

  async calculateInvoiceAnalytics(
    clientId: string,
    orgId: string,
  ): Promise<InvoiceAnalyticsDto> {
    const [allInvoices, client] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { clientId, orgId },
        select: {
          status: true,
          totalAmount: true,
          issueDate: true,
        },
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.client.findUnique({
        where: { id: clientId },
        select: { createdAt: true },
      }),
    ]);

    const totalInvoices = allInvoices.length;
    const paidInvoices = allInvoices.filter(
      (inv) => inv.status === InvoiceStatus.PAID,
    ).length;
    const pendingInvoices = allInvoices.filter((inv) =>
      [InvoiceStatus.SENT, InvoiceStatus.VIEWED].includes(inv.status),
    ).length;
    const overdueInvoices = allInvoices.filter(
      (inv) => inv.status === InvoiceStatus.OVERDUE,
    ).length;

    const totalAmount = allInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );
    const averageInvoiceAmount =
      totalInvoices > 0 ? totalAmount / totalInvoices : 0;

    const now = new Date();
    const monthsSinceCreation = client
      ? Math.max(
          1,
          Math.floor(
            (now.getTime() - client.createdAt.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        )
      : 1;
    const invoicesPerMonth = totalInvoices / monthsSinceCreation;

    const lastInvoice = allInvoices.length > 0 ? allInvoices[0] : null;
    const lastInvoiceDate = lastInvoice?.issueDate || null;
    const daysSinceLastInvoice = lastInvoiceDate
      ? Math.floor(
          (now.getTime() - new Date(lastInvoiceDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    // Last 6 months invoice count
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const last6MonthsInvoiceCount = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = allInvoices.filter((inv) => {
        const issueDate = new Date(inv.issueDate);
        return issueDate >= monthStart && issueDate <= monthEnd;
      }).length;
      last6MonthsInvoiceCount.push(count);
    }

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      averageInvoiceAmount: Number(averageInvoiceAmount.toFixed(2)),
      invoicesPerMonth: Number(invoicesPerMonth.toFixed(1)),
      lastInvoiceDate,
      daysSinceLastInvoice,
      last6MonthsInvoiceCount,
    };
  }

  // ============================================================================
  // CLIENT LIFETIME VALUE
  // ============================================================================

  async calculateClientLifetimeValue(
    clientId: string,
    orgId: string,
  ): Promise<ClientLifetimeValueDto> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        createdAt: true,
        totalRevenue: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const now = new Date();
    const customerAgeMonths = Math.max(
      1,
      Math.floor(
        (now.getTime() - client.createdAt.getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      ),
    );

    const currentLifetimeValue = Number(client.totalRevenue);
    const averageMonthlyValue = currentLifetimeValue / customerAgeMonths;

    // Get monthly revenue for growth calculation
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenues = await this.getMonthlyRevenue(
      clientId,
      sixMonthsAgo,
    );

    // Calculate growth rate (simple linear regression would be better)
    let revenueGrowthRate = 0;
    if (monthlyRevenues.length >= 3) {
      const recentAvg =
        monthlyRevenues.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
      const olderAvg =
        monthlyRevenues.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
      if (olderAvg > 0) {
        revenueGrowthRate = ((recentAvg - olderAvg) / olderAvg) * 100;
      }
    }

    // Project lifetime (assuming 3-year average retention)
    const projectedLifetimeMonths = 36;
    const remainingMonths = Math.max(0, projectedLifetimeMonths - customerAgeMonths);

    // Simple projection: current CLV + (average monthly * remaining months * growth factor)
    const growthFactor = 1 + revenueGrowthRate / 100;
    const projectedLifetimeValue =
      currentLifetimeValue + averageMonthlyValue * remainingMonths * growthFactor;

    // Determine value segment based on average monthly value
    let valueSegment = 'Low';
    if (averageMonthlyValue > 10000) valueSegment = 'High';
    else if (averageMonthlyValue > 5000) valueSegment = 'Medium';

    return {
      currentLifetimeValue: Number(currentLifetimeValue.toFixed(2)),
      projectedLifetimeValue: Number(projectedLifetimeValue.toFixed(2)),
      averageMonthlyValue: Number(averageMonthlyValue.toFixed(2)),
      customerAgeMonths,
      projectedLifetimeMonths,
      valueSegment,
      revenueGrowthRate: Number(revenueGrowthRate.toFixed(1)),
    };
  }

  // ============================================================================
  // RISK ASSESSMENT
  // ============================================================================

  async calculateRiskAssessment(
    clientId: string,
    orgId: string,
  ): Promise<RiskAssessmentDto> {
    const [client, payments, invoices, communications] = await Promise.all([
      this.prisma.client.findUnique({
        where: { id: clientId },
        select: {
          createdAt: true,
          lastPaymentDate: true,
          lastInvoiceDate: true,
          averagePaymentDays: true,
        },
      }),
      this.calculatePaymentAnalytics(clientId, orgId),
      this.calculateInvoiceAnalytics(clientId, orgId),
      this.prisma.clientCommunication.findMany({
        where: { clientId },
        orderBy: { occurredAt: 'desc' },
        take: 1,
      }),
    ]);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    let churnRiskScore = 0;
    const riskFactors: string[] = [];
    const positiveIndicators: string[] = [];

    const now = new Date();

    // Factor 1: Payment behavior (0-30 points)
    if (payments.averagePaymentDays > 45) {
      churnRiskScore += 20;
      riskFactors.push(`Slow payment (avg ${payments.averagePaymentDays.toFixed(0)} days)`);
    } else if (payments.averagePaymentDays > 30) {
      churnRiskScore += 10;
      riskFactors.push('Moderate payment delays');
    } else if (payments.averagePaymentDays < 15) {
      positiveIndicators.push('Fast payer');
    }

    // Factor 2: Overdue invoices (0-20 points)
    if (payments.overdueInvoicesCount > 2) {
      churnRiskScore += 20;
      riskFactors.push(`${payments.overdueInvoicesCount} overdue invoices`);
    } else if (payments.overdueInvoicesCount > 0) {
      churnRiskScore += 10;
      riskFactors.push('Has overdue invoices');
    } else {
      positiveIndicators.push('No overdue invoices');
    }

    // Factor 3: Payment velocity trend (0-15 points)
    if (payments.paymentVelocityTrend === PaymentVelocityTrend.DECLINING) {
      churnRiskScore += 15;
      riskFactors.push('Declining payment speed');
    } else if (payments.paymentVelocityTrend === PaymentVelocityTrend.IMPROVING) {
      positiveIndicators.push('Improving payment speed');
    }

    // Factor 4: Invoice frequency (0-15 points)
    const daysSinceLastInvoice = client.lastInvoiceDate
      ? Math.floor(
          (now.getTime() - new Date(client.lastInvoiceDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 999;

    if (daysSinceLastInvoice > 90) {
      churnRiskScore += 15;
      riskFactors.push('No recent invoices (90+ days)');
    } else if (daysSinceLastInvoice > 60) {
      churnRiskScore += 8;
      riskFactors.push('Low invoice frequency');
    } else if (invoices.invoicesPerMonth > 4) {
      positiveIndicators.push('High engagement (frequent invoices)');
    }

    // Factor 5: Communication activity (0-10 points)
    const lastCommunication = communications[0];
    const daysSinceLastCommunication = lastCommunication
      ? Math.floor(
          (now.getTime() - new Date(lastCommunication.occurredAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 999;

    if (daysSinceLastCommunication > 90) {
      churnRiskScore += 10;
      riskFactors.push('No communication in 90+ days');
    } else if (daysSinceLastCommunication < 30) {
      positiveIndicators.push('Recent communication');
    }

    // Factor 6: Outstanding balance (0-10 points)
    if (payments.outstandingBalance > 20000) {
      churnRiskScore += 10;
      riskFactors.push(`High outstanding balance ($${payments.outstandingBalance.toFixed(0)})`);
    } else if (payments.outstandingBalance === 0) {
      positiveIndicators.push('No outstanding balance');
    }

    // Engagement score (inverse of risk, 0-100)
    const engagementScore = Math.max(0, 100 - churnRiskScore);

    // Days since last activity
    const daysSinceLastActivity = Math.min(
      daysSinceLastInvoice,
      daysSinceLastCommunication,
      payments.daysSinceLastPayment || 999,
    );

    // Determine churn risk level
    let churnRisk: ChurnRiskLevel;
    if (churnRiskScore >= 80) churnRisk = ChurnRiskLevel.CRITICAL;
    else if (churnRiskScore >= 60) churnRisk = ChurnRiskLevel.HIGH;
    else if (churnRiskScore >= 40) churnRisk = ChurnRiskLevel.MEDIUM;
    else churnRisk = ChurnRiskLevel.LOW;

    const isAtRisk = churnRiskScore >= 40;

    // Recommended action
    let recommendedAction: string | null = null;
    if (churnRiskScore >= 80) {
      recommendedAction = 'Urgent: Contact immediately to address concerns';
    } else if (churnRiskScore >= 60) {
      recommendedAction = 'Schedule call to discuss satisfaction and upcoming needs';
    } else if (churnRiskScore >= 40) {
      recommendedAction = 'Send check-in email or schedule review meeting';
    }

    return {
      churnRisk,
      churnRiskScore: Number(churnRiskScore.toFixed(1)),
      riskFactors,
      positiveIndicators,
      engagementScore,
      daysSinceLastActivity,
      isAtRisk,
      recommendedAction,
    };
  }

  // ============================================================================
  // SEASONAL PATTERNS
  // ============================================================================

  async detectSeasonalPatterns(
    clientId: string,
    orgId: string,
  ): Promise<SeasonalPatternsDto> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        clientId,
        orgId,
        status: InvoiceStatus.PAID,
      },
      select: {
        totalAmount: true,
        issueDate: true,
      },
    });

    if (invoices.length < 12) {
      // Not enough data for pattern detection
      return {
        hasSeasonalPattern: false,
        peakPeriods: [],
        lowPeriods: [],
        quarterlyRevenue: {},
        monthlyRevenue: {},
      };
    }

    // Group by quarter
    const quarterlyRevenue: Record<string, number> = {
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
    };

    // Group by month
    const monthlyRevenue: Record<string, number> = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    invoices.forEach((invoice) => {
      const date = new Date(invoice.issueDate);
      const month = date.getMonth();
      const quarter = Math.floor(month / 3) + 1;
      const amount = Number(invoice.totalAmount);

      quarterlyRevenue[`Q${quarter}`] += amount;
      monthlyRevenue[monthNames[month]] += amount;
    });

    // Detect patterns
    const quarterValues = Object.values(quarterlyRevenue);
    const avgQuarterRevenue = quarterValues.reduce((sum, val) => sum + val, 0) / 4;
    const quarterVariance = quarterValues.reduce(
      (sum, val) => sum + Math.pow(val - avgQuarterRevenue, 2),
      0,
    ) / 4;
    const quarterStdDev = Math.sqrt(quarterVariance);

    // Significant pattern if std dev is > 20% of mean
    const hasSeasonalPattern = quarterStdDev > avgQuarterRevenue * 0.2;

    const peakPeriods: string[] = [];
    const lowPeriods: string[] = [];

    if (hasSeasonalPattern) {
      Object.entries(quarterlyRevenue).forEach(([quarter, revenue]) => {
        if (revenue > avgQuarterRevenue + quarterStdDev * 0.5) {
          peakPeriods.push(quarter);
        } else if (revenue < avgQuarterRevenue - quarterStdDev * 0.5) {
          lowPeriods.push(quarter);
        }
      });
    }

    return {
      hasSeasonalPattern,
      peakPeriods,
      lowPeriods,
      quarterlyRevenue: Object.fromEntries(
        Object.entries(quarterlyRevenue).map(([k, v]) => [k, Number(v.toFixed(2))]),
      ),
      monthlyRevenue: Object.fromEntries(
        Object.entries(monthlyRevenue).map(([k, v]) => [k, Number(v.toFixed(2))]),
      ),
    };
  }

  // ============================================================================
  // TOP PERFORMERS
  // ============================================================================

  async getTopPerformers(
    orgId: string,
    limit = 10,
  ): Promise<TopPerformersDto> {
    const [topByRevenue, topByGrowth, topByReliability, topByLTV] =
      await Promise.all([
        this.getTopByRevenue(orgId, limit),
        this.getTopByGrowth(orgId, limit),
        this.getTopByReliability(orgId, limit),
        this.getTopByLifetimeValue(orgId, limit),
      ]);

    return {
      topByRevenue,
      topByGrowth,
      topByReliability,
      topByLifetimeValue: topByLTV,
    };
  }

  private async getTopByRevenue(
    orgId: string,
    limit: number,
  ): Promise<TopPerformerDto[]> {
    const clients = await this.prisma.client.findMany({
      where: { orgId, isActive: true },
      orderBy: { totalRevenue: 'desc' },
      take: limit,
      select: {
        id: true,
        clientNumber: true,
        name: true,
        totalRevenue: true,
        createdAt: true,
        averagePaymentDays: true,
      },
    });

    const orgTotalRevenue = await this.getOrgTotalRevenue(orgId);

    return Promise.all(
      clients.map(async (client) => {
        const now = new Date();
        const customerAgeMonths = Math.max(
          1,
          Math.floor(
            (now.getTime() - client.createdAt.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        );

        const segment = await this.determineClientSegment(client.id, orgId);
        const payments = await this.calculatePaymentAnalytics(client.id, orgId);

        return {
          clientId: client.id,
          clientNumber: client.clientNumber,
          clientName: client.name,
          totalRevenue: Number(client.totalRevenue),
          revenueContributionPercentage: Number(
            ((Number(client.totalRevenue) / orgTotalRevenue) * 100).toFixed(2),
          ),
          customerAgeMonths,
          paymentReliabilityScore: payments.paymentReliabilityScore,
          segment,
        };
      }),
    );
  }

  private async getTopByGrowth(
    orgId: string,
    limit: number,
  ): Promise<TopPerformerDto[]> {
    const clients = await this.prisma.client.findMany({
      where: { orgId, isActive: true },
      select: {
        id: true,
        clientNumber: true,
        name: true,
        totalRevenue: true,
        createdAt: true,
      },
    });

    // Calculate growth for each client
    const clientsWithGrowth = await Promise.all(
      clients.map(async (client) => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyRevenues = await this.getMonthlyRevenue(
          client.id,
          sixMonthsAgo,
        );

        let growthRate = 0;
        if (monthlyRevenues.length >= 3) {
          const recentAvg =
            monthlyRevenues.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
          const olderAvg =
            monthlyRevenues.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
          if (olderAvg > 0) {
            growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;
          }
        }

        return { ...client, growthRate };
      }),
    );

    // Sort by growth rate and take top N
    const topClients = clientsWithGrowth
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, limit);

    const orgTotalRevenue = await this.getOrgTotalRevenue(orgId);

    return Promise.all(
      topClients.map(async (client) => {
        const now = new Date();
        const customerAgeMonths = Math.max(
          1,
          Math.floor(
            (now.getTime() - client.createdAt.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        );

        const segment = await this.determineClientSegment(client.id, orgId);
        const payments = await this.calculatePaymentAnalytics(client.id, orgId);

        return {
          clientId: client.id,
          clientNumber: client.clientNumber,
          clientName: client.name,
          totalRevenue: Number(client.totalRevenue),
          revenueContributionPercentage: Number(
            ((Number(client.totalRevenue) / orgTotalRevenue) * 100).toFixed(2),
          ),
          customerAgeMonths,
          paymentReliabilityScore: payments.paymentReliabilityScore,
          segment,
        };
      }),
    );
  }

  private async getTopByReliability(
    orgId: string,
    limit: number,
  ): Promise<TopPerformerDto[]> {
    const clients = await this.prisma.client.findMany({
      where: { orgId, isActive: true },
      select: {
        id: true,
        clientNumber: true,
        name: true,
        totalRevenue: true,
        createdAt: true,
        totalInvoices: true,
      },
    });

    // Filter clients with at least 3 invoices
    const eligibleClients = clients.filter((c) => c.totalInvoices >= 3);

    // Calculate reliability for each client
    const clientsWithReliability = await Promise.all(
      eligibleClients.map(async (client) => {
        const payments = await this.calculatePaymentAnalytics(client.id, orgId);
        return { ...client, reliabilityScore: payments.paymentReliabilityScore };
      }),
    );

    // Sort by reliability score and take top N
    const topClients = clientsWithReliability
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
      .slice(0, limit);

    const orgTotalRevenue = await this.getOrgTotalRevenue(orgId);

    return Promise.all(
      topClients.map(async (client) => {
        const now = new Date();
        const customerAgeMonths = Math.max(
          1,
          Math.floor(
            (now.getTime() - client.createdAt.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        );

        const segment = await this.determineClientSegment(client.id, orgId);

        return {
          clientId: client.id,
          clientNumber: client.clientNumber,
          clientName: client.name,
          totalRevenue: Number(client.totalRevenue),
          revenueContributionPercentage: Number(
            ((Number(client.totalRevenue) / orgTotalRevenue) * 100).toFixed(2),
          ),
          customerAgeMonths,
          paymentReliabilityScore: client.reliabilityScore,
          segment,
        };
      }),
    );
  }

  private async getTopByLifetimeValue(
    orgId: string,
    limit: number,
  ): Promise<TopPerformerDto[]> {
    const clients = await this.prisma.client.findMany({
      where: { orgId, isActive: true },
      select: {
        id: true,
        clientNumber: true,
        name: true,
        totalRevenue: true,
        createdAt: true,
      },
    });

    // Calculate LTV for each client
    const clientsWithLTV = await Promise.all(
      clients.map(async (client) => {
        const ltv = await this.calculateClientLifetimeValue(client.id, orgId);
        return { ...client, projectedLTV: ltv.projectedLifetimeValue };
      }),
    );

    // Sort by projected LTV and take top N
    const topClients = clientsWithLTV
      .sort((a, b) => b.projectedLTV - a.projectedLTV)
      .slice(0, limit);

    const orgTotalRevenue = await this.getOrgTotalRevenue(orgId);

    return Promise.all(
      topClients.map(async (client) => {
        const now = new Date();
        const customerAgeMonths = Math.max(
          1,
          Math.floor(
            (now.getTime() - client.createdAt.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        );

        const segment = await this.determineClientSegment(client.id, orgId);
        const payments = await this.calculatePaymentAnalytics(client.id, orgId);

        return {
          clientId: client.id,
          clientNumber: client.clientNumber,
          clientName: client.name,
          totalRevenue: Number(client.totalRevenue),
          revenueContributionPercentage: Number(
            ((Number(client.totalRevenue) / orgTotalRevenue) * 100).toFixed(2),
          ),
          customerAgeMonths,
          paymentReliabilityScore: payments.paymentReliabilityScore,
          segment,
        };
      }),
    );
  }

  // ============================================================================
  // AT-RISK CLIENTS
  // ============================================================================

  async getAtRiskClients(
    orgId: string,
    limit = 20,
    minRiskLevel?: ChurnRiskLevel,
  ): Promise<AtRiskClientsDto> {
    const clients = await this.prisma.client.findMany({
      where: { orgId, isActive: true },
      select: {
        id: true,
        clientNumber: true,
        name: true,
        totalRevenue: true,
      },
    });

    // Calculate risk for each client
    const clientsWithRisk = await Promise.all(
      clients.map(async (client) => {
        const [risk, payments] = await Promise.all([
          this.calculateRiskAssessment(client.id, orgId),
          this.calculatePaymentAnalytics(client.id, orgId),
        ]);

        return {
          clientId: client.id,
          clientNumber: client.clientNumber,
          clientName: client.name,
          churnRiskScore: risk.churnRiskScore,
          churnRisk: risk.churnRisk,
          riskFactors: risk.riskFactors,
          recommendedAction: risk.recommendedAction || 'Monitor',
          totalRevenue: Number(client.totalRevenue),
          outstandingBalance: payments.outstandingBalance,
          daysSinceLastActivity: risk.daysSinceLastActivity,
        };
      }),
    );

    // Filter by minimum risk level if specified
    let filteredClients = clientsWithRisk;
    if (minRiskLevel) {
      const riskLevelOrder = {
        [ChurnRiskLevel.LOW]: 0,
        [ChurnRiskLevel.MEDIUM]: 1,
        [ChurnRiskLevel.HIGH]: 2,
        [ChurnRiskLevel.CRITICAL]: 3,
      };
      const minOrder = riskLevelOrder[minRiskLevel];
      filteredClients = clientsWithRisk.filter(
        (c) => riskLevelOrder[c.churnRisk] >= minOrder,
      );
    }

    // Sort by risk score and take top N
    const sortedClients = filteredClients
      .sort((a, b) => b.churnRiskScore - a.churnRiskScore)
      .slice(0, limit);

    // Separate by risk level
    const criticalRisk = sortedClients.filter(
      (c) => c.churnRisk === ChurnRiskLevel.CRITICAL,
    );
    const highRisk = sortedClients.filter(
      (c) => c.churnRisk === ChurnRiskLevel.HIGH,
    );
    const mediumRisk = sortedClients.filter(
      (c) => c.churnRisk === ChurnRiskLevel.MEDIUM,
    );

    const totalAtRisk = sortedClients.length;
    const totalRevenueAtRisk = sortedClients.reduce(
      (sum, c) => sum + c.totalRevenue,
      0,
    );

    return {
      criticalRisk,
      highRisk,
      mediumRisk,
      totalAtRisk,
      totalRevenueAtRisk: Number(totalRevenueAtRisk.toFixed(2)),
    };
  }

  // ============================================================================
  // OVERALL TRENDS
  // ============================================================================

  async getClientTrends(orgId: string): Promise<ClientTrendsDto> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      allClients,
      newClients,
      churnedClients,
      monthlyRevenues,
      segmentCounts,
    ] = await Promise.all([
      this.prisma.client.findMany({
        where: { orgId, isActive: true },
        select: {
          id: true,
          createdAt: true,
          averagePaymentDays: true,
        },
      }),
      this.prisma.client.count({
        where: {
          orgId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.client.count({
        where: {
          orgId,
          updatedAt: { gte: thirtyDaysAgo },
          isActive: false,
        },
      }),
      this.getOrgMonthlyRevenue(orgId, sixMonthsAgo),
      this.getClientsBySegment(orgId),
    ]);

    // Calculate average revenue growth
    let averageRevenueGrowth = 0;
    if (monthlyRevenues.length >= 3) {
      const recentAvg =
        monthlyRevenues.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
      const olderAvg =
        monthlyRevenues.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
      if (olderAvg > 0) {
        averageRevenueGrowth = ((recentAvg - olderAvg) / olderAvg) * 100;
      }
    }

    // Calculate average payment days
    const clientsWithPaymentDays = allClients.filter(
      (c) => c.averagePaymentDays !== null,
    );
    const averagePaymentDays =
      clientsWithPaymentDays.length > 0
        ? clientsWithPaymentDays.reduce(
            (sum, c) => sum + Number(c.averagePaymentDays),
            0,
          ) / clientsWithPaymentDays.length
        : 0;

    // Get average payment reliability
    const reliabilityScores = await Promise.all(
      allClients.slice(0, 50).map(async (client) => {
        const payments = await this.calculatePaymentAnalytics(client.id, orgId);
        return payments.paymentReliabilityScore;
      }),
    );
    const averagePaymentReliability =
      reliabilityScores.length > 0
        ? reliabilityScores.reduce((sum, val) => sum + val, 0) /
          reliabilityScores.length
        : 0;

    // Count at-risk clients
    const atRiskData = await this.getAtRiskClients(orgId, 100);
    const clientsAtRiskCount = atRiskData.totalAtRisk;

    // Calculate churn rate
    const totalClients = allClients.length + churnedClients;
    const churnRate =
      totalClients > 0 ? (churnedClients / totalClients) * 100 : 0;

    // Get last 6 months average payment days
    const last6MonthsAveragePaymentDays = new Array(6).fill(averagePaymentDays);

    return {
      averageRevenueGrowth: Number(averageRevenueGrowth.toFixed(1)),
      averagePaymentDays: Number(averagePaymentDays.toFixed(1)),
      averagePaymentReliability: Number(averagePaymentReliability.toFixed(1)),
      clientsAtRiskCount,
      churnRate: Number(churnRate.toFixed(1)),
      newClientsLast30Days: newClients,
      churnedClientsLast30Days: churnedClients,
      last6MonthsTotalRevenue: monthlyRevenues,
      last6MonthsAveragePaymentDays,
      clientsBySegment: segmentCounts,
      calculatedAt: now,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async sumInvoices(
    clientId: string,
    where: any,
  ): Promise<number> {
    const result = await this.prisma.invoice.aggregate({
      where: {
        clientId,
        ...where,
      },
      _sum: {
        totalAmount: true,
      },
    });

    return Number(result._sum.totalAmount || 0);
  }

  private async getMonthlyRevenue(
    clientId: string,
    startDate: Date,
  ): Promise<number[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        clientId,
        status: InvoiceStatus.PAID,
        issueDate: { gte: startDate },
      },
      select: {
        totalAmount: true,
        issueDate: true,
      },
    });

    const now = new Date();
    const monthlyData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTotal = invoices
        .filter((inv) => {
          const issueDate = new Date(inv.issueDate);
          return issueDate >= monthStart && issueDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

      monthlyData.push(Number(monthTotal.toFixed(2)));
    }

    return monthlyData;
  }

  private async getOrgMonthlyRevenue(
    orgId: string,
    startDate: Date,
  ): Promise<number[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId,
        status: InvoiceStatus.PAID,
        issueDate: { gte: startDate },
      },
      select: {
        totalAmount: true,
        issueDate: true,
      },
    });

    const now = new Date();
    const monthlyData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTotal = invoices
        .filter((inv) => {
          const issueDate = new Date(inv.issueDate);
          return issueDate >= monthStart && issueDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

      monthlyData.push(Number(monthTotal.toFixed(2)));
    }

    return monthlyData;
  }

  private async getOrgTotalRevenue(orgId: string): Promise<number> {
    const result = await this.prisma.invoice.aggregate({
      where: {
        orgId,
        status: InvoiceStatus.PAID,
      },
      _sum: {
        totalAmount: true,
      },
    });

    return Number(result._sum.totalAmount || 1); // Return 1 to avoid division by zero
  }

  private async determineClientSegment(
    clientId: string,
    orgId: string,
  ): Promise<ClientSegment> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { totalRevenue: true, createdAt: true },
    });

    if (!client) return ClientSegment.NEW;

    const now = new Date();
    const monthsSinceCreation = Math.floor(
      (now.getTime() - client.createdAt.getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    );

    // New clients (less than 3 months)
    if (monthsSinceCreation < 3) {
      return ClientSegment.NEW;
    }

    // Get all clients by revenue to determine percentiles
    const allClients = await this.prisma.client.findMany({
      where: { orgId, isActive: true },
      select: { totalRevenue: true },
      orderBy: { totalRevenue: 'desc' },
    });

    const clientRevenue = Number(client.totalRevenue);
    const clientRank =
      allClients.findIndex((c) => Number(c.totalRevenue) <= clientRevenue) + 1;
    const percentile = (clientRank / allClients.length) * 100;

    if (percentile <= 20) return ClientSegment.ENTERPRISE;
    if (percentile <= 50) return ClientSegment.MID_MARKET;
    return ClientSegment.SMB;
  }

  private async getClientsBySegment(
    orgId: string,
  ): Promise<Record<ClientSegment, number>> {
    const clients = await this.prisma.client.findMany({
      where: { orgId, isActive: true },
      select: { id: true },
    });

    const segmentCounts: Record<ClientSegment, number> = {
      [ClientSegment.ENTERPRISE]: 0,
      [ClientSegment.MID_MARKET]: 0,
      [ClientSegment.SMB]: 0,
      [ClientSegment.NEW]: 0,
    };

    await Promise.all(
      clients.map(async (client) => {
        const segment = await this.determineClientSegment(client.id, orgId);
        segmentCounts[segment]++;
      }),
    );

    return segmentCounts;
  }

  private calculatePaymentReliabilityScore(
    averagePaymentDays: number,
    onTimePaymentRate: number,
    overdueCount: number,
  ): number {
    let score = 100;

    // Deduct for average payment days
    if (averagePaymentDays > 45) score -= 30;
    else if (averagePaymentDays > 30) score -= 20;
    else if (averagePaymentDays > 15) score -= 10;
    else if (averagePaymentDays > 0) score -= 5;

    // Deduct for on-time payment rate
    score -= (100 - onTimePaymentRate) * 0.3;

    // Deduct for overdue invoices
    if (overdueCount > 3) score -= 20;
    else if (overdueCount > 1) score -= 10;
    else if (overdueCount > 0) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private identifyOpportunities(
    revenue: RevenueBreakdownDto,
    payments: PaymentAnalyticsDto,
    invoices: InvoiceAnalyticsDto,
    risk: RiskAssessmentDto,
  ): string[] {
    const opportunities: string[] = [];

    // Upsell opportunities
    if (revenue.monthOverMonthGrowth > 10) {
      opportunities.push('upsell_opportunity');
    }

    // Payment terms negotiation
    if (
      payments.paymentReliabilityScore > 90 &&
      payments.averagePaymentDays < 15
    ) {
      opportunities.push('payment_terms_negotiation');
    }

    // Volume discount
    if (invoices.invoicesPerMonth > 8) {
      opportunities.push('volume_discount_eligible');
    }

    // Contract renewal
    if (!risk.isAtRisk && revenue.totalRevenue > 50000) {
      opportunities.push('long_term_contract_opportunity');
    }

    // Cross-sell
    if (
      revenue.revenueContributionPercentage > 5 &&
      invoices.averageInvoiceAmount > 5000
    ) {
      opportunities.push('cross_sell_opportunity');
    }

    // Annual prepayment discount
    if (payments.paymentReliabilityScore > 85) {
      opportunities.push('annual_prepayment_eligible');
    }

    return opportunities;
  }

  // ============================================================================
  // BATCH RECALCULATION
  // ============================================================================

  async recalculateAllInsights(orgId: string): Promise<{ processed: number }> {
    const clients = await this.prisma.client.findMany({
      where: { orgId, isActive: true },
      select: { id: true },
    });

    let processed = 0;

    for (const client of clients) {
      try {
        await this.getClientInsights(client.id, orgId);
        processed++;
      } catch (error) {
        console.error(
          `Failed to calculate insights for client ${client.id}:`,
          error,
        );
      }
    }

    return { processed };
  }
}
