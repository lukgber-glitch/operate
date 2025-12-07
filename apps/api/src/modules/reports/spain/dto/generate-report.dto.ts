/**
 * Spain Report Generation DTOs
 * Task: W25-T4
 */

import {
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpainReportType } from '../interfaces/spain-report.interface';

/**
 * Report period DTO
 */
export class ReportPeriodDto {
  @ApiProperty({ description: 'Fiscal year', example: 2024 })
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({ description: 'Quarter (1-4)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  quarter?: 1 | 2 | 3 | 4;

  @ApiPropertyOptional({ description: 'Month (1-12)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ description: 'Is annual report', example: false })
  @IsOptional()
  @IsBoolean()
  isAnnual?: boolean;
}

/**
 * Taxpayer information DTO
 */
export class TaxpayerDto {
  @ApiProperty({
    description: 'Spanish Tax ID (NIF/CIF)',
    example: 'B12345678',
  })
  @IsString()
  @Matches(
    /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[A-W][0-9]{7}[0-9A-J])$/,
    {
      message: 'Invalid Spanish NIF/CIF format',
    },
  )
  nif: string;

  @ApiProperty({ description: 'Taxpayer name', example: 'Mi Empresa SL' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Fiscal year', example: 2024 })
  @IsNumber()
  @Min(2020)
  @Max(2100)
  fiscalYear: number;

  @ApiPropertyOptional({
    description: 'Tax regime',
    example: 'REGIMEN_GENERAL',
  })
  @IsOptional()
  @IsString()
  taxRegime?: string;
}

/**
 * Report generation options
 */
export class ReportGenerationOptionsDto {
  @ApiPropertyOptional({
    description: 'Include PDF preview',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includePreview?: boolean;

  @ApiPropertyOptional({
    description: 'Auto-validate calculations',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoValidate?: boolean;

  @ApiPropertyOptional({
    description: 'Export format',
    example: 'XML',
    enum: ['XML', 'PDF', 'BOTH'],
  })
  @IsOptional()
  @IsEnum(['XML', 'PDF', 'BOTH'])
  exportFormat?: 'XML' | 'PDF' | 'BOTH';
}

/**
 * Generate report DTO
 */
export class GenerateReportDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  orgId: string;

  @ApiProperty({
    description: 'Report type',
    enum: SpainReportType,
    example: SpainReportType.MODELO_303,
  })
  type: SpainReportType;

  @ApiProperty({ description: 'Reporting period', type: ReportPeriodDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ReportPeriodDto)
  period: ReportPeriodDto;

  @ApiProperty({ description: 'Taxpayer information', type: TaxpayerDto })
  @IsObject()
  @ValidateNested()
  @Type(() => TaxpayerDto)
  taxpayer: TaxpayerDto;

  @ApiPropertyOptional({
    description: 'Generation options',
    type: ReportGenerationOptionsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ReportGenerationOptionsDto)
  options?: ReportGenerationOptionsDto;
}

/**
 * Get report DTO
 */
export class GetReportDto {
  @ApiProperty({ description: 'Report ID' })
  @IsString()
  reportId: string;

  @ApiPropertyOptional({ description: 'Include PDF preview', default: false })
  @IsOptional()
  @IsBoolean()
  includePreview?: boolean;

  @ApiPropertyOptional({ description: 'Include XML export', default: false })
  @IsOptional()
  @IsBoolean()
  includeExport?: boolean;
}

/**
 * Submit report DTO
 */
export class SubmitReportDto {
  @ApiProperty({ description: 'Report ID' })
  @IsString()
  reportId: string;

  @ApiProperty({ description: 'Certificate path' })
  @IsString()
  certificatePath: string;

  @ApiPropertyOptional({ description: 'Certificate password' })
  @IsOptional()
  @IsString()
  certificatePassword?: string;

  @ApiPropertyOptional({
    description: 'Submit to AEAT SII',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  submitToSII?: boolean;
}

/**
 * Validate report DTO
 */
export class ValidateReportDto {
  @ApiProperty({ description: 'Report ID' })
  @IsString()
  reportId: string;
}

/**
 * List reports query DTO
 */
export class ListReportsQueryDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  orgId: string;

  @ApiPropertyOptional({
    description: 'Filter by report type',
    enum: SpainReportType,
  })
  @IsOptional()
  type?: SpainReportType;

  @ApiPropertyOptional({ description: 'Filter by year', example: 2024 })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ description: 'Filter by quarter', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  quarter?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Recalculate report DTO
 */
export class RecalculateReportDto {
  @ApiProperty({ description: 'Report ID' })
  @IsString()
  reportId: string;

  @ApiPropertyOptional({
    description: 'Force recalculation even if already submitted',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
