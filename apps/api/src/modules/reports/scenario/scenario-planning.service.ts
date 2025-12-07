import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CashFlowPredictorService } from '../../ai/bank-intelligence/cash-flow-predictor.service';

/**
 * Scenario Planning Service
 * Enables "what-if" business analysis by modeling different financial scenarios
 * and predicting their impact on cash flow, runway, and business health.
 */

export interface Scenario {
  name: string;
  description?: string;
  changes: ScenarioChanges;
}

export interface ScenarioChanges {
  // Revenue changes
  newMonthlyRevenue?: number;
  revenueChangePercent?: number;
  lostCustomerId?: string;
  newCustomerRevenue?: number;

  // Expense changes
  newHires?: { count: number; monthlySalary: number };
  newMonthlyExpense?: { description: string; amount: number };
  removedExpense?: { description: string; amount: number };
  expenseChangePercent?: number;

  // One-time changes
  oneTimeIncome?: number;
  oneTimeExpense?: number;
}

export interface ScenarioResult {
  scenario: Scenario;
  baseline: CashFlowMetrics;
  projected: CashFlowMetrics;
  impact: {
    burnRateChange: number;
    runwayChange: number;
    monthlyNetChange: number;
    breakEvenMonths?: number;
  };
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CashFlowMetrics {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNet: number;
  burnRate: number;
  runwayMonths: number;
}

@Injectable()
export class ScenarioPlanningService {
  private readonly logger = new Logger(ScenarioPlanningService.name);

  constructor(
    private prisma: PrismaService,
    private cashFlowService: CashFlowPredictorService,
  ) {}

  /**
   * Calculate a single scenario's impact
   */
  async calculateScenario(orgId: string, scenario: Scenario): Promise<ScenarioResult> {
    this.logger.log(`Calculating scenario "${scenario.name}" for org ${orgId}`);

    // Get baseline metrics
    const baseline = await this.getBaselineMetrics(orgId);

    // Apply scenario changes
    const projected = this.applyScenarioChanges(baseline, scenario.changes);

    // Calculate impact
    const impact = this.calculateImpact(baseline, projected);

    // Generate recommendation
    const recommendation = this.generateRecommendation(baseline, projected, impact);

    // Determine risk level
    const riskLevel = this.assessRisk(projected);

    return {
      scenario,
      baseline,
      projected,
      impact,
      recommendation,
      riskLevel,
    };
  }

  /**
   * Compare multiple scenarios side-by-side
   */
  async compareScenarios(orgId: string, scenarios: Scenario[]): Promise<ScenarioResult[]> {
    this.logger.log(`Comparing ${scenarios.length} scenarios for org ${orgId}`);
    return Promise.all(scenarios.map(s => this.calculateScenario(orgId, s)));
  }

  /**
   * Get baseline financial metrics from current state
   */
  private async getBaselineMetrics(orgId: string): Promise<CashFlowMetrics> {
    try {
      const runway = await this.cashFlowService.calculateRunway(orgId);
      const forecast = await this.cashFlowService.predictCashFlow(orgId, 30);

      return {
        currentBalance: forecast.currentBalance,
        monthlyIncome: runway.averageMonthlyIncome,
        monthlyExpenses: runway.monthlyBurnRate,
        monthlyNet: runway.netMonthlyChange,
        burnRate: runway.monthlyBurnRate,
        runwayMonths: runway.runwayMonths,
      };
    } catch (error) {
      this.logger.error('Error getting baseline metrics:', error);
      // Return safe defaults if cash flow service fails
      return {
        currentBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyNet: 0,
        burnRate: 0,
        runwayMonths: 0,
      };
    }
  }

  /**
   * Apply scenario changes to baseline metrics
   */
  private applyScenarioChanges(
    baseline: CashFlowMetrics,
    changes: ScenarioChanges,
  ): CashFlowMetrics {
    let { monthlyIncome, monthlyExpenses, currentBalance } = baseline;

    // Apply revenue changes
    if (changes.newMonthlyRevenue) {
      monthlyIncome += changes.newMonthlyRevenue;
    }
    if (changes.revenueChangePercent) {
      monthlyIncome *= 1 + changes.revenueChangePercent / 100;
    }
    if (changes.newCustomerRevenue) {
      monthlyIncome += changes.newCustomerRevenue;
    }
    // Note: lostCustomerId would need DB lookup for actual revenue impact

    // Apply expense changes
    if (changes.newHires) {
      monthlyExpenses += changes.newHires.count * changes.newHires.monthlySalary;
    }
    if (changes.newMonthlyExpense) {
      monthlyExpenses += changes.newMonthlyExpense.amount;
    }
    if (changes.removedExpense) {
      monthlyExpenses -= changes.removedExpense.amount;
    }
    if (changes.expenseChangePercent) {
      monthlyExpenses *= 1 + changes.expenseChangePercent / 100;
    }

    // Apply one-time changes
    if (changes.oneTimeIncome) {
      currentBalance += changes.oneTimeIncome;
    }
    if (changes.oneTimeExpense) {
      currentBalance -= changes.oneTimeExpense;
    }

    const monthlyNet = monthlyIncome - monthlyExpenses;
    const burnRate = monthlyNet < 0 ? Math.abs(monthlyNet) : 0;
    const runwayMonths = burnRate > 0 ? currentBalance / burnRate : Infinity;

    return {
      currentBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyNet,
      burnRate,
      runwayMonths: Math.min(runwayMonths, 120), // Cap at 10 years
    };
  }

  /**
   * Calculate the delta between baseline and projected
   */
  private calculateImpact(baseline: CashFlowMetrics, projected: CashFlowMetrics) {
    const burnRateChange = projected.burnRate - baseline.burnRate;
    const runwayChange = projected.runwayMonths - baseline.runwayMonths;
    const monthlyNetChange = projected.monthlyNet - baseline.monthlyNet;

    // Calculate break-even months if currently losing money
    let breakEvenMonths: number | undefined;
    if (projected.monthlyNet < 0 && monthlyNetChange > 0) {
      // Moving in right direction
      breakEvenMonths = Math.ceil(
        Math.abs(projected.monthlyNet) / Math.abs(monthlyNetChange),
      );
    }

    return {
      burnRateChange,
      runwayChange,
      monthlyNetChange,
      breakEvenMonths,
    };
  }

  /**
   * Generate human-readable recommendation in German
   */
  private generateRecommendation(
    baseline: CashFlowMetrics,
    projected: CashFlowMetrics,
    impact: any,
  ): string {
    if (projected.runwayMonths < 1) {
      return 'KRITISCH: Diese Änderung würde zu sofortiger Liquiditätskrise führen. Nicht empfohlen.';
    }

    if (projected.runwayMonths < 3 && impact.runwayChange < 0) {
      return 'WARNUNG: Runway würde auf unter 3 Monate fallen. Zusätzliche Einnahmen oder Kostensenkungen erforderlich.';
    }

    if (impact.runwayChange > 0) {
      return `POSITIV: Diese Änderung würde den Runway um ${impact.runwayChange.toFixed(1)} Monate verlängern.`;
    }

    if (Math.abs(impact.runwayChange) < 0.5) {
      return 'NEUTRAL: Diese Änderung hat minimalen Einfluss auf die Finanzlage.';
    }

    return `VORSICHT: Runway würde sich um ${Math.abs(impact.runwayChange).toFixed(1)} Monate verkürzen.`;
  }

  /**
   * Assess risk level based on projected metrics
   */
  private assessRisk(projected: CashFlowMetrics): 'low' | 'medium' | 'high' | 'critical' {
    if (projected.runwayMonths < 1) return 'critical';
    if (projected.runwayMonths < 3) return 'high';
    if (projected.runwayMonths < 6) return 'medium';
    return 'low';
  }

  /**
   * Suggest optimizations based on scenario results
   */
  async suggestOptimizations(orgId: string): Promise<ScenarioResult[]> {
    this.logger.log(`Generating optimization suggestions for org ${orgId}`);

    const suggestions: Scenario[] = [
      {
        name: 'Kosteneinsparung 10%',
        description: 'Reduzierung der monatlichen Ausgaben um 10%',
        changes: { expenseChangePercent: -10 },
      },
      {
        name: 'Umsatzsteigerung 20%',
        description: 'Erhöhung des monatlichen Umsatzes um 20%',
        changes: { revenueChangePercent: 20 },
      },
      {
        name: 'Kombination',
        description: '10% mehr Umsatz + 5% weniger Kosten',
        changes: {
          revenueChangePercent: 10,
          expenseChangePercent: -5,
        },
      },
    ];

    return this.compareScenarios(orgId, suggestions);
  }
}
