/**
 * MCC Codes Tests
 */

import {
  getCategoryFromMCC,
  getMCCConfidenceBoost,
  mccMatchesCategory,
} from './mcc-codes';
import { TransactionCategory } from './types';

describe('MCC Codes', () => {
  describe('getCategoryFromMCC', () => {
    it('should return correct category for software MCC', () => {
      const category = getCategoryFromMCC('7372');
      expect(category).toBe(TransactionCategory.SOFTWARE_SUBSCRIPTIONS);
    });

    it('should return correct category for restaurant MCC', () => {
      const category = getCategoryFromMCC('5812');
      expect(category).toBe(TransactionCategory.MEALS_BUSINESS);
    });

    it('should return correct category for office supplies MCC', () => {
      const category = getCategoryFromMCC('5943');
      expect(category).toBe(TransactionCategory.OFFICE_SUPPLIES);
    });

    it('should return null for unknown MCC', () => {
      const category = getCategoryFromMCC('9999');
      expect(category).toBeNull();
    });
  });

  describe('getMCCConfidenceBoost', () => {
    it('should return confidence boost for known MCC', () => {
      const boost = getMCCConfidenceBoost('7372');
      expect(boost).toBeGreaterThan(0);
      expect(boost).toBeLessThanOrEqual(0.2);
    });

    it('should return 0 for unknown MCC', () => {
      const boost = getMCCConfidenceBoost('9999');
      expect(boost).toBe(0);
    });
  });

  describe('mccMatchesCategory', () => {
    it('should return true when MCC matches category', () => {
      const matches = mccMatchesCategory(
        '7372',
        TransactionCategory.SOFTWARE_SUBSCRIPTIONS,
      );
      expect(matches).toBe(true);
    });

    it('should return false when MCC does not match category', () => {
      const matches = mccMatchesCategory(
        '7372',
        TransactionCategory.MEALS_BUSINESS,
      );
      expect(matches).toBe(false);
    });

    it('should return false for unknown MCC', () => {
      const matches = mccMatchesCategory(
        '9999',
        TransactionCategory.OFFICE_SUPPLIES,
      );
      expect(matches).toBe(false);
    });
  });
});
