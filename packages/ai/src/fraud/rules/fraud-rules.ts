/**
 * Fraud Detection Rules
 *
 * Pattern-based rules for identifying suspicious activity.
 * Conservative approach: better to flag for review than miss fraud.
 */

import {
  FraudAlertType,
  FraudAlertSeverity,
  PatternCheck,
  DuplicateCheck,
  ThresholdStatus,
  AnomalyScore,
  VelocityCheck,
} from '../types';

export interface FraudRule {
  name: string;
  type: FraudAlertType;
  severity: FraudAlertSeverity;
  condition: (context: RuleContext) => boolean;
  title: string;
  getDescription: (context: RuleContext) => string;
}

export interface RuleContext {
  duplicateCheck?: DuplicateCheck;
  thresholdStatus?: ThresholdStatus;
  patterns?: PatternCheck;
  anomalyScore?: AnomalyScore;
  velocityCheck?: VelocityCheck;
  transactionAmount?: number;
  categoryCode?: string;
}

/**
 * All fraud detection rules
 */
export const FRAUD_RULES: FraudRule[] = [
  // Duplicate Detection Rules
  {
    name: 'high_confidence_duplicate',
    type: FraudAlertType.DUPLICATE_TRANSACTION,
    severity: FraudAlertSeverity.CRITICAL,
    condition: (ctx) =>
      !!ctx.duplicateCheck &&
      ctx.duplicateCheck.isDuplicate &&
      ctx.duplicateCheck.duplicateScore >= 0.95,
    title: 'Highly likely duplicate transaction',
    getDescription: (ctx) =>
      `This transaction appears to be an exact or near-exact duplicate (${(ctx.duplicateCheck!.duplicateScore * 100).toFixed(0)}% match). Review carefully to avoid double-claiming.`,
  },
  {
    name: 'probable_duplicate',
    type: FraudAlertType.DUPLICATE_TRANSACTION,
    severity: FraudAlertSeverity.HIGH,
    condition: (ctx) =>
      !!ctx.duplicateCheck &&
      ctx.duplicateCheck.isDuplicate &&
      ctx.duplicateCheck.duplicateScore >= 0.75,
    title: 'Probable duplicate transaction',
    getDescription: (ctx) =>
      `This transaction has significant similarities to a previous transaction (${(ctx.duplicateCheck!.duplicateScore * 100).toFixed(0)}% match). Please verify it is not a duplicate.`,
  },
  {
    name: 'possible_duplicate',
    type: FraudAlertType.DUPLICATE_TRANSACTION,
    severity: FraudAlertSeverity.WARNING,
    condition: (ctx) =>
      !!ctx.duplicateCheck &&
      ctx.duplicateCheck.isDuplicate &&
      ctx.duplicateCheck.duplicateScore >= 0.6,
    title: 'Possible duplicate transaction',
    getDescription: (ctx) =>
      `This transaction may be similar to a previous transaction (${(ctx.duplicateCheck!.duplicateScore * 100).toFixed(0)}% match). Double-check to ensure it's not a duplicate claim.`,
  },

  // Threshold Rules
  {
    name: 'threshold_exceeded',
    type: FraudAlertType.THRESHOLD_EXCEEDED,
    severity: FraudAlertSeverity.CRITICAL,
    condition: (ctx) => !!ctx.thresholdStatus && ctx.thresholdStatus.hasExceeded,
    title: 'Category spending limit exceeded',
    getDescription: (ctx) => {
      const status = ctx.thresholdStatus!;
      return `This transaction exceeds the ${status.limitType} spending limit for ${status.categoryCode}. Maximum allowed deductions may have been reached.`;
    },
  },
  {
    name: 'threshold_approaching',
    type: FraudAlertType.THRESHOLD_APPROACHING,
    severity: FraudAlertSeverity.WARNING,
    condition: (ctx) =>
      !!ctx.thresholdStatus &&
      ctx.thresholdStatus.hasWarning &&
      !ctx.thresholdStatus.hasExceeded,
    title: 'Approaching category spending limit',
    getDescription: (ctx) => {
      const status = ctx.thresholdStatus!;
      const maxPercent = Math.max(
        status.dailyPercentage,
        status.monthlyPercentage,
        status.annualPercentage,
      );
      return `You are at ${(maxPercent * 100).toFixed(0)}% of the spending limit for ${status.categoryCode}. Be cautious of additional claims.`;
    },
  },

  // Pattern Rules
  {
    name: 'round_amount_pattern',
    type: FraudAlertType.ROUND_AMOUNT_PATTERN,
    severity: FraudAlertSeverity.WARNING,
    condition: (ctx) => !!ctx.patterns && ctx.patterns.roundAmountRatio > 0.5,
    title: 'High percentage of round amounts',
    getDescription: (ctx) =>
      `${(ctx.patterns!.roundAmountRatio * 100).toFixed(0)}% of your transactions are round amounts (e.g., €50.00, €100.00). This pattern may raise questions during tax audits.`,
  },
  {
    name: 'year_end_spike',
    type: FraudAlertType.TIMING_ANOMALY,
    severity: FraudAlertSeverity.HIGH,
    condition: (ctx) =>
      !!ctx.patterns &&
      ctx.patterns.yearEndSpike &&
      ctx.patterns.accelerationRate > 2,
    title: 'Unusual year-end spending spike',
    getDescription: (ctx) =>
      `Significant increase in transactions near year end (${(ctx.patterns!.accelerationRate * 100).toFixed(0)}% acceleration). This timing pattern may be flagged during audits.`,
  },
  {
    name: 'end_of_month_spike',
    type: FraudAlertType.TIMING_ANOMALY,
    severity: FraudAlertSeverity.WARNING,
    condition: (_ctx) =>
      !!_ctx.patterns &&
      _ctx.patterns.endOfMonthSpike &&
      _ctx.patterns.accelerationRate > 1.8,
    title: 'End-of-month spending pattern',
    getDescription: (_ctx) =>
      `Unusual concentration of transactions at month end. Consider spreading expenses more evenly throughout the month.`,
  },
  {
    name: 'merchant_concentration',
    type: FraudAlertType.SUSPICIOUS_PATTERN,
    severity: FraudAlertSeverity.WARNING,
    condition: (ctx) =>
      !!ctx.patterns && ctx.patterns.merchantConcentration > 0.8,
    title: 'High concentration with single merchant',
    getDescription: (ctx) =>
      `${(ctx.patterns!.merchantConcentration * 100).toFixed(0)}% of transactions are with a single merchant. Ensure all claims are legitimate business expenses.`,
  },
  {
    name: 'weekend_business_expenses',
    type: FraudAlertType.TIMING_ANOMALY,
    severity: FraudAlertSeverity.INFO,
    condition: (ctx) =>
      !!ctx.patterns && ctx.patterns.weekendTransactionRatio > 0.4,
    title: 'High weekend transaction rate',
    getDescription: (ctx) =>
      `${(ctx.patterns!.weekendTransactionRatio * 100).toFixed(0)}% of transactions occur on weekends. Ensure these are all legitimate business expenses.`,
  },

  // Anomaly Rules
  {
    name: 'unusual_amount',
    type: FraudAlertType.UNUSUAL_AMOUNT,
    severity: FraudAlertSeverity.HIGH,
    condition: (ctx) =>
      !!ctx.anomalyScore &&
      ctx.anomalyScore.isAnomaly &&
      ctx.anomalyScore.score > 0.8,
    title: 'Highly unusual transaction amount',
    getDescription: (ctx) =>
      `This amount is significantly different from your typical transactions in this category. ${ctx.anomalyScore!.reason}`,
  },
  {
    name: 'category_anomaly',
    type: FraudAlertType.CATEGORY_ANOMALY,
    severity: FraudAlertSeverity.INFO,
    condition: (ctx) =>
      !!ctx.anomalyScore && ctx.anomalyScore.isAnomaly && ctx.anomalyScore.score > 0.5,
    title: 'Unusual category usage',
    getDescription: (ctx) => ctx.anomalyScore!.reason,
  },

  // Velocity Rules
  {
    name: 'velocity_spike',
    type: FraudAlertType.VELOCITY_SPIKE,
    severity: FraudAlertSeverity.HIGH,
    condition: (ctx) =>
      !!ctx.velocityCheck &&
      ctx.velocityCheck.isSpike &&
      ctx.velocityCheck.accelerationRate > 2.5,
    title: 'Significant increase in transaction frequency',
    getDescription: (ctx) =>
      `Transaction rate has increased by ${((ctx.velocityCheck!.accelerationRate - 1) * 100).toFixed(0)}%. This rapid acceleration may be flagged for review.`,
  },
  {
    name: 'velocity_increase',
    type: FraudAlertType.VELOCITY_SPIKE,
    severity: FraudAlertSeverity.WARNING,
    condition: (ctx) =>
      !!ctx.velocityCheck &&
      ctx.velocityCheck.isSpike &&
      ctx.velocityCheck.accelerationRate > 1.5,
    title: 'Increased transaction frequency',
    getDescription: (ctx) =>
      `Transaction rate is ${((ctx.velocityCheck!.accelerationRate - 1) * 100).toFixed(0)}% higher than usual. Monitor to ensure all claims are legitimate.`,
  },

  // Large Amount Rules
  {
    name: 'large_transaction',
    type: FraudAlertType.UNUSUAL_AMOUNT,
    severity: FraudAlertSeverity.WARNING,
    condition: (ctx) =>
      !!ctx.transactionAmount && ctx.transactionAmount > 100000, // €1,000
    title: 'Large transaction amount',
    getDescription: (ctx) =>
      `This transaction (€${(ctx.transactionAmount! / 100).toFixed(2)}) is significant. Ensure proper documentation is available.`,
  },
];

/**
 * Evaluate all rules and return matching alerts
 */
export function evaluateRules(context: RuleContext): FraudRule[] {
  return FRAUD_RULES.filter((rule) => {
    try {
      return rule.condition(context);
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error);
      return false;
    }
  });
}

/**
 * Get highest severity from multiple rules
 */
export function getHighestSeverity(
  rules: FraudRule[],
): FraudAlertSeverity {
  if (rules.length === 0) return FraudAlertSeverity.INFO;

  const severityOrder = {
    [FraudAlertSeverity.CRITICAL]: 4,
    [FraudAlertSeverity.HIGH]: 3,
    [FraudAlertSeverity.WARNING]: 2,
    [FraudAlertSeverity.INFO]: 1,
  };

  return rules.reduce<FraudAlertSeverity>((highest, rule) => {
    return severityOrder[rule.severity] > severityOrder[highest]
      ? rule.severity
      : highest;
  }, FraudAlertSeverity.INFO);
}

/**
 * Determine if transaction should be auto-blocked
 */
export function shouldAutoBlock(rules: FraudRule[]): boolean {
  return rules.some((rule) => rule.severity === FraudAlertSeverity.CRITICAL);
}
