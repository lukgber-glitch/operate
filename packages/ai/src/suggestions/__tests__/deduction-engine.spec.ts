/**
 * Deduction Engine Tests
 */

import { DeductionEngine } from '../deduction-engine';
import { ClassifiedTransaction } from '../types';

describe('DeductionEngine', () => {
  let engine: DeductionEngine;

  beforeEach(() => {
    engine = new DeductionEngine();
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions for German office supplies', async () => {
      const transactions: ClassifiedTransaction[] = [
        {
          id: 'tx-1',
          amount: 50,
          currency: 'EUR',
          description: 'Printer paper and pens',
          date: new Date('2024-01-15'),
          category: 'office_supplies',
          confidence: 0.9,
        },
      ];

      const suggestions = await engine.generateSuggestions(transactions, {
        countryCode: 'DE',
        taxYear: 2024,
      });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]!.categoryCode).toBe('WORK_EQUIPMENT');
      expect(suggestions[0]!.legalReference).toContain('§9');
      expect(suggestions[0]!.deductibleAmount).toBe(50);
      expect(suggestions[0]!.deductiblePercentage).toBe(100);
    });

    it('should apply 70% deduction for German business meals', async () => {
      const transactions: ClassifiedTransaction[] = [
        {
          id: 'tx-2',
          amount: 100,
          currency: 'EUR',
          description: 'Business lunch with client',
          date: new Date('2024-02-20'),
          category: 'meals_business',
          confidence: 0.85,
          metadata: {
            businessPurpose: 'Client meeting',
          },
        },
      ];

      const suggestions = await engine.generateSuggestions(transactions, {
        countryCode: 'DE',
        taxYear: 2024,
      });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]!.categoryCode).toBe('BUSINESS_MEALS');
      expect(suggestions[0]!.deductiblePercentage).toBe(70);
      expect(suggestions[0]!.deductibleAmount).toBe(70); // 70% of 100
      expect(suggestions[0]!.legalReference).toContain('§4 Abs. 5 Nr. 2');
    });

    it('should generate suggestions for Austrian commute expenses', async () => {
      const transactions: ClassifiedTransaction[] = [
        {
          id: 'tx-3',
          amount: 200,
          currency: 'EUR',
          description: 'Monthly public transport pass',
          date: new Date('2024-03-01'),
          category: 'public_transport',
          confidence: 0.95,
        },
      ];

      const suggestions = await engine.generateSuggestions(transactions, {
        countryCode: 'AT',
        taxYear: 2024,
      });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]!.categoryCode).toBe('COMMUTE');
      expect(suggestions[0]!.legalReference).toContain('§16');
    });

    it('should generate suggestions for Swiss work equipment', async () => {
      const transactions: ClassifiedTransaction[] = [
        {
          id: 'tx-4',
          amount: 1500,
          currency: 'CHF',
          description: 'Laptop for work',
          date: new Date('2024-04-10'),
          category: 'computer_hardware',
          confidence: 0.88,
        },
      ];

      const suggestions = await engine.generateSuggestions(transactions, {
        countryCode: 'CH',
        taxYear: 2024,
      });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]!.categoryCode).toBe('WORK_EQUIPMENT');
      expect(suggestions[0]!.legalReference).toContain('Art. 26');
      expect(suggestions[0]!.currency).toBe('CHF');
    });

    it('should filter transactions by minimum confidence', async () => {
      const transactions: ClassifiedTransaction[] = [
        {
          id: 'tx-5',
          amount: 50,
          currency: 'EUR',
          description: 'Office supplies',
          date: new Date('2024-05-01'),
          category: 'office_supplies',
          confidence: 0.3, // Low confidence
        },
        {
          id: 'tx-6',
          amount: 100,
          currency: 'EUR',
          description: 'More office supplies',
          date: new Date('2024-05-02'),
          category: 'office_supplies',
          confidence: 0.9, // High confidence
        },
      ];

      const suggestions = await engine.generateSuggestions(transactions, {
        countryCode: 'DE',
        taxYear: 2024,
        minConfidence: 0.7,
      });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]!.transactionId).toBe('tx-6');
    });

    it('should filter transactions by tax year', async () => {
      const transactions: ClassifiedTransaction[] = [
        {
          id: 'tx-7',
          amount: 50,
          currency: 'EUR',
          description: 'Office supplies 2023',
          date: new Date('2023-12-01'),
          category: 'office_supplies',
          confidence: 0.9,
        },
        {
          id: 'tx-8',
          amount: 100,
          currency: 'EUR',
          description: 'Office supplies 2024',
          date: new Date('2024-01-15'),
          category: 'office_supplies',
          confidence: 0.9,
        },
      ];

      const suggestions = await engine.generateSuggestions(transactions, {
        countryCode: 'DE',
        taxYear: 2024,
      });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]!.transactionId).toBe('tx-8');
    });

    it('should include requirement status in suggestions', async () => {
      const transactions: ClassifiedTransaction[] = [
        {
          id: 'tx-9',
          amount: 200,
          currency: 'EUR',
          description: 'Professional training course',
          date: new Date('2024-06-01'),
          category: 'training',
          confidence: 0.92,
          metadata: {
            receipt: true,
            businessPurpose: 'Professional development',
          },
        },
      ];

      const suggestions = await engine.generateSuggestions(transactions, {
        countryCode: 'DE',
        taxYear: 2024,
      });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]!.requirements.receiptAttached).toBe(true);
      expect(suggestions[0]!.requirements.receiptRequired).toBe(true);
      expect(suggestions[0]!.requirements.businessPurposeProvided).toBe(true);
    });
  });

  describe('getRulesForCountry', () => {
    it('should return rules for Germany', () => {
      const rules = engine.getRulesForCountry('DE');
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.countryCode === 'DE')).toBe(true);
    });

    it('should return rules for Austria', () => {
      const rules = engine.getRulesForCountry('AT');
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.countryCode === 'AT')).toBe(true);
    });

    it('should return rules for Switzerland', () => {
      const rules = engine.getRulesForCountry('CH');
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.countryCode === 'CH')).toBe(true);
    });

    it('should return empty array for unsupported country', () => {
      const rules = engine.getRulesForCountry('US');
      expect(rules).toEqual([]);
    });
  });

  describe('addRule', () => {
    it('should allow adding custom rules', () => {
      const customRule = {
        id: 'custom-rule-1',
        countryCode: 'DE',
        categoryCode: 'CUSTOM_CATEGORY',
        transactionCategories: ['custom_category'],
        percentageDeductible: 100,
        legalReference: 'Custom §1',
        legalDescription: 'Custom deduction',
        requiresReceipt: true,
        requiresBusinessPurpose: true,
        requiresLogbook: false,
      };

      engine.addRule(customRule);

      const rules = engine.getRulesForCountry('DE');
      const found = rules.find((r) => r.id === 'custom-rule-1');
      expect(found).toBeDefined();
    });
  });

  describe('removeRule', () => {
    it('should allow removing rules', () => {
      const rules = engine.getRulesForCountry('DE');
      const firstRuleId = rules[0]!.id;

      const removed = engine.removeRule(firstRuleId);
      expect(removed).toBe(true);

      const updatedRules = engine.getRulesForCountry('DE');
      expect(updatedRules.length).toBe(rules.length - 1);
    });

    it('should return false when removing non-existent rule', () => {
      const removed = engine.removeRule('non-existent-rule');
      expect(removed).toBe(false);
    });
  });
});
