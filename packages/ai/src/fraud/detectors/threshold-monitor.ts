/**
 * Threshold Monitor
 *
 * Monitors spending against category-specific thresholds.
 * Warns when approaching limits and blocks when exceeded.
 */

import { ThresholdConfig, ThresholdStatus, Transaction } from '../types';

export class ThresholdMonitor {
  /**
   * Check current usage against thresholds
   */
  public checkThresholds(
    transaction: Transaction,
    config: ThresholdConfig,
    history: Transaction[],
  ): ThresholdStatus {
    const now = transaction.date;
    const categoryTransactions = history.filter(
      (t) => t.categoryCode === transaction.categoryCode,
    );

    // Calculate usage for different periods
    const dailyUsage = this.calculateDailyUsage(
      categoryTransactions,
      now,
      transaction.amount,
    );
    const monthlyUsage = this.calculateMonthlyUsage(
      categoryTransactions,
      now,
      transaction.amount,
    );
    const annualUsage = this.calculateAnnualUsage(
      categoryTransactions,
      now,
      transaction.amount,
    );

    // Calculate percentages
    const dailyPercentage = config.dailyLimit
      ? dailyUsage / config.dailyLimit
      : 0;
    const monthlyPercentage = config.monthlyLimit
      ? monthlyUsage / config.monthlyLimit
      : 0;
    const annualPercentage = config.annualLimit
      ? annualUsage / config.annualLimit
      : 0;

    // Check for warnings and exceedances
    const hasWarning = this.hasWarning(
      dailyPercentage,
      monthlyPercentage,
      annualPercentage,
      config.warningThreshold,
    );

    const { hasExceeded, limitType } = this.hasExceeded(
      transaction.amount,
      dailyPercentage,
      monthlyPercentage,
      annualPercentage,
      config,
    );

    return {
      categoryCode: config.categoryCode,
      config,
      dailyUsage,
      monthlyUsage,
      annualUsage,
      dailyPercentage,
      monthlyPercentage,
      annualPercentage,
      hasWarning,
      hasExceeded,
      limitType,
    };
  }

  /**
   * Calculate daily usage including the new transaction
   */
  private calculateDailyUsage(
    transactions: Transaction[],
    date: Date,
    newAmount: number,
  ): number {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startOfDay && tDate <= endOfDay;
    });

    const existingUsage = dailyTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    return existingUsage + newAmount;
  }

  /**
   * Calculate monthly usage including the new transaction
   */
  private calculateMonthlyUsage(
    transactions: Transaction[],
    date: Date,
    newAmount: number,
  ): number {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const monthlyTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startOfMonth && tDate <= endOfMonth;
    });

    const existingUsage = monthlyTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    return existingUsage + newAmount;
  }

  /**
   * Calculate annual usage including the new transaction
   */
  private calculateAnnualUsage(
    transactions: Transaction[],
    date: Date,
    newAmount: number,
  ): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const endOfYear = new Date(date.getFullYear(), 11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    const annualTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startOfYear && tDate <= endOfYear;
    });

    const existingUsage = annualTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    return existingUsage + newAmount;
  }

  /**
   * Check if any threshold warning should be triggered
   */
  private hasWarning(
    dailyPercentage: number,
    monthlyPercentage: number,
    annualPercentage: number,
    warningThreshold: number,
  ): boolean {
    return (
      dailyPercentage >= warningThreshold ||
      monthlyPercentage >= warningThreshold ||
      annualPercentage >= warningThreshold
    );
  }

  /**
   * Check if any threshold has been exceeded
   */
  private hasExceeded(
    transactionAmount: number,
    dailyPercentage: number,
    monthlyPercentage: number,
    annualPercentage: number,
    config: ThresholdConfig,
  ): { hasExceeded: boolean; limitType?: ThresholdStatus['limitType'] } {
    // Check per-transaction limit
    if (
      config.perTransactionLimit &&
      transactionAmount > config.perTransactionLimit
    ) {
      return { hasExceeded: true, limitType: 'per_transaction' };
    }

    // Check daily limit
    if (dailyPercentage > 1.0) {
      return { hasExceeded: true, limitType: 'daily' };
    }

    // Check monthly limit
    if (monthlyPercentage > 1.0) {
      return { hasExceeded: true, limitType: 'monthly' };
    }

    // Check annual limit
    if (annualPercentage > 1.0) {
      return { hasExceeded: true, limitType: 'annual' };
    }

    return { hasExceeded: false };
  }

  /**
   * Get explanation for threshold status
   */
  public getExplanation(status: ThresholdStatus): string {
    const parts: string[] = [];

    if (status.hasExceeded) {
      const limitType = status.limitType || 'unknown';
      const limitConfig = this.getLimitFromConfig(
        status.config,
        status.limitType,
      );
      const usage = this.getUsageForLimitType(status, status.limitType);

      parts.push(
        `EXCEEDED ${limitType} limit: ${this.formatAmount(usage)} / ${this.formatAmount(limitConfig || 0)}`,
      );
    } else if (status.hasWarning) {
      // Find which threshold triggered the warning
      if (
        status.config.dailyLimit &&
        status.dailyPercentage >= status.config.warningThreshold
      ) {
        parts.push(
          `Daily: ${(status.dailyPercentage * 100).toFixed(0)}% of ${this.formatAmount(status.config.dailyLimit)}`,
        );
      }
      if (
        status.config.monthlyLimit &&
        status.monthlyPercentage >= status.config.warningThreshold
      ) {
        parts.push(
          `Monthly: ${(status.monthlyPercentage * 100).toFixed(0)}% of ${this.formatAmount(status.config.monthlyLimit)}`,
        );
      }
      if (
        status.config.annualLimit &&
        status.annualPercentage >= status.config.warningThreshold
      ) {
        parts.push(
          `Annual: ${(status.annualPercentage * 100).toFixed(0)}% of ${this.formatAmount(status.config.annualLimit)}`,
        );
      }
    } else {
      parts.push('Within all limits');
    }

    return parts.join('; ');
  }

  /**
   * Get limit value from config for specific limit type
   */
  private getLimitFromConfig(
    config: ThresholdConfig,
    limitType?: ThresholdStatus['limitType'],
  ): number | undefined {
    switch (limitType) {
      case 'daily':
        return config.dailyLimit;
      case 'monthly':
        return config.monthlyLimit;
      case 'annual':
        return config.annualLimit;
      case 'per_transaction':
        return config.perTransactionLimit;
      default:
        return undefined;
    }
  }

  /**
   * Get usage for specific limit type
   */
  private getUsageForLimitType(
    status: ThresholdStatus,
    limitType?: ThresholdStatus['limitType'],
  ): number {
    switch (limitType) {
      case 'daily':
        return status.dailyUsage;
      case 'monthly':
        return status.monthlyUsage;
      case 'annual':
        return status.annualUsage;
      default:
        return 0;
    }
  }

  /**
   * Format amount (cents to currency)
   */
  private formatAmount(cents: number): string {
    return `€${(cents / 100).toFixed(2)}`;
  }

  /**
   * Get remaining budget for a category
   */
  public getRemainingBudget(status: ThresholdStatus): {
    daily?: number;
    monthly?: number;
    annual?: number;
  } {
    return {
      daily: status.config.dailyLimit
        ? Math.max(0, status.config.dailyLimit - status.dailyUsage)
        : undefined,
      monthly: status.config.monthlyLimit
        ? Math.max(0, status.config.monthlyLimit - status.monthlyUsage)
        : undefined,
      annual: status.config.annualLimit
        ? Math.max(0, status.config.annualLimit - status.annualUsage)
        : undefined,
    };
  }
}
