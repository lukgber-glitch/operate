/**
 * Cash Flow Predictor - Usage Examples
 *
 * Demonstrates how to use the enhanced multi-month cash flow forecasting
 */

import { CashFlowPredictorService } from './cash-flow-predictor.service';

/**
 * Example 1: Basic 1-Month Forecast (Default)
 */
export async function example1_basicForecast(
  cashFlowPredictor: CashFlowPredictorService,
  organisationId: string,
) {
  // Default 30-day forecast
  const forecast = await cashFlowPredictor.predictCashFlow(organisationId);

  console.log('=== 1-Month Cash Flow Forecast ===');
  console.log(`Current Balance: €${forecast.currentBalance.toLocaleString()}`);
  console.log(`Projected Balance: €${forecast.projectedBalance.toLocaleString()}`);
  console.log(`Net Change: €${forecast.summary.netChange.toLocaleString()}`);
  console.log(`Confidence: ${forecast.confidence}%`);
  console.log(`\nInflows:`);
  console.log(`  - Pending Invoices: €${forecast.inflows.pendingInvoices.toLocaleString()}`);
  console.log(`  - Recurring Income: €${forecast.inflows.expectedRecurringIncome.toLocaleString()}`);
  console.log(`  - Predicted Income: €${forecast.inflows.predictedIncome.toLocaleString()}`);
  console.log(`\nOutflows:`);
  console.log(`  - Pending Bills: €${forecast.outflows.pendingBills.toLocaleString()}`);
  console.log(`  - Recurring Expenses: €${forecast.outflows.recurringExpenses.toLocaleString()}`);

  return forecast;
}

/**
 * Example 2: 3-Month Forecast
 */
export async function example2_threeMonthForecast(
  cashFlowPredictor: CashFlowPredictorService,
  organisationId: string,
) {
  // 90-day (3 month) forecast
  const forecast = await cashFlowPredictor.predictCashFlow(organisationId, 90);

  console.log('=== 3-Month Cash Flow Forecast ===');
  console.log(`Forecast Period: ${forecast.forecastDays} days`);
  console.log(`Daily Projections: ${forecast.dailyProjections.length}`);

  // Find the lowest cash point
  console.log(`\nLowest Point:`);
  console.log(`  Date: ${forecast.lowestPoint.date.toISOString().split('T')[0]}`);
  console.log(`  Balance: €${forecast.lowestPoint.projectedBalance.toLocaleString()}`);
  console.log(`  Days From Now: ${forecast.lowestPoint.daysFromNow}`);
  console.log(`  Critical: ${forecast.lowestPoint.isCritical ? 'YES ⚠️' : 'No'}`);

  if (forecast.lowestPoint.riskFactors.length > 0) {
    console.log(`\nRisk Factors:`);
    forecast.lowestPoint.riskFactors.forEach(risk => {
      console.log(`  - ${risk}`);
    });
  }

  return forecast;
}

/**
 * Example 3: 6-Month Forecast with Seasonal Patterns
 */
export async function example3_sixMonthForecast(
  cashFlowPredictor: CashFlowPredictorService,
  organisationId: string,
) {
  // Maximum 180-day (6 month) forecast
  const forecast = await cashFlowPredictor.predictCashFlow(organisationId, 180);

  console.log('=== 6-Month Cash Flow Forecast ===');

  // Show recurring income patterns
  const recurringIncomeItems = forecast.inflows.breakdown.filter(item =>
    item.type === 'recurring' && item.description.includes('Recurring Income')
  );

  console.log(`\nRecurring Income (${recurringIncomeItems.length} patterns):`);
  recurringIncomeItems.forEach(item => {
    console.log(`  - ${item.description}: €${item.amount.toLocaleString()} (${item.confidence}% confidence)`);
  });

  // Show monthly breakdown
  const monthlyData = groupByMonth(forecast.dailyProjections);
  console.log(`\nMonthly Breakdown:`);
  monthlyData.forEach(month => {
    console.log(`  ${month.monthName}:`);
    console.log(`    Inflows: €${month.totalInflows.toLocaleString()}`);
    console.log(`    Outflows: €${month.totalOutflows.toLocaleString()}`);
    console.log(`    Net: €${month.net.toLocaleString()}`);
  });

  return forecast;
}

/**
 * Example 4: Cash Flow Alerts
 */
export async function example4_cashFlowAlerts(
  cashFlowPredictor: CashFlowPredictorService,
  organisationId: string,
) {
  const forecast = await cashFlowPredictor.predictCashFlow(organisationId, 60);

  console.log('=== Cash Flow Alerts ===');

  if (forecast.alerts.length === 0) {
    console.log('No alerts - cash flow looks healthy! ✅');
    return;
  }

  // Group by severity
  const critical = forecast.alerts.filter(a => a.severity === 'critical');
  const warnings = forecast.alerts.filter(a => a.severity === 'warning');
  const info = forecast.alerts.filter(a => a.severity === 'info');

  if (critical.length > 0) {
    console.log(`\n🚨 CRITICAL ALERTS (${critical.length}):`);
    critical.forEach(alert => {
      console.log(`  - [${alert.type}] ${alert.message}`);
      console.log(`    Action: ${alert.actionRequired}`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️ WARNINGS (${warnings.length}):`);
    warnings.forEach(alert => {
      console.log(`  - [${alert.type}] ${alert.message}`);
      console.log(`    Action: ${alert.actionRequired}`);
    });
  }

  if (info.length > 0) {
    console.log(`\nℹ️ INFO (${info.length}):`);
    info.forEach(alert => {
      console.log(`  - [${alert.type}] ${alert.message}`);
    });
  }
}

/**
 * Example 5: Runway Analysis
 */
export async function example5_runwayAnalysis(
  cashFlowPredictor: CashFlowPredictorService,
  organisationId: string,
) {
  const runway = await cashFlowPredictor.calculateRunway(organisationId);

  console.log('=== Runway Analysis ===');
  console.log(`Current Balance: €${runway.currentBalance.toLocaleString()}`);
  console.log(`Monthly Burn Rate: €${runway.monthlyBurnRate.toLocaleString()}`);
  console.log(`Average Monthly Income: €${runway.averageMonthlyIncome.toLocaleString()}`);
  console.log(`Net Monthly Change: €${runway.netMonthlyChange.toLocaleString()}`);
  console.log(`\nRunway: ${runway.runwayMonths === 999 ? 'Infinite ♾️' : `${runway.runwayMonths} months`}`);

  if (runway.runwayDate) {
    console.log(`Projected Zero Date: ${runway.runwayDate.toISOString().split('T')[0]}`);
  }

  console.log(`\nStatus: ${getRunwayStatusEmoji(runway.status)} ${runway.status.toUpperCase()}`);

  console.log(`\nRecommendations:`);
  runway.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  return runway;
}

/**
 * Example 6: Daily Projections
 */
export async function example6_dailyProjections(
  cashFlowPredictor: CashFlowPredictorService,
  organisationId: string,
) {
  const projections = await cashFlowPredictor.getDailyProjections(organisationId, 30);

  console.log('=== Daily Projections (Next 30 Days) ===');

  // Show next 7 days
  const nextWeek = projections.slice(0, 7);

  console.log('\nNext 7 Days:');
  nextWeek.forEach(day => {
    console.log(`\n${day.date.toISOString().split('T')[0]} (${day.dayOfWeek}):`);
    console.log(`  Opening: €${day.openingBalance.toLocaleString()}`);
    console.log(`  Inflows: €${day.inflows.toLocaleString()}`);
    console.log(`  Outflows: €${day.outflows.toLocaleString()}`);
    console.log(`  Closing: €${day.closingBalance.toLocaleString()}`);

    if (day.items.length > 0) {
      console.log(`  Transactions (${day.items.length}):`);
      day.items.forEach(item => {
        const sign = item.type === 'invoice' || item.description.includes('Income') ? '+' : '-';
        console.log(`    ${sign} €${item.amount.toLocaleString()} - ${item.description}`);
      });
    }
  });
}

/**
 * Example 7: Scenario Analysis
 */
export async function example7_scenarioAnalysis(
  cashFlowPredictor: CashFlowPredictorService,
  organisationId: string,
) {
  console.log('=== Scenario Analysis ===');

  // Baseline
  const baseline = await cashFlowPredictor.predictCashFlow(organisationId, 90);
  console.log(`\nBaseline (90 days):`);
  console.log(`  Net Change: €${baseline.summary.netChange.toLocaleString()}`);
  console.log(`  Projected Balance: €${baseline.projectedBalance.toLocaleString()}`);

  // Scenario 1: Win new contract (+€50,000)
  const winContract = await cashFlowPredictor.getScenarioAnalysis(organisationId, {
    name: 'Win New Contract',
    adjustments: {
      additionalIncome: 50000,
    },
  });
  console.log(`\nScenario: Win New Contract (+€50,000):`);
  console.log(`  Net Change: €${winContract.summary.netChange.toLocaleString()}`);
  console.log(`  Projected Balance: €${winContract.projectedBalance.toLocaleString()}`);
  console.log(`  Difference: €${(winContract.projectedBalance - baseline.projectedBalance).toLocaleString()}`);

  // Scenario 2: Unexpected expense (-€20,000)
  const unexpectedExpense = await cashFlowPredictor.getScenarioAnalysis(organisationId, {
    name: 'Unexpected Expense',
    adjustments: {
      additionalExpense: 20000,
    },
  });
  console.log(`\nScenario: Unexpected Expense (-€20,000):`);
  console.log(`  Net Change: €${unexpectedExpense.summary.netChange.toLocaleString()}`);
  console.log(`  Projected Balance: €${unexpectedExpense.projectedBalance.toLocaleString()}`);
  console.log(`  Difference: €${(unexpectedExpense.projectedBalance - baseline.projectedBalance).toLocaleString()}`);
}

/**
 * Example 8: Comparing Different Forecast Periods
 */
export async function example8_compareForecastPeriods(
  cashFlowPredictor: CashFlowPredictorService,
  organisationId: string,
) {
  console.log('=== Forecast Period Comparison ===');

  const periods = [30, 60, 90, 180];

  for (const days of periods) {
    const forecast = await cashFlowPredictor.predictCashFlow(organisationId, days);

    console.log(`\n${days} Days (${Math.round(days / 30)} months):`);
    console.log(`  Projected Balance: €${forecast.projectedBalance.toLocaleString()}`);
    console.log(`  Net Change: €${forecast.summary.netChange.toLocaleString()}`);
    console.log(`  Confidence: ${forecast.confidence}%`);
    console.log(`  Alerts: ${forecast.alerts.length}`);
  }
}

/**
 * Example 9: Integration with Dashboard
 */
export async function example9_dashboardData(
  cashFlowPredictor: CashFlowPredictorService,
  organisationId: string,
) {
  // Fetch all data for dashboard
  const [forecast30, runway] = await Promise.all([
    cashFlowPredictor.predictCashFlow(organisationId, 30),
    cashFlowPredictor.calculateRunway(organisationId),
  ]);

  // Return dashboard-ready data
  return {
    currentBalance: forecast30.currentBalance,
    projectedBalance30: forecast30.projectedBalance,
    netChange30: forecast30.summary.netChange,
    confidence: forecast30.confidence,

    runway: {
      months: runway.runwayMonths,
      status: runway.status,
      burnRate: runway.monthlyBurnRate,
    },

    alerts: forecast30.alerts.map(alert => ({
      severity: alert.severity,
      message: alert.message,
      actionRequired: alert.actionRequired,
    })),

    lowestPoint: {
      date: forecast30.lowestPoint.date,
      balance: forecast30.lowestPoint.projectedBalance,
      daysFromNow: forecast30.lowestPoint.daysFromNow,
      isCritical: forecast30.lowestPoint.isCritical,
    },

    chartData: forecast30.dailyProjections.map(day => ({
      date: day.date.toISOString().split('T')[0],
      balance: day.closingBalance,
      inflows: day.inflows,
      outflows: day.outflows,
    })),
  };
}

/**
 * Example 10: API Controller Integration
 */
export class CashFlowController {
  constructor(private readonly cashFlowPredictor: CashFlowPredictorService) {}

  // GET /api/cash-flow/forecast?days=90
  async getForecast(organisationId: string, days = 30) {
    return this.cashFlowPredictor.predictCashFlow(organisationId, days);
  }

  // GET /api/cash-flow/runway
  async getRunway(organisationId: string) {
    return this.cashFlowPredictor.calculateRunway(organisationId);
  }

  // GET /api/cash-flow/projections?days=30
  async getProjections(organisationId: string, days = 30) {
    return this.cashFlowPredictor.getDailyProjections(organisationId, days);
  }

  // GET /api/cash-flow/lowest-point?days=60
  async getLowestPoint(organisationId: string, days = 60) {
    return this.cashFlowPredictor.getLowestCashPoint(organisationId, days);
  }

  // POST /api/cash-flow/scenario
  async analyzeScenario(organisationId: string, scenario: any) {
    return this.cashFlowPredictor.getScenarioAnalysis(organisationId, scenario);
  }
}

/**
 * Helper Functions
 */

function groupByMonth(dailyProjections: any[]) {
  const months = new Map();

  dailyProjections.forEach(day => {
    const monthKey = day.date.toISOString().substring(0, 7); // YYYY-MM

    if (!months.has(monthKey)) {
      months.set(monthKey, {
        monthName: day.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        totalInflows: 0,
        totalOutflows: 0,
        net: 0,
      });
    }

    const month = months.get(monthKey);
    month.totalInflows += day.inflows;
    month.totalOutflows += day.outflows;
    month.net += (day.inflows - day.outflows);
  });

  return Array.from(months.values());
}

function getRunwayStatusEmoji(status: string): string {
  switch (status) {
    case 'healthy': return '✅';
    case 'caution': return '⚠️';
    case 'critical': return '🚨';
    default: return 'ℹ️';
  }
}
