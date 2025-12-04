/**
 * Revenue Report DTOs
 * Data Transfer Objects for revenue recognition and reporting
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';

/**
 * Base Query DTO for revenue reports
 */
export class RevenueQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for the report (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the report (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';
}

/**
 * MRR Query DTO
 */
export class MrrQueryDto extends RevenueQueryDto {
  @ApiPropertyOptional({
    description: 'Group results by tier',
    default: false,
  })
  @IsOptional()
  groupByTier?: boolean;
}

/**
 * Cohort Query DTO
 */
export class CohortQueryDto {
  @ApiPropertyOptional({
    description: 'Start cohort month (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startCohort?: string;

  @ApiPropertyOptional({
    description: 'End cohort month (ISO 8601)',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString()
  endCohort?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';

  @ApiPropertyOptional({
    description: 'Minimum customers in cohort to include',
    example: 5,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minCustomers?: number = 1;
}

/**
 * Forecast Query DTO
 */
export class ForecastQueryDto {
  @ApiPropertyOptional({
    description: 'Number of months to forecast',
    example: 12,
    default: 12,
    minimum: 1,
    maximum: 24,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number = 12;

  @ApiPropertyOptional({
    description: 'Forecast method',
    enum: ['LINEAR', 'MOVING_AVERAGE', 'EXPONENTIAL'],
    default: 'LINEAR',
  })
  @IsOptional()
  @IsEnum(['LINEAR', 'MOVING_AVERAGE', 'EXPONENTIAL'])
  method?: 'LINEAR' | 'MOVING_AVERAGE' | 'EXPONENTIAL' = 'LINEAR';

  @ApiPropertyOptional({
    description: 'Months of historical data to use',
    example: 12,
    default: 12,
    minimum: 3,
    maximum: 36,
  })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(36)
  historicalPeriod?: number = 12;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';
}

/**
 * Deferred Revenue Query DTO
 */
export class DeferredRevenueQueryDto {
  @ApiPropertyOptional({
    description: 'As of date for the schedule',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'COMPLETED', 'CANCELLED'])
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  @ApiPropertyOptional({
    description: 'Organisation ID to filter by',
  })
  @IsOptional()
  @IsString()
  organisationId?: string;
}

/**
 * Create Revenue Recognition DTO
 */
export class CreateRevenueRecognitionDto {
  @ApiProperty({
    description: 'Organisation ID',
    example: 'org_123',
  })
  @IsString()
  organisationId: string;

  @ApiPropertyOptional({
    description: 'Subscription ID',
    example: 'sub_123',
  })
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @ApiProperty({
    description: 'Period start date',
    example: '2024-01-01',
  })
  @IsDateString()
  periodStart: string;

  @ApiProperty({
    description: 'Period end date',
    example: '2024-01-31',
  })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({
    description: 'Total amount in cents',
    example: 10000,
  })
  @IsInt()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Monthly subscription revenue',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Invoice ID',
    example: 'inv_123',
  })
  @IsOptional()
  @IsString()
  invoiceId?: string;
}

/**
 * Create Deferred Revenue Schedule DTO
 */
export class CreateDeferredRevenueDto {
  @ApiProperty({
    description: 'Organisation ID',
    example: 'org_123',
  })
  @IsString()
  organisationId: string;

  @ApiProperty({
    description: 'Invoice ID',
    example: 'inv_123',
  })
  @IsString()
  invoiceId: string;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2024-001',
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiProperty({
    description: 'Billing date',
    example: '2024-01-01',
  })
  @IsDateString()
  billingDate: string;

  @ApiProperty({
    description: 'Recognition start date',
    example: '2024-01-01',
  })
  @IsDateString()
  recognitionStart: string;

  @ApiProperty({
    description: 'Recognition end date',
    example: '2024-12-31',
  })
  @IsDateString()
  recognitionEnd: string;

  @ApiProperty({
    description: 'Total amount in cents',
    example: 120000,
  })
  @IsInt()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Annual subscription payment',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
