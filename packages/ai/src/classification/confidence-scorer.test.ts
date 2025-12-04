/**
 * Confidence Scorer Tests
 */

import { ConfidenceScorer } from './confidence-scorer';
import { ConfidenceLevel, TransactionCategory } from './types';

describe('ConfidenceScorer', () => {
  let scorer: ConfidenceScorer;

  beforeEach(() => {
    scorer = new ConfidenceScorer();
  });

  describe('getConfidenceLevel', () => {
    it('should return HIGH for confidence >= 0.8', () => {
      expect(scorer.getConfidenceLevel(0.9)).toBe(ConfidenceLevel.HIGH);
      expect(scorer.getConfidenceLevel(0.8)).toBe(ConfidenceLevel.HIGH);
    });

    it('should return MEDIUM for confidence between 0.5 and 0.79', () => {
      expect(scorer.getConfidenceLevel(0.7)).toBe(ConfidenceLevel.MEDIUM);
      expect(scorer.getConfidenceLevel(0.5)).toBe(ConfidenceLevel.MEDIUM);
    });

    it('should return LOW for confidence < 0.5', () => {
      expect(scorer.getConfidenceLevel(0.4)).toBe(ConfidenceLevel.LOW);
      expect(scorer.getConfidenceLevel(0.0)).toBe(ConfidenceLevel.LOW);
    });
  });

  describe('adjustConfidence', () => {
    it('should boost confidence with MCC match', () => {
      const adjusted = scorer.adjustConfidence({
        baseConfidence: 0.7,
        mccCode: '7372',
        predictedCategory: TransactionCategory.SOFTWARE_SUBSCRIPTIONS,
        hasCounterparty: false,
        descriptionLength: 20,
        amount: 100,
      });

      expect(adjusted).toBeGreaterThan(0.7);
    });

    it('should boost confidence with counterparty information', () => {
      const adjusted = scorer.adjustConfidence({
        baseConfidence: 0.7,
        predictedCategory: TransactionCategory.OFFICE_SUPPLIES,
        hasCounterparty: true,
        descriptionLength: 20,
        amount: 100,
      });

      expect(adjusted).toBeGreaterThan(0.7);
    });

    it('should boost confidence with detailed description', () => {
      const adjusted = scorer.adjustConfidence({
        baseConfidence: 0.7,
        predictedCategory: TransactionCategory.OFFICE_SUPPLIES,
        hasCounterparty: false,
        descriptionLength: 50,
        amount: 100,
      });

      expect(adjusted).toBeGreaterThan(0.7);
    });

    it('should reduce confidence for very short descriptions', () => {
      const adjusted = scorer.adjustConfidence({
        baseConfidence: 0.7,
        predictedCategory: TransactionCategory.OFFICE_SUPPLIES,
        hasCounterparty: false,
        descriptionLength: 3,
        amount: 100,
      });

      expect(adjusted).toBeLessThan(0.7);
    });

    it('should reduce confidence for very high amounts', () => {
      const adjusted = scorer.adjustConfidence({
        baseConfidence: 0.7,
        predictedCategory: TransactionCategory.OFFICE_SUPPLIES,
        hasCounterparty: false,
        descriptionLength: 20,
        amount: 15000,
      });

      expect(adjusted).toBeLessThan(0.7);
    });

    it('should never exceed 1.0', () => {
      const adjusted = scorer.adjustConfidence({
        baseConfidence: 0.95,
        mccCode: '7372',
        predictedCategory: TransactionCategory.SOFTWARE_SUBSCRIPTIONS,
        hasCounterparty: true,
        descriptionLength: 50,
        amount: 100,
      });

      expect(adjusted).toBeLessThanOrEqual(1.0);
    });

    it('should never go below 0.0', () => {
      const adjusted = scorer.adjustConfidence({
        baseConfidence: 0.1,
        predictedCategory: TransactionCategory.UNKNOWN,
        hasCounterparty: false,
        descriptionLength: 2,
        amount: 20000,
      });

      expect(adjusted).toBeGreaterThanOrEqual(0.0);
    });
  });

  describe('needsReview', () => {
    it('should require review for confidence below threshold', () => {
      expect(scorer.needsReview(0.6, 0.7)).toBe(true);
    });

    it('should not require review for confidence above threshold', () => {
      expect(scorer.needsReview(0.8, 0.7)).toBe(false);
    });

    it('should use default threshold if not provided', () => {
      expect(scorer.needsReview(0.6)).toBe(true);
    });
  });

  describe('calculateReviewPriority', () => {
    it('should assign priority 5 for very low confidence', () => {
      const priority = scorer.calculateReviewPriority(0.2, 100);
      expect(priority).toBe(5);
    });

    it('should assign priority 4 for low confidence', () => {
      const priority = scorer.calculateReviewPriority(0.4, 100);
      expect(priority).toBe(4);
    });

    it('should increase priority for high value transactions', () => {
      const lowValue = scorer.calculateReviewPriority(0.6, 100);
      const highValue = scorer.calculateReviewPriority(0.6, 6000);
      expect(highValue).toBeGreaterThan(lowValue);
    });

    it('should never exceed priority 5', () => {
      const priority = scorer.calculateReviewPriority(0.1, 100000);
      expect(priority).toBeLessThanOrEqual(5);
    });

    it('should never be below priority 1', () => {
      const priority = scorer.calculateReviewPriority(0.99, 10);
      expect(priority).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getConfidenceDescription', () => {
    it('should return high confidence description', () => {
      const desc = scorer.getConfidenceDescription(0.9);
      expect(desc).toContain('High confidence');
    });

    it('should return medium confidence description', () => {
      const desc = scorer.getConfidenceDescription(0.6);
      expect(desc).toContain('Medium confidence');
    });

    it('should return low confidence description', () => {
      const desc = scorer.getConfidenceDescription(0.3);
      expect(desc).toContain('Low confidence');
    });
  });
});
