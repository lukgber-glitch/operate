/**
 * DTOs for AI Learning from Corrections
 */

import { IsString, IsNotEmpty, IsObject, IsUUID, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EntityType {
  RECEIPT = 'receipt',
  EXPENSE = 'expense',
  INVOICE = 'invoice',
  TRANSACTION = 'transaction',
}

export enum CorrectionField {
  CATEGORY = 'category',
  MERCHANT = 'merchant',
  TAX_DEDUCTIBLE = 'taxDeductible',
  DEDUCTION_CATEGORY = 'deductionCategory',
  DEDUCTION_PERCENTAGE = 'deductionPercentage',
  BUSINESS_PURPOSE = 'businessPurpose',
  SUBCATEGORY = 'subcategory',
}

export enum PatternType {
  MERCHANT_CATEGORY = 'merchant_category',
  AMOUNT_CATEGORY = 'amount_category',
  KEYWORD_SUBCATEGORY = 'keyword_subcategory',
  MERCHANT_TAX_DEDUCTIBLE = 'merchant_tax_deductible',
  AMOUNT_TAX_DEDUCTIBLE = 'amount_tax_deductible',
  CATEGORY_SUBCATEGORY = 'category_subcategory',
  DESCRIPTION_CATEGORY = 'description_category',
}

export class RecordCorrectionDto {
  @ApiProperty({ description: 'Organisation ID' })
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  @ApiProperty({ enum: EntityType, description: 'Type of entity being corrected' })
  @IsNotEmpty()
  entityType: EntityType;

  @ApiProperty({ description: 'ID of the entity being corrected' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ enum: CorrectionField, description: 'Field that was corrected' })
  @IsNotEmpty()
  field: CorrectionField;

  @ApiProperty({ description: 'Original AI-predicted value' })
  @IsObject()
  @IsNotEmpty()
  originalValue: any;

  @ApiProperty({ description: 'User-corrected value' })
  @IsObject()
  @IsNotEmpty()
  correctedValue: any;

  @ApiProperty({ description: 'User ID who made the correction' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: 'Additional context for pattern matching' })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

export class ApplyLearningDto {
  @ApiProperty({ description: 'Organisation ID' })
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  @ApiProperty({ enum: EntityType, description: 'Type of entity to classify' })
  @IsNotEmpty()
  entityType: EntityType;

  @ApiProperty({ description: 'Data to apply learning to' })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}

export class CorrectionPatternDto {
  id: string;
  organisationId: string;
  patternType: PatternType;
  condition: Record<string, any>;
  adjustment: Record<string, any>;
  occurrences: number;
  accuracy: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LearningAdjustmentDto {
  @ApiProperty({ description: 'Field to adjust' })
  field: string;

  @ApiProperty({ description: 'Original value' })
  originalValue: any;

  @ApiProperty({ description: 'Suggested value based on learning' })
  suggestedValue: any;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ description: 'Pattern that triggered this adjustment' })
  patternType: PatternType;

  @ApiProperty({ description: 'Number of times this pattern has been observed' })
  occurrences: number;

  @ApiProperty({ description: 'Historical accuracy of this pattern' })
  accuracy: number;

  @ApiProperty({ description: 'Reasoning for the suggestion' })
  reasoning: string;
}

export class AccuracyStatsDto {
  @ApiProperty({ description: 'Organisation ID' })
  organisationId: string;

  @ApiProperty({ description: 'Overall accuracy percentage' })
  overallAccuracy: number;

  @ApiProperty({ description: 'Accuracy by field' })
  accuracyByField: Record<CorrectionField, number>;

  @ApiProperty({ description: 'Accuracy by entity type' })
  accuracyByEntityType: Record<EntityType, number>;

  @ApiProperty({ description: 'Total classifications' })
  totalClassifications: number;

  @ApiProperty({ description: 'Total corrections made' })
  totalCorrections: number;

  @ApiProperty({ description: 'Active learning patterns' })
  activePatternsCount: number;

  @ApiProperty({ description: 'Improvement over time (percentage points)' })
  improvement: number;

  @ApiProperty({ description: 'Stats by pattern type' })
  patternStats: Array<{
    patternType: PatternType;
    occurrences: number;
    accuracy: number;
    lastUsed: Date;
  }>;
}

export class GetPatternsQueryDto {
  @ApiPropertyOptional({ enum: PatternType, description: 'Filter by pattern type' })
  @IsOptional()
  patternType?: PatternType;

  @ApiPropertyOptional({ description: 'Only active patterns' })
  @IsOptional()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Minimum accuracy threshold' })
  @IsOptional()
  @Min(0)
  @Max(1)
  minAccuracy?: number;

  @ApiPropertyOptional({ description: 'Minimum occurrences' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minOccurrences?: number;
}
