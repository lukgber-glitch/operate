/**
 * Classification Service
 * Handles transaction classification using the AI package
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TransactionClassifier,
  TransactionInput,
  ClassificationResult,
  ClassificationResultWithId,
} from '@operate/ai';
import { ClassifyTransactionDto } from './dto/classify-transaction.dto';
import { AutomationService } from '../../automation/automation.service';
import { ReviewQueueService } from './review-queue/review-queue.service';
import { AutomationFeature, AutomationAction } from '../../automation/dto/automation-log.dto';

export interface ClassificationResultWithAction extends ClassificationResult {
  autoApproved: boolean;
  addedToReviewQueue: boolean;
}

@Injectable()
export class ClassificationService implements OnModuleInit {
  private readonly logger = new Logger(ClassificationService.name);
  private classifier: TransactionClassifier;

  constructor(
    private readonly configService: ConfigService,
    private readonly automationService: AutomationService,
    private readonly reviewQueueService: ReviewQueueService,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured - classification service disabled');
      return;
    }

    const confidenceThreshold = this.configService.get<number>(
      'CLASSIFICATION_CONFIDENCE_THRESHOLD',
      0.7,
    );

    this.classifier = new TransactionClassifier({
      claudeApiKey: apiKey,
      confidenceThreshold,
      reviewThreshold: confidenceThreshold,
    });

    this.logger.log('Transaction classifier initialized successfully');
  }

  /**
   * Classify a transaction with auto-approval logic
   */
  async classifyWithAutoApproval(
    orgId: string,
    transaction: ClassifyTransactionDto,
  ): Promise<ClassificationResultWithAction> {
    const result = await this.classifyTransaction(transaction);

    // Check automation settings
    const shouldAuto = await this.automationService.shouldAutoApprove(
      orgId,
      'classification',
      result.confidence,
      Math.abs(transaction.amount),
    );

    if (shouldAuto) {
      // Log auto-approval
      await this.automationService.logAutomationAction({
        organisationId: orgId,
        feature: AutomationFeature.CLASSIFICATION,
        action: AutomationAction.AUTO_APPROVED,
        resourceId: transaction.id || 'unknown',
        confidence: result.confidence,
        amount: Math.abs(transaction.amount),
        metadata: {
          category: result.category,
          reasoning: result.reasoning,
          taxRelevant: result.taxRelevant,
        },
      });

      return { ...result, autoApproved: true, addedToReviewQueue: false };
    }

    // Add to review queue if confidence is below threshold or mode is SEMI_AUTO
    const needsReview = this.needsReview(result);
    if (needsReview) {
      const priority = this.getReviewPriority(result, transaction.amount);

      await this.reviewQueueService.addToQueue({
        orgId,
        transactionId: transaction.id || 'unknown',
        transactionDescription: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        classificationResult: result,
        priority,
      });

      return { ...result, autoApproved: false, addedToReviewQueue: true };
    }

    return { ...result, autoApproved: false, addedToReviewQueue: false };
  }

  /**
   * Classify a single transaction
   */
  async classifyTransaction(
    dto: ClassifyTransactionDto,
  ): Promise<ClassificationResult> {
    this.ensureInitialized();

    const input: TransactionInput = {
      id: dto.id,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency,
      date: dto.date,
      counterparty: dto.counterparty,
      mccCode: dto.mccCode,
    };

    this.logger.debug(`Classifying transaction: ${dto.description}`);

    try {
      const result = await this.classifier.classifyTransaction(input);

      this.logger.debug(
        `Classification complete: ${result.category} (confidence: ${result.confidence})`,
      );

      return result;
    } catch (error) {
      this.logger.error('Classification failed', error);
      throw error;
    }
  }

  /**
   * Classify multiple transactions
   */
  async classifyBatch(
    transactions: ClassifyTransactionDto[],
  ): Promise<ClassificationResultWithId[]> {
    this.ensureInitialized();

    const inputs: TransactionInput[] = transactions.map((dto) => ({
      id: dto.id,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency,
      date: dto.date,
      counterparty: dto.counterparty,
      mccCode: dto.mccCode,
    }));

    this.logger.debug(`Classifying batch of ${inputs.length} transactions`);

    try {
      const results = await this.classifier.classifyBatch(inputs);

      const needsReview = results.filter((r) =>
        this.classifier.needsReview(r),
      ).length;

      this.logger.debug(
        `Batch classification complete: ${results.length} total, ${needsReview} need review`,
      );

      return results;
    } catch (error) {
      this.logger.error('Batch classification failed', error);
      throw error;
    }
  }

  /**
   * Check if a classification result needs review
   */
  needsReview(result: ClassificationResult): boolean {
    this.ensureInitialized();
    return this.classifier.needsReview(result);
  }

  /**
   * Get review priority for a classification
   */
  getReviewPriority(result: ClassificationResult, amount: number): number {
    this.ensureInitialized();
    return this.classifier.getReviewPriority(result, amount);
  }

  /**
   * Check if classifier is initialized
   */
  private ensureInitialized(): void {
    if (!this.classifier) {
      throw new Error(
        'Classification service not initialized - check ANTHROPIC_API_KEY configuration',
      );
    }
  }

  /**
   * Health check for the classification service
   */
  isHealthy(): boolean {
    return !!this.classifier;
  }
}
