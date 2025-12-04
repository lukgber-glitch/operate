/**
 * Pattern Analyzer
 *
 * Analyzes transaction patterns for suspicious activity indicators.
 * Looks for behavioral patterns that may indicate fraud.
 */

import { PatternCheck, Transaction } from '../types';

export class PatternAnalyzer {
  private readonly endOfMonthDays: number = 5;
  private readonly yearEndDays: number = 14;

  /**
   * Analyze transaction patterns for suspicious indicators
   */
  public analyzePatterns(transactions: Transaction[]): PatternCheck {
    if (transactions.length === 0) {
      return this.getEmptyPatternCheck();
    }

    // Suspicious patterns
    const roundAmountRatio = this.calculateRoundAmountRatio(transactions);
    const weekendTransactionRatio =
      this.calculateWeekendRatio(transactions);
    const endOfMonthSpike = this.detectEndOfMonthSpike(transactions);
    const yearEndSpike = this.detectYearEndSpike(transactions);

    // Statistical anomalies
    const amountStdDeviation = this.calculateAmountStdDeviation(transactions);
    const categoryDistributionAnomaly =
      this.detectCategoryDistributionAnomaly(transactions);
    const merchantConcentration =
      this.calculateMerchantConcentration(transactions);

    // Velocity metrics
    const transactionsPerDay = this.calculateTransactionsPerDay(transactions);
    const transactionsPerWeek =
      this.calculateTransactionsPerWeek(transactions);
    const accelerationRate = this.calculateAccelerationRate(transactions);

    return {
      roundAmountRatio,
      weekendTransactionRatio,
      endOfMonthSpike,
      yearEndSpike,
      amountStdDeviation,
      categoryDistributionAnomaly,
      merchantConcentration,
      transactionsPerDay,
      transactionsPerWeek,
      accelerationRate,
    };
  }

  /**
   * Calculate percentage of transactions with round amounts
   */
  private calculateRoundAmountRatio(transactions: Transaction[]): number {
    const roundAmounts = transactions.filter((t) => this.isRoundAmount(t.amount));
    return roundAmounts.length / transactions.length;
  }

  /**
   * Check if amount is suspiciously round (e.g., exactly 100.00, 50.00)
   */
  private isRoundAmount(amount: number): boolean {
    // Check if divisible by 5000 cents (50.00) or higher
    return amount % 5000 === 0 && amount >= 5000;
  }

  /**
   * Calculate percentage of weekend transactions
   */
  private calculateWeekendRatio(transactions: Transaction[]): number {
    const weekendTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });

    return weekendTransactions.length / transactions.length;
  }

  /**
   * Detect spike in transactions near end of month
   */
  private detectEndOfMonthSpike(transactions: Transaction[]): boolean {
    const endOfMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getDate();
      const dayOfMonth = date.getDate();

      return dayOfMonth > daysInMonth - this.endOfMonthDays;
    });

    const endOfMonthRatio = endOfMonthTransactions.length / transactions.length;

    // Expected ratio for last 5 days of month is ~16% (5/30)
    // Flag if significantly higher
    return endOfMonthRatio > 0.3;
  }

  /**
   * Detect spike in transactions near end of year
   */
  private detectYearEndSpike(transactions: Transaction[]): boolean {
    const yearEndTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      const month = date.getMonth();
      const day = date.getDate();

      // December 18-31 (last 14 days of year)
      return month === 11 && day > 31 - this.yearEndDays;
    });

    const yearEndRatio = yearEndTransactions.length / transactions.length;

    // Expected ratio for last 14 days is ~3.8% (14/365)
    // Flag if significantly higher
    return yearEndRatio > 0.15;
  }

  /**
   * Calculate standard deviation of transaction amounts
   */
  private calculateAmountStdDeviation(transactions: Transaction[]): number {
    const amounts = transactions.map((t) => t.amount);
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

    const squaredDiffs = amounts.map((a) => Math.pow(a - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, d) => sum + d, 0) / amounts.length;

    return Math.sqrt(variance);
  }

  /**
   * Detect anomalies in category distribution
   */
  private detectCategoryDistributionAnomaly(
    transactions: Transaction[],
  ): boolean {
    const categoryCount = new Map<string, number>();

    for (const t of transactions) {
      if (t.categoryCode) {
        categoryCount.set(
          t.categoryCode,
          (categoryCount.get(t.categoryCode) || 0) + 1,
        );
      }
    }

    // Check if one category dominates (>70%)
    const maxCategoryCount = Math.max(...Array.from(categoryCount.values()));
    const dominance = maxCategoryCount / transactions.length;

    return dominance > 0.7;
  }

  /**
   * Calculate concentration of transactions from single merchant
   */
  private calculateMerchantConcentration(
    transactions: Transaction[],
  ): number {
    const merchantCount = new Map<string, number>();

    for (const t of transactions) {
      if (t.merchantId) {
        merchantCount.set(
          t.merchantId,
          (merchantCount.get(t.merchantId) || 0) + 1,
        );
      }
    }

    if (merchantCount.size === 0) {
      return 0;
    }

    const maxMerchantCount = Math.max(...Array.from(merchantCount.values()));
    return maxMerchantCount / transactions.length;
  }

  /**
   * Calculate average transactions per day
   */
  private calculateTransactionsPerDay(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;

    const dates = transactions.map((t) => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    // If all on same day
    if (daysDiff === 0) return transactions.length;

    return transactions.length / (daysDiff + 1);
  }

  /**
   * Calculate average transactions per week
   */
  private calculateTransactionsPerWeek(transactions: Transaction[]): number {
    return this.calculateTransactionsPerDay(transactions) * 7;
  }

  /**
   * Calculate acceleration rate (recent velocity vs historical)
   */
  private calculateAccelerationRate(transactions: Transaction[]): number {
    if (transactions.length < 10) return 1; // Not enough data

    // Sort by date
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Split into two halves
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    // Calculate velocity for each half
    const firstVelocity = this.calculateTransactionsPerDay(firstHalf);
    const secondVelocity = this.calculateTransactionsPerDay(secondHalf);

    if (firstVelocity === 0) return 1;

    return secondVelocity / firstVelocity;
  }

  /**
   * Get explanation for pattern analysis
   */
  public getExplanation(patterns: PatternCheck): string[] {
    const findings: string[] = [];

    if (patterns.roundAmountRatio > 0.5) {
      findings.push(
        `${(patterns.roundAmountRatio * 100).toFixed(0)}% of transactions are round amounts`,
      );
    }

    if (patterns.weekendTransactionRatio > 0.3) {
      findings.push(
        `${(patterns.weekendTransactionRatio * 100).toFixed(0)}% of transactions on weekends`,
      );
    }

    if (patterns.endOfMonthSpike) {
      findings.push('Unusual spike in transactions at end of month');
    }

    if (patterns.yearEndSpike) {
      findings.push('Unusual spike in transactions at year end');
    }

    if (patterns.categoryDistributionAnomaly) {
      findings.push('One category dominates transaction history');
    }

    if (patterns.merchantConcentration > 0.7) {
      findings.push(
        `${(patterns.merchantConcentration * 100).toFixed(0)}% of transactions from single merchant`,
      );
    }

    if (patterns.accelerationRate > 2) {
      findings.push(
        `Transaction velocity increased by ${(patterns.accelerationRate * 100).toFixed(0)}%`,
      );
    }

    if (findings.length === 0) {
      findings.push('No suspicious patterns detected');
    }

    return findings;
  }

  /**
   * Get empty pattern check (for no transactions)
   */
  private getEmptyPatternCheck(): PatternCheck {
    return {
      roundAmountRatio: 0,
      weekendTransactionRatio: 0,
      endOfMonthSpike: false,
      yearEndSpike: false,
      amountStdDeviation: 0,
      categoryDistributionAnomaly: false,
      merchantConcentration: 0,
      transactionsPerDay: 0,
      transactionsPerWeek: 0,
      accelerationRate: 1,
    };
  }

  /**
   * Check if patterns indicate high risk
   */
  public isHighRisk(patterns: PatternCheck): boolean {
    let riskScore = 0;

    if (patterns.roundAmountRatio > 0.5) riskScore += 2;
    if (patterns.yearEndSpike && patterns.accelerationRate > 2) riskScore += 3;
    if (patterns.endOfMonthSpike && patterns.accelerationRate > 2) riskScore += 2;
    if (patterns.merchantConcentration > 0.8) riskScore += 2;
    if (patterns.categoryDistributionAnomaly) riskScore += 1;

    return riskScore >= 4;
  }
}
