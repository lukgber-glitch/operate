/**
 * Amount Validator
 *
 * Validates transaction amounts against deduction limits
 */

import { DeductionRule } from '../types';

/**
 * Validation result
 */
export interface AmountValidationResult {
  isValid: boolean;
  deductibleAmount: number;
  reason?: string;
  warnings?: string[];
}

/**
 * Calculate deductible amount based on rule
 */
export function calculateDeductibleAmount(
  amount: number,
  rule: DeductionRule,
  yearToDateAmount?: number,
): AmountValidationResult {
  const warnings: string[] = [];
  let deductibleAmount = amount;

  // Apply percentage deductible
  deductibleAmount = (amount * rule.percentageDeductible) / 100;

  // Check max amount per item
  if (rule.maxAmountPerItem && amount > rule.maxAmountPerItem) {
    warnings.push(
      `Amount exceeds max per item limit of ${rule.maxAmountPerItem}. Depreciation may be required.`,
    );
    // Still calculate deductible amount, but flag for review
  }

  // Check max amount per year
  if (rule.maxAmountPerYear) {
    const currentYearTotal = (yearToDateAmount || 0) + deductibleAmount;

    if (currentYearTotal > rule.maxAmountPerYear) {
      const remaining = rule.maxAmountPerYear - (yearToDateAmount || 0);
      if (remaining <= 0) {
        return {
          isValid: false,
          deductibleAmount: 0,
          reason: `Annual limit of ${rule.maxAmountPerYear} already reached`,
        };
      }

      deductibleAmount = remaining;
      warnings.push(
        `Deductible amount limited to ${remaining} due to annual limit of ${rule.maxAmountPerYear}`,
      );
    }
  }

  return {
    isValid: true,
    deductibleAmount: Math.max(0, deductibleAmount),
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate amount is within acceptable range
 */
export function validateAmountRange(
  amount: number,
  minAmount: number = 0,
  maxAmount?: number,
): boolean {
  if (amount < minAmount) {
    return false;
  }

  if (maxAmount && amount > maxAmount) {
    return false;
  }

  return true;
}

/**
 * Check if amount requires depreciation
 */
export function requiresDepreciation(
  amount: number,
  rule: DeductionRule,
): boolean {
  if (!rule.maxAmountPerItem) {
    return false;
  }

  return amount > rule.maxAmountPerItem;
}

/**
 * Calculate year-to-date total for a rule
 */
export function calculateYearToDateTotal(
  confirmedAmounts: number[],
): number {
  return confirmedAmounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Get remaining annual allowance
 */
export function getRemainingAllowance(
  rule: DeductionRule,
  yearToDateAmount: number,
): number | null {
  if (!rule.maxAmountPerYear) {
    return null; // No limit
  }

  return Math.max(0, rule.maxAmountPerYear - yearToDateAmount);
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount);
}
