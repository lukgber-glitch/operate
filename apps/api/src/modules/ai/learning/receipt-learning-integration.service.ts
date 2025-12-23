/**
 * Receipt Learning Integration Service
 * Integrates learning system with receipt scanner
 */

import { Injectable, Logger } from '@nestjs/common';
import { CorrectionLearningService } from './correction-learning.service';
import { EntityType, CorrectionField } from './dto/learning.dto';

@Injectable()
export class ReceiptLearningIntegrationService {
  private readonly logger = new Logger(ReceiptLearningIntegrationService.name);

  constructor(private readonly learningService: CorrectionLearningService) {}

  /**
   * Record receipt confirmation with corrections
   * Called when user confirms a receipt with modifications
   */
  async recordReceiptCorrections(params: {
    organisationId: string;
    receiptId: string;
    userId: string;
    originalData: {
      merchant?: string;
      category?: string;
      subcategory?: string;
      amount?: number;
      currency?: string;
      taxDeductible?: boolean;
      deductionPercentage?: number;
      description?: string;
    };
    confirmedData: {
      merchant?: string;
      category?: string;
      subcategory?: string;
      amount?: number;
      currency?: string;
      taxDeductible?: boolean;
      deductionPercentage?: number;
      description?: string;
    };
  }): Promise<void> {
    this.logger.log(`Recording receipt corrections for receipt ${params.receiptId}`);

    const { organisationId, receiptId, userId, originalData, confirmedData } = params;

    // Compare original vs confirmed and record corrections
    const corrections = [];

    // Merchant correction
    if (originalData.merchant !== confirmedData.merchant && confirmedData.merchant) {
      corrections.push({
        field: CorrectionField.MERCHANT,
        originalValue: { merchant: originalData.merchant },
        correctedValue: { merchant: confirmedData.merchant },
      });
    }

    // Category correction
    if (originalData.category !== confirmedData.category && confirmedData.category) {
      corrections.push({
        field: CorrectionField.CATEGORY,
        originalValue: { category: originalData.category },
        correctedValue: { category: confirmedData.category },
        context: {
          merchant: confirmedData.merchant,
          amount: confirmedData.amount,
          currency: confirmedData.currency,
          description: confirmedData.description,
        },
      });
    }

    // Subcategory correction
    if (originalData.subcategory !== confirmedData.subcategory && confirmedData.subcategory) {
      corrections.push({
        field: CorrectionField.SUBCATEGORY,
        originalValue: { subcategory: originalData.subcategory },
        correctedValue: { subcategory: confirmedData.subcategory },
        context: {
          merchant: confirmedData.merchant,
          category: confirmedData.category,
          description: confirmedData.description,
        },
      });
    }

    // Tax deductible correction
    if (
      (originalData.taxDeductible !== confirmedData.taxDeductible ||
        originalData.deductionPercentage !== confirmedData.deductionPercentage) &&
      confirmedData.taxDeductible !== undefined
    ) {
      corrections.push({
        field: CorrectionField.TAX_DEDUCTIBLE,
        originalValue: {
          taxDeductible: originalData.taxDeductible,
          deductionPercentage: originalData.deductionPercentage,
        },
        correctedValue: {
          taxDeductible: confirmedData.taxDeductible,
          deductionPercentage: confirmedData.deductionPercentage,
        },
        context: {
          merchant: confirmedData.merchant,
          category: confirmedData.category,
          amount: confirmedData.amount,
          currency: confirmedData.currency,
        },
      });
    }

    // Record all corrections
    for (const correction of corrections) {
      try {
        await this.learningService.recordCorrection({
          organisationId,
          entityType: EntityType.RECEIPT,
          entityId: receiptId,
          field: correction.field,
          originalValue: correction.originalValue,
          correctedValue: correction.correctedValue,
          userId,
          context: correction.context,
        });
      } catch (error) {
        this.logger.error(
          `Failed to record correction for ${correction.field}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Recorded ${corrections.length} corrections for receipt ${receiptId}`);
  }

  /**
   * Enhance receipt classification with learned patterns
   * Called before returning classification results to user
   */
  async enhanceWithLearning(params: {
    organisationId: string;
    receiptData: {
      merchant?: string;
      category?: string;
      subcategory?: string;
      amount?: number;
      currency?: string;
      taxDeductible?: boolean;
      deductionPercentage?: number;
      description?: string;
    };
  }): Promise<{
    suggestions: Array<{
      field: string;
      value: any;
      confidence: number;
      reasoning: string;
    }>;
    enhancedData: any;
  }> {
    this.logger.debug(`Enhancing receipt with learning for org ${params.organisationId}`);

    try {
      // Apply learning patterns
      const adjustments = await this.learningService.applyLearning({
        organisationId: params.organisationId,
        entityType: EntityType.RECEIPT,
        data: params.receiptData,
      });

      // Convert adjustments to suggestions
      const suggestions = adjustments.map((adj) => ({
        field: adj.field,
        value: adj.suggestedValue,
        confidence: adj.confidence,
        reasoning: adj.reasoning,
      }));

      // Create enhanced data by applying high-confidence suggestions
      const enhancedData = { ...params.receiptData };
      adjustments.forEach((adj) => {
        // Auto-apply suggestions with >90% confidence
        if (adj.confidence > 0.9) {
          enhancedData[adj.field] = adj.suggestedValue;
        }
      });

      return { suggestions, enhancedData };
    } catch (error) {
      this.logger.error(`Failed to enhance with learning: ${error.message}`);
      return { suggestions: [], enhancedData: params.receiptData };
    }
  }

  /**
   * Get learning insights for a merchant
   */
  async getMerchantInsights(organisationId: string, merchant: string): Promise<{
    category?: string;
    subcategory?: string;
    taxDeductible?: boolean;
    deductionPercentage?: number;
    confidence: number;
    basedOnCorrections: number;
  } | null> {
    try {
      const patterns = await this.learningService.getCorrectionPatterns(organisationId, {
        activeOnly: true,
        minAccuracy: 0.7,
        minOccurrences: 3,
      });

      // Find patterns matching this merchant
      const merchantPatterns = patterns.filter((p) => {
        const condition = p.condition as unknown as { merchant?: string; [key: string]: any };
        return condition.merchant && merchant.toLowerCase().includes(condition.merchant);
      });

      if (merchantPatterns.length === 0) {
        return null;
      }

      // Aggregate insights
      const insights: any = {
        confidence: 0,
        basedOnCorrections: 0,
      };

      merchantPatterns.forEach((pattern) => {
        const adjustment = pattern.adjustment as unknown as {
          category?: string;
          subcategory?: string;
          taxDeductible?: boolean;
          deductionPercentage?: number;
          [key: string]: any;
        };

        if (adjustment.category) {
          insights.category = adjustment.category;
        }
        if (adjustment.subcategory) {
          insights.subcategory = adjustment.subcategory;
        }
        if (adjustment.taxDeductible !== undefined) {
          insights.taxDeductible = adjustment.taxDeductible;
          insights.deductionPercentage = adjustment.deductionPercentage;
        }

        insights.confidence = Math.max(insights.confidence, pattern.accuracy);
        insights.basedOnCorrections += pattern.occurrences;
      });

      return insights;
    } catch (error) {
      this.logger.error(`Failed to get merchant insights: ${error.message}`);
      return null;
    }
  }
}
