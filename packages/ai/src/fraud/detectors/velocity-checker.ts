/**
 * Velocity Checker
 *
 * Monitors transaction velocity (rate of transactions over time).
 * Detects sudden spikes in transaction frequency.
 */

import { VelocityCheck, Transaction } from '../types';

export class VelocityChecker {
  private readonly velocityThreshold: number = 1.5; // 50% increase
  private readonly lookbackDays: number = 30;

  /**
   * Check transaction velocity
   */
  public checkVelocity(
    currentDate: Date,
    history: Transaction[],
  ): VelocityCheck {
    if (history.length < 10) {
      return {
        currentRate: 0,
        historicalRate: 0,
        accelerationRate: 1,
        isSpike: false,
        threshold: this.velocityThreshold,
      };
    }

    const currentRate = this.calculateCurrentRate(currentDate, history);
    const historicalRate = this.calculateHistoricalRate(currentDate, history);

    const accelerationRate =
      historicalRate > 0 ? currentRate / historicalRate : 1;

    const isSpike = accelerationRate > this.velocityThreshold;

    return {
      currentRate,
      historicalRate,
      accelerationRate,
      isSpike,
      threshold: this.velocityThreshold,
    };
  }

  /**
   * Calculate current transaction rate (last 7 days)
   */
  private calculateCurrentRate(
    currentDate: Date,
    history: Transaction[],
  ): number {
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = history.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= sevenDaysAgo && tDate <= currentDate;
    });

    return recentTransactions.length / 7;
  }

  /**
   * Calculate historical average rate (30 days prior to last 7 days)
   */
  private calculateHistoricalRate(
    currentDate: Date,
    history: Transaction[],
  ): number {
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtySevenDaysAgo = new Date(currentDate);
    thirtySevenDaysAgo.setDate(
      thirtySevenDaysAgo.getDate() - (this.lookbackDays + 7),
    );

    const historicalTransactions = history.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= thirtySevenDaysAgo && tDate < sevenDaysAgo;
    });

    return historicalTransactions.length / this.lookbackDays;
  }

  /**
   * Get explanation for velocity check
   */
  public getExplanation(check: VelocityCheck): string {
    if (check.isSpike) {
      return `Transaction velocity spike detected: ${check.currentRate.toFixed(2)} per day (was ${check.historicalRate.toFixed(2)}) - ${((check.accelerationRate - 1) * 100).toFixed(0)}% increase`;
    }

    return `Transaction velocity normal: ${check.currentRate.toFixed(2)} per day`;
  }

  /**
   * Check velocity for specific category
   */
  public checkCategoryVelocity(
    currentDate: Date,
    categoryCode: string,
    history: Transaction[],
  ): VelocityCheck {
    const categoryHistory = history.filter(
      (t) => t.categoryCode === categoryCode,
    );

    return this.checkVelocity(currentDate, categoryHistory);
  }

  /**
   * Detect burst pattern (many transactions in short time)
   */
  public detectBurst(
    currentDate: Date,
    history: Transaction[],
    windowHours: number = 1,
  ): {
    isBurst: boolean;
    transactionCount: number;
    rate: number;
  } {
    const windowStart = new Date(currentDate);
    windowStart.setHours(windowStart.getHours() - windowHours);

    const recentTransactions = history.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= windowStart && tDate <= currentDate;
    });

    const transactionCount = recentTransactions.length;
    const rate = transactionCount / windowHours;

    // Flag if more than 5 transactions in an hour
    const isBurst = transactionCount > 5;

    return {
      isBurst,
      transactionCount,
      rate,
    };
  }

  /**
   * Calculate momentum (rate of change in velocity)
   */
  public calculateMomentum(
    currentDate: Date,
    history: Transaction[],
  ): {
    momentum: number;
    isAccelerating: boolean;
  } {
    if (history.length < 30) {
      return {
        momentum: 0,
        isAccelerating: false,
      };
    }

    // Split into three periods
    const period1End = new Date(currentDate);
    period1End.setDate(period1End.getDate() - 7);

    const period2End = new Date(currentDate);
    period2End.setDate(period2End.getDate() - 14);

    const period3End = new Date(currentDate);
    period3End.setDate(period3End.getDate() - 21);

    const period1Rate = this.calculateRateForPeriod(
      period1End,
      currentDate,
      history,
    );
    const period2Rate = this.calculateRateForPeriod(
      period2End,
      period1End,
      history,
    );
    const period3Rate = this.calculateRateForPeriod(
      period3End,
      period2End,
      history,
    );

    // Calculate rate of change
    const change1to2 = period2Rate > 0 ? period1Rate / period2Rate : 1;
    const change2to3 = period3Rate > 0 ? period2Rate / period3Rate : 1;

    // Momentum is the acceleration of acceleration
    const momentum = change1to2 - change2to3;

    const isAccelerating = momentum > 0.2;

    return {
      momentum,
      isAccelerating,
    };
  }

  /**
   * Calculate transaction rate for a specific period
   */
  private calculateRateForPeriod(
    startDate: Date,
    endDate: Date,
    history: Transaction[],
  ): number {
    const periodTransactions = history.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    return days > 0 ? periodTransactions.length / days : 0;
  }

  /**
   * Get severity level for velocity spike
   */
  public getSeverity(check: VelocityCheck): 'low' | 'medium' | 'high' {
    if (!check.isSpike) return 'low';

    if (check.accelerationRate > 3) return 'high';
    if (check.accelerationRate > 2) return 'medium';

    return 'low';
  }
}
