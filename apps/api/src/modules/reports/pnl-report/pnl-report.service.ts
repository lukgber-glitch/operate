/**
 * P&L Report Service
 * Specialized Profit & Loss Statement Generator
 *
 * Provides comprehensive P&L reporting with:
 * - Full P&L statement generation with all sections
 * - Comparative multi-period analysis
 * - Department and project-level P&L
 * - Budget variance analysis
 * - Margin analysis (gross, operating, net, EBITDA)
 * - Trend analysis with seasonality detection
 * - Financial forecasting
 * - Break-even analysis
 * - Contribution margin analysis
 *
 * @module PnlReportService
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { ReportGeneratorService } from '../report-generator/report-generator.service';
import {
  PnlFilterDto,
  PnlOptionsDto,
  PnlReportDto,
  ComparativePnlDto,
  ComparativePnlReportDto,
  BudgetVarianceDto,
  BudgetVarianceReportDto,
  PnlSectionDto,
  PnlLineItemDto,
  MarginAnalysisDto,
  BreakEvenAnalysisDto,
  TrendAnalysisDto,
  TrendDataPointDto,
  ForecastDto,
  PnlAnalysisType,
  PnlGroupingType,
  PnlPeriodType,
} from './dto/pnl-report.dto';
import { Decimal } from '@prisma/client/runtime/library';

interface PeriodData {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  date: Date;
}

interface RevenueBreakdown {
  category: string;
  amount: number;
  count: number;
  percentOfTotal: number;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  count: number;
  percentOfTotal: number;
  isCogs: boolean;
}

@Injectable()
export class PnlReportService {
  private readonly logger = new Logger(PnlReportService.name);
  private readonly CACHE_TTL = 1800; // 30 minutes
  private readonly FORECAST_CONFIDENCE_THRESHOLD = 0.75;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly reportGenerator: ReportGeneratorService,
  ) {}

  /**
   * Generate comprehensive P&L statement
   * Main entry point for standard P&L generation
   */
  async generateFullPnlStatement(
    organisationId: string,
    filters: PnlFilterDto,
    options?: PnlOptionsDto,
  ): Promise<PnlReportDto> {
    this.logger.log(`Generating full P&L statement for org ${organisationId}`);

    // Parse date range
    const { startDate, endDate } = this.parseDateRange(filters);
    const currency = filters.currency || 'EUR';
    const analysisType = options?.analysisType || PnlAnalysisType.STANDARD;

    // Check cache
    const cacheKey = this.buildCacheKey('pnl-full', organisationId, filters, options);
    const cached = await this.getCached<PnlReportDto>(cacheKey);
    if (cached) {
      this.logger.log('Returning cached P&L report');
      return cached;
    }

    // Fetch revenue data
    const revenueData = await this.fetchRevenueData(
      organisationId,
      startDate,
      endDate,
      filters,
      options,
    );

    // Fetch COGS data
    const cogsData = await this.fetchCogsData(
      organisationId,
      startDate,
      endDate,
      filters,
      options,
    );

    // Fetch operating expenses
    const opexData = await this.fetchOperatingExpenses(
      organisationId,
      startDate,
      endDate,
      filters,
      options,
    );

    // Fetch other income/expenses
    const otherData = await this.fetchOtherIncomeExpenses(
      organisationId,
      startDate,
      endDate,
      filters,
    );

    // Calculate summary metrics
    const totalRevenue = revenueData.total;
    const totalCogs = cogsData.total;
    const grossProfit = this.calculateGrossProfit(totalRevenue, totalCogs);
    const totalOpex = opexData.total;
    const ebitda = grossProfit - totalOpex;

    // Depreciation and amortization (from specific expense categories)
    const depreciation = opexData.items.find((i) => i.label === 'DEPRECIATION')?.value || 0;
    const amortization = opexData.items.find((i) => i.label === 'AMORTIZATION')?.value || 0;

    const operatingIncome = this.calculateOperatingIncome(grossProfit, totalOpex);
    const ebitdaCalc = this.calculateEbitda(operatingIncome, depreciation, amortization);

    const interestIncome = otherData.interestIncome;
    const interestExpense = otherData.interestExpense;
    const otherIncome = otherData.otherIncome;
    const otherExpenses = otherData.otherExpenses;

    const preTaxIncome = operatingIncome + interestIncome - interestExpense + otherIncome - otherExpenses;

    // Tax expense (simplified - would calculate from tax rate in production)
    const taxExpense = await this.calculateTaxExpense(
      organisationId,
      preTaxIncome,
      startDate,
      endDate,
    );

    const netIncome = this.calculateNetIncome(ebitdaCalc, interestExpense, taxExpense);

    // Build sections
    const revenueSection = this.buildRevenueSection(revenueData, currency, totalRevenue);
    const cogsSection = this.buildCogsSection(cogsData, currency, totalRevenue);
    const opexSection = this.buildOpexSection(opexData, currency, totalRevenue);
    const otherSection = this.buildOtherSection(otherData, currency, totalRevenue);

    // Build report
    const report: PnlReportDto = {
      metadata: {
        organisationId,
        generatedAt: new Date().toISOString(),
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        currency,
        analysisType,
        reportVersion: '2.0',
      },
      summary: {
        totalRevenue,
        totalCogs,
        grossProfit,
        totalOperatingExpenses: totalOpex,
        ebitda: ebitdaCalc,
        depreciation,
        amortization,
        operatingIncome,
        interestIncome,
        interestExpense,
        otherIncome,
        otherExpenses,
        preTaxIncome,
        taxExpense,
        netIncome,
      },
      revenue: revenueSection,
      cogs: cogsSection,
      grossProfit: {
        amount: grossProfit,
        formattedAmount: this.formatCurrency(grossProfit, currency),
        margin: this.calculateMarginPercent(grossProfit, totalRevenue),
      },
      operatingExpenses: opexSection,
      ebitda: {
        amount: ebitdaCalc,
        formattedAmount: this.formatCurrency(ebitdaCalc, currency),
        margin: this.calculateMarginPercent(ebitdaCalc, totalRevenue),
      },
      operatingIncome: {
        amount: operatingIncome,
        formattedAmount: this.formatCurrency(operatingIncome, currency),
        margin: this.calculateMarginPercent(operatingIncome, totalRevenue),
      },
      otherIncomeExpenses: otherSection,
      netIncome: {
        amount: netIncome,
        formattedAmount: this.formatCurrency(netIncome, currency),
        margin: this.calculateMarginPercent(netIncome, totalRevenue),
      },
    };

    // Add margin analysis if requested
    if (options?.includeMargins) {
      report.marginAnalysis = await this.analyzeMargins(
        organisationId,
        report.summary,
        startDate,
        endDate,
        currency,
      );
    }

    // Add trend analysis if requested
    if (options?.includeTrends) {
      const trendPeriods = options.trendPeriods || 12;
      report.trends = await this.identifyTrends(
        organisationId,
        startDate,
        endDate,
        trendPeriods,
        currency,
      );
    }

    // Add forecast if requested
    if (options?.includeForecast && report.trends) {
      report.forecast = await this.forecastNextPeriod(report.trends, currency);
    }

    // Add break-even analysis
    report.breakEvenAnalysis = this.calculateBreakEven(
      totalRevenue,
      totalCogs,
      totalOpex,
      currency,
    );

    // Apply vertical/horizontal analysis if requested
    if (analysisType === PnlAnalysisType.VERTICAL) {
      this.applyVerticalAnalysis(report);
    } else if (analysisType === PnlAnalysisType.HORIZONTAL) {
      await this.applyHorizontalAnalysis(report, organisationId, startDate, endDate);
    }

    // Cache the report
    await this.setCached(cacheKey, report, this.CACHE_TTL);

    this.logger.log('P&L statement generated successfully');
    return report;
  }

  /**
   * Generate comparative P&L across multiple periods
   * Supports side-by-side comparison with variance analysis
   */
  async generateComparativePnl(
    organisationId: string,
    params: ComparativePnlDto,
  ): Promise<ComparativePnlReportDto> {
    this.logger.log(`Generating comparative P&L for ${params.periods.length} periods`);

    if (params.periods.length < 2 || params.periods.length > 12) {
      throw new BadRequestException('Comparative P&L requires 2-12 periods');
    }

    const currency = params.options?.roundValues ? 'EUR' : 'EUR';
    const periodLabels: string[] = [];
    const periodSummaries: any[] = [];
    const lineItemMap = new Map<string, { label: string; category: string; values: number[] }>();

    // Generate P&L for each period
    for (const period of params.periods) {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      const label = period.label || `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

      periodLabels.push(label);

      // Fetch data for this period
      const revenueData = await this.fetchRevenueData(
        organisationId,
        startDate,
        endDate,
        {},
        params.options,
      );

      const cogsData = await this.fetchCogsData(
        organisationId,
        startDate,
        endDate,
        {},
        params.options,
      );

      const opexData = await this.fetchOperatingExpenses(
        organisationId,
        startDate,
        endDate,
        {},
        params.options,
      );

      const totalRevenue = revenueData.total;
      const totalCogs = cogsData.total;
      const grossProfit = totalRevenue - totalCogs;
      const totalOpex = opexData.total;
      const operatingIncome = grossProfit - totalOpex;
      const netIncome = operatingIncome; // Simplified

      periodSummaries.push({
        period: label,
        revenue: totalRevenue,
        grossProfit,
        grossMargin: this.calculateMarginPercent(grossProfit, totalRevenue),
        operatingIncome,
        operatingMargin: this.calculateMarginPercent(operatingIncome, totalRevenue),
        netIncome,
        netMargin: this.calculateMarginPercent(netIncome, totalRevenue),
      });

      // Collect line items
      [...revenueData.items, ...cogsData.items, ...opexData.items].forEach((item) => {
        const itemCategory = (item.metadata?.category as string) || 'Other';
        const key = `${itemCategory}-${item.label}`;
        if (!lineItemMap.has(key)) {
          lineItemMap.set(key, {
            label: item.label,
            category: itemCategory,
            values: new Array(params.periods.length).fill(0),
          });
        }
        const lineItem = lineItemMap.get(key)!;
        lineItem.values[periodLabels.length - 1] = item.value;
      });
    }

    // Calculate variance analysis
    const revenueGrowth: number[] = [];
    const expenseGrowth: number[] = [];
    const marginExpansion: number[] = [];

    for (let i = 1; i < periodSummaries.length; i++) {
      const current = periodSummaries[i];
      const previous = periodSummaries[i - 1];

      const revGrowth = previous.revenue !== 0
        ? ((current.revenue - previous.revenue) / previous.revenue) * 100
        : 0;
      revenueGrowth.push(revGrowth);

      const expGrowth = previous.operatingIncome !== 0
        ? ((current.operatingIncome - previous.operatingIncome) / previous.operatingIncome) * 100
        : 0;
      expenseGrowth.push(expGrowth);

      const marginExp = current.netMargin - previous.netMargin;
      marginExpansion.push(marginExp);
    }

    // Build line items with percentage changes and trends
    const lineItems = Array.from(lineItemMap.values()).map((item) => {
      const percentageChange = item.values.slice(1).map((val, idx) => {
        const prevVal = item.values[idx];
        return prevVal !== 0 ? ((val - prevVal) / prevVal) * 100 : 0;
      });

      // Determine overall trend
      const avgChange = percentageChange.reduce((sum, val) => sum + val, 0) / percentageChange.length;
      const trend = avgChange > 5 ? 'GROWING' : avgChange < -5 ? 'DECLINING' : 'STABLE';

      return {
        ...item,
        percentageChange,
        trend,
      };
    });

    return {
      metadata: {
        organisationId,
        generatedAt: new Date().toISOString(),
        comparisonPeriods: params.periods.length,
        currency,
      },
      periods: periodLabels,
      summaryByPeriod: periodSummaries,
      lineItems,
      varianceAnalysis: {
        revenueGrowth,
        expenseGrowth,
        marginExpansion,
      },
    };
  }

  /**
   * Generate department-level P&L
   * Shows P&L for a specific department with cost allocation
   */
  async generateDepartmentPnl(
    organisationId: string,
    departmentId: string,
    filters: PnlFilterDto,
    options?: PnlOptionsDto,
  ): Promise<PnlReportDto> {
    this.logger.log(`Generating department P&L for department ${departmentId}`);

    // Verify department exists
    // Note: Department model may not exist in schema, skip verification for now
    // const department = await this.prisma.department.findFirst({
    //   where: { id: departmentId, orgId: organisationId },
    // });

    const department = { id: departmentId };

    if (!department) {
      throw new NotFoundException(`Department ${departmentId} not found`);
    }

    // Add department filter
    const departmentFilters = { ...filters, departmentId };

    // Generate standard P&L with department filter
    return this.generateFullPnlStatement(organisationId, departmentFilters, options);
  }

  /**
   * Generate project-level P&L
   * Shows P&L for a specific project
   */
  async generateProjectPnl(
    organisationId: string,
    projectId: string,
    filters: PnlFilterDto,
    options?: PnlOptionsDto,
  ): Promise<PnlReportDto> {
    this.logger.log(`Generating project P&L for project ${projectId}`);

    // Verify project exists (assuming a Project model exists)
    // For now, we'll proceed without verification

    // Add project filter
    const projectFilters = { ...filters, projectId };

    // Generate standard P&L with project filter
    return this.generateFullPnlStatement(organisationId, projectFilters, options);
  }

  /**
   * Generate budget variance report
   * Compares actual P&L against budget with variance analysis
   */
  async generateBudgetVariance(
    organisationId: string,
    params: BudgetVarianceDto,
  ): Promise<BudgetVarianceReportDto> {
    this.logger.log(`Generating budget variance report for budget ${params.budgetId}`);

    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    // Fetch budget data (assuming a Budget model exists)
    const budget = await this.fetchBudgetData(organisationId, params.budgetId, startDate, endDate);

    // Fetch actual data
    const actualRevenue = await this.fetchRevenueData(organisationId, startDate, endDate, {}, params.options);
    const actualCogs = await this.fetchCogsData(organisationId, startDate, endDate, {}, params.options);
    const actualOpex = await this.fetchOperatingExpenses(organisationId, startDate, endDate, {}, params.options);

    const totalActualRevenue = actualRevenue.total;
    const totalActualExpenses = actualCogs.total + actualOpex.total;
    const actualNetIncome = totalActualRevenue - totalActualExpenses;

    const revenueVariance = totalActualRevenue - budget.revenue;
    const expenseVariance = totalActualExpenses - budget.expenses;
    const netIncomeVariance = actualNetIncome - budget.netIncome;

    // Build line item variances
    const lineItemVariances: any[] = [];

    // Revenue variances
    actualRevenue.items.forEach((item) => {
      const itemCategory = (item.metadata?.category as string) || 'Other';
      const budgetedAmount = budget.revenueByCategory[itemCategory] || 0;
      const variance = item.value - budgetedAmount;
      const variancePercent = budgetedAmount !== 0 ? (variance / budgetedAmount) * 100 : 0;

      lineItemVariances.push({
        category: 'Revenue',
        label: item.label,
        budgeted: budgetedAmount,
        actual: item.value,
        variance,
        variancePercent,
        status: variance > 0 ? 'FAVORABLE' : variance < 0 ? 'UNFAVORABLE' : 'ON_TARGET',
      });
    });

    // Expense variances
    [...actualCogs.items, ...actualOpex.items].forEach((item) => {
      const itemCategory = (item.metadata?.category as string) || 'Other';
      const budgetedAmount = budget.expensesByCategory[itemCategory] || 0;
      const variance = item.value - budgetedAmount;
      const variancePercent = budgetedAmount !== 0 ? (variance / budgetedAmount) * 100 : 0;

      lineItemVariances.push({
        category: 'Expense',
        label: item.label,
        budgeted: budgetedAmount,
        actual: item.value,
        variance,
        variancePercent,
        status: variance < 0 ? 'FAVORABLE' : variance > 0 ? 'UNFAVORABLE' : 'ON_TARGET',
      });
    });

    // Generate insights
    const insights = this.generateBudgetVarianceInsights(
      revenueVariance,
      expenseVariance,
      netIncomeVariance,
      lineItemVariances,
    );

    return {
      metadata: {
        organisationId,
        budgetId: params.budgetId,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        currency: 'EUR',
      },
      summary: {
        budgetedRevenue: budget.revenue,
        actualRevenue: totalActualRevenue,
        revenueVariance,
        revenueVariancePercent: budget.revenue !== 0 ? (revenueVariance / budget.revenue) * 100 : 0,
        budgetedExpenses: budget.expenses,
        actualExpenses: totalActualExpenses,
        expenseVariance,
        expenseVariancePercent: budget.expenses !== 0 ? (expenseVariance / budget.expenses) * 100 : 0,
        budgetedNetIncome: budget.netIncome,
        actualNetIncome,
        netIncomeVariance,
        netIncomeVariancePercent: budget.netIncome !== 0 ? (netIncomeVariance / budget.netIncome) * 100 : 0,
      },
      lineItemVariances,
      insights,
    };
  }

  /**
   * Calculate gross profit
   */
  calculateGrossProfit(revenue: number, cogs: number): number {
    return revenue - cogs;
  }

  /**
   * Calculate operating income
   */
  calculateOperatingIncome(grossProfit: number, operatingExpenses: number): number {
    return grossProfit - operatingExpenses;
  }

  /**
   * Calculate EBITDA
   */
  calculateEbitda(
    operatingIncome: number,
    depreciation: number,
    amortization: number,
  ): number {
    return operatingIncome + depreciation + amortization;
  }

  /**
   * Calculate net income
   */
  calculateNetIncome(ebitda: number, interest: number, taxes: number): number {
    return ebitda - interest - taxes;
  }

  /**
   * Analyze margins across all key metrics
   */
  async analyzeMargins(
    organisationId: string,
    summary: any,
    startDate: Date,
    endDate: Date,
    currency: string,
  ): Promise<MarginAnalysisDto> {
    const revenue = summary.totalRevenue;

    // Current period margins
    const grossMargin = this.calculateMarginPercent(summary.grossProfit, revenue);
    const operatingMargin = this.calculateMarginPercent(summary.operatingIncome, revenue);
    const ebitdaMargin = this.calculateMarginPercent(summary.ebitda, revenue);
    const netMargin = this.calculateMarginPercent(summary.netIncome, revenue);
    const contributionMargin = this.calculateMarginPercent(
      summary.totalRevenue - summary.totalCogs,
      revenue,
    );

    // Previous period margins for comparison
    const previousPeriod = this.calculatePreviousPeriod(startDate, endDate);
    const previousData = await this.fetchPeriodSummary(
      organisationId,
      previousPeriod.start,
      previousPeriod.end,
    );

    const prevRevenue = previousData.revenue;
    const prevGrossMargin = this.calculateMarginPercent(previousData.grossProfit, prevRevenue);
    const prevOperatingMargin = this.calculateMarginPercent(previousData.operatingIncome, prevRevenue);
    const prevNetMargin = this.calculateMarginPercent(previousData.netIncome, prevRevenue);

    return {
      grossMargin,
      operatingMargin,
      ebitdaMargin,
      netMargin,
      contributionMargin,
      marginTrend: {
        grossMarginChange: grossMargin - prevGrossMargin,
        operatingMarginChange: operatingMargin - prevOperatingMargin,
        netMarginChange: netMargin - prevNetMargin,
      },
    };
  }

  /**
   * Identify trends in financial metrics
   * Analyzes historical data to detect patterns and seasonality
   */
  async identifyTrends(
    organisationId: string,
    currentStartDate: Date,
    currentEndDate: Date,
    periods: number,
    currency: string,
  ): Promise<TrendAnalysisDto[]> {
    this.logger.log(`Analyzing trends over ${periods} periods`);

    // Calculate period length
    const periodLength = currentEndDate.getTime() - currentStartDate.getTime();

    // Fetch historical data
    const historicalData: PeriodData[] = [];

    for (let i = periods - 1; i >= 0; i--) {
      const endDate = new Date(currentStartDate.getTime() - (i * periodLength));
      const startDate = new Date(endDate.getTime() - periodLength);

      const periodSummary = await this.fetchPeriodSummary(organisationId, startDate, endDate);

      historicalData.push({
        revenue: periodSummary.revenue,
        cogs: periodSummary.cogs,
        operatingExpenses: periodSummary.operatingExpenses,
        grossProfit: periodSummary.grossProfit,
        operatingIncome: periodSummary.operatingIncome,
        netIncome: periodSummary.netIncome,
        date: endDate,
      });
    }

    // Analyze trends for each metric
    const trends: TrendAnalysisDto[] = [];

    const metrics: Array<keyof PeriodData> = [
      'revenue',
      'grossProfit',
      'operatingIncome',
      'netIncome',
    ];

    for (const metric of metrics) {
      const dataPoints: TrendDataPointDto[] = historicalData.map((period, idx) => ({
        period: `Period ${idx + 1}`,
        date: period.date.toISOString(),
        value: period[metric] as number,
      }));

      // Calculate growth rate
      const firstValue = dataPoints[0].value;
      const lastValue = dataPoints[dataPoints.length - 1].value;
      const growthRate = firstValue !== 0
        ? ((lastValue - firstValue) / firstValue) * 100
        : 0;

      // Detect seasonality (simplified - check for recurring patterns)
      const seasonality = this.detectSeasonality(dataPoints.map((d) => d.value));

      trends.push({
        metric: metric.toString(),
        historicalData: dataPoints,
        growthRate,
        hasSeasonality: seasonality.hasSeasonality,
        seasonalityStrength: seasonality.strength,
      });
    }

    return trends;
  }

  /**
   * Forecast next period based on historical trends
   * Uses simple linear regression with seasonal adjustment
   */
  async forecastNextPeriod(
    trends: TrendAnalysisDto[],
    currency: string,
  ): Promise<ForecastDto> {
    this.logger.log('Forecasting next period');

    // Get revenue trend
    const revenueTrend = trends.find((t) => t.metric === 'revenue');
    if (!revenueTrend) {
      throw new BadRequestException('Revenue trend data required for forecasting');
    }

    // Simple linear regression
    const revenueValues = revenueTrend.historicalData.map((d) => d.value);
    const forecastedRevenue = this.linearRegression(revenueValues);

    // Forecast other metrics based on historical ratios
    const grossProfitTrend = trends.find((t) => t.metric === 'grossProfit');
    const opIncomeTrend = trends.find((t) => t.metric === 'operatingIncome');
    const netIncomeTrend = trends.find((t) => t.metric === 'netIncome');

    const avgGrossMargin = grossProfitTrend
      ? this.calculateAverageRatio(grossProfitTrend.historicalData, revenueValues)
      : 0.3;

    const avgOpMargin = opIncomeTrend
      ? this.calculateAverageRatio(opIncomeTrend.historicalData, revenueValues)
      : 0.15;

    const avgNetMargin = netIncomeTrend
      ? this.calculateAverageRatio(netIncomeTrend.historicalData, revenueValues)
      : 0.10;

    const forecastedGrossProfit = forecastedRevenue * avgGrossMargin;
    const forecastedCogs = forecastedRevenue - forecastedGrossProfit;
    const forecastedOperatingIncome = forecastedRevenue * avgOpMargin;
    const forecastedOpex = forecastedGrossProfit - forecastedOperatingIncome;
    const forecastedNetIncome = forecastedRevenue * avgNetMargin;

    // Calculate confidence based on data consistency
    const confidence = this.calculateForecastConfidence(revenueValues);

    return {
      revenue: forecastedRevenue,
      cogs: forecastedCogs,
      grossProfit: forecastedGrossProfit,
      operatingExpenses: forecastedOpex,
      netIncome: forecastedNetIncome,
      confidence,
      methodology: 'Linear Regression with Historical Ratios',
      periodsAnalyzed: revenueValues.length,
    };
  }

  /**
   * Calculate break-even analysis
   */
  private calculateBreakEven(
    revenue: number,
    cogs: number,
    opex: number,
    currency: string,
  ): BreakEvenAnalysisDto {
    // Separate fixed and variable costs (simplified assumption)
    // In production, would have explicit fixed/variable cost categorization
    const variableCostRatio = cogs / revenue;
    const fixedCosts = opex;

    // Break-even formula: Fixed Costs / (1 - Variable Cost Ratio)
    const contributionMarginRatio = 1 - variableCostRatio;
    const breakEvenRevenue = contributionMarginRatio > 0
      ? fixedCosts / contributionMarginRatio
      : 0;

    const revenueAboveBreakEven = revenue - breakEvenRevenue;
    const breakEvenPercentage = breakEvenRevenue > 0
      ? (revenue / breakEvenRevenue) * 100
      : 0;

    return {
      breakEvenRevenue,
      revenueAboveBreakEven,
      breakEvenPercentage,
      fixedCosts,
      variableCostRatio: variableCostRatio * 100,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Fetch revenue data with grouping
   */
  private async fetchRevenueData(
    organisationId: string,
    startDate: Date,
    endDate: Date,
    filters: PnlFilterDto,
    options?: PnlOptionsDto,
  ): Promise<{ total: number; items: PnlLineItemDto[] }> {
    const groupBy = options?.groupBy || PnlGroupingType.CATEGORY;

    const where: any = {
      orgId: organisationId,
      status: 'PAID',
      paidDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Apply filters
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.includeCategories?.length) {
      where.category = { in: filters.includeCategories };
    }
    if (filters.excludeCategories?.length) {
      where.category = { notIn: filters.excludeCategories };
    }

    // Determine grouping field
    let groupByField: any = ['category'];
    if (groupBy === PnlGroupingType.CLIENT) {
      groupByField = ['clientName'];
    } else if (groupBy === PnlGroupingType.PRODUCT) {
      groupByField = ['productId'];
    }

    const grouped = await this.prisma.invoice.groupBy({
      by: groupByField,
      where,
      _sum: {
        totalAmount: true,
        taxAmount: true,
      },
      _count: true,
    });

    const total = grouped.reduce((sum, g) => sum + (g._sum.totalAmount?.toNumber() || 0), 0);

    const items: PnlLineItemDto[] = grouped.map((g, idx) => {
      const value = g._sum.totalAmount?.toNumber() || 0;
      const category = g.category || g.clientName || 'Uncategorized';

      return {
        id: `revenue-${idx}`,
        label: category,
        value,
        formattedValue: this.formatCurrency(value, filters.currency || 'EUR'),
        percentageOfRevenue: total > 0 ? (value / total) * 100 : 0,
        transactionCount: g._count,
        metadata: { category },
      };
    });

    return { total, items };
  }

  /**
   * Fetch COGS data
   */
  private async fetchCogsData(
    organisationId: string,
    startDate: Date,
    endDate: Date,
    filters: PnlFilterDto,
    options?: PnlOptionsDto,
  ): Promise<{ total: number; items: PnlLineItemDto[] }> {
    const where: any = {
      orgId: organisationId,
      status: 'APPROVED',
      category: {
        in: ['COGS', 'INVENTORY', 'MATERIALS', 'DIRECT_LABOR', 'MANUFACTURING'],
      },
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    const grouped = await this.prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const total = grouped.reduce((sum, g) => sum + Math.abs(g._sum.amount?.toNumber() || 0), 0);

    const items: PnlLineItemDto[] = grouped.map((g, idx) => {
      const value = Math.abs(g._sum.amount?.toNumber() || 0);

      return {
        id: `cogs-${idx}`,
        label: g.category || 'COGS',
        value,
        formattedValue: this.formatCurrency(value, filters.currency || 'EUR'),
        transactionCount: g._count,
        metadata: { category: g.category },
      };
    });

    return { total, items };
  }

  /**
   * Fetch operating expenses
   */
  private async fetchOperatingExpenses(
    organisationId: string,
    startDate: Date,
    endDate: Date,
    filters: PnlFilterDto,
    options?: PnlOptionsDto,
  ): Promise<{ total: number; items: PnlLineItemDto[] }> {
    const where: any = {
      orgId: organisationId,
      status: 'APPROVED',
      category: {
        notIn: ['COGS', 'INVENTORY', 'MATERIALS', 'DIRECT_LABOR', 'MANUFACTURING', 'INVESTMENT', 'FINANCING', 'LOAN'],
      },
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    const grouped = await this.prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const total = grouped.reduce((sum, g) => sum + Math.abs(g._sum.amount?.toNumber() || 0), 0);

    const items: PnlLineItemDto[] = grouped.map((g, idx) => {
      const value = Math.abs(g._sum.amount?.toNumber() || 0);

      return {
        id: `opex-${idx}`,
        label: g.category || 'Operating Expense',
        value,
        formattedValue: this.formatCurrency(value, filters.currency || 'EUR'),
        transactionCount: g._count,
        metadata: { category: g.category },
      };
    });

    return { total, items };
  }

  /**
   * Fetch other income and expenses
   */
  private async fetchOtherIncomeExpenses(
    organisationId: string,
    startDate: Date,
    endDate: Date,
    filters: PnlFilterDto,
  ): Promise<{
    interestIncome: number;
    interestExpense: number;
    otherIncome: number;
    otherExpenses: number;
  }> {
    // For simplicity, returning zeros
    // In production, would query specific transaction categories
    return {
      interestIncome: 0,
      interestExpense: 0,
      otherIncome: 0,
      otherExpenses: 0,
    };
  }

  /**
   * Calculate tax expense
   */
  private async calculateTaxExpense(
    organisationId: string,
    preTaxIncome: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Get organization's tax rate
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { country: true },
    });

    // Default corporate tax rates by country (simplified)
    const taxRates: Record<string, number> = {
      DE: 0.30, // Germany ~30%
      AT: 0.25, // Austria 25%
      CH: 0.21, // Switzerland ~21%
      GB: 0.19, // UK 19%
      US: 0.21, // US 21%
      ES: 0.25, // Spain 25%
      SA: 0.20, // Saudi Arabia 20%
    };

    const taxRate = taxRates[org?.country || 'DE'] || 0.25;

    // Only tax positive income
    return preTaxIncome > 0 ? preTaxIncome * taxRate : 0;
  }

  /**
   * Build revenue section
   */
  private buildRevenueSection(
    data: { total: number; items: PnlLineItemDto[] },
    currency: string,
    totalRevenue: number,
  ): PnlSectionDto {
    return {
      id: 'revenue',
      title: 'Revenue',
      items: data.items,
      subtotal: data.total,
      formattedSubtotal: this.formatCurrency(data.total, currency),
      percentageOfRevenue: 100,
    };
  }

  /**
   * Build COGS section
   */
  private buildCogsSection(
    data: { total: number; items: PnlLineItemDto[] },
    currency: string,
    totalRevenue: number,
  ): PnlSectionDto {
    return {
      id: 'cogs',
      title: 'Cost of Goods Sold',
      items: data.items,
      subtotal: data.total,
      formattedSubtotal: this.formatCurrency(data.total, currency),
      percentageOfRevenue: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
    };
  }

  /**
   * Build operating expenses section
   */
  private buildOpexSection(
    data: { total: number; items: PnlLineItemDto[] },
    currency: string,
    totalRevenue: number,
  ): PnlSectionDto {
    return {
      id: 'operating_expenses',
      title: 'Operating Expenses',
      items: data.items,
      subtotal: data.total,
      formattedSubtotal: this.formatCurrency(data.total, currency),
      percentageOfRevenue: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
    };
  }

  /**
   * Build other income/expenses section
   */
  private buildOtherSection(
    data: {
      interestIncome: number;
      interestExpense: number;
      otherIncome: number;
      otherExpenses: number;
    },
    currency: string,
    totalRevenue: number,
  ): PnlSectionDto {
    const items: PnlLineItemDto[] = [
      {
        id: 'interest-income',
        label: 'Interest Income',
        value: data.interestIncome,
        formattedValue: this.formatCurrency(data.interestIncome, currency),
      },
      {
        id: 'interest-expense',
        label: 'Interest Expense',
        value: data.interestExpense,
        formattedValue: this.formatCurrency(data.interestExpense, currency),
      },
      {
        id: 'other-income',
        label: 'Other Income',
        value: data.otherIncome,
        formattedValue: this.formatCurrency(data.otherIncome, currency),
      },
      {
        id: 'other-expenses',
        label: 'Other Expenses',
        value: data.otherExpenses,
        formattedValue: this.formatCurrency(data.otherExpenses, currency),
      },
    ];

    const total = data.interestIncome - data.interestExpense + data.otherIncome - data.otherExpenses;

    return {
      id: 'other',
      title: 'Other Income & Expenses',
      items,
      subtotal: total,
      formattedSubtotal: this.formatCurrency(total, currency),
    };
  }

  /**
   * Fetch period summary for historical analysis
   */
  private async fetchPeriodSummary(
    organisationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PeriodData> {
    const revenue = await this.fetchRevenueData(organisationId, startDate, endDate, {}, undefined);
    const cogs = await this.fetchCogsData(organisationId, startDate, endDate, {}, undefined);
    const opex = await this.fetchOperatingExpenses(organisationId, startDate, endDate, {}, undefined);

    const grossProfit = revenue.total - cogs.total;
    const operatingIncome = grossProfit - opex.total;
    const netIncome = operatingIncome; // Simplified

    return {
      revenue: revenue.total,
      cogs: cogs.total,
      operatingExpenses: opex.total,
      grossProfit,
      operatingIncome,
      netIncome,
      date: endDate,
    };
  }

  /**
   * Fetch budget data
   */
  private async fetchBudgetData(
    organisationId: string,
    budgetId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // Placeholder - would fetch from Budget model
    // For now, return mock data
    return {
      revenue: 1000000,
      expenses: 750000,
      netIncome: 250000,
      revenueByCategory: {
        PRODUCT_SALES: 600000,
        SERVICES: 400000,
      },
      expensesByCategory: {
        SALARIES: 400000,
        RENT: 100000,
        MARKETING: 150000,
        UTILITIES: 50000,
        OTHER: 50000,
      },
    };
  }

  /**
   * Generate budget variance insights
   */
  private generateBudgetVarianceInsights(
    revenueVariance: number,
    expenseVariance: number,
    netIncomeVariance: number,
    lineItems: any[],
  ): string[] {
    const insights: string[] = [];

    if (revenueVariance > 0) {
      insights.push(`Revenue exceeded budget by ${this.formatCurrency(revenueVariance, 'EUR')} (${((revenueVariance / (revenueVariance - netIncomeVariance)) * 100).toFixed(1)}%)`);
    } else if (revenueVariance < 0) {
      insights.push(`Revenue fell short of budget by ${this.formatCurrency(Math.abs(revenueVariance), 'EUR')}`);
    }

    if (expenseVariance < 0) {
      insights.push(`Expenses were ${this.formatCurrency(Math.abs(expenseVariance), 'EUR')} below budget (favorable)`);
    } else if (expenseVariance > 0) {
      insights.push(`Expenses exceeded budget by ${this.formatCurrency(expenseVariance, 'EUR')} (unfavorable)`);
    }

    // Find largest variances
    const sortedVariances = lineItems
      .sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))
      .slice(0, 3);

    sortedVariances.forEach((item) => {
      if (Math.abs(item.variancePercent) > 10) {
        insights.push(`${item.label}: ${item.variancePercent > 0 ? 'over' : 'under'} budget by ${Math.abs(item.variancePercent).toFixed(1)}%`);
      }
    });

    return insights;
  }

  /**
   * Apply vertical analysis (common-size statements)
   */
  private applyVerticalAnalysis(report: PnlReportDto): void {
    const revenue = report.summary.totalRevenue;

    // Update all line items to show percentage of revenue
    const updateItems = (items: PnlLineItemDto[]) => {
      items.forEach((item) => {
        item.percentageOfRevenue = revenue > 0 ? (item.value / revenue) * 100 : 0;
      });
    };

    updateItems(report.revenue.items);
    updateItems(report.cogs.items);
    updateItems(report.operatingExpenses.items);
    updateItems(report.otherIncomeExpenses.items);
  }

  /**
   * Apply horizontal analysis (period-over-period comparison)
   */
  private async applyHorizontalAnalysis(
    report: PnlReportDto,
    organisationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    // Calculate previous period
    const previousPeriod = this.calculatePreviousPeriod(startDate, endDate);

    // Fetch previous period data
    const previousRevenue = await this.fetchRevenueData(
      organisationId,
      previousPeriod.start,
      previousPeriod.end,
      {},
      undefined,
    );

    const previousCogs = await this.fetchCogsData(
      organisationId,
      previousPeriod.start,
      previousPeriod.end,
      {},
      undefined,
    );

    const previousOpex = await this.fetchOperatingExpenses(
      organisationId,
      previousPeriod.start,
      previousPeriod.end,
      {},
      undefined,
    );

    // Update line items with period changes
    const updateWithChanges = (
      currentItems: PnlLineItemDto[],
      previousItems: PnlLineItemDto[],
    ) => {
      currentItems.forEach((item) => {
        const prevItem = previousItems.find((p) => p.label === item.label);
        if (prevItem) {
          const change = item.value - prevItem.value;
          const changePercent = prevItem.value !== 0 ? (change / prevItem.value) * 100 : 0;

          item.periodChange = change;
          item.periodChangePercent = changePercent;
          item.trend = change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'FLAT';
        }
      });
    };

    updateWithChanges(report.revenue.items, previousRevenue.items);
    updateWithChanges(report.cogs.items, previousCogs.items);
    updateWithChanges(report.operatingExpenses.items, previousOpex.items);
  }

  /**
   * Detect seasonality in data
   */
  private detectSeasonality(values: number[]): { hasSeasonality: boolean; strength: number } {
    if (values.length < 12) {
      return { hasSeasonality: false, strength: 0 };
    }

    // Simple autocorrelation check at lag 12 (yearly seasonality)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    if (variance === 0) {
      return { hasSeasonality: false, strength: 0 };
    }

    let autocorr = 0;
    const lag = 12;

    for (let i = 0; i < values.length - lag; i++) {
      autocorr += (values[i] - mean) * (values[i + lag] - mean);
    }

    autocorr /= (values.length - lag) * variance;

    const hasSeasonality = Math.abs(autocorr) > 0.5;
    const strength = Math.abs(autocorr);

    return { hasSeasonality, strength };
  }

  /**
   * Simple linear regression forecast
   */
  private linearRegression(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Forecast next period (x = n)
    return slope * n + intercept;
  }

  /**
   * Calculate average ratio between two series
   */
  private calculateAverageRatio(
    numeratorData: TrendDataPointDto[],
    denominatorValues: number[],
  ): number {
    const ratios = numeratorData.map((d, i) => {
      const denom = denominatorValues[i];
      return denom !== 0 ? d.value / denom : 0;
    });

    return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  }

  /**
   * Calculate forecast confidence
   */
  private calculateForecastConfidence(values: number[]): number {
    // Calculate coefficient of variation
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean !== 0 ? stdDev / mean : 1;

    // Lower CV = higher confidence
    const confidence = Math.max(0, Math.min(1, 1 - cv));

    return confidence * 100;
  }

  /**
   * Calculate margin percentage
   */
  private calculateMarginPercent(value: number, revenue: number): number {
    return revenue > 0 ? (value / revenue) * 100 : 0;
  }

  /**
   * Calculate previous period dates
   */
  private calculatePreviousPeriod(
    startDate: Date,
    endDate: Date,
  ): { start: Date; end: Date } {
    const periodLength = endDate.getTime() - startDate.getTime();

    return {
      start: new Date(startDate.getTime() - periodLength),
      end: new Date(startDate.getTime() - 1),
    };
  }

  /**
   * Parse date range from filters
   */
  private parseDateRange(filters: PnlFilterDto): { startDate: Date; endDate: Date } {
    if (filters.startDate && filters.endDate) {
      return {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      };
    }

    // Use period type for quick selection
    const now = new Date();

    switch (filters.periodType) {
      case PnlPeriodType.MONTH:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };

      case PnlPeriodType.QUARTER:
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          startDate: new Date(now.getFullYear(), quarter * 3, 1),
          endDate: new Date(now.getFullYear(), (quarter + 1) * 3, 0),
        };

      case PnlPeriodType.YEAR:
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: new Date(now.getFullYear(), 11, 31),
        };

      default:
        // Default to current month
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
    }
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Build cache key
   */
  private buildCacheKey(
    prefix: string,
    organisationId: string,
    filters: any,
    options?: any,
  ): string {
    const components = [
      prefix,
      organisationId,
      JSON.stringify(filters),
      JSON.stringify(options || {}),
    ];

    return components.join(':');
  }

  /**
   * Get cached value
   */
  private async getCached<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(key);
    } catch (error) {
      this.logger.warn(`Cache retrieval failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Set cached value
   */
  private async setCached<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.cacheService.set(key, value, ttl);
    } catch (error) {
      this.logger.warn(`Cache storage failed: ${error.message}`);
    }
  }
}
