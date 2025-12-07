/**
 * Cash Flow Predictor Example
 *
 * This example demonstrates how to use the CashFlowPredictorService
 * to forecast cash flow, analyze runway, and perform scenario planning.
 *
 * NOTE: This is a demonstration file. In practice, the service should be
 * injected via NestJS dependency injection, not instantiated directly.
 */

import { Injectable } from '@nestjs/common';
import { CashFlowPredictorService } from './cash-flow-predictor.service';
import { format } from 'date-fns';

/**
 * Integration Example: Using in a Controller
 */
@Injectable()
export class CashFlowControllerExample {
  constructor(private readonly cashFlowPredictor: CashFlowPredictorService) {}

  /**
   * GET /api/cash-flow/forecast
   */
  async getForecast(orgId: string, days: number = 30) {
    return this.cashFlowPredictor.predictCashFlow(orgId, days);
  }

  /**
   * GET /api/cash-flow/daily
   */
  async getDailyProjections(orgId: string, days: number = 30) {
    return this.cashFlowPredictor.getDailyProjections(orgId, days);
  }

  /**
   * GET /api/cash-flow/lowest-point
   */
  async getLowestCashPoint(orgId: string, days: number = 30) {
    return this.cashFlowPredictor.getLowestCashPoint(orgId, days);
  }

  /**
   * GET /api/cash-flow/runway
   */
  async getRunway(orgId: string) {
    return this.cashFlowPredictor.calculateRunway(orgId);
  }

  /**
   * POST /api/cash-flow/scenario
   */
  async analyzeScenario(orgId: string, scenarioName: string, adjustments: any) {
    return this.cashFlowPredictor.getScenarioAnalysis(orgId, {
      name: scenarioName,
      adjustments,
    });
  }

  /**
   * Example: Dashboard Summary
   */
  async getDashboardSummary(orgId: string) {
    const forecast = await this.cashFlowPredictor.predictCashFlow(orgId, 30);
    const runway = await this.cashFlowPredictor.calculateRunway(orgId);

    return {
      currentBalance: forecast.currentBalance,
      projectedBalance: forecast.projectedBalance,
      netChange: forecast.summary.netChange,
      lowestPoint: {
        date: forecast.lowestPoint.date,
        balance: forecast.lowestPoint.projectedBalance,
        daysAway: forecast.lowestPoint.daysFromNow,
        isCritical: forecast.lowestPoint.isCritical,
      },
      runway: {
        months: runway.runwayMonths,
        status: runway.status,
      },
      alerts: forecast.alerts.filter(a => a.severity !== 'info'),
      confidence: forecast.confidence,
    };
  }

  /**
   * Example: Weekly Email Summary
   */
  async prepareWeeklySummary(orgId: string) {
    const forecast = await this.cashFlowPredictor.predictCashFlow(orgId, 7);
    const runway = await this.cashFlowPredictor.calculateRunway(orgId);

    const formattedAlerts = forecast.alerts.map(alert => {
      const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
      return `${icon} ${alert.message}`;
    });

    return {
      subject: `Cash Flow Summary - Week of ${format(new Date(), 'MMM dd, yyyy')}`,
      summary: {
        currentBalance: forecast.currentBalance,
        projectedBalance: forecast.projectedBalance,
        netChange: forecast.summary.netChange,
        runwayMonths: runway.runwayMonths,
        runwayStatus: runway.status,
      },
      alerts: formattedAlerts,
      recommendations: runway.recommendations,
      lowestPoint: {
        date: format(forecast.lowestPoint.date, 'MMM dd, yyyy'),
        balance: forecast.lowestPoint.projectedBalance,
        daysAway: forecast.lowestPoint.daysFromNow,
      },
    };
  }

  /**
   * Example: Check if can afford new hire
   */
  async canAffordNewHire(orgId: string, annualSalary: number) {
    const monthlyCost = annualSalary / 12;

    // Test scenario with additional expense
    const scenario = await this.cashFlowPredictor.getScenarioAnalysis(orgId, {
      name: 'New Hire Impact',
      adjustments: {
        additionalExpense: monthlyCost * 3, // 3 months forecast
      },
    });

    const baseRunway = await this.cashFlowPredictor.calculateRunway(orgId);

    const SAFE_BALANCE_THRESHOLD = 10000;
    const isAffordable = scenario.lowestPoint.projectedBalance > SAFE_BALANCE_THRESHOLD;

    return {
      isAffordable,
      currentRunway: baseRunway.runwayMonths,
      lowestProjectedBalance: scenario.lowestPoint.projectedBalance,
      newAlerts: scenario.alerts.length,
      recommendation: isAffordable
        ? 'Safe to proceed with hire'
        : 'Consider waiting or securing additional funding first',
      analysis: {
        monthlyCost,
        impactOnBalance: scenario.projectedBalance - scenario.currentBalance,
        lowestPointDate: scenario.lowestPoint.date,
        riskLevel: scenario.lowestPoint.isCritical ? 'high' : 'low',
      },
    };
  }

  /**
   * Example: Proactive alert checking (for background job)
   */
  async checkAndNotifyAlerts(orgId: string) {
    const lowestPoint = await this.cashFlowPredictor.getLowestCashPoint(orgId, 30);
    const forecast = await this.cashFlowPredictor.predictCashFlow(orgId, 30);

    const criticalAlerts = forecast.alerts.filter(a => a.severity === 'critical');
    const warningAlerts = forecast.alerts.filter(a => a.severity === 'warning');

    if (lowestPoint.isCritical || criticalAlerts.length > 0) {
      return {
        shouldNotify: true,
        priority: 'critical',
        message: `CRITICAL: Cash flow alert for next 30 days`,
        details: {
          lowestBalance: lowestPoint.projectedBalance,
          daysUntilLowest: lowestPoint.daysFromNow,
          criticalAlerts,
          actionRequired: 'Immediate action required',
        },
      };
    }

    if (warningAlerts.length > 0) {
      return {
        shouldNotify: true,
        priority: 'warning',
        message: `Cash flow warnings detected`,
        details: {
          lowestBalance: lowestPoint.projectedBalance,
          daysUntilLowest: lowestPoint.daysFromNow,
          warningAlerts,
          actionRequired: 'Review recommended',
        },
      };
    }

    return {
      shouldNotify: false,
      priority: 'info',
      message: 'Cash flow healthy',
    };
  }
}

/**
 * Example output formats for different use cases
 */
export const EXAMPLE_OUTPUTS = {
  // Forecast summary for dashboard
  dashboardSummary: {
    currentBalance: 25000.00,
    projectedBalance: 18500.00,
    netChange: -6500.00,
    lowestPoint: {
      date: new Date('2025-01-15'),
      balance: 8200.00,
      daysAway: 14,
      isCritical: false,
    },
    runway: {
      months: 8.5,
      status: 'healthy',
    },
    alerts: [
      {
        type: 'low_balance',
        severity: 'warning',
        message: 'Balance projected to drop to €8,200 on Jan 15',
      },
    ],
    confidence: 85,
  },

  // Daily projection example
  dailyProjection: {
    date: new Date('2025-01-10'),
    dayOfWeek: 'Wednesday',
    openingBalance: 22000.00,
    inflows: 5000.00,
    outflows: 8500.00,
    closingBalance: 18500.00,
    items: [
      {
        description: 'Invoice INV-2024-045 - Acme Corp',
        amount: 5000.00,
        expectedDate: new Date('2025-01-10'),
        type: 'invoice',
        confidence: 90,
        source: 'inv-123',
      },
      {
        description: 'Bill #1234 - AWS',
        amount: 2500.00,
        expectedDate: new Date('2025-01-10'),
        type: 'bill',
        confidence: 95,
        source: 'bill-456',
      },
      {
        description: 'Recurring: Office Rent (monthly)',
        amount: 6000.00,
        expectedDate: new Date('2025-01-10'),
        type: 'recurring',
        confidence: 98,
        source: 'Landlord LLC',
      },
    ],
    isWeekend: false,
    isPayday: false,
  },

  // Runway analysis example
  runwayAnalysis: {
    currentBalance: 25000.00,
    monthlyBurnRate: 12000.00,
    averageMonthlyIncome: 15000.00,
    netMonthlyChange: 3000.00,
    runwayMonths: 999, // Infinite (profitable)
    runwayDate: null,
    status: 'healthy',
    recommendations: [
      'Maintain current financial discipline',
      'Consider investing excess cash',
      'Continue monitoring key metrics',
    ],
  },
};
