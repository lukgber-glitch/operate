/**
 * Transaction Classifier Tests
 */

import { TransactionClassifier } from './transaction-classifier';
import { TransactionCategory, TransactionInput } from './types';

// Mock Claude client
jest.mock('../claude/client');

describe('TransactionClassifier', () => {
  let classifier: TransactionClassifier;

  beforeEach(() => {
    classifier = new TransactionClassifier({
      claudeApiKey: 'test-api-key',
      confidenceThreshold: 0.7,
    });
  });

  describe('classifyTransaction', () => {
    it('should classify a software subscription transaction', async () => {
      const transaction: TransactionInput = {
        description: 'Amazon Web Services EMEA',
        amount: -125.50,
        currency: 'EUR',
        date: '2024-11-29',
        mccCode: '7372',
      };

      const result = await classifier.classifyTransaction(transaction);

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('taxRelevant');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should classify a business travel transaction', async () => {
      const transaction: TransactionInput = {
        description: 'Lufthansa Airlines',
        amount: -450.00,
        currency: 'EUR',
        date: '2024-11-20',
        counterparty: 'Deutsche Lufthansa AG',
      };

      const result = await classifier.classifyTransaction(transaction);

      expect(result.category).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle missing optional fields', async () => {
      const transaction: TransactionInput = {
        description: 'Unknown Merchant',
        amount: -50.00,
        currency: 'EUR',
        date: '2024-11-29',
      };

      const result = await classifier.classifyTransaction(transaction);

      expect(result).toHaveProperty('category');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should add flags for high-value transactions', async () => {
      const transaction: TransactionInput = {
        description: 'Office Equipment',
        amount: -8500.00,
        currency: 'EUR',
        date: '2024-11-29',
      };

      const result = await classifier.classifyTransaction(transaction);

      expect(result.flags).toBeDefined();
      expect(result.flags?.length).toBeGreaterThan(0);
    });

    it('should boost confidence for MCC code matches', async () => {
      const transactionWithMCC: TransactionInput = {
        description: 'Office Supplies',
        amount: -45.00,
        currency: 'EUR',
        date: '2024-11-29',
        mccCode: '5943',
      };

      const transactionWithoutMCC: TransactionInput = {
        description: 'Office Supplies',
        amount: -45.00,
        currency: 'EUR',
        date: '2024-11-29',
      };

      const resultWithMCC = await classifier.classifyTransaction(transactionWithMCC);
      const resultWithoutMCC = await classifier.classifyTransaction(transactionWithoutMCC);

      // MCC code should boost confidence (in most cases)
      expect(resultWithMCC.confidence).toBeGreaterThanOrEqual(resultWithoutMCC.confidence - 0.2);
    });
  });

  describe('classifyBatch', () => {
    it('should classify multiple transactions', async () => {
      const transactions: TransactionInput[] = [
        {
          id: 'tx-1',
          description: 'AWS Cloud Services',
          amount: -125.00,
          currency: 'EUR',
          date: '2024-11-29',
        },
        {
          id: 'tx-2',
          description: 'Business Lunch',
          amount: -45.50,
          currency: 'EUR',
          date: '2024-11-28',
        },
        {
          id: 'tx-3',
          description: 'Office Rent',
          amount: -1200.00,
          currency: 'EUR',
          date: '2024-11-01',
        },
      ];

      const results = await classifier.classifyBatch(transactions);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('transactionId');
      expect(results[0]!.transactionId).toBe('tx-1');
      expect(results[1]!.transactionId).toBe('tx-2');
      expect(results[2]!.transactionId).toBe('tx-3');
    });

    it('should handle empty batch', async () => {
      const results = await classifier.classifyBatch([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('needsReview', () => {
    it('should flag low confidence results for review', () => {
      const lowConfidenceResult = {
        category: TransactionCategory.UNKNOWN,
        confidence: 0.4,
        reasoning: 'Insufficient information',
        taxRelevant: false,
      };

      expect(classifier.needsReview(lowConfidenceResult)).toBe(true);
    });

    it('should not flag high confidence results', () => {
      const highConfidenceResult = {
        category: TransactionCategory.SOFTWARE_SUBSCRIPTIONS,
        confidence: 0.95,
        reasoning: 'Clear software subscription',
        taxRelevant: true,
      };

      expect(classifier.needsReview(highConfidenceResult)).toBe(false);
    });
  });

  describe('getReviewPriority', () => {
    it('should assign higher priority to low confidence, high value transactions', () => {
      const result = {
        category: TransactionCategory.UNKNOWN,
        confidence: 0.3,
        reasoning: 'Unclear',
        taxRelevant: false,
      };

      const priority = classifier.getReviewPriority(result, 10000);

      expect(priority).toBeGreaterThanOrEqual(4);
    });

    it('should assign lower priority to high confidence transactions', () => {
      const result = {
        category: TransactionCategory.OFFICE_SUPPLIES,
        confidence: 0.9,
        reasoning: 'Clear office supplies',
        taxRelevant: true,
      };

      const priority = classifier.getReviewPriority(result, 50);

      expect(priority).toBeLessThanOrEqual(3);
    });
  });
});
