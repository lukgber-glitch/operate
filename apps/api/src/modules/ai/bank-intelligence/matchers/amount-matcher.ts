import { MatchCriteria, DEFAULT_MATCH_CRITERIA } from '../types/invoice-matching.types';

/**
 * Result of amount matching
 */
export interface AmountMatchResult {
  matches: boolean;
  matchType: 'EXACT' | 'WITHIN_TOLERANCE' | 'PARTIAL' | 'OVERPAYMENT' | 'NO_MATCH';
  difference: number;
  confidence: number; // 0-100
  reason: string;
}

/**
 * Amount matcher utility for invoice matching
 */
export class AmountMatcher {
  private criteria: MatchCriteria;

  constructor(criteria: MatchCriteria = DEFAULT_MATCH_CRITERIA) {
    this.criteria = criteria;
  }

  /**
   * Check if payment amount matches invoice amount
   */
  matchAmount(paymentAmount: number, invoiceAmount: number): AmountMatchResult {
    const difference = paymentAmount - invoiceAmount;
    const absDifference = Math.abs(difference);
    const percentDifference = (absDifference / invoiceAmount) * 100;

    // Exact match
    if (difference === 0) {
      return {
        matches: true,
        matchType: 'EXACT',
        difference: 0,
        confidence: 100,
        reason: 'Amount matches exactly',
      };
    }

    // Calculate tolerance
    const percentTolerance = (invoiceAmount * this.criteria.amountTolerance) / 100;
    const tolerance = Math.max(percentTolerance, this.criteria.minAmountToleranceEuro);

    // Within tolerance (considering rounding, bank fees, etc.)
    if (absDifference <= tolerance) {
      return {
        matches: true,
        matchType: 'WITHIN_TOLERANCE',
        difference,
        confidence: 100 - percentDifference,
        reason: `Amount within tolerance (€${tolerance.toFixed(2)})`,
      };
    }

    // Underpayment (partial payment)
    if (difference < 0 && paymentAmount > 0) {
      const paymentPercent = (paymentAmount / invoiceAmount) * 100;
      return {
        matches: true,
        matchType: 'PARTIAL',
        difference,
        confidence: Math.min(paymentPercent, 90), // Max 90% confidence for partial
        reason: `Partial payment (${paymentPercent.toFixed(1)}% of invoice)`,
      };
    }

    // Overpayment
    if (difference > 0) {
      // Small overpayment might still be acceptable
      if (percentDifference < 5) {
        return {
          matches: true,
          matchType: 'OVERPAYMENT',
          difference,
          confidence: 85,
          reason: `Small overpayment (€${difference.toFixed(2)})`,
        };
      }
      return {
        matches: false,
        matchType: 'OVERPAYMENT',
        difference,
        confidence: 30,
        reason: `Overpayment too large (€${difference.toFixed(2)})`,
      };
    }

    // No match
    return {
      matches: false,
      matchType: 'NO_MATCH',
      difference,
      confidence: 0,
      reason: `Amount difference too large (€${absDifference.toFixed(2)})`,
    };
  }

  /**
   * Check if payment could cover multiple invoices
   */
  matchMultipleInvoices(
    paymentAmount: number,
    invoiceAmounts: number[],
  ): {
    matches: boolean;
    invoiceIndices: number[];
    totalAmount: number;
    difference: number;
    confidence: number;
  } {
    // Sort invoices by amount (largest first) for greedy matching
    const sortedInvoices = invoiceAmounts
      .map((amount, index) => ({ amount, index }))
      .sort((a, b) => b.amount - a.amount);

    // Try to find combination that matches payment
    const selected: number[] = [];
    let totalAmount = 0;

    for (const invoice of sortedInvoices) {
      if (totalAmount + invoice.amount <= paymentAmount) {
        selected.push(invoice.index);
        totalAmount += invoice.amount;
      }
    }

    const difference = paymentAmount - totalAmount;
    const absDifference = Math.abs(difference);
    const tolerance = Math.max(
      (totalAmount * this.criteria.amountTolerance) / 100,
      this.criteria.minAmountToleranceEuro,
    );

    const matches = selected.length > 1 && absDifference <= tolerance;
    const confidence = matches ? Math.max(100 - (absDifference / totalAmount) * 100, 70) : 0;

    return {
      matches,
      invoiceIndices: selected,
      totalAmount,
      difference,
      confidence,
    };
  }

  /**
   * Calculate confidence based on amount match quality
   */
  calculateAmountConfidence(paymentAmount: number, invoiceAmount: number): number {
    const result = this.matchAmount(paymentAmount, invoiceAmount);
    return result.confidence;
  }
}

/**
 * Singleton instance
 */
export const amountMatcher = new AmountMatcher();
