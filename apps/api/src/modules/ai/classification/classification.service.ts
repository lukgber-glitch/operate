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
import { AutoApproveService } from '../../automation/auto-approve.service';
import { AutomationSettingsService } from '../../automation/automation-settings.service';
import { ReviewQueueService } from './review-queue/review-queue.service';
import { AutomationFeature, AutomationAction } from '../../automation/dto/automation-log.dto';
import { EventsGateway } from '../../../websocket/events.gateway';
import { AutomationEvent, AutomationEventPayload } from '@operate/shared';

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
    private readonly autoApproveService: AutoApproveService,
    private readonly automationSettingsService: AutomationSettingsService,
    private readonly reviewQueueService: ReviewQueueService,
    private readonly eventsGateway: EventsGateway,
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
   *
   * Workflow:
   * 1. Classify the transaction using AI
   * 2. Check automation settings to determine if auto-approve is enabled
   * 3. If FULL_AUTO and thresholds met, execute auto-approval
   * 4. Emit real-time event via WebSocket for UI updates
   * 5. If not auto-approved, add to review queue if needed
   */
  async classifyWithAutoApproval(
    orgId: string,
    transaction: ClassifyTransactionDto,
  ): Promise<ClassificationResultWithAction> {
    const result = await this.classifyTransaction(transaction);

    this.logger.log(
      `Classification complete for transaction ${transaction.id}: ${result.category} (confidence: ${result.confidence})`,
    );

    // Check if should auto-approve using the new AutoApproveService
    const decision = await this.autoApproveService.shouldAutoApprove({
      organisationId: orgId,
      feature: 'expenses', // Map classification to expenses feature
      confidenceScore: result.confidence,
      amount: transaction.amount ? Math.abs(transaction.amount) : undefined,
    });

    if (decision.autoApprove) {
      this.logger.log(`Auto-approving transaction ${transaction.id}: ${decision.reason}`);

      // Execute auto-approval and create audit log
      await this.autoApproveService.executeAutoApproval({
        organisationId: orgId,
        feature: 'classification',
        entityType: 'transaction',
        entityId: transaction.id || 'unknown',
        confidenceScore: result.confidence,
        inputData: {
          description: transaction.description,
          amount: transaction.amount,
          currency: transaction.currency,
          category: result.category,
        },
      });

      // Emit WebSocket event for real-time UI update
      this.emitClassificationEvent(orgId, transaction.id || 'unknown', result, true);

      return { ...result, autoApproved: true, addedToReviewQueue: false };
    }

    // Not auto-approved - check if needs review
    const needsReview = this.needsReview(result);

    if (needsReview) {
      this.logger.log(
        `Adding transaction ${transaction.id} to review queue: ${decision.reason}`,
      );

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

      // Emit WebSocket event for review queue addition
      this.emitClassificationEvent(orgId, transaction.id || 'unknown', result, false);

      return { ...result, autoApproved: false, addedToReviewQueue: true };
    }

    // Classification complete but no action needed
    this.emitClassificationEvent(orgId, transaction.id || 'unknown', result, false);

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

  /**
   * Emit WebSocket event for transaction classification
   * Notifies connected clients in real-time about classification results
   */
  private emitClassificationEvent(
    orgId: string,
    transactionId: string,
    result: ClassificationResult,
    autoApproved: boolean,
  ): void {
    try {
      const payload: AutomationEventPayload = {
        organizationId: orgId,
        entityType: 'transaction',
        entityId: transactionId,
        feature: 'classification',
        action: autoApproved ? 'AUTO_APPROVED' : 'CLASSIFIED',
        confidence: result.confidence,
        category: result.category,
        autoApproved,
        reasoning: result.reasoning,
        timestamp: new Date(),
        metadata: {
          taxRelevant: result.taxRelevant,
          suggestedDeductionCategory: result.suggestedDeductionCategory,
          flags: result.flags,
        },
      };

      // Emit appropriate event based on approval status
      const event = autoApproved
        ? AutomationEvent.AUTO_APPROVED
        : AutomationEvent.CLASSIFICATION_COMPLETE;

      this.eventsGateway.emitToOrganization(orgId, event, payload);

      this.logger.debug(
        `Emitted ${event} for transaction ${transactionId} (confidence: ${result.confidence})`,
      );
    } catch (error) {
      // Don't fail the classification if WebSocket emission fails
      this.logger.warn(
        `Failed to emit WebSocket event for transaction ${transactionId}: ${error.message}`,
      );
    }
  }
}
