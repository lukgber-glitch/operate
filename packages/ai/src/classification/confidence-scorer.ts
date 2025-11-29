/**
 * Confidence Scoring System
 * Evaluates and adjusts confidence scores for transaction classifications
 */

import { getMCCConfidenceBoost, mccMatchesCategory } from './mcc-codes';
import { ConfidenceLevel, ConfidenceThresholds, TransactionCategory } from './types';

export interface ConfidenceAdjustmentFactors {
  baseConfidence: number;
  mccCode?: string;
  predictedCategory: TransactionCategory;
  hasCounterparty: boolean;
  descriptionLength: number;
  amount: number;
}

export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  high: 0.8,
  medium: 0.5,
  low: 0.0,
};

export class ConfidenceScorer {
  private thresholds: ConfidenceThresholds;

  constructor(thresholds: ConfidenceThresholds = DEFAULT_CONFIDENCE_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Get confidence level from score
   */
  getConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= this.thresholds.high) {
      return ConfidenceLevel.HIGH;
    } else if (score >= this.thresholds.medium) {
      return ConfidenceLevel.MEDIUM;
    } else {
      return ConfidenceLevel.LOW;
    }
  }

  /**
   * Adjust confidence score based on various factors
   */
  adjustConfidence(factors: ConfidenceAdjustmentFactors): number {
    let confidence = factors.baseConfidence;

    // MCC code boost
    if (factors.mccCode) {
      const mccBoost = getMCCConfidenceBoost(factors.mccCode);
      if (mccBoost > 0 && mccMatchesCategory(factors.mccCode, factors.predictedCategory)) {
        confidence = Math.min(1.0, confidence + mccBoost);
      }
    }

    // Counterparty information boost
    if (factors.hasCounterparty) {
      confidence = Math.min(1.0, confidence + 0.05);
    }

    // Description quality boost
    if (factors.descriptionLength > 20) {
      confidence = Math.min(1.0, confidence + 0.05);
    } else if (factors.descriptionLength < 5) {
      confidence = Math.max(0.0, confidence - 0.1);
    }

    // High value transactions - reduce confidence slightly (need more scrutiny)
    if (factors.amount > 10000) {
      confidence = Math.max(0.0, confidence - 0.05);
    }

    return Math.max(0.0, Math.min(1.0, confidence));
  }

  /**
   * Check if transaction should go to review queue
   */
  needsReview(confidence: number, reviewThreshold?: number): boolean {
    const threshold = reviewThreshold || 0.7;
    return confidence < threshold;
  }

  /**
   * Calculate review priority (1-5, higher = more urgent)
   */
  calculateReviewPriority(confidence: number, amount: number): number {
    let priority = 3; // Default medium priority

    // Very low confidence
    if (confidence < 0.3) {
      priority = 5;
    } else if (confidence < 0.5) {
      priority = 4;
    }

    // High value transactions get higher priority
    if (amount > 5000) {
      priority = Math.min(5, priority + 1);
    } else if (amount > 1000) {
      priority = Math.min(5, priority + 0.5);
    }

    return Math.round(priority);
  }

  /**
   * Get confidence score description
   */
  getConfidenceDescription(confidence: number): string {
    const level = this.getConfidenceLevel(confidence);

    switch (level) {
      case ConfidenceLevel.HIGH:
        return 'High confidence - Clear category match';
      case ConfidenceLevel.MEDIUM:
        return 'Medium confidence - Likely correct but review recommended';
      case ConfidenceLevel.LOW:
        return 'Low confidence - Manual review required';
      default:
        return 'Unknown confidence level';
    }
  }
}
