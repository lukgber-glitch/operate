/**
 * Revenue Reports Service
 * Generates comprehensive revenue reports including cohort analysis and forecasting
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RevenueRecognitionService } from './revenue-recognition.service';
import {
  MrrMovementSummary,
  RevenueTierReport,
  CohortReport,
  CohortMetrics,
  DeferredRevenueSchedule,
  DeferredRevenueItem,
  RevenueForecastReport,
  ForecastDataPoint,
  RevenueQueryOptions,
  CohortQueryOptions,
  ForecastOptions,
} from './types/revenue.types';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RevenueReportsService {
  private readonly logger = new Logger(RevenueReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly revenueRecognition: RevenueRecognitionService,
  ) {}

  /**
   * Generate MRR movement report over time
   */
  async getMrrMovementReport(
    options: RevenueQueryOptions = {},
  ): Promise<MrrMovementSummary> {
    const {
      startDate = this.getMonthsAgo(12),
      endDate = new Date(),
      currency = 'EUR',
    } = options;

    this.logger.log(
      `Generating MRR movement report: ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const months = this.getMonthsBetween(startDate, endDate);
    const movements = [];

    for (const month of months) {
      const mrr = await this.revenueRecognition.calculateMrr(month, currency);
      movements.push(mrr);
    }

    const startingMrr = movements.length > 0 ? movements[0].totalMrr : 0;
    const endingMrr =
      movements.length > 0 ? movements[movements.length - 1].totalMrr : 0;

    const totalNewMrr = movements.reduce((sum, m) => sum + m.newMrr, 0);
    const totalExpansionMrr = movements.reduce(
      (sum, m) => sum + m.expansionMrr,
      0,
    );
    const totalContractionMrr = movements.reduce(
      (sum, m) => sum + m.contractionMrr,
      0,
    );
    const totalChurnMrr = movements.reduce((sum, m) => sum + m.churnMrr, 0);
    const totalReactivationMrr = movements.reduce(
      (sum, m) => sum + m.reactivationMrr,
      0,
    );

    const mrrChange = endingMrr - startingMrr;
    const mrrChangePercent =
      startingMrr > 0 ? (mrrChange / startingMrr) * 100 : 0;

    return {
      dateRange: { start: startDate, end: endDate },
      currency,
      startingMrr,
      endingMrr,
      mrrChange,
      mrrChangePercent: this.roundToTwoDecimals(mrrChangePercent),
      totalNewMrr,
      totalExpansionMrr,
      totalContractionMrr,
      totalChurnMrr,
      totalReactivationMrr,
      movements,
    };
  }

  /**
   * Generate revenue by tier report
   */
  async getRevenueTierReport(
    month: Date = new Date(),
    currency: string = 'EUR',
  ): Promise<RevenueTierReport> {
    this.logger.log(
      `Generating revenue tier report for ${month.toISOString()}`,
    );

    const monthStart = this.getMonthStart(month);

    // Get all revenue recognition for the month
    const revenue = await this.prisma.revenueRecognition.findMany({
      where: {
        recognitionMonth: monthStart,
        currency,
      },
      include: {
        organisation: true,
      },
    });

    // Group by tier (would need subscription tier info - placeholder logic)
    // In real implementation, join with subscription/plan data
    const tierMap = new Map<string, { count: number; mrr: number }>();

    for (const record of revenue) {
      // Placeholder: categorize by amount ranges
      const amount = this.decimalToNumber(record.recognizedAmount);
      const tier = this.getTierByAmount(amount);

      const current = tierMap.get(tier) || { count: 0, mrr: 0 };
      tierMap.set(tier, {
        count: current.count + 1,
        mrr: current.mrr + amount,
      });
    }

    const totalMrr = Array.from(tierMap.values()).reduce(
      (sum, t) => sum + t.mrr,
      0,
    );

    const tiers = Array.from(tierMap.entries()).map(([tierName, data]) => ({
      tierName,
      tierPrice: this.getTierPrice(tierName),
      customerCount: data.count,
      mrr: data.mrr,
      arr: data.mrr * 12,
      percentOfTotal: totalMrr > 0 ? (data.mrr / totalMrr) * 100 : 0,
    }));

    return {
      month: monthStart,
      currency,
      tiers,
      totalMrr,
      totalArr: totalMrr * 12,
    };
  }

  /**
   * Generate cohort analysis report
   */
  async getCohortReport(
    options: CohortQueryOptions = {},
  ): Promise<CohortReport> {
    const {
      startCohort = this.getMonthsAgo(12),
      endCohort = new Date(),
      currency = 'EUR',
      minCustomers = 1,
    } = options;

    this.logger.log(
      `Generating cohort report: ${startCohort.toISOString()} to ${endCohort.toISOString()}`,
    );

    const cohortMonths = this.getMonthsBetween(startCohort, endCohort);
    const cohorts: CohortMetrics[] = [];

    for (const cohortMonth of cohortMonths) {
      const cohort = await this.generateCohortMetrics(
        cohortMonth,
        currency,
        minCustomers,
      );
      if (cohort) {
        cohorts.push(cohort);
      }
    }

    const averageLifetimeValue =
      cohorts.length > 0
        ? cohorts.reduce((sum, c) => sum + c.lifetimeValue, 0) / cohorts.length
        : 0;

    const averageRetentionRate =
      cohorts.length > 0
        ? cohorts.reduce((sum, c) => sum + c.retentionRate, 0) /
          cohorts.length
        : 0;

    return {
      currency,
      cohorts,
      averageLifetimeValue: this.roundToTwoDecimals(averageLifetimeValue),
      averageRetentionRate: this.roundToTwoDecimals(averageRetentionRate),
    };
  }

  /**
   * Generate cohort metrics for a specific cohort month
   */
  private async generateCohortMetrics(
    cohortMonth: Date,
    currency: string,
    minCustomers: number,
  ): Promise<CohortMetrics | null> {
    const cohortStart = this.getMonthStart(cohortMonth);

    // Find organizations that first appeared in this cohort month
    const firstRevenue = await this.prisma.revenueRecognition.groupBy({
      by: ['organisationId'],
      where: {
        currency,
      },
      _min: {
        recognitionMonth: true,
      },
      having: {
        recognitionMonth: {
          _min: cohortStart,
        },
      },
    });

    const cohortOrgIds = firstRevenue.map((r) => r.organisationId);

    if (cohortOrgIds.length < minCustomers) {
      return null; // Skip small cohorts
    }

    const initialCustomers = cohortOrgIds.length;

    // Get initial MRR
    const initialRevenue = await this.prisma.revenueRecognition.findMany({
      where: {
        organisationId: { in: cohortOrgIds },
        recognitionMonth: cohortStart,
        currency,
      },
    });

    const initialMrr = initialRevenue.reduce(
      (sum, r) => sum + this.decimalToNumber(r.recognizedAmount),
      0,
    );

    // Track revenue by month
    const now = new Date();
    const monthlyRevenue = [];
    let currentCustomers = initialCustomers;
    let lifetimeValue = 0;

    const months = this.getMonthsBetween(cohortStart, now);

    for (const month of months) {
      const monthRevenue = await this.prisma.revenueRecognition.findMany({
        where: {
          organisationId: { in: cohortOrgIds },
          recognitionMonth: this.getMonthStart(month),
          currency,
        },
      });

      const activeOrgs = new Set(monthRevenue.map((r) => r.organisationId));
      const activeCustomers = activeOrgs.size;
      const churnedCustomers = currentCustomers - activeCustomers;

      const revenue = monthRevenue.reduce(
        (sum, r) => sum + this.decimalToNumber(r.recognizedAmount),
        0,
      );

      const mrr = revenue;
      lifetimeValue += revenue;

      monthlyRevenue.push({
        month: this.getMonthStart(month),
        revenue,
        mrr,
        activeCustomers,
        churnedCustomers: Math.max(0, churnedCustomers),
      });

      currentCustomers = activeCustomers;
    }

    const retentionRate =
      initialCustomers > 0 ? (currentCustomers / initialCustomers) * 100 : 0;

    return {
      cohortMonth: cohortStart,
      initialCustomers,
      currentCustomers,
      retentionRate: this.roundToTwoDecimals(retentionRate),
      initialMrr,
      currentMrr:
        monthlyRevenue.length > 0
          ? monthlyRevenue[monthlyRevenue.length - 1].mrr
          : 0,
      lifetimeValue,
      monthlyRevenue,
    };
  }

  /**
   * Generate deferred revenue schedule
   */
  async getDeferredRevenueSchedule(
    asOfDate: Date = new Date(),
    currency: string = 'EUR',
    organisationId?: string,
  ): Promise<DeferredRevenueSchedule> {
    this.logger.log(
      `Generating deferred revenue schedule as of ${asOfDate.toISOString()}`,
    );

    const schedules = await this.prisma.deferredRevenueSchedule.findMany({
      where: {
        currency,
        status: 'ACTIVE',
        organisationId,
        recognitionEnd: { gte: asOfDate },
      },
      include: {
        organisation: true,
      },
      orderBy: {
        recognitionEnd: 'asc',
      },
    });

    const items: DeferredRevenueItem[] = schedules.map((schedule) => ({
      invoiceId: schedule.invoiceId,
      invoiceNumber: schedule.invoiceNumber || '',
      organisationId: schedule.organisationId,
      organisationName: schedule.organisation.name,
      billingDate: schedule.billingDate,
      recognitionStart: schedule.recognitionStart,
      recognitionEnd: schedule.recognitionEnd,
      totalAmount: this.decimalToNumber(schedule.totalAmount),
      recognizedToDate: this.decimalToNumber(schedule.recognizedToDate),
      remainingDeferred: this.decimalToNumber(schedule.remainingDeferred),
      currency: schedule.currency,
      status: schedule.status as 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
    }));

    const totalDeferred = items.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalRecognized = items.reduce(
      (sum, i) => sum + i.recognizedToDate,
      0,
    );
    const totalRemaining = items.reduce(
      (sum, i) => sum + i.remainingDeferred,
      0,
    );

    // Calculate aging buckets
    const deferredBy30Days = this.calculateDeferredByDays(items, asOfDate, 30);
    const deferredBy60Days = this.calculateDeferredByDays(items, asOfDate, 60);
    const deferredBy90Days = this.calculateDeferredByDays(items, asOfDate, 90);
    const deferredBeyond90Days = this.calculateDeferredByDays(
      items,
      asOfDate,
      91,
      true,
    );

    return {
      asOfDate,
      currency,
      items,
      totalDeferred,
      totalRecognized,
      totalRemaining,
      deferredBy30Days,
      deferredBy60Days,
      deferredBy90Days,
      deferredBeyond90Days,
    };
  }

  /**
   * Generate revenue forecast
   */
  async getRevenueForecast(
    options: ForecastOptions = {},
  ): Promise<RevenueForecastReport> {
    const {
      months = 12,
      method = 'LINEAR',
      historicalPeriod = 12,
      currency = 'EUR',
    } = options;

    this.logger.log(
      `Generating revenue forecast: ${months} months using ${method} method`,
    );

    const now = new Date();
    const historicalStart = this.getMonthsAgo(historicalPeriod);

    // Get historical MRR data
    const historicalMonths = this.getMonthsBetween(historicalStart, now);
    const historical = [];

    for (const month of historicalMonths) {
      const mrr = await this.revenueRecognition.calculateMrr(month, currency);
      historical.push({
        month: this.getMonthStart(month),
        actualMrr: mrr.totalMrr,
        actualArr: mrr.totalMrr * 12,
      });
    }

    // Calculate growth rate
    const averageGrowthRate = this.calculateAverageGrowthRate(historical);

    // Generate forecast
    const forecast: ForecastDataPoint[] = [];
    let lastMrr =
      historical.length > 0
        ? historical[historical.length - 1].actualMrr
        : 0;

    for (let i = 1; i <= months; i++) {
      const forecastMonth = this.getMonthsAhead(i);
      let forecastedMrr = 0;

      switch (method) {
        case 'LINEAR':
          forecastedMrr = this.linearForecast(lastMrr, averageGrowthRate, i);
          break;
        case 'MOVING_AVERAGE':
          forecastedMrr = this.movingAverageForecast(historical, i);
          break;
        case 'EXPONENTIAL':
          forecastedMrr = this.exponentialForecast(
            lastMrr,
            averageGrowthRate,
            i,
          );
          break;
      }

      forecast.push({
        month: forecastMonth,
        forecastedMrr,
        forecastedArr: forecastedMrr * 12,
        confidenceLevel: this.getConfidenceLevel(i, historicalPeriod),
        forecastMethod: method,
      });
    }

    return {
      currency,
      generatedAt: now,
      historicalMonths: historicalPeriod,
      averageGrowthRate: this.roundToTwoDecimals(averageGrowthRate),
      historical,
      forecast,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getTierByAmount(amount: number): string {
    // Placeholder logic - in real implementation, look up actual tier
    if (amount < 50) return 'Starter';
    if (amount < 150) return 'Professional';
    if (amount < 500) return 'Business';
    return 'Enterprise';
  }

  private getTierPrice(tierName: string): number {
    // Placeholder - would come from pricing configuration
    const prices: Record<string, number> = {
      Starter: 29,
      Professional: 99,
      Business: 299,
      Enterprise: 999,
    };
    return prices[tierName] || 0;
  }

  private calculateDeferredByDays(
    items: DeferredRevenueItem[],
    asOfDate: Date,
    days: number,
    orMore: boolean = false,
  ): number {
    const targetDate = new Date(asOfDate);
    targetDate.setDate(targetDate.getDate() + days);

    return items
      .filter((item) => {
        const endDate = new Date(item.recognitionEnd);
        if (orMore) {
          return endDate > targetDate;
        } else {
          return endDate <= targetDate && endDate > asOfDate;
        }
      })
      .reduce((sum, item) => sum + item.remainingDeferred, 0);
  }

  private calculateAverageGrowthRate(
    historical: { month: Date; actualMrr: number }[],
  ): number {
    if (historical.length < 2) return 0;

    const growthRates = [];
    for (let i = 1; i < historical.length; i++) {
      const previous = historical[i - 1].actualMrr;
      const current = historical[i].actualMrr;
      if (previous > 0) {
        growthRates.push(((current - previous) / previous) * 100);
      }
    }

    return growthRates.length > 0
      ? growthRates.reduce((sum, r) => sum + r, 0) / growthRates.length
      : 0;
  }

  private linearForecast(
    baseMrr: number,
    growthRate: number,
    monthsAhead: number,
  ): number {
    return baseMrr * (1 + (growthRate / 100) * monthsAhead);
  }

  private movingAverageForecast(
    historical: { month: Date; actualMrr: number }[],
    monthsAhead: number,
  ): number {
    const window = Math.min(3, historical.length);
    const recent = historical.slice(-window);
    const average =
      recent.reduce((sum, h) => sum + h.actualMrr, 0) / recent.length;
    return average;
  }

  private exponentialForecast(
    baseMrr: number,
    growthRate: number,
    monthsAhead: number,
  ): number {
    return baseMrr * Math.pow(1 + growthRate / 100, monthsAhead);
  }

  private getConfidenceLevel(
    monthsAhead: number,
    historicalPeriod: number,
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    const ratio = monthsAhead / historicalPeriod;
    if (ratio < 0.25) return 'HIGH';
    if (ratio < 0.5) return 'MEDIUM';
    return 'LOW';
  }

  private getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getMonthsBetween(start: Date, end: Date): Date[] {
    const months: Date[] = [];
    const current = this.getMonthStart(start);
    const endMonth = this.getMonthStart(end);

    while (current <= endMonth) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  private getMonthsAgo(count: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - count);
    return this.getMonthStart(date);
  }

  private getMonthsAhead(count: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + count);
    return this.getMonthStart(date);
  }

  private decimalToNumber(decimal: Decimal): number {
    return decimal.toNumber();
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
