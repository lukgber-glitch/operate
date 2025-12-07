import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';

/**
 * Export format enum
 */
export enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  XLSX = 'xlsx',
}

/**
 * Report type enum
 */
export enum ReportType {
  FINANCIAL = 'financial',
  TAX = 'tax',
  INVOICES = 'invoices',
  HR = 'hr',
}

/**
 * DTO for exporting reports
 */
export class ExportReportDto {
  @ApiProperty({
    description: 'Type of report to export',
    enum: ReportType,
    example: 'FINANCIAL',
  })
  reportType: ReportType;

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: 'PDF',
  })
  format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Start date for report period (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'End date for report period (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Optional report title',
    example: 'Q4 2024 Financial Report',
  })
  @IsOptional()
  @IsString()
  title?: string;
}
