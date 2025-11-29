/**
 * Fraud Detection System Types
 *
 * Conservative fraud prevention for tax deduction claims.
 * Prefers false positives to protect users from accidental fraud.
 */

export enum FraudAlertType {
  DUPLICATE_TRANSACTION = 'duplicate_transaction',
  DUPLICATE_DEDUCTION = 'duplicate_deduction',
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  THRESHOLD_APPROACHING = 'threshold_approaching',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  UNUSUAL_AMOUNT = 'unusual_amount',
  VELOCITY_SPIKE = 'velocity_spike',
  CATEGORY_ANOMALY = 'category_anomaly',
  TIMING_ANOMALY = 'timing_anomaly',
  ROUND_AMOUNT_PATTERN = 'round_amount_pattern',
}

export enum FraudAlertSeverity {
  INFO = 'info',           // Just informational
  WARNING = 'warning',     // Should review
  HIGH = 'high',           // Likely issue, block until reviewed
  CRITICAL = 'critical',   // Almost certain fraud, require approval
}

export enum FraudAlertStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
  CONFIRMED = 'confirmed',
}

export enum RecommendedAction {
  BLOCK = 'block',
  REVIEW = 'review',
  WARN = 'warn',
  ALLOW = 'allow',
}

export interface FraudEvidence {
  type: string;
  value: string;
  explanation: string;
}

export interface FraudAlert {
  id: string;
  type: FraudAlertType;
  severity: FraudAlertSeverity;

  // Context
  transactionId?: string;
  deductionId?: string;
  orgId: string;

  // Details
  title: string;
  description: string;
  evidence: FraudEvidence[];

  // Status
  status: FraudAlertStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;

  // Audit
  createdAt: Date;

  // Recommendations
  recommendedAction: RecommendedAction;
  autoResolved: boolean;
}

export interface DuplicateCheck {
  // Exact duplicates
  sameAmount: boolean;
  sameDate: boolean;
  sameDescription: boolean;
  sameCounterparty: boolean;

  // Near duplicates
  similarAmount: boolean;      // Within 5%
  proximateDate: boolean;      // Within 7 days
  similarDescription: boolean; // Levenshtein distance < 3

  // Scoring
  duplicateScore: number;      // 0-1, higher = more likely duplicate
  isDuplicate: boolean;
  matchedTransactionId?: string;
}

export interface ThresholdConfig {
  countryCode: string;
  categoryCode: string;

  // Limits (in cents/minor units)
  dailyLimit?: number;
  monthlyLimit?: number;
  annualLimit?: number;
  perTransactionLimit?: number;

  // Warnings
  warningThreshold: number;    // e.g., 0.8 = warn at 80%
}

export interface ThresholdStatus {
  categoryCode: string;
  config: ThresholdConfig;

  // Current usage (in cents/minor units)
  dailyUsage: number;
  monthlyUsage: number;
  annualUsage: number;

  // Percentages
  dailyPercentage: number;
  monthlyPercentage: number;
  annualPercentage: number;

  // Alerts
  hasWarning: boolean;
  hasExceeded: boolean;
  limitType?: 'daily' | 'monthly' | 'annual' | 'per_transaction';
}

export interface PatternCheck {
  // Suspicious patterns
  roundAmountRatio: number;     // % of transactions that are round amounts
  weekendTransactionRatio: number;
  endOfMonthSpike: boolean;
  yearEndSpike: boolean;

  // Statistical anomalies
  amountStdDeviation: number;
  categoryDistributionAnomaly: boolean;
  merchantConcentration: number; // % from single merchant

  // Velocity
  transactionsPerDay: number;
  transactionsPerWeek: number;
  accelerationRate: number;     // Change in velocity
}

export interface AnomalyScore {
  score: number;               // 0-1, higher = more anomalous
  isAnomaly: boolean;
  reason: string;
  comparisonValue?: number;
  normalRange?: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
  };
}

export interface VelocityCheck {
  currentRate: number;         // Transactions per day
  historicalRate: number;      // Average over last 30 days
  accelerationRate: number;    // Current / Historical
  isSpike: boolean;
  threshold: number;
}

export interface Transaction {
  id: string;
  orgId: string;
  amount: number;              // In cents/minor units
  date: Date;
  description: string;
  counterparty?: string;
  categoryCode?: string;
  merchantId?: string;
  metadata?: Record<string, any>;
}

export interface FraudCheckResult {
  transactionId: string;
  hasFraudSignals: boolean;

  // Individual checks
  duplicateCheck?: DuplicateCheck;
  thresholdStatus?: ThresholdStatus;
  anomalyScore?: AnomalyScore;
  velocityCheck?: VelocityCheck;

  // Alerts generated
  alerts: FraudAlert[];

  // Overall recommendation
  recommendedAction: RecommendedAction;
  blockedBySystem: boolean;

  // Audit
  checkedAt: Date;
  checksPerformed: string[];
}

export interface FraudStatistics {
  orgId: string;
  period: {
    start: Date;
    end: Date;
  };

  // Alert stats
  totalAlerts: number;
  alertsBySeverity: Record<FraudAlertSeverity, number>;
  alertsByType: Record<FraudAlertType, number>;

  // Review stats
  reviewedAlerts: number;
  confirmedFraud: number;
  falsePositives: number;

  // Detection effectiveness
  precision: number;           // confirmed / (confirmed + false positives)
  avgReviewTime: number;       // In hours

  // Top issues
  topCategories: Array<{
    categoryCode: string;
    alertCount: number;
  }>;
}

export interface ReviewDecision {
  decision: 'dismiss' | 'confirm';
  note?: string;
  correctedCategoryCode?: string;
  correctedAmount?: number;
}

export interface AlertFilters {
  status?: FraudAlertStatus[];
  severity?: FraudAlertSeverity[];
  type?: FraudAlertType[];
  dateFrom?: Date;
  dateTo?: Date;
  categoryCode?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FraudPreventionConfig {
  // Conservative settings
  duplicateScoreThreshold: number;      // Lower = more sensitive
  anomalyStdDeviationThreshold: number; // 2 sigma = flag
  velocityIncreaseThreshold: number;    // 50% increase = flag

  // Auto-block thresholds
  autoBlockDuplicateScore: number;     // Very high confidence
  autoBlockSeverity: FraudAlertSeverity;

  // Review requirements
  requireReviewAbove: number;          // Review amounts > this (in cents)
  requireReviewForCategories: string[];

  // Audit settings
  logAllChecks: boolean;
  retainAlertsForYears: number;        // Tax compliance

  // Pattern detection
  roundAmountThreshold: number;        // % of round amounts to flag
  weekendRatioThreshold: number;
  merchantConcentrationThreshold: number;

  // Timing
  endOfMonthDays: number;              // Last N days of month
  yearEndDays: number;                 // Last N days of year
}
