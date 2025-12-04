/**
 * P&L Report DTOs
 * Data Transfer Objects for Profit & Loss Statement requests and responses
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PnlGroupingType {
  CATEGORY = 'CATEGORY',
  DEPARTMENT = 'DEPARTMENT',
  PROJECT = 'PROJECT',
  PRODUCT = 'PRODUCT',
  CLIENT = 'CLIENT',
  LOCATION = 'LOCATION',
}

export enum PnlAnalysisType {
  STANDARD = 'STANDARD',
  VERTICAL = 'VERTICAL', // Each line as % of revenue
  HORIZONTAL = 'HORIZONTAL', // Period-over-period changes
  COMMON_SIZE = 'COMMON_SIZE', // All items as % of revenue
  CONTRIBUTION_MARGIN = 'CONTRIBUTION_MARGIN', // Revenue - variable costs
}

export enum PnlPeriodType {
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

export class PnlFilterDto {
  @ApiPropertyOptional({ description: 'Start date for P&L period', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for P&L period', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: PnlPeriodType, description: 'Period type for quick selection' })
  @IsOptional()
  @IsEnum(PnlPeriodType)
  periodType?: PnlPeriodType;

  @ApiPropertyOptional({ description: 'Department ID to filter by' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Project ID to filter by' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Location ID to filter by' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ enum: ['EUR', 'USD', 'GBP', 'CHF'], default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Include only specific categories' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeCategories?: string[];

  @ApiPropertyOptional({ description: 'Exclude specific categories' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeCategories?: string[];
}

export class PnlOptionsDto {
  @ApiPropertyOptional({ enum: PnlAnalysisType, default: PnlAnalysisType.STANDARD })
  @IsOptional()
  @IsEnum(PnlAnalysisType)
  analysisType?: PnlAnalysisType;

  @ApiPropertyOptional({ enum: PnlGroupingType, default: PnlGroupingType.CATEGORY })
  @IsOptional()
  @IsEnum(PnlGroupingType)
  groupBy?: PnlGroupingType;

  @ApiPropertyOptional({ description: 'Include detailed line items', default: true })
  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean;

  @ApiPropertyOptional({ description: 'Include margin analysis', default: true })
  @IsOptional()
  @IsBoolean()
  includeMargins?: boolean;

  @ApiPropertyOptional({ description: 'Include trend indicators', default: true })
  @IsOptional()
  @IsBoolean()
  includeTrends?: boolean;

  @ApiPropertyOptional({ description: 'Include forecasting', default: false })
  @IsOptional()
  @IsBoolean()
  includeForecast?: boolean;

  @ApiPropertyOptional({ description: 'Include budget variance', default: false })
  @IsOptional()
  @IsBoolean()
  includeBudgetVariance?: boolean;

  @ApiPropertyOptional({ description: 'Number of periods for trend analysis', default: 12, minimum: 3, maximum: 36 })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(36)
  trendPeriods?: number;

  @ApiPropertyOptional({ description: 'Apply currency conversion', default: false })
  @IsOptional()
  @IsBoolean()
  convertCurrency?: boolean;

  @ApiPropertyOptional({ description: 'Show zero-value items', default: false })
  @IsOptional()
  @IsBoolean()
  showZeroValues?: boolean;

  @ApiPropertyOptional({ description: 'Round to nearest integer', default: false })
  @IsOptional()
  @IsBoolean()
  roundValues?: boolean;
}

export class ComparativePeriodDto {
  @ApiProperty({ description: 'Period start date', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Period end date', example: '2024-03-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Label for this period', example: 'Q1 2024' })
  @IsOptional()
  @IsString()
  label?: string;
}

export class ComparativePnlDto {
  @ApiProperty({ type: [ComparativePeriodDto], description: 'Periods to compare (max 12)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComparativePeriodDto)
  periods: ComparativePeriodDto[];

  @ApiPropertyOptional({ type: PnlOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PnlOptionsDto)
  options?: PnlOptionsDto;
}

export class BudgetVarianceDto {
  @ApiProperty({ description: 'Budget ID to compare against' })
  @IsString()
  budgetId: string;

  @ApiProperty({ description: 'Start date for comparison period', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for comparison period', example: '2024-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ type: PnlOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PnlOptionsDto)
  options?: PnlOptionsDto;
}

// Response DTOs

export class PnlLineItemDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Line item label' })
  label: string;

  @ApiProperty({ description: 'Amount value' })
  value: number;

  @ApiProperty({ description: 'Formatted currency value' })
  formattedValue: string;

  @ApiPropertyOptional({ description: 'Percentage of revenue' })
  percentageOfRevenue?: number;

  @ApiPropertyOptional({ description: 'Period-over-period change' })
  periodChange?: number;

  @ApiPropertyOptional({ description: 'Period-over-period change percentage' })
  periodChangePercent?: number;

  @ApiPropertyOptional({ description: 'Budget variance' })
  budgetVariance?: number;

  @ApiPropertyOptional({ description: 'Budget variance percentage' })
  budgetVariancePercent?: number;

  @ApiPropertyOptional({ description: 'Trend indicator' })
  trend?: 'UP' | 'DOWN' | 'FLAT';

  @ApiPropertyOptional({ description: 'Number of transactions' })
  transactionCount?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class PnlSectionDto {
  @ApiProperty({ description: 'Section identifier' })
  id: string;

  @ApiProperty({ description: 'Section title' })
  title: string;

  @ApiProperty({ description: 'Line items in this section' })
  items: PnlLineItemDto[];

  @ApiProperty({ description: 'Section subtotal' })
  subtotal: number;

  @ApiProperty({ description: 'Formatted subtotal' })
  formattedSubtotal: string;

  @ApiPropertyOptional({ description: 'Percentage of revenue' })
  percentageOfRevenue?: number;
}

export class MarginAnalysisDto {
  @ApiProperty({ description: 'Gross profit margin %' })
  grossMargin: number;

  @ApiProperty({ description: 'Operating margin %' })
  operatingMargin: number;

  @ApiProperty({ description: 'EBITDA margin %' })
  ebitdaMargin: number;

  @ApiProperty({ description: 'Net profit margin %' })
  netMargin: number;

  @ApiProperty({ description: 'Contribution margin %' })
  contributionMargin?: number;

  @ApiProperty({ description: 'Margin trend compared to previous period' })
  marginTrend: {
    grossMarginChange: number;
    operatingMarginChange: number;
    netMarginChange: number;
  };
}

export class BreakEvenAnalysisDto {
  @ApiProperty({ description: 'Break-even revenue point' })
  breakEvenRevenue: number;

  @ApiProperty({ description: 'Current revenue above/below break-even' })
  revenueAboveBreakEven: number;

  @ApiProperty({ description: 'Break-even percentage achieved' })
  breakEvenPercentage: number;

  @ApiProperty({ description: 'Fixed costs' })
  fixedCosts: number;

  @ApiProperty({ description: 'Variable costs as % of revenue' })
  variableCostRatio: number;
}

export class TrendDataPointDto {
  @ApiProperty({ description: 'Period label' })
  period: string;

  @ApiProperty({ description: 'Date for this period' })
  date: string;

  @ApiProperty({ description: 'Value for this metric' })
  value: number;

  @ApiPropertyOptional({ description: 'Forecasted value (if applicable)' })
  forecast?: number;

  @ApiPropertyOptional({ description: 'Confidence interval lower bound' })
  forecastLower?: number;

  @ApiPropertyOptional({ description: 'Confidence interval upper bound' })
  forecastUpper?: number;
}

export class TrendAnalysisDto {
  @ApiProperty({ description: 'Metric name' })
  metric: string;

  @ApiProperty({ description: 'Historical data points' })
  historicalData: TrendDataPointDto[];

  @ApiProperty({ description: 'Growth rate %' })
  growthRate: number;

  @ApiProperty({ description: 'Seasonality detected' })
  hasSeasonality: boolean;

  @ApiPropertyOptional({ description: 'Seasonal pattern strength' })
  seasonalityStrength?: number;

  @ApiPropertyOptional({ description: 'Next period forecast' })
  nextPeriodForecast?: number;
}

export class ForecastDto {
  @ApiProperty({ description: 'Forecasted revenue' })
  revenue: number;

  @ApiProperty({ description: 'Forecasted COGS' })
  cogs: number;

  @ApiProperty({ description: 'Forecasted gross profit' })
  grossProfit: number;

  @ApiProperty({ description: 'Forecasted operating expenses' })
  operatingExpenses: number;

  @ApiProperty({ description: 'Forecasted net income' })
  netIncome: number;

  @ApiProperty({ description: 'Forecast confidence %' })
  confidence: number;

  @ApiProperty({ description: 'Basis for forecast' })
  methodology: string;

  @ApiProperty({ description: 'Number of periods used for forecast' })
  periodsAnalyzed: number;
}

export class PnlReportDto {
  @ApiProperty({ description: 'Report metadata' })
  metadata: {
    organisationId: string;
    generatedAt: string;
    periodStart: string;
    periodEnd: string;
    currency: string;
    analysisType: PnlAnalysisType;
    reportVersion: string;
  };

  @ApiProperty({ description: 'Summary metrics' })
  summary: {
    totalRevenue: number;
    totalCogs: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    ebitda: number;
    depreciation: number;
    amortization: number;
    operatingIncome: number;
    interestIncome: number;
    interestExpense: number;
    otherIncome: number;
    otherExpenses: number;
    preTaxIncome: number;
    taxExpense: number;
    netIncome: number;
  };

  @ApiProperty({ description: 'Revenue section' })
  revenue: PnlSectionDto;

  @ApiProperty({ description: 'Cost of Goods Sold section' })
  cogs: PnlSectionDto;

  @ApiProperty({ description: 'Gross Profit section' })
  grossProfit: {
    amount: number;
    formattedAmount: string;
    margin: number;
  };

  @ApiProperty({ description: 'Operating Expenses section' })
  operatingExpenses: PnlSectionDto;

  @ApiProperty({ description: 'EBITDA section' })
  ebitda: {
    amount: number;
    formattedAmount: string;
    margin: number;
  };

  @ApiProperty({ description: 'Operating Income section' })
  operatingIncome: {
    amount: number;
    formattedAmount: string;
    margin: number;
  };

  @ApiProperty({ description: 'Other income and expenses section' })
  otherIncomeExpenses: PnlSectionDto;

  @ApiProperty({ description: 'Net Income section' })
  netIncome: {
    amount: number;
    formattedAmount: string;
    margin: number;
  };

  @ApiPropertyOptional({ description: 'Margin analysis' })
  marginAnalysis?: MarginAnalysisDto;

  @ApiPropertyOptional({ description: 'Break-even analysis' })
  breakEvenAnalysis?: BreakEvenAnalysisDto;

  @ApiPropertyOptional({ description: 'Trend analysis' })
  trends?: TrendAnalysisDto[];

  @ApiPropertyOptional({ description: 'Forecast data' })
  forecast?: ForecastDto;
}

export class ComparativePnlReportDto {
  @ApiProperty({ description: 'Report metadata' })
  metadata: {
    organisationId: string;
    generatedAt: string;
    comparisonPeriods: number;
    currency: string;
  };

  @ApiProperty({ description: 'Period labels' })
  periods: string[];

  @ApiProperty({ description: 'Summary metrics by period' })
  summaryByPeriod: Array<{
    period: string;
    revenue: number;
    grossProfit: number;
    grossMargin: number;
    operatingIncome: number;
    operatingMargin: number;
    netIncome: number;
    netMargin: number;
  }>;

  @ApiProperty({ description: 'Line items with values across all periods' })
  lineItems: Array<{
    label: string;
    category: string;
    values: number[];
    percentageChange: number[];
    trend: string;
  }>;

  @ApiProperty({ description: 'Variance analysis between periods' })
  varianceAnalysis: {
    revenueGrowth: number[];
    expenseGrowth: number[];
    marginExpansion: number[];
  };
}

export class BudgetVarianceReportDto {
  @ApiProperty({ description: 'Report metadata' })
  metadata: {
    organisationId: string;
    budgetId: string;
    periodStart: string;
    periodEnd: string;
    currency: string;
  };

  @ApiProperty({ description: 'Summary of variances' })
  summary: {
    budgetedRevenue: number;
    actualRevenue: number;
    revenueVariance: number;
    revenueVariancePercent: number;
    budgetedExpenses: number;
    actualExpenses: number;
    expenseVariance: number;
    expenseVariancePercent: number;
    budgetedNetIncome: number;
    actualNetIncome: number;
    netIncomeVariance: number;
    netIncomeVariancePercent: number;
  };

  @ApiProperty({ description: 'Detailed variance by line item' })
  lineItemVariances: Array<{
    category: string;
    label: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercent: number;
    status: 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TARGET';
  }>;

  @ApiProperty({ description: 'Variance explanation insights' })
  insights: string[];
}
