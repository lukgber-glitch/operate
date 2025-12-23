/**
 * DTOs for Report Generation
 */

import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsObject,
  IsNumber,
  IsDateString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ReportType,
  DateRangeType,
  ComparisonPeriodType,
} from '../interfaces/report.interfaces';

export class DateRangeDto {
  @ApiProperty({ enum: DateRangeType })
  type: DateRangeType;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;
}

export class ComparisonPeriodDto {
  @ApiProperty({ enum: ComparisonPeriodType })
  type: ComparisonPeriodType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;
}

export class CalculatedFieldDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  formula: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];
}

export class CacheStrategyDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 3600 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(86400)
  ttlSeconds?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ReportOptionsDto {
  @ApiPropertyOptional({ default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ type: ComparisonPeriodDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ComparisonPeriodDto)
  comparison?: ComparisonPeriodDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupBy?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean;

  @ApiPropertyOptional({ type: CacheStrategyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CacheStrategyDto)
  cache?: CacheStrategyDto;

  @ApiPropertyOptional({ type: [CalculatedFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculatedFieldDto)
  customFields?: CalculatedFieldDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;

  /**
   * Convert DTO to domain interface
   * Maps DTO types to their interface equivalents
   */
  toReportOptions(): import('../interfaces/report.interfaces').ReportOptions {
    return {
      currency: this.currency,
      comparison: this.comparison ? {
        type: this.comparison.type,
        startDate: this.comparison.startDate ? new Date(this.comparison.startDate) : new Date(),
        endDate: this.comparison.endDate ? new Date(this.comparison.endDate) : new Date(),
        label: this.comparison.label,
      } : undefined,
      groupBy: this.groupBy,
      filters: this.filters,
      includeDetails: this.includeDetails,
      cache: this.cache ? {
        enabled: this.cache.enabled ?? true,
        ttlSeconds: this.cache.ttlSeconds ?? 3600,
        key: '', // Will be set by service
        tags: this.cache.tags ?? [],
      } : undefined,
      customFields: this.customFields?.map(field => ({
        name: field.name,
        formula: field.formula,
        value: 0, // Will be calculated by service
        dependencies: field.dependencies ?? [],
      })),
      templateId: this.templateId,
    };
  }
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiProperty({ type: DateRangeDto })
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange: DateRangeDto;

  @ApiPropertyOptional({ type: ReportOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportOptionsDto)
  options?: ReportOptionsDto;
}

export class ReportFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  product?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  customFilters?: Record<string, any>;
}

export class AnnotationDto {
  @ApiProperty()
  @IsString()
  reportId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lineId?: string;

  @ApiProperty()
  @IsString()
  content: string;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiProperty({ type: Object })
  @IsObject()
  configuration: Record<string, any>;

  @ApiPropertyOptional({ type: [CalculatedFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculatedFieldDto)
  customFields?: CalculatedFieldDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class CompareReportsDto {
  @ApiProperty()
  @IsString()
  reportIdA: string;

  @ApiProperty()
  @IsString()
  reportIdB: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean;
}

export class DrillDownDto {
  @ApiProperty()
  @IsString()
  reportId: string;

  @ApiProperty()
  @IsString()
  sectionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lineId?: string;

  @ApiPropertyOptional({ type: ReportFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto;
}

export class ScheduleReportDto {
  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiProperty()
  @IsString()
  schedule: string; // cron expression

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({ type: ReportOptionsDto })
  @ValidateNested()
  @Type(() => ReportOptionsDto)
  options: ReportOptionsDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
