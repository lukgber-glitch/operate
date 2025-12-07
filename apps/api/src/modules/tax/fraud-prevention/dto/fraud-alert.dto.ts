/**
 * Fraud Alert DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsUUID,
  IsArray,
  IsBoolean,
  IsDate,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FraudAlertTypeDto {
  DUPLICATE_TRANSACTION = 'duplicate_transaction',
  DUPLICATE_DEDUCTION = 'duplicate_deduction',
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  THRESHOLD_APPROACHING = 'threshold_approaching',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  UNUSUAL_AMOUNT = 'unusual_amount',
  VELOCITY_SPIKE = 'velocity_spike',
  CATEGORY_ANOMALY = 'category_anomaly',
  TIMING_ANOMALY = 'timing_anomaly',
  ROUND_AMOUNT_PATTERN = 'round_amount_pattern',
}

export enum FraudAlertSeverityDto {
  INFO = 'info',
  WARNING = 'warning',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum FraudAlertStatusDto {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
  CONFIRMED = 'confirmed',
}

export enum RecommendedActionDto {
  BLOCK = 'block',
  REVIEW = 'review',
  WARN = 'warn',
  ALLOW = 'allow',
}

export class FraudEvidenceDto {
  @ApiProperty({ description: 'Type of evidence' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Evidence value' })
  @IsString()
  value!: string;

  @ApiProperty({ description: 'Explanation of evidence' })
  @IsString()
  explanation!: string;
}

export class FraudAlertDto {
  @ApiProperty({ description: 'Alert ID' })
  @IsUUID()
  id!: string;

  @ApiProperty({ enum: FraudAlertTypeDto, description: 'Alert type' })
  type!: FraudAlertTypeDto;

  @ApiProperty({ enum: FraudAlertSeverityDto, description: 'Alert severity' })
  severity!: FraudAlertSeverityDto;

  @ApiPropertyOptional({ description: 'Associated transaction ID' })
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Associated deduction ID' })
  @IsOptional()
  @IsUUID()
  deductionId?: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  orgId!: string;

  @ApiProperty({ description: 'Alert title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Alert description' })
  @IsString()
  description!: string;

  @ApiProperty({ type: [FraudEvidenceDto], description: 'Evidence list' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FraudEvidenceDto)
  evidence!: FraudEvidenceDto[];

  @ApiProperty({ enum: FraudAlertStatusDto, description: 'Alert status' })
  status!: FraudAlertStatusDto;

  @ApiPropertyOptional({ description: 'Reviewer user ID' })
  @IsOptional()
  @IsUUID()
  reviewedBy?: string;

  @ApiPropertyOptional({ description: 'Review timestamp' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reviewedAt?: Date;

  @ApiPropertyOptional({ description: 'Review note' })
  @IsOptional()
  @IsString()
  reviewNote?: string;

  @ApiProperty({ description: 'Created timestamp' })
  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @ApiProperty({
    enum: RecommendedActionDto,
    description: 'Recommended action',
  })
  recommendedAction!: RecommendedActionDto;

  @ApiProperty({ description: 'Whether alert was auto-resolved' })
  @IsBoolean()
  autoResolved!: boolean;
}

export class ReviewDecisionDto {
  @ApiProperty({
    enum: ['dismiss', 'confirm'],
    description: 'Review decision',
  })
  @IsEnum(['dismiss', 'confirm'])
  decision!: 'dismiss' | 'confirm';

  @ApiPropertyOptional({ description: 'Review note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Corrected category code' })
  @IsOptional()
  @IsString()
  correctedCategoryCode?: string;

  @ApiPropertyOptional({ description: 'Corrected amount in cents' })
  @IsOptional()
  correctedAmount?: number;
}

export class AlertFiltersDto {
  @ApiPropertyOptional({
    enum: FraudAlertStatusDto,
    isArray: true,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsArray()
  status?: FraudAlertStatusDto[];

  @ApiPropertyOptional({
    enum: FraudAlertSeverityDto,
    isArray: true,
    description: 'Filter by severity',
  })
  @IsOptional()
  @IsArray()
  severity?: FraudAlertSeverityDto[];

  @ApiPropertyOptional({
    enum: FraudAlertTypeDto,
    isArray: true,
    description: 'Filter by type',
  })
  @IsOptional()
  @IsArray()
  type?: FraudAlertTypeDto[];

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Filter by category code' })
  @IsOptional()
  @IsString()
  categoryCode?: string;
}
