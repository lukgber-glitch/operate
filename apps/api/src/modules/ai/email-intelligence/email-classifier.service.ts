/**
 * Email Classifier Service
 * Classifies emails into business-relevant categories using Claude AI
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { ClaudeClient } from '@operate/ai';
import {
  EmailInput,
  ClassificationResult,
  ClassificationResultWithId,
  ClassificationOptions,
  EmailClassification,
  EmailPriority,
  SuggestedAction,
  CLASSIFICATION_PRIORITY_MAP,
  CLASSIFICATION_ACTION_MAP,
} from './types/email-classification.types';
import {
  EMAIL_CLASSIFICATION_SYSTEM_PROMPT,
  EMAIL_CLASSIFICATION_USER_PROMPT,
  EMAIL_BATCH_CLASSIFICATION_PROMPT,
  buildClassificationPrompt,
} from './prompts/classification-prompt';

export interface EmailClassifierConfig {
  confidenceThreshold?: number;
  maxTokens?: number;
  temperature?: number;
}

@Injectable()
export class EmailClassifierService implements OnModuleInit {
  private readonly logger = new Logger(EmailClassifierService.name);
  private claudeClient: ClaudeClient | null = null;
  private config: Required<EmailClassifierConfig>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.config = {
      confidenceThreshold: this.configService.get<number>(
        'EMAIL_CLASSIFICATION_CONFIDENCE_THRESHOLD',
        0.7,
      ),
      maxTokens: this.configService.get<number>(
        'EMAIL_CLASSIFICATION_MAX_TOKENS',
        2000,
      ),
      temperature: this.configService.get<number>(
        'EMAIL_CLASSIFICATION_TEMPERATURE',
        0.3,
      ),
    };
  }

  onModuleInit() {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not configured - email classification service disabled',
      );
      return;
    }

    this.claudeClient = new ClaudeClient({
      apiKey,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    });

    this.logger.log(
      `Email classifier initialized (confidence threshold: ${this.config.confidenceThreshold})`,
    );
  }

  /**
   * Classify a single email
   */
  async classifyEmail(email: EmailInput): Promise<ClassificationResult> {
    this.ensureInitialized();

    this.logger.debug(`Classifying email: "${email.subject}" from ${email.from}`);

    try {
      const prompts = buildClassificationPrompt({ email });

      const response = await this.claudeClient!.promptJson<Partial<ClassificationResult>>(
        prompts.user,
        {
          system: prompts.system,
          maxTokens: this.config.maxTokens,
          temperature: this.config.temperature,
        },
      );

      // Ensure all required fields are present (fallback to defaults)
      const classification = response.classification || EmailClassification.UNKNOWN;
      const priority = response.priority || CLASSIFICATION_PRIORITY_MAP[classification] || EmailPriority.MEDIUM;
      const suggestedAction = response.suggestedAction || CLASSIFICATION_ACTION_MAP[classification] || SuggestedAction.NO_ACTION;

      const result: ClassificationResult = {
        classification,
        priority,
        suggestedAction,
        confidence: response.confidence || 0.0,
        reasoning: response.reasoning || 'No reasoning provided',
        extractedIntent: response.extractedIntent,
        extractedEntities: response.extractedEntities,
        suggestedActionDetails: response.suggestedActionDetails,
        flags: response.flags,
      };

      this.logger.debug(
        `Classification complete: ${result.classification} (confidence: ${result.confidence}, priority: ${result.priority})`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Email classification failed: ${error.message}`, error.stack);

      // Return fallback classification on error
      return {
        classification: EmailClassification.UNKNOWN,
        confidence: 0.0,
        priority: EmailPriority.LOW,
        reasoning: `Classification failed: ${error.message}`,
        suggestedAction: SuggestedAction.NO_ACTION,
        flags: ['classification_error'],
      };
    }
  }

  /**
   * Classify multiple emails in batch
   * More efficient than individual classifications for large volumes
   */
  async classifyBatch(emails: EmailInput[]): Promise<ClassificationResultWithId[]> {
    this.ensureInitialized();

    if (emails.length === 0) {
      return [];
    }

    this.logger.debug(`Classifying batch of ${emails.length} emails`);

    try {
      // For small batches, use individual classification for better accuracy
      if (emails.length <= 5) {
        const results = await Promise.all(
          emails.map(async (email, idx) => {
            const result = await this.classifyEmail(email);
            return {
              emailId: `email_${idx}`,
              ...result,
            };
          }),
        );

        this.logger.debug(`Batch classification complete: ${results.length} emails processed`);
        return results;
      }

      // For larger batches, use batch prompt (less detailed but faster)
      const emailSummaries = emails.map((email, idx) => ({
        id: `email_${idx}`,
        subject: email.subject,
        from: email.from,
        hasAttachments: email.hasAttachments,
      }));

      const batchPrompt = EMAIL_BATCH_CLASSIFICATION_PROMPT(emailSummaries);

      const response = await this.claudeClient!.promptJson<
        Array<{
          emailId: string;
          classification: EmailClassification;
          confidence: number;
          priority?: EmailPriority;
          reasoning: string;
          suggestedAction?: SuggestedAction;
        }>
      >(batchPrompt, {
        system: EMAIL_CLASSIFICATION_SYSTEM_PROMPT,
        maxTokens: this.config.maxTokens * 2, // More tokens for batch
        temperature: this.config.temperature,
      });

      // Ensure all required fields are present
      const results: ClassificationResultWithId[] = response.map((item) => ({
        emailId: item.emailId,
        classification: item.classification || EmailClassification.UNKNOWN,
        confidence: item.confidence || 0.0,
        priority: item.priority || CLASSIFICATION_PRIORITY_MAP[item.classification] || EmailPriority.MEDIUM,
        reasoning: item.reasoning || 'No reasoning provided',
        suggestedAction: item.suggestedAction || CLASSIFICATION_ACTION_MAP[item.classification] || SuggestedAction.NO_ACTION,
      }));

      this.logger.debug(
        `Batch classification complete: ${results.length} emails processed`,
      );

      return results;
    } catch (error) {
      this.logger.error(`Batch classification failed: ${error.message}`, error.stack);

      // Return fallback classifications for all emails
      return emails.map((_, idx) => ({
        emailId: `email_${idx}`,
        classification: EmailClassification.UNKNOWN,
        confidence: 0.0,
        priority: EmailPriority.LOW,
        reasoning: `Batch classification failed: ${error.message}`,
        suggestedAction: SuggestedAction.NO_ACTION,
        flags: ['classification_error'],
      }));
    }
  }

  /**
   * Check if a classification result should trigger auto-action
   * Based on confidence threshold
   */
  shouldAutoAction(result: ClassificationResult): boolean {
    return result.confidence >= this.config.confidenceThreshold;
  }

  /**
   * Check if a classification needs human review
   */
  needsReview(result: ClassificationResult): boolean {
    // Review if confidence is below threshold
    if (result.confidence < this.config.confidenceThreshold) {
      return true;
    }

    // Review critical items regardless of confidence
    if (result.priority === EmailPriority.CRITICAL) {
      return true;
    }

    // Review if flagged for review
    if (result.flags?.includes('review_needed')) {
      return true;
    }

    return false;
  }

  /**
   * Get review priority for a classification
   * Higher number = more urgent
   */
  getReviewPriority(result: ClassificationResult): number {
    const priorityScores: Record<EmailPriority, number> = {
      [EmailPriority.CRITICAL]: 100,
      [EmailPriority.HIGH]: 75,
      [EmailPriority.MEDIUM]: 50,
      [EmailPriority.LOW]: 25,
      [EmailPriority.SPAM]: 0,
    };

    let score = priorityScores[result.priority] || 50;

    // Boost score for low confidence
    if (result.confidence < 0.5) {
      score += 20;
    }

    // Boost for specific classifications
    if (result.classification === EmailClassification.COMPLAINT) {
      score += 30;
    }
    if (result.classification === EmailClassification.LEGAL) {
      score += 30;
    }

    return Math.min(score, 100);
  }

  /**
   * Check if classifier is initialized and ready
   */
  isHealthy(): boolean {
    return this.claudeClient !== null;
  }

  /**
   * Ensure service is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.claudeClient) {
      throw new Error(
        'Email classification service not initialized - check ANTHROPIC_API_KEY configuration',
      );
    }
  }

  /**
   * Get configuration for debugging
   */
  getConfig(): Required<EmailClassifierConfig> {
    return { ...this.config };
  }
}
