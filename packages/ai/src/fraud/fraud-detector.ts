/**
 * Fraud Detector Engine
 *
 * Main fraud detection orchestrator that runs all checks
 * and generates comprehensive fraud alerts.
 */

import { v4 as uuidv4 } from 'uuid';

import { AnomalyDetector } from './detectors/anomaly-detector';
import { DuplicateDetector } from './detectors/duplicate-detector';
import { PatternAnalyzer } from './detectors/pattern-analyzer';
import { ThresholdMonitor } from './detectors/threshold-monitor';
import { VelocityChecker } from './detectors/velocity-checker';
import {
  evaluateRules,
  shouldAutoBlock,
} from './rules/fraud-rules';
import { getCategoryThreshold } from './rules/thresholds';
import {
  Transaction,
  FraudCheckResult,
  FraudAlert,
  FraudAlertStatus,
  FraudAlertSeverity,
  FraudAlertType,
  RecommendedAction,
  FraudEvidence,
  FraudPreventionConfig,
} from './types';

/**
 * Default conservative configuration
 */
const DEFAULT_CONFIG: FraudPreventionConfig = {
  duplicateScoreThreshold: 0.6,
  anomalyStdDeviationThreshold: 2,
  velocityIncreaseThreshold: 1.5,
  autoBlockDuplicateScore: 0.95,
  autoBlockSeverity: FraudAlertSeverity.CRITICAL,
  requireReviewAbove: 100000, // €1,000
  requireReviewForCategories: ['VEHICLE_BUSINESS', 'TRAVEL_BUSINESS'],
  logAllChecks: true,
  retainAlertsForYears: 10,
  roundAmountThreshold: 0.5,
  weekendRatioThreshold: 0.3,
  merchantConcentrationThreshold: 0.7,
  endOfMonthDays: 5,
  yearEndDays: 14,
};

export class FraudDetector {
  private duplicateDetector: DuplicateDetector;
  private thresholdMonitor: ThresholdMonitor;
  private patternAnalyzer: PatternAnalyzer;
  private anomalyDetector: AnomalyDetector;
  private velocityChecker: VelocityChecker;
  private config: FraudPreventionConfig;

  constructor(config: Partial<FraudPreventionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.duplicateDetector = new DuplicateDetector();
    this.thresholdMonitor = new ThresholdMonitor();
    this.patternAnalyzer = new PatternAnalyzer();
    this.anomalyDetector = new AnomalyDetector();
    this.velocityChecker = new VelocityChecker();
  }

  /**
   * Check a single transaction for fraud signals
   */
  public async checkTransaction(
    transaction: Transaction,
    history: Transaction[],
    countryCode: string = 'DE',
  ): Promise<FraudCheckResult> {
    const checksPerformed: string[] = [];
    const alerts: FraudAlert[] = [];

    // 1. Duplicate Detection
    checksPerformed.push('duplicate_detection');
    const duplicateCheck = this.duplicateDetector.detectDuplicates(
      transaction,
      history,
    );

    if (duplicateCheck.isDuplicate) {
      const duplicateAlerts = this.createDuplicateAlerts(
        transaction,
        duplicateCheck,
      );
      alerts.push(...duplicateAlerts);
    }

    // 2. Threshold Monitoring
    let thresholdStatus;
    if (transaction.categoryCode) {
      checksPerformed.push('threshold_monitoring');
      const thresholdConfig = getCategoryThreshold(
        countryCode,
        transaction.categoryCode,
      );

      if (thresholdConfig) {
        thresholdStatus = this.thresholdMonitor.checkThresholds(
          transaction,
          thresholdConfig,
          history,
        );

        if (thresholdStatus.hasExceeded || thresholdStatus.hasWarning) {
          const thresholdAlerts = this.createThresholdAlerts(
            transaction,
            thresholdStatus,
          );
          alerts.push(...thresholdAlerts);
        }
      }
    }

    // 3. Anomaly Detection
    checksPerformed.push('anomaly_detection');
    const anomalyScore = this.anomalyDetector.detectAnomaly(
      transaction,
      history,
    );

    if (anomalyScore.isAnomaly) {
      const anomalyAlerts = this.createAnomalyAlerts(
        transaction,
        anomalyScore,
      );
      alerts.push(...anomalyAlerts);
    }

    // 4. Velocity Check
    checksPerformed.push('velocity_check');
    const velocityCheck = this.velocityChecker.checkVelocity(
      transaction.date,
      history,
    );

    if (velocityCheck.isSpike) {
      const velocityAlerts = this.createVelocityAlerts(
        transaction,
        velocityCheck,
      );
      alerts.push(...velocityAlerts);
    }

    // 5. Pattern Analysis (on full history including current)
    checksPerformed.push('pattern_analysis');
    const allTransactions = [...history, transaction];
    const patterns = this.patternAnalyzer.analyzePatterns(allTransactions);

    const patternAlerts = this.createPatternAlerts(transaction, patterns);
    alerts.push(...patternAlerts);

    // 6. Evaluate all rules
    const matchedRules = evaluateRules({
      duplicateCheck,
      thresholdStatus,
      patterns,
      anomalyScore,
      velocityCheck,
      transactionAmount: transaction.amount,
      categoryCode: transaction.categoryCode,
    });

    // 7. Determine overall recommendation
    const recommendedAction = this.determineRecommendedAction(
      alerts,
      matchedRules,
      transaction,
    );

    const blockedBySystem = recommendedAction === RecommendedAction.BLOCK;

    return {
      transactionId: transaction.id,
      hasFraudSignals: alerts.length > 0,
      duplicateCheck,
      thresholdStatus,
      anomalyScore,
      velocityCheck,
      alerts,
      recommendedAction,
      blockedBySystem,
      checkedAt: new Date(),
      checksPerformed,
    };
  }

  /**
   * Check multiple transactions in batch
   */
  public async checkBatch(
    transactions: Transaction[],
    history: Transaction[],
    countryCode: string = 'DE',
  ): Promise<FraudCheckResult[]> {
    const results: FraudCheckResult[] = [];

    // Process each transaction
    for (const transaction of transactions) {
      const result = await this.checkTransaction(
        transaction,
        [...history, ...results.map((r) => transactions.find((t) => t.id === r.transactionId)!)],
        countryCode,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Create alerts for duplicate detection
   */
  private createDuplicateAlerts(
    transaction: Transaction,
    duplicateCheck: any,
  ): FraudAlert[] {
    const alerts: FraudAlert[] = [];

    const evidence: FraudEvidence[] = [];
    if (duplicateCheck.sameAmount) {
      evidence.push({
        type: 'same_amount',
        value: `€${(transaction.amount / 100).toFixed(2)}`,
        explanation: 'Transaction has identical amount to previous transaction',
      });
    }
    if (duplicateCheck.sameDate) {
      const dateStr = new Date(transaction.date).toISOString().split('T')[0] || '';
      evidence.push({
        type: 'same_date',
        value: dateStr,
        explanation: 'Transaction occurred on same date',
      });
    }
    if (duplicateCheck.sameDescription) {
      evidence.push({
        type: 'same_description',
        value: transaction.description,
        explanation: 'Transaction has identical description',
      });
    }

    const severity = duplicateCheck.duplicateScore >= 0.95
      ? FraudAlertSeverity.CRITICAL
      : duplicateCheck.duplicateScore >= 0.75
      ? FraudAlertSeverity.HIGH
      : FraudAlertSeverity.WARNING;

    alerts.push({
      id: uuidv4(),
      type: FraudAlertType.DUPLICATE_TRANSACTION,
      severity,
      transactionId: transaction.id,
      orgId: transaction.orgId,
      title: 'Possible duplicate transaction',
      description: this.duplicateDetector.getExplanation(duplicateCheck),
      evidence,
      status: FraudAlertStatus.PENDING,
      createdAt: new Date(),
      recommendedAction: severity === FraudAlertSeverity.CRITICAL
        ? RecommendedAction.BLOCK
        : RecommendedAction.REVIEW,
      autoResolved: false,
    });

    return alerts;
  }

  /**
   * Create alerts for threshold violations
   */
  private createThresholdAlerts(
    transaction: Transaction,
    thresholdStatus: any,
  ): FraudAlert[] {
    const alerts: FraudAlert[] = [];

    const evidence: FraudEvidence[] = [
      {
        type: 'category',
        value: thresholdStatus.categoryCode,
        explanation: `Category: ${thresholdStatus.categoryCode}`,
      },
    ];

    if (thresholdStatus.hasExceeded) {
      alerts.push({
        id: uuidv4(),
        type: FraudAlertType.THRESHOLD_EXCEEDED,
        severity: FraudAlertSeverity.CRITICAL,
        transactionId: transaction.id,
        orgId: transaction.orgId,
        title: 'Spending threshold exceeded',
        description: this.thresholdMonitor.getExplanation(thresholdStatus),
        evidence,
        status: FraudAlertStatus.PENDING,
        createdAt: new Date(),
        recommendedAction: RecommendedAction.BLOCK,
        autoResolved: false,
      });
    } else if (thresholdStatus.hasWarning) {
      alerts.push({
        id: uuidv4(),
        type: FraudAlertType.THRESHOLD_APPROACHING,
        severity: FraudAlertSeverity.WARNING,
        transactionId: transaction.id,
        orgId: transaction.orgId,
        title: 'Approaching spending threshold',
        description: this.thresholdMonitor.getExplanation(thresholdStatus),
        evidence,
        status: FraudAlertStatus.PENDING,
        createdAt: new Date(),
        recommendedAction: RecommendedAction.WARN,
        autoResolved: false,
      });
    }

    return alerts;
  }

  /**
   * Create alerts for anomalies
   */
  private createAnomalyAlerts(
    transaction: Transaction,
    anomalyScore: any,
  ): FraudAlert[] {
    const alerts: FraudAlert[] = [];

    const evidence: FraudEvidence[] = [
      {
        type: 'anomaly_score',
        value: anomalyScore.score.toFixed(2),
        explanation: anomalyScore.reason,
      },
    ];

    const severity = anomalyScore.score > 0.8 ? FraudAlertSeverity.HIGH : FraudAlertSeverity.WARNING;

    alerts.push({
      id: uuidv4(),
      type: FraudAlertType.UNUSUAL_AMOUNT,
      severity,
      transactionId: transaction.id,
      orgId: transaction.orgId,
      title: 'Unusual transaction amount',
      description: anomalyScore.reason,
      evidence,
      status: FraudAlertStatus.PENDING,
      createdAt: new Date(),
      recommendedAction: severity === FraudAlertSeverity.HIGH
        ? RecommendedAction.REVIEW
        : RecommendedAction.WARN,
      autoResolved: false,
    });

    return alerts;
  }

  /**
   * Create alerts for velocity spikes
   */
  private createVelocityAlerts(
    transaction: Transaction,
    velocityCheck: any,
  ): FraudAlert[] {
    const alerts: FraudAlert[] = [];

    const evidence: FraudEvidence[] = [
      {
        type: 'velocity_rate',
        value: `${velocityCheck.currentRate.toFixed(2)} per day`,
        explanation: `Current rate: ${velocityCheck.currentRate.toFixed(2)} per day (was ${velocityCheck.historicalRate.toFixed(2)})`,
      },
    ];

    const severity = velocityCheck.accelerationRate > 2.5 ? FraudAlertSeverity.HIGH : FraudAlertSeverity.WARNING;

    alerts.push({
      id: uuidv4(),
      type: FraudAlertType.VELOCITY_SPIKE,
      severity,
      transactionId: transaction.id,
      orgId: transaction.orgId,
      title: 'Transaction velocity spike',
      description: this.velocityChecker.getExplanation(velocityCheck),
      evidence,
      status: FraudAlertStatus.PENDING,
      createdAt: new Date(),
      recommendedAction: RecommendedAction.REVIEW,
      autoResolved: false,
    });

    return alerts;
  }

  /**
   * Create alerts for pattern anomalies
   */
  private createPatternAlerts(
    transaction: Transaction,
    patterns: any,
  ): FraudAlert[] {
    const alerts: FraudAlert[] = [];

    // Round amounts
    if (patterns.roundAmountRatio > this.config.roundAmountThreshold) {
      alerts.push({
        id: uuidv4(),
        type: FraudAlertType.ROUND_AMOUNT_PATTERN,
        severity: FraudAlertSeverity.WARNING,
        transactionId: transaction.id,
        orgId: transaction.orgId,
        title: 'High percentage of round amounts',
        description: `${(patterns.roundAmountRatio * 100).toFixed(0)}% of transactions are round amounts`,
        evidence: [
          {
            type: 'pattern',
            value: `${(patterns.roundAmountRatio * 100).toFixed(0)}%`,
            explanation: 'Percentage of round-amount transactions',
          },
        ],
        status: FraudAlertStatus.PENDING,
        createdAt: new Date(),
        recommendedAction: RecommendedAction.WARN,
        autoResolved: false,
      });
    }

    // Year-end spike
    if (patterns.yearEndSpike && patterns.accelerationRate > 2) {
      alerts.push({
        id: uuidv4(),
        type: FraudAlertType.TIMING_ANOMALY,
        severity: FraudAlertSeverity.HIGH,
        transactionId: transaction.id,
        orgId: transaction.orgId,
        title: 'Year-end spending spike',
        description: 'Unusual concentration of transactions near year end',
        evidence: [
          {
            type: 'timing',
            value: 'Year-end',
            explanation: `Transaction rate increased by ${(patterns.accelerationRate * 100).toFixed(0)}%`,
          },
        ],
        status: FraudAlertStatus.PENDING,
        createdAt: new Date(),
        recommendedAction: RecommendedAction.REVIEW,
        autoResolved: false,
      });
    }

    return alerts;
  }

  /**
   * Determine overall recommended action
   */
  private determineRecommendedAction(
    alerts: FraudAlert[],
    matchedRules: any[],
    transaction: Transaction,
  ): RecommendedAction {
    // Auto-block on critical alerts
    if (shouldAutoBlock(matchedRules)) {
      return RecommendedAction.BLOCK;
    }

    // Block on critical severity
    if (alerts.some((a) => a.severity === FraudAlertSeverity.CRITICAL)) {
      return RecommendedAction.BLOCK;
    }

    // Review on high severity or large amounts
    if (
      alerts.some((a) => a.severity === FraudAlertSeverity.HIGH) ||
      transaction.amount > this.config.requireReviewAbove
    ) {
      return RecommendedAction.REVIEW;
    }

    // Warn on any alerts
    if (alerts.length > 0) {
      return RecommendedAction.WARN;
    }

    return RecommendedAction.ALLOW;
  }
}
