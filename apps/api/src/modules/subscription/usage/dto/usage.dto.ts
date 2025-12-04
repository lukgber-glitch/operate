/**
 * Usage DTOs
 * Data transfer objects for usage-based billing
 */

import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsObject,
  IsDateString,
  Min,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsageFeature } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * Track Usage DTO
 */
export class TrackUsageDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ enum: UsageFeature, description: 'Feature being used' })
  @IsEnum(UsageFeature)
  feature: UsageFeature;

  @ApiPropertyOptional({ description: 'Usage quantity', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Event metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'User ID (if applicable)' })
  @IsOptional()
  @IsString()
  userId?: string;
}

/**
 * Get Usage Summary DTO
 */
export class GetUsageSummaryDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({
    description: 'Period start date (ISO 8601)',
    example: '2024-12-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({
    description: 'Period end date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional({
    enum: UsageFeature,
    isArray: true,
    description: 'Filter by specific features',
  })
  @IsOptional()
  @IsEnum(UsageFeature, { each: true })
  features?: UsageFeature[];
}

/**
 * Usage Summary Response DTO
 */
export class UsageSummaryResponseDto {
  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;

  @ApiProperty({ type: [FeatureUsageDto] })
  features: FeatureUsageDto[];

  @ApiProperty()
  totalOverageAmount: number;

  @ApiProperty()
  currency: string;
}

/**
 * Feature Usage DTO
 */
export class FeatureUsageDto {
  @ApiProperty({ enum: UsageFeature })
  feature: UsageFeature;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  totalQuantity: number;

  @ApiProperty()
  includedQuantity: number;

  @ApiProperty()
  overageQuantity: number;

  @ApiProperty()
  pricePerUnit: number;

  @ApiProperty()
  overageAmount: number;

  @ApiProperty()
  percentUsed: number;

  @ApiProperty()
  currency: string;
}

/**
 * Configure Usage Quota DTO
 */
export class ConfigureUsageQuotaDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ enum: UsageFeature })
  @IsEnum(UsageFeature)
  feature: UsageFeature;

  @ApiProperty({ description: 'Included quantity in free tier' })
  @IsInt()
  @Min(0)
  includedQuantity: number;

  @ApiProperty({ description: 'Price per unit in cents' })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Reset period',
    enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY'],
    default: 'MONTHLY',
  })
  @IsOptional()
  @IsString()
  resetPeriod?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

  @ApiPropertyOptional({ description: 'Activate quota', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Usage Estimate DTO
 */
export class UsageEstimateDto {
  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  estimatedDate: Date;

  @ApiProperty({ type: [FeatureEstimateDto] })
  features: FeatureEstimateDto[];

  @ApiProperty()
  estimatedTotalAmount: number;

  @ApiProperty()
  currency: string;
}

/**
 * Feature Estimate DTO
 */
export class FeatureEstimateDto {
  @ApiProperty({ enum: UsageFeature })
  feature: UsageFeature;

  @ApiProperty()
  projectedQuantity: number;

  @ApiProperty()
  projectedOverage: number;

  @ApiProperty()
  estimatedAmount: number;
}

/**
 * Usage History Query DTO
 */
export class UsageHistoryQueryDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({ description: 'Start date for history range' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for history range' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Number of periods to return', default: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    enum: UsageFeature,
    isArray: true,
    description: 'Filter by specific features',
  })
  @IsOptional()
  @IsEnum(UsageFeature, { each: true })
  features?: UsageFeature[];
}

/**
 * Usage History Response DTO
 */
export class UsageHistoryResponseDto {
  @ApiProperty()
  organizationId: string;

  @ApiProperty({ type: [UsageHistoryPeriodDto] })
  periods: UsageHistoryPeriodDto[];
}

/**
 * Usage History Period DTO
 */
export class UsageHistoryPeriodDto {
  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;

  @ApiProperty({ type: [FeatureUsageDto] })
  features: FeatureUsageDto[];

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  currency: string;
}

/**
 * Bulk Track Usage DTO
 */
export class BulkTrackUsageDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ type: [TrackUsageEventDto], description: 'Usage events to track' })
  events: TrackUsageEventDto[];
}

/**
 * Track Usage Event DTO
 */
export class TrackUsageEventDto {
  @ApiProperty({ enum: UsageFeature })
  @IsEnum(UsageFeature)
  feature: UsageFeature;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}
