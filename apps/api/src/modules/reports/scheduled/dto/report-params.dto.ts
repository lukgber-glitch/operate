import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  PROFIT_LOSS = 'profit_loss',
  CASH_FLOW = 'cash_flow',
  TAX_SUMMARY = 'tax_summary',
  VAT_REPORT = 'vat_report',
  REVENUE = 'revenue',
  EXPENSES = 'expenses',
  BALANCE_SHEET = 'balance_sheet',
  PAYROLL = 'payroll',
  CUSTOM = 'custom',
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  BOTH = 'both',
}

export enum DateRangeType {
  LAST_MONTH = 'last_month',
  LAST_QUARTER = 'last_quarter',
  LAST_YEAR = 'last_year',
  MONTH_TO_DATE = 'month_to_date',
  QUARTER_TO_DATE = 'quarter_to_date',
  YEAR_TO_DATE = 'year_to_date',
  CUSTOM = 'custom',
}

export class DateRangeDto {
  @ApiProperty({
    description: 'Date range type',
    enum: DateRangeType,
    example: DateRangeType.LAST_MONTH,
  })
  @IsEnum(DateRangeType)
  type: DateRangeType;

  @ApiPropertyOptional({
    description: 'Custom start date (required if type is CUSTOM)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Custom end date (required if type is CUSTOM)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ReportFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific accounts',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accountIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by categories',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by departments',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by tags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter by currency',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Include only reconciled transactions',
    default: false,
  })
  @IsOptional()
  reconciledOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Additional custom filters',
  })
  @IsOptional()
  @IsObject()
  custom?: Record<string, any>;
}

export class ReportParamsDto {
  @ApiProperty({
    description: 'Type of report to generate',
    enum: ReportType,
    example: ReportType.PROFIT_LOSS,
  })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({
    description: 'Date range for the report',
    type: DateRangeDto,
  })
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange: DateRangeDto;

  @ApiProperty({
    description: 'Export format(s)',
    enum: ExportFormat,
    example: ExportFormat.PDF,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Report filters',
    type: ReportFiltersDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFiltersDto)
  filters?: ReportFiltersDto;

  @ApiPropertyOptional({
    description: 'Include charts and visualizations',
    default: true,
  })
  @IsOptional()
  includeCharts?: boolean;

  @ApiPropertyOptional({
    description: 'Include detailed breakdown',
    default: true,
  })
  @IsOptional()
  includeDetails?: boolean;

  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
    default: false,
  })
  @IsOptional()
  includeComparison?: boolean;

  @ApiPropertyOptional({
    description: 'Custom report template ID',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Additional report-specific parameters',
  })
  @IsOptional()
  @IsObject()
  customParams?: Record<string, any>;
}
