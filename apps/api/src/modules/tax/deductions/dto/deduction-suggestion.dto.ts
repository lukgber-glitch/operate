import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

/**
 * Deduction suggestion status enum
 */
export enum DeductionSuggestionStatus {
  SUGGESTED = 'SUGGESTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  MODIFIED = 'MODIFIED',
}

/**
 * Requirement status DTO
 */
export class RequirementStatusDto {
  @ApiProperty()
  receiptAttached!: boolean;

  @ApiProperty()
  receiptRequired!: boolean;

  @ApiProperty()
  businessPurposeProvided!: boolean;

  @ApiProperty()
  businessPurposeRequired!: boolean;

  @ApiProperty()
  logbookRequired!: boolean;

  @ApiPropertyOptional()
  additionalRequirements?: {
    requirement: string;
    fulfilled: boolean;
  }[];
}

/**
 * Deduction suggestion response DTO
 */
export class DeductionSuggestionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  transactionId!: string;

  @ApiProperty()
  orgId!: string;

  // Matched rule
  @ApiProperty()
  ruleId!: string;

  @ApiProperty()
  categoryCode!: string;

  @ApiProperty()
  categoryName!: string;

  // Amounts
  @ApiProperty()
  originalAmount!: number;

  @ApiProperty()
  deductibleAmount!: number;

  @ApiProperty()
  deductiblePercentage!: number;

  @ApiProperty()
  currency!: string;

  // Legal info
  @ApiProperty()
  legalReference!: string;

  @ApiProperty()
  legalDescription!: string;

  // Status
  @ApiProperty({ enum: DeductionSuggestionStatus })
  status!: DeductionSuggestionStatus;

  // Requirements
  @ApiProperty({ type: RequirementStatusDto })
  requirements!: RequirementStatusDto;

  // AI confidence
  @ApiProperty()
  confidence!: number;

  @ApiProperty()
  reasoning!: string;

  // Audit
  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  confirmedAt?: Date;

  @ApiPropertyOptional()
  confirmedBy?: string;

  @ApiPropertyOptional()
  rejectedAt?: Date;

  @ApiPropertyOptional()
  rejectedBy?: string;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  modifiedAt?: Date;

  @ApiPropertyOptional()
  modifiedBy?: string;
}

/**
 * Generate suggestions request DTO
 */
export class GenerateSuggestionsDto {
  @ApiProperty({
    description: 'Country code (DE, AT, CH)',
    example: 'DE',
  })
  @IsString()
  countryCode!: string;

  @ApiPropertyOptional({
    description: 'Tax year to generate suggestions for',
    example: 2024,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  taxYear?: number;

  @ApiPropertyOptional({
    description: 'Minimum confidence threshold (0.0 - 1.0)',
    example: 0.7,
  })
  @IsOptional()
  @Min(0)
  @Max(1)
  minConfidence?: number;

  @ApiPropertyOptional({
    description: 'Transaction IDs to generate suggestions for (optional)',
  })
  @IsOptional()
  transactionIds?: string[];
}

/**
 * Suggestion filters DTO
 */
export class SuggestionFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: DeductionSuggestionStatus,
  })
  @IsOptional()
  @IsEnum(DeductionSuggestionStatus)
  status?: DeductionSuggestionStatus;

  @ApiPropertyOptional({
    description: 'Filter by category code',
  })
  @IsOptional()
  @IsString()
  categoryCode?: string;

  @ApiPropertyOptional({
    description: 'Filter by tax year',
  })
  @IsOptional()
  @IsInt()
  taxYear?: number;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
