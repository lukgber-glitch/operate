import { Prisma } from '@prisma/client';
/**
 * Enhanced Transaction Classifier Service
 * Tax-aware transaction classification for German EÜR
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaudeClient } from '@operate/ai';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  EnhancedTransactionClassification,
  TransactionForClassification,
  BatchClassificationResult,
  TaxCategory,
} from './types/tax-categories.types';
import {
  buildClassificationPrompt,
  buildBatchClassificationPrompt,
  buildCategorySuggestionPrompt,
  CLASSIFICATION_SYSTEM_PROMPT,
} from './prompts/classification-prompt';
import {
  getEurLineInfo,
  calculateDeductibleAmount,
} from './rules/eur-line-mapping';
import {
  findVendorPattern,
  extractVendorName,
  isLikelyRecurring,
} from './rules/vendor-patterns';
import { VendorMatcher } from './matchers/vendor-matcher';

/**
 * Matched vendor from database
 */
interface MatchedVendor {
  id: string;
  name: string;
  displayName: string | null;
  defaultCategoryId: string | null;
  defaultTaxDeductible: boolean | null;
}

/**
 * AI response structure
 */
interface AIClassificationResponse {
  category: string;
  subcategory?: string;
  confidence: number;
  tax: {
    deductible: boolean;
    deductionPercentage: number;
    deductibleAmount: number;
    vatReclaimable: boolean;
    vatAmount?: number;
    vatRate?: number;
    taxCategory: TaxCategory;
    eurLineNumber?: number;
    eurDescription?: string;
  };
  business: {
    isBusinessExpense: boolean;
    businessPercentage: number;
    requiresDocumentation: boolean;
    documentationType?: 'RECEIPT' | 'INVOICE' | 'CONTRACT' | 'PROOF_OF_PAYMENT';
    specialRequirements?: string[];
  };
  pattern: {
    isRecurring: boolean;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    vendor?: string;
    vendorNormalized?: string;
    vendorCategory?: string;
  };
  reasoning?: string;
  flags?: {
    needsReview?: boolean;
    unusualAmount?: boolean;
    newVendor?: boolean;
    requiresSplit?: boolean;
    possiblyPrivate?: boolean;
  };
  suggestedActions?: string[];
  alternativeCategories?: Array<{
    category: string;
    taxCategory: TaxCategory;
    confidence: number;
  }>;
}

@Injectable()
export class EnhancedTransactionClassifierService {
  private readonly logger = new Logger(
    EnhancedTransactionClassifierService.name,
  );
  private readonly claude: ClaudeClient;
  private readonly confidenceThreshold: number;
  private readonly vendorMatcher: VendorMatcher;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not configured - transaction classification will fail',
      );
    }

    this.claude = new ClaudeClient({
      apiKey: apiKey || 'dummy',
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.1, // Low temperature for consistent classification
    });

    this.confidenceThreshold =
      this.configService.get<number>('CLASSIFICATION_CONFIDENCE_THRESHOLD') ||
      0.85;

    this.vendorMatcher = new VendorMatcher(0.8);

    this.logger.log(
      `Enhanced Transaction Classifier initialized (confidence threshold: ${this.confidenceThreshold})`,
    );
  }

  /**
   * Classify a single transaction
   */
  async classifyTransaction(
    transaction: TransactionForClassification,
    orgId?: string,
  ): Promise<EnhancedTransactionClassification> {
    const startTime = Date.now();

    this.logger.log(
      `Classifying transaction: ${transaction.description.substring(0, 50)}...`,
    );

    try {
      // Step 1: Check for learned patterns (highest priority)
      let learnedClassification: EnhancedTransactionClassification | null = null;
      if (orgId) {
        learnedClassification = await this.applyLearnedPatterns(
          transaction,
          orgId,
        );
        if (learnedClassification && learnedClassification.confidence >= 0.95) {
          this.logger.debug('Using learned pattern classification');
          return learnedClassification;
        }
      }

      // Step 2: Check for vendor pattern match (fast path)
      const vendorPattern = findVendorPattern(transaction.description);

      // Step 3: Check for vendor match in database
      let matchedVendor: MatchedVendor | null = null;
      if (orgId && transaction.counterparty) {
        matchedVendor = await this.findMatchingVendor(
          transaction.counterparty,
          orgId,
        );
      }

      // Step 4: Call AI for classification
      const prompt = this.buildEnhancedPrompt(
        transaction,
        learnedClassification,
        matchedVendor,
      );
      const aiResponse =
        await this.claude.promptJson<AIClassificationResponse>(prompt, {
          system: CLASSIFICATION_SYSTEM_PROMPT,
          maxTokens: 2048,
          temperature: 0.1,
        });

      // Step 5: Enhance with vendor pattern data
      const enhanced = this.enhanceWithVendorPattern(
        aiResponse,
        vendorPattern,
        transaction,
      );

      // Step 6: Enhance with matched vendor data
      if (matchedVendor) {
        this.enhanceWithVendorData(enhanced, matchedVendor);
      }

      // Step 7: Validate and enrich
      const validated = this.validateClassification(enhanced, transaction);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Classification complete in ${processingTime}ms: ${validated.category} (${validated.tax.taxCategory}) - confidence: ${validated.confidence.toFixed(2)}`,
      );

      return validated;
    } catch (error) {
      this.logger.error('Classification failed:', error);
      throw new Error(`Transaction classification failed: ${error.message}`);
    }
  }

  /**
   * Classify multiple transactions in batch
   */
  async classifyBatch(
    transactions: TransactionForClassification[],
    orgId?: string,
  ): Promise<BatchClassificationResult> {
    const startTime = Date.now();

    this.logger.log(`Batch classifying ${transactions.length} transactions`);

    const results: BatchClassificationResult['results'] = [];
    let classified = 0;
    let failed = 0;
    let totalConfidence = 0;

    // Process in batches of 10 for API efficiency
    const batchSize = 10;

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map((tx) => this.classifyTransaction(tx, orgId)),
      );

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.push({
            classification: result.value,
          });
          classified++;
          totalConfidence += result.value.confidence;
        } else {
          results.push({
            classification: this.getDefaultClassification(batch[idx]),
            error: result.reason?.message || 'Unknown error',
          });
          failed++;
        }
      });
    }

    const processingTime = Date.now() - startTime;
    const averageConfidence = classified > 0 ? totalConfidence / classified : 0;

    this.logger.log(
      `Batch classification complete: ${classified} classified, ${failed} failed, avg confidence: ${averageConfidence.toFixed(2)}, time: ${processingTime}ms`,
    );

    return {
      total: transactions.length,
      classified,
      failed,
      averageConfidence,
      results,
      processingTime,
    };
  }

  /**
   * Bulk classify transactions for an organization
   * Optimized for processing large batches with learned patterns
   */
  async bulkClassify(
    orgId: string,
    transactions: TransactionForClassification[],
  ): Promise<BatchClassificationResult> {
    const startTime = Date.now();

    this.logger.log(
      `Bulk classifying ${transactions.length} transactions for org ${orgId}`,
    );

    // Pre-load learned patterns for the organization
    const patterns = await this.loadLearnedPatterns(orgId);
    this.logger.debug(`Loaded ${patterns.length} learned patterns`);

    // Pre-load vendors for matching
    const vendors = await this.prisma.vendor.findMany({
      where: {
        organisationId: orgId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        defaultCategoryId: true,
        defaultTaxDeductible: true,
      },
    });
    this.logger.debug(`Loaded ${vendors.length} vendors`);

    const results: BatchClassificationResult['results'] = [];
    let classified = 0;
    let failed = 0;
    let totalConfidence = 0;

    // Process in parallel batches
    const batchSize = 20;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (tx) => {
          try {
            const classification = await this.classifyTransaction(tx, orgId);
            return { success: true as const, classification };
          } catch (error) {
            return { success: false as const, error };
          }
        }),
      );

      batchResults.forEach((result, idx) => {
        if (
          result.status === 'fulfilled' &&
          result.value.success &&
          result.value.classification
        ) {
          results.push({
            classification: result.value.classification,
          });
          classified++;
          totalConfidence += result.value.classification.confidence;
        } else {
          const errorMsg =
            result.status === 'rejected'
              ? result.reason?.message
              : (result.value as any)?.error?.message;
          results.push({
            classification: this.getDefaultClassification(batch[idx]),
            error: errorMsg || 'Unknown error',
          });
          failed++;
        }
      });
    }

    const processingTime = Date.now() - startTime;
    const averageConfidence = classified > 0 ? totalConfidence / classified : 0;

    this.logger.log(
      `Bulk classification complete: ${classified} classified, ${failed} failed, avg confidence: ${averageConfidence.toFixed(2)}, time: ${processingTime}ms`,
    );

    return {
      total: transactions.length,
      classified,
      failed,
      averageConfidence,
      results,
      processingTime,
    };
  }

  /**
   * Suggest tax category for a given category and description
   */
  async suggestTaxCategory(
    category: string,
    description: string,
  ): Promise<TaxCategory> {
    this.logger.debug(
      `Suggesting tax category for: ${category} - ${description}`,
    );

    try {
      const prompt = buildCategorySuggestionPrompt(category, description);
      const response = await this.claude.prompt(prompt, {
        system: CLASSIFICATION_SYSTEM_PROMPT,
        maxTokens: 100,
        temperature: 0.0,
      });

      // Extract enum value from response
      const taxCategory = response.trim() as TaxCategory;

      // Validate it's a valid enum value
      if (Object.values(TaxCategory).includes(taxCategory)) {
        return taxCategory;
      }

      // Fallback
      this.logger.warn(`Invalid tax category suggested: ${taxCategory}`);
      return TaxCategory.SONSTIGE_KOSTEN;
    } catch (error) {
      this.logger.error('Tax category suggestion failed:', error);
      return TaxCategory.SONSTIGE_KOSTEN;
    }
  }

  /**
   * Enhance classification with vendor pattern data
   */
  private enhanceWithVendorPattern(
    aiResponse: AIClassificationResponse,
    vendorPattern: ReturnType<typeof findVendorPattern>,
    transaction: TransactionForClassification,
  ): AIClassificationResponse {
    if (!vendorPattern) {
      return aiResponse;
    }

    this.logger.debug(
      `Enhancing with vendor pattern: ${vendorPattern.vendorName}`,
    );

    // Override with vendor pattern data if AI confidence is low
    if (aiResponse.confidence < 0.7) {
      aiResponse.tax.taxCategory = vendorPattern.taxCategory;
      aiResponse.pattern.vendor = vendorPattern.vendorName;
      aiResponse.pattern.vendorCategory = vendorPattern.category;
      aiResponse.pattern.isRecurring = vendorPattern.recurring;
      if (vendorPattern.frequency) {
        aiResponse.pattern.frequency = vendorPattern.frequency;
      }
      if (vendorPattern.businessPercentage) {
        aiResponse.business.businessPercentage =
          vendorPattern.businessPercentage;
      }
    }

    return aiResponse;
  }

  /**
   * Validate and enrich classification
   */
  private validateClassification(
    aiResponse: AIClassificationResponse,
    transaction: TransactionForClassification,
  ): EnhancedTransactionClassification {
    // Get EÜR line info
    const eurInfo = getEurLineInfo(aiResponse.tax.taxCategory);

    // Recalculate deductible amount based on EÜR rules
    const deductibleAmount = calculateDeductibleAmount(
      Math.abs(transaction.amount),
      aiResponse.tax.taxCategory,
    );

    // Extract vendor name
    const vendorName =
      aiResponse.pattern.vendor || extractVendorName(transaction.description);

    // Check if recurring
    const isRecurring =
      aiResponse.pattern.isRecurring ||
      isLikelyRecurring(transaction.description);

    // Build flags
    const flags = aiResponse.flags || {};

    // Flag for review if confidence is low
    if (aiResponse.confidence < this.confidenceThreshold) {
      flags.needsReview = true;
    }

    // Flag unusual amounts
    if (Math.abs(transaction.amount) > 500000) {
      // > 5000 EUR
      flags.unusualAmount = true;
      flags.needsReview = true;
    }

    // Flag if business percentage < 100%
    if (aiResponse.business.businessPercentage < 100) {
      flags.possiblyPrivate = true;
    }

    return {
      category: aiResponse.category,
      subcategory: aiResponse.subcategory,
      confidence: aiResponse.confidence,
      tax: {
        deductible: aiResponse.tax.deductible,
        deductionPercentage: eurInfo.deductionPercentage,
        deductibleAmount,
        vatReclaimable: aiResponse.tax.vatReclaimable,
        vatAmount: aiResponse.tax.vatAmount,
        vatRate: aiResponse.tax.vatRate,
        taxCategory: aiResponse.tax.taxCategory,
        eurLineNumber: eurInfo.lineNumber,
        eurDescription: eurInfo.germanDescription,
      },
      business: {
        isBusinessExpense: aiResponse.business.isBusinessExpense,
        businessPercentage: aiResponse.business.businessPercentage,
        requiresDocumentation:
          eurInfo.requiresDocumentation ||
          aiResponse.business.requiresDocumentation,
        documentationType: aiResponse.business.documentationType,
        specialRequirements:
          aiResponse.business.specialRequirements || eurInfo.notes,
      },
      pattern: {
        isRecurring,
        frequency: aiResponse.pattern.frequency,
        vendor: vendorName,
        vendorNormalized: vendorName.toLowerCase().replace(/\s+/g, '-'),
        vendorCategory: aiResponse.pattern.vendorCategory,
      },
      reasoning: aiResponse.reasoning,
      flags,
      suggestedActions: aiResponse.suggestedActions || [],
      alternativeCategories: aiResponse.alternativeCategories || [],
    };
  }

  /**
   * Get default classification for failed cases
   */
  private getDefaultClassification(
    transaction: TransactionForClassification,
  ): EnhancedTransactionClassification {
    const taxCategory =
      transaction.type === 'DEBIT'
        ? TaxCategory.SONSTIGE_KOSTEN
        : TaxCategory.EINNAHMEN_19;

    const eurInfo = getEurLineInfo(taxCategory);

    return {
      category: 'Uncategorized',
      confidence: 0.0,
      tax: {
        deductible: false,
        deductionPercentage: 0,
        deductibleAmount: 0,
        vatReclaimable: false,
        taxCategory,
        eurLineNumber: eurInfo.lineNumber,
        eurDescription: eurInfo.germanDescription,
      },
      business: {
        isBusinessExpense: false,
        businessPercentage: 0,
        requiresDocumentation: true,
        documentationType: 'INVOICE',
      },
      pattern: {
        isRecurring: false,
        vendor: 'Unknown',
      },
      flags: {
        needsReview: true,
      },
      suggestedActions: ['Manual review required'],
      alternativeCategories: [],
    };
  }

  /**
   * Learn from user correction
   * Store the correction and create/update learning patterns
   */
  async learnFromCorrection(
    transactionId: string,
    orgId: string,
    userId: string,
    correctCategory: string,
    correctTaxCategory: TaxCategory,
    originalClassification: EnhancedTransactionClassification,
    transaction: TransactionForClassification,
  ): Promise<void> {
    this.logger.log(
      `Learning from correction: ${originalClassification.category} -> ${correctCategory}`,
    );

    try {
      // 1. Store correction record
      await this.prisma.correctionRecord.create({
        data: {
          organisationId: orgId,
          entityType: 'transaction',
          entityId: transactionId,
          field: 'category',
          originalValue: {
            category: originalClassification.category,
            taxCategory: originalClassification.tax.taxCategory,
            confidence: originalClassification.confidence,
          },
          correctedValue: {
            category: correctCategory,
            taxCategory: correctTaxCategory,
          },
          context: {
            description: transaction.description,
            amount: transaction.amount,
            counterparty: transaction.counterparty,
            vendor: originalClassification.pattern.vendor,
          },
          userId,
        },
      });

      // 2. Extract pattern from correction
      const vendor = extractVendorName(transaction.description);
      const normalizedVendor = vendor.toLowerCase().replace(/\s+/g, '-');

      // Check if pattern already exists
      const existingPattern = await this.prisma.learningPattern.findFirst({
        where: {
          organisationId: orgId,
          patternType: 'vendor_category',
          condition: {
            path: ['vendor'],
            equals: normalizedVendor,
          },
        },
      });

      if (existingPattern) {
        // Update existing pattern
        const occurrences = existingPattern.occurrences + 1;
        // Simple accuracy calculation: if corrected to same category, increase accuracy
        const currentAccuracy = parseFloat(existingPattern.accuracy.toString());
        const adjustment = existingPattern.adjustment as unknown as { category: string; taxCategory: TaxCategory };
        const newAccuracy =
          adjustment.category === correctCategory
            ? Math.min(1.0, currentAccuracy + 0.1)
            : Math.max(0.5, currentAccuracy - 0.1);

        await this.prisma.learningPattern.update({
          where: { id: existingPattern.id },
          data: {
            adjustment: {
              category: correctCategory,
              taxCategory: correctTaxCategory,
            } as unknown as Prisma.InputJsonValue,
            occurrences,
            accuracy: newAccuracy,
            updatedAt: new Date(),
          },
        });

        this.logger.debug(
          `Updated learning pattern for vendor "${vendor}" (occurrences: ${occurrences}, accuracy: ${newAccuracy})`,
        );
      } else {
        // Create new pattern
        await this.prisma.learningPattern.create({
          data: {
            organisationId: orgId,
            patternType: 'vendor_category',
            condition: {
              vendor: normalizedVendor,
              vendorOriginal: vendor,
            } as unknown as Prisma.InputJsonValue,
            adjustment: {
              category: correctCategory,
              taxCategory: correctTaxCategory,
            } as unknown as Prisma.InputJsonValue,
            occurrences: 1,
            accuracy: 1.0,
            isActive: true,
          },
        });

        this.logger.debug(`Created new learning pattern for vendor "${vendor}"`);
      }

      // 3. Check for amount-based patterns (if amount is significant)
      if (Math.abs(transaction.amount) >= 10000) {
        // >= 100 EUR
        const amountRange = this.getAmountRange(transaction.amount);
        const amountPattern = await this.prisma.learningPattern.findFirst({
          where: {
            organisationId: orgId,
            patternType: 'amount_category',
            condition: {
              path: ['amountRange'],
              equals: amountRange,
            },
          },
        });

        if (!amountPattern) {
          await this.prisma.learningPattern.create({
            data: {
              organisationId: orgId,
              patternType: 'amount_category',
              condition: {
                amountRange,
                description: transaction.description.substring(0, 100),
              } as unknown as Prisma.InputJsonValue,
              adjustment: {
                category: correctCategory,
                taxCategory: correctTaxCategory,
              } as unknown as Prisma.InputJsonValue,
              occurrences: 1,
              accuracy: 0.7, // Lower initial accuracy for amount-based patterns
              isActive: true,
            },
          });
        }
      }

      this.logger.log('Correction learned successfully');
    } catch (error) {
      this.logger.error('Failed to learn from correction:', error);
      throw new Error(`Learning from correction failed: ${error.message}`);
    }
  }

  /**
   * Apply learned patterns to a transaction
   */
  private async applyLearnedPatterns(
    transaction: TransactionForClassification,
    orgId: string,
  ): Promise<EnhancedTransactionClassification | null> {
    const vendor = extractVendorName(transaction.description);
    const normalizedVendor = vendor.toLowerCase().replace(/\s+/g, '-');

    // Look for vendor-based pattern
    const pattern = await this.prisma.learningPattern.findFirst({
      where: {
        organisationId: orgId,
        patternType: 'vendor_category',
        isActive: true,
        condition: {
          path: ['vendor'],
          equals: normalizedVendor,
        },
        accuracy: {
          gte: 0.8, // Only use patterns with high accuracy
        },
      },
      orderBy: {
        occurrences: 'desc',
      },
    });

    if (!pattern) {
      return null;
    }

    const adjustment = pattern.adjustment as unknown as { category: string; taxCategory: TaxCategory };
    const accuracy = parseFloat(pattern.accuracy.toString());

    this.logger.debug(
      `Found learned pattern for vendor "${vendor}" with accuracy ${accuracy}`,
    );

    // Build classification from learned pattern
    const taxCategory = adjustment.taxCategory;
    const eurInfo = getEurLineInfo(taxCategory);
    const deductibleAmount = calculateDeductibleAmount(
      Math.abs(transaction.amount),
      taxCategory,
    );

    return {
      category: adjustment.category,
      confidence: accuracy,
      tax: {
        deductible: true,
        deductionPercentage: eurInfo.deductionPercentage,
        deductibleAmount,
        vatReclaimable: true,
        taxCategory,
        eurLineNumber: eurInfo.lineNumber,
        eurDescription: eurInfo.germanDescription,
      },
      business: {
        isBusinessExpense: true,
        businessPercentage: 100,
        requiresDocumentation: eurInfo.requiresDocumentation,
        documentationType: 'INVOICE',
        specialRequirements: eurInfo.notes,
      },
      pattern: {
        isRecurring: true,
        vendor,
        vendorNormalized: normalizedVendor,
      },
      flags: {
        needsReview: false,
      },
      suggestedActions: ['Pattern learned from previous corrections'],
      alternativeCategories: [],
    };
  }

  /**
   * Load all learned patterns for an organization
   */
  private async loadLearnedPatterns(orgId: string): Promise<any[]> {
    return this.prisma.learningPattern.findMany({
      where: {
        organisationId: orgId,
        isActive: true,
        accuracy: {
          gte: 0.7,
        },
      },
      orderBy: {
        occurrences: 'desc',
      },
    });
  }

  /**
   * Find matching vendor in database
   */
  private async findMatchingVendor(
    vendorName: string,
    orgId: string,
  ): Promise<MatchedVendor | null> {
    const vendors = await this.prisma.vendor.findMany({
      where: {
        organisationId: orgId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        defaultCategoryId: true,
        defaultTaxDeductible: true,
      },
    });

    if (vendors.length === 0) {
      return null;
    }

    // Use VendorMatcher to find best match
    const match = this.vendorMatcher.findBestVendorMatch(
      vendorName,
      vendors.map((v) => ({ id: v.id, name: v.name })),
    );

    if (match && match.result.confidence >= 70) {
      const matchedVendor = vendors.find((v) => v.id === match.vendorId);
      this.logger.debug(
        `Matched vendor: ${vendorName} -> ${matchedVendor?.name} (confidence: ${match.result.confidence})`,
      );
      return matchedVendor || null;
    }

    return null;
  }

  /**
   * Build enhanced prompt with learned patterns and vendor data
   */
  private buildEnhancedPrompt(
    transaction: TransactionForClassification,
    learnedClassification: EnhancedTransactionClassification | null,
    matchedVendor: MatchedVendor | null,
  ): string {
    let prompt = buildClassificationPrompt(transaction);

    if (learnedClassification) {
      prompt += `\n\n## Previous Learning\n\nThis vendor has been previously classified as:\n- Category: ${learnedClassification.category}\n- Tax Category: ${learnedClassification.tax.taxCategory}\n- Confidence: ${learnedClassification.confidence.toFixed(2)}\n\nConsider this historical data in your classification.`;
    }

    if (matchedVendor) {
      prompt += `\n\n## Matched Vendor\n\nThis transaction matches vendor: ${matchedVendor.name}\n- Default Tax Deductible: ${matchedVendor.defaultTaxDeductible}\n\nConsider the vendor's default settings in your classification.`;
    }

    return prompt;
  }

  /**
   * Enhance with vendor data from database
   */
  private enhanceWithVendorData(
    aiResponse: AIClassificationResponse,
    vendor: MatchedVendor,
  ): void {
    aiResponse.pattern.vendor = vendor.name;
    aiResponse.pattern.vendorNormalized = vendor.name
      .toLowerCase()
      .replace(/\s+/g, '-');

    if (vendor.defaultCategoryId) {
      aiResponse.flags = aiResponse.flags || {};
      aiResponse.suggestedActions = aiResponse.suggestedActions || [];
      aiResponse.suggestedActions.push(
        `Vendor has default category: ${vendor.defaultCategoryId}`,
      );
    }
  }

  /**
   * Get amount range for pattern matching
   */
  private getAmountRange(amount: number): string {
    const absAmount = Math.abs(amount);
    if (absAmount < 5000) return '0-50';
    if (absAmount < 10000) return '50-100';
    if (absAmount < 25000) return '100-250';
    if (absAmount < 50000) return '250-500';
    if (absAmount < 100000) return '500-1000';
    return '1000+';
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    return !!this.claude;
  }
}
