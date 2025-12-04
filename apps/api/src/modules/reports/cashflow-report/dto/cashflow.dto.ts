/**
 * Cash Flow Statement DTOs
 * Comprehensive data transfer objects for IFRS/GAAP compliant cash flow reporting
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cash flow statement method (IFRS/GAAP)
 */
export enum CashFlowMethod {
  INDIRECT = 'INDIRECT', // Start with net income + adjustments (most common)
  DIRECT = 'DIRECT', // Show actual cash receipts/payments
}

/**
 * Cash flow activity categories
 */
export enum CashFlowCategory {
  OPERATING = 'OPERATING',
  INVESTING = 'INVESTING',
  FINANCING = 'FINANCING',
}

/**
 * Report period type
 */
export enum PeriodType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

/**
 * Cash flow projection method
 */
export enum ProjectionMethod {
  LINEAR = 'LINEAR', // Simple linear projection
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE', // Weight recent months more
  SEASONAL = 'SEASONAL', // Account for seasonal patterns
  TREND_ANALYSIS = 'TREND_ANALYSIS', // Advanced trend-based
}

/**
 * Generate Cash Flow Statement DTO
 */
export class GenerateCashFlowStatementDto {
  @ApiPropertyOptional({
    description: 'Start date for the reporting period (ISO 8601)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the reporting period (ISO 8601)',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Period type for predefined date ranges',
    enum: PeriodType,
    example: PeriodType.QUARTERLY,
  })
  @IsEnum(PeriodType)
  @IsOptional()
  periodType?: PeriodType;

  @ApiPropertyOptional({
    description: 'Cash flow method (Indirect is default and most common)',
    enum: CashFlowMethod,
    default: CashFlowMethod.INDIRECT,
  })
  @IsEnum(CashFlowMethod)
  @IsOptional()
  method?: CashFlowMethod = CashFlowMethod.INDIRECT;

  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeComparison?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include detailed line items',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeDetails?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include cash flow ratios and metrics',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeRatios?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include working capital analysis',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeWorkingCapital?: boolean = true;

  @ApiPropertyOptional({
    description: 'Currency code (defaults to organization currency)',
    example: 'EUR',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Export format',
    enum: ['JSON', 'PDF', 'EXCEL', 'CSV'],
    default: 'JSON',
  })
  @IsEnum(['JSON', 'PDF', 'EXCEL', 'CSV'])
  @IsOptional()
  format?: string = 'JSON';
}

/**
 * Cash Flow Projection DTO
 */
export class CashFlowProjectionDto {
  @ApiProperty({
    description: 'Number of months to project into the future',
    minimum: 1,
    maximum: 24,
    example: 6,
  })
  @IsNumber()
  @Min(1)
  @Max(24)
  months: number;

  @ApiPropertyOptional({
    description: 'Projection method to use',
    enum: ProjectionMethod,
    default: ProjectionMethod.WEIGHTED_AVERAGE,
  })
  @IsEnum(ProjectionMethod)
  @IsOptional()
  method?: ProjectionMethod = ProjectionMethod.WEIGHTED_AVERAGE;

  @ApiPropertyOptional({
    description: 'Number of historical months to analyze (3-24)',
    minimum: 3,
    maximum: 24,
    default: 12,
  })
  @IsNumber()
  @Min(3)
  @Max(24)
  @IsOptional()
  historicalMonths?: number = 12;

  @ApiPropertyOptional({
    description: 'Include confidence intervals',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeConfidenceIntervals?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include scenario analysis (best/worst case)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeScenarios?: boolean = false;
}

/**
 * Cash Flow Analysis DTO
 */
export class CashFlowAnalysisDto {
  @ApiPropertyOptional({
    description: 'Start date for analysis period',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analysis period',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Include cash conversion cycle analysis',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeCashConversionCycle?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include quality of earnings analysis',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeQualityOfEarnings?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include liquidity risk assessment',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeLiquidityRisks?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include free cash flow analysis',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeFreeCashFlow?: boolean = true;
}

/**
 * Burn Rate Analysis DTO
 */
export class BurnRateAnalysisDto {
  @ApiPropertyOptional({
    description: 'Number of months to analyze (3-12)',
    minimum: 3,
    maximum: 12,
    default: 6,
  })
  @IsNumber()
  @Min(3)
  @Max(12)
  @IsOptional()
  months?: number = 6;

  @ApiPropertyOptional({
    description: 'Include runway calculation',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeRunway?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include growth-adjusted burn rate',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeGrowthAdjusted?: boolean = false;

  @ApiPropertyOptional({
    description: 'Target monthly revenue for breakeven analysis',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  targetRevenue?: number;
}

/**
 * Cash Flow Ratios Request DTO
 */
export class CashFlowRatiosDto {
  @ApiPropertyOptional({
    description: 'Start date for ratio calculation',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for ratio calculation',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Include operating cash flow ratios',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeOperatingRatios?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include coverage ratios',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeCoverageRatios?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include efficiency ratios',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeEfficiencyRatios?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include quality metrics',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeQualityMetrics?: boolean = true;
}

/**
 * Working Capital Changes DTO (for detailed analysis)
 */
export class WorkingCapitalChangesDto {
  @ApiProperty({ description: 'Change in accounts receivable' })
  @IsNumber()
  accountsReceivableChange: number;

  @ApiProperty({ description: 'Change in inventory' })
  @IsNumber()
  inventoryChange: number;

  @ApiProperty({ description: 'Change in prepaid expenses' })
  @IsNumber()
  prepaidExpensesChange: number;

  @ApiProperty({ description: 'Change in accounts payable' })
  @IsNumber()
  accountsPayableChange: number;

  @ApiProperty({ description: 'Change in accrued liabilities' })
  @IsNumber()
  accruedLiabilitiesChange: number;

  @ApiProperty({ description: 'Change in deferred revenue' })
  @IsNumber()
  deferredRevenueChange: number;
}

/**
 * Non-Cash Adjustments DTO
 */
export class NonCashAdjustmentsDto {
  @ApiProperty({ description: 'Depreciation expense' })
  @IsNumber()
  depreciation: number;

  @ApiProperty({ description: 'Amortization expense' })
  @IsNumber()
  amortization: number;

  @ApiPropertyOptional({ description: 'Stock-based compensation' })
  @IsNumber()
  @IsOptional()
  stockBasedCompensation?: number;

  @ApiPropertyOptional({ description: 'Gain/loss on asset sales' })
  @IsNumber()
  @IsOptional()
  gainLossOnAssetSales?: number;

  @ApiPropertyOptional({ description: 'Impairment charges' })
  @IsNumber()
  @IsOptional()
  impairmentCharges?: number;

  @ApiPropertyOptional({ description: 'Foreign exchange gains/losses' })
  @IsNumber()
  @IsOptional()
  forexGainsLosses?: number;

  @ApiPropertyOptional({ description: 'Other non-cash items' })
  @IsNumber()
  @IsOptional()
  otherNonCashItems?: number;
}

/**
 * Cash Flow Filters DTO
 */
export class CashFlowFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific categories',
    enum: CashFlowCategory,
    isArray: true,
  })
  @IsEnum(CashFlowCategory, { each: true })
  @IsArray()
  @IsOptional()
  categories?: CashFlowCategory[];

  @ApiPropertyOptional({
    description: 'Minimum transaction amount to include',
  })
  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum transaction amount to include',
  })
  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter by specific accounts',
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  accountIds?: string[];

  @ApiPropertyOptional({
    description: 'Exclude specific transaction types',
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludeTypes?: string[];
}
