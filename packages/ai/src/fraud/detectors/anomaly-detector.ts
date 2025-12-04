/**
 * Anomaly Detector
 *
 * Detects statistical anomalies in transaction amounts.
 * Uses standard deviation to identify unusual transactions.
 */

import { AnomalyScore, Transaction } from '../types';

export class AnomalyDetector {
  private readonly stdDeviationThreshold: number = 2;

  /**
   * Detect if transaction amount is anomalous
   */
  public detectAnomaly(
    transaction: Transaction,
    history: Transaction[],
  ): AnomalyScore {
    // Filter to same category for better comparison
    const categoryHistory = history.filter(
      (t) => t.categoryCode === transaction.categoryCode,
    );

    // Need at least 5 transactions for meaningful statistics
    if (categoryHistory.length < 5) {
      return {
        score: 0,
        isAnomaly: false,
        reason: 'Insufficient historical data for anomaly detection',
      };
    }

    const stats = this.calculateStats(categoryHistory);
    const zScore = Math.abs(
      (transaction.amount - stats.mean) / stats.stdDev,
    );

    const isAnomaly = zScore > this.stdDeviationThreshold;
    const score = Math.min(zScore / 5, 1); // Normalize to 0-1

    return {
      score,
      isAnomaly,
      reason: this.getAnomalyReason(
        transaction.amount,
        stats,
        zScore,
        isAnomaly,
      ),
      comparisonValue: stats.mean,
      normalRange: {
        min: stats.mean - this.stdDeviationThreshold * stats.stdDev,
        max: stats.mean + this.stdDeviationThreshold * stats.stdDev,
        mean: stats.mean,
        stdDev: stats.stdDev,
      },
    };
  }

  /**
   * Calculate statistical measures
   */
  private calculateStats(transactions: Transaction[]): {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
  } {
    const amounts = transactions.map((t) => t.amount);

    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

    const squaredDiffs = amounts.map((a) => Math.pow(a - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, d) => sum + d, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const min = Math.min(...amounts);
    const max = Math.max(...amounts);

    return { mean, stdDev, min, max };
  }

  /**
   * Get explanation for anomaly
   */
  private getAnomalyReason(
    amount: number,
    stats: { mean: number; stdDev: number },
    zScore: number,
    isAnomaly: boolean,
  ): string {
    if (!isAnomaly) {
      return `Amount within normal range (${this.formatAmount(stats.mean - 2 * stats.stdDev)} - ${this.formatAmount(stats.mean + 2 * stats.stdDev)})`;
    }

    const direction = amount > stats.mean ? 'higher' : 'lower';
    const meanStr = this.formatAmount(stats.mean);

    return `Amount is ${zScore.toFixed(1)} standard deviations ${direction} than average (${meanStr})`;
  }

  /**
   * Detect anomalies in transaction frequency
   */
  public detectFrequencyAnomaly(
    transactions: Transaction[],
  ): AnomalyScore {
    if (transactions.length < 14) {
      return {
        score: 0,
        isAnomaly: false,
        reason: 'Insufficient data for frequency analysis',
      };
    }

    // Group by day
    const dailyCounts = this.groupByDay(transactions);
    const counts = Array.from(dailyCounts.values());

    const stats = {
      mean: counts.reduce((sum, c) => sum + c, 0) / counts.length,
      stdDev: this.calculateStdDev(counts),
      min: Math.min(...counts),
      max: Math.max(...counts),
    };

    // Check the most recent day
    const recentDay = this.getRecentDayCount(transactions);
    const zScore = Math.abs((recentDay - stats.mean) / stats.stdDev);

    const isAnomaly = zScore > this.stdDeviationThreshold;
    const score = Math.min(zScore / 5, 1);

    return {
      score,
      isAnomaly,
      reason: isAnomaly
        ? `Unusual transaction frequency: ${recentDay} transactions (avg: ${stats.mean.toFixed(1)})`
        : `Transaction frequency within normal range`,
      comparisonValue: stats.mean,
      normalRange: {
        min: stats.mean - this.stdDeviationThreshold * stats.stdDev,
        max: stats.mean + this.stdDeviationThreshold * stats.stdDev,
        mean: stats.mean,
        stdDev: stats.stdDev,
      },
    };
  }

  /**
   * Group transactions by day
   */
  private groupByDay(transactions: Transaction[]): Map<string, number> {
    const dailyCounts = new Map<string, number>();

    for (const t of transactions) {
      const date = new Date(t.date);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    }

    return dailyCounts;
  }

  /**
   * Get transaction count for the most recent day
   */
  private getRecentDayCount(transactions: Transaction[]): number {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    if (sorted.length === 0) return 0;

    const firstTransaction = sorted[0];
    if (!firstTransaction) return 0;

    const mostRecentDate = new Date(firstTransaction.date);
    const dateKey = `${mostRecentDate.getFullYear()}-${mostRecentDate.getMonth() + 1}-${mostRecentDate.getDate()}`;

    const dailyCounts = this.groupByDay(transactions);
    return dailyCounts.get(dateKey) || 0;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * Format amount (cents to currency)
   */
  private formatAmount(cents: number): string {
    return `€${(cents / 100).toFixed(2)}`;
  }

  /**
   * Detect category switching anomalies
   */
  public detectCategoryAnomaly(
    transaction: Transaction,
    history: Transaction[],
  ): AnomalyScore {
    if (!transaction.categoryCode) {
      return {
        score: 0,
        isAnomaly: false,
        reason: 'No category assigned',
      };
    }

    // Count category usage
    const categoryCount = new Map<string, number>();
    for (const t of history) {
      if (t.categoryCode) {
        categoryCount.set(
          t.categoryCode,
          (categoryCount.get(t.categoryCode) || 0) + 1,
        );
      }
    }

    const currentCategoryCount =
      categoryCount.get(transaction.categoryCode) || 0;
    const totalTransactions = history.length;

    // If category has never been used or very rarely
    const categoryUsageRate =
      totalTransactions > 0 ? currentCategoryCount / totalTransactions : 0;

    const isAnomaly = categoryUsageRate < 0.05 && totalTransactions > 20;
    const score = isAnomaly ? 0.6 : 0;

    return {
      score,
      isAnomaly,
      reason: isAnomaly
        ? `Category "${transaction.categoryCode}" rarely used (${(categoryUsageRate * 100).toFixed(1)}% of transactions)`
        : `Category usage normal`,
    };
  }
}
