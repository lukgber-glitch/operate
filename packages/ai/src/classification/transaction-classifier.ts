/**
 * Transaction Classifier
 * Main service for classifying bank transactions using Claude AI
 */

import { ClaudeClient } from '../claude/client';
import {
  buildTransactionClassificationPrompt,
  buildBatchClassificationPrompt,
  TRANSACTION_CLASSIFICATION_SYSTEM,
  TransactionPromptInput,
} from '../claude/prompts';

import { ConfidenceScorer } from './confidence-scorer';
import { getCategoryFromMCC } from './mcc-codes';
import {
  TransactionInput,
  ClassificationResult,
  ClassificationResultWithId,
  TransactionCategory,
  ClassificationFlag,
} from './types';

export interface TransactionClassifierConfig {
  claudeApiKey: string;
  confidenceThreshold?: number;
  reviewThreshold?: number;
  modelName?: string;
  maxTokens?: number;
}

export class TransactionClassifier {
  private claudeClient: ClaudeClient;
  private confidenceScorer: ConfidenceScorer;
  private config: Required<TransactionClassifierConfig>;

  constructor(config: TransactionClassifierConfig) {
    this.claudeClient = new ClaudeClient({
      apiKey: config.claudeApiKey,
      defaultModel: config.modelName || 'claude-3-5-sonnet-20241022',
      maxTokens: config.maxTokens || 1024,
      temperature: 0.3, // Lower temperature for more consistent results
    });

    this.confidenceScorer = new ConfidenceScorer();

    this.config = {
      claudeApiKey: config.claudeApiKey,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      reviewThreshold: config.reviewThreshold || 0.7,
      modelName: config.modelName || 'claude-3-5-sonnet-20241022',
      maxTokens: config.maxTokens || 1024,
    };
  }

  /**
   * Classify a single transaction
   */
  async classifyTransaction(
    transaction: TransactionInput,
  ): Promise<ClassificationResult> {
    const startTime = Date.now();

    try {
      // Build prompt
      const promptInput = this.buildPromptInput(transaction);
      const prompt = buildTransactionClassificationPrompt(promptInput);

      // Get classification from Claude
      const rawResult = await this.claudeClient.promptJson<{
        category: string;
        confidence: number;
        reasoning: string;
        taxRelevant: boolean;
        suggestedDeductionCategory?: string;
        flags?: string[];
      }>(prompt, {
        system: TRANSACTION_CLASSIFICATION_SYSTEM,
        maxTokens: this.config.maxTokens,
      });

      // Validate and normalize category
      const category = this.normalizeCategory(rawResult.category);

      // Adjust confidence based on additional factors
      const adjustedConfidence = this.confidenceScorer.adjustConfidence({
        baseConfidence: rawResult.confidence,
        mccCode: transaction.mccCode,
        predictedCategory: category,
        hasCounterparty: !!transaction.counterparty,
        descriptionLength: transaction.description.length,
        amount: Math.abs(transaction.amount),
      });

      // Validate and normalize flags
      const flags = this.normalizeFlags(rawResult.flags);

      // Add automatic flags
      const autoFlags = this.generateAutoFlags(transaction, adjustedConfidence);
      const allFlags = [...new Set([...flags, ...autoFlags])];

      const processingTime = Date.now() - startTime;

      return {
        category,
        confidence: adjustedConfidence,
        reasoning: rawResult.reasoning,
        taxRelevant: rawResult.taxRelevant,
        suggestedDeductionCategory: rawResult.suggestedDeductionCategory,
        flags: allFlags.length > 0 ? allFlags : undefined,
        metadata: {
          processingTime,
          modelUsed: this.config.modelName,
        },
      };
    } catch (error) {
      // Fallback classification on error
      return this.getFallbackClassification(transaction, error);
    }
  }

  /**
   * Classify multiple transactions in batch
   */
  async classifyBatch(
    transactions: TransactionInput[],
  ): Promise<ClassificationResultWithId[]> {
    // For small batches, use batch API
    if (transactions.length <= 5) {
      return this.classifyBatchWithClaude(transactions);
    }

    // For larger batches, process in parallel with rate limiting
    return this.classifyBatchParallel(transactions);
  }

  /**
   * Classify batch using Claude's batch processing
   */
  private async classifyBatchWithClaude(
    transactions: TransactionInput[],
  ): Promise<ClassificationResultWithId[]> {
    const startTime = Date.now();

    try {
      const promptInputs = transactions.map((tx) => this.buildPromptInput(tx));
      const prompt = buildBatchClassificationPrompt(promptInputs);

      const rawResults = await this.claudeClient.promptJson<
        Array<{
          category: string;
          confidence: number;
          reasoning: string;
          taxRelevant: boolean;
          suggestedDeductionCategory?: string;
          flags?: string[];
        }>
      >(prompt, {
        system: TRANSACTION_CLASSIFICATION_SYSTEM,
        maxTokens: this.config.maxTokens * transactions.length,
      });

      const processingTime = Date.now() - startTime;

      return transactions.map((tx, index) => {
        const rawResult = rawResults[index] || this.getDefaultClassification();
        const category = this.normalizeCategory(rawResult.category);

        const adjustedConfidence = this.confidenceScorer.adjustConfidence({
          baseConfidence: rawResult.confidence,
          mccCode: tx.mccCode,
          predictedCategory: category,
          hasCounterparty: !!tx.counterparty,
          descriptionLength: tx.description.length,
          amount: Math.abs(tx.amount),
        });

        const flags = this.normalizeFlags(rawResult.flags);
        const autoFlags = this.generateAutoFlags(tx, adjustedConfidence);
        const allFlags = [...new Set([...flags, ...autoFlags])];

        return {
          transactionId: tx.id || `unknown-${index}`,
          category,
          confidence: adjustedConfidence,
          reasoning: rawResult.reasoning,
          taxRelevant: rawResult.taxRelevant,
          suggestedDeductionCategory: rawResult.suggestedDeductionCategory,
          flags: allFlags.length > 0 ? allFlags : undefined,
          metadata: {
            processingTime: processingTime / transactions.length,
            modelUsed: this.config.modelName,
          },
        };
      });
    } catch (error) {
      // Fallback to individual classification
      return this.classifyBatchParallel(transactions);
    }
  }

  /**
   * Classify batch in parallel with rate limiting
   */
  private async classifyBatchParallel(
    transactions: TransactionInput[],
  ): Promise<ClassificationResultWithId[]> {
    const batchSize = 5;
    const results: ClassificationResultWithId[] = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (tx) => {
          const result = await this.classifyTransaction(tx);
          return {
            transactionId: tx.id || `unknown-${i}`,
            ...result,
          };
        }),
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Build prompt input from transaction
   */
  private buildPromptInput(transaction: TransactionInput): TransactionPromptInput {
    let dateStr: string;
    if (typeof transaction.date === 'string') {
      dateStr = transaction.date;
    } else {
      const isoStr = transaction.date.toISOString();
      const parts = isoStr.split('T');
      dateStr = parts[0] || isoStr;
    }

    return {
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency,
      date: dateStr,
      counterparty: transaction.counterparty,
      mccCode: transaction.mccCode,
    };
  }

  /**
   * Normalize category string to enum
   */
  private normalizeCategory(category: string): TransactionCategory {
    const normalized = category.toLowerCase().trim();

    // Direct match
    if (Object.values(TransactionCategory).includes(normalized as TransactionCategory)) {
      return normalized as TransactionCategory;
    }

    // Fallback to unknown
    return TransactionCategory.UNKNOWN;
  }

  /**
   * Normalize flags array
   */
  private normalizeFlags(flags?: string[]): ClassificationFlag[] {
    if (!flags || !Array.isArray(flags)) {
      return [];
    }

    return flags
      .map((flag) => {
        const normalized = flag.toLowerCase().trim();
        if (Object.values(ClassificationFlag).includes(normalized as ClassificationFlag)) {
          return normalized as ClassificationFlag;
        }
        return null;
      })
      .filter((flag): flag is ClassificationFlag => flag !== null);
  }

  /**
   * Generate automatic flags based on transaction data
   */
  private generateAutoFlags(
    transaction: TransactionInput,
    _confidence: number,
  ): ClassificationFlag[] {
    const flags: ClassificationFlag[] = [];

    // High value
    if (Math.abs(transaction.amount) > 5000) {
      flags.push(ClassificationFlag.HIGH_VALUE);
    }

    // Foreign currency
    if (transaction.currency && !['EUR', 'CHF'].includes(transaction.currency.toUpperCase())) {
      flags.push(ClassificationFlag.FOREIGN_CURRENCY);
    }

    return flags;
  }

  /**
   * Get fallback classification on error
   */
  private getFallbackClassification(
    transaction: TransactionInput,
    error: unknown,
  ): ClassificationResult {
    // Try MCC-based classification as fallback
    if (transaction.mccCode) {
      const mccCategory = getCategoryFromMCC(transaction.mccCode);
      if (mccCategory) {
        return {
          category: mccCategory,
          confidence: 0.6,
          reasoning: `Classified based on MCC code ${transaction.mccCode}. AI classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          taxRelevant: true,
          flags: [ClassificationFlag.NEEDS_RECEIPT],
        };
      }
    }

    // Default to unknown
    return {
      category: TransactionCategory.UNKNOWN,
      confidence: 0.0,
      reasoning: `AI classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      taxRelevant: false,
      flags: [ClassificationFlag.NEEDS_RECEIPT],
    };
  }

  /**
   * Get default classification
   */
  private getDefaultClassification(): {
    category: string;
    confidence: number;
    reasoning: string;
    taxRelevant: boolean;
    suggestedDeductionCategory?: string;
    flags?: string[];
  } {
    return {
      category: TransactionCategory.UNKNOWN,
      confidence: 0.0,
      reasoning: 'No classification result available',
      taxRelevant: false,
      suggestedDeductionCategory: undefined,
      flags: [],
    };
  }

  /**
   * Check if transaction needs review
   */
  needsReview(result: ClassificationResult): boolean {
    return this.confidenceScorer.needsReview(
      result.confidence,
      this.config.reviewThreshold,
    );
  }

  /**
   * Calculate review priority
   */
  getReviewPriority(result: ClassificationResult, amount: number): number {
    return this.confidenceScorer.calculateReviewPriority(result.confidence, Math.abs(amount));
  }
}
