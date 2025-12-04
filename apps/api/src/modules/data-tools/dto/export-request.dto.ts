import { IsEnum, IsOptional, IsBoolean, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportFormat, DataCategory } from '../types/data-tools.types';

/**
 * Date Range DTO
 */
export class DateRangeDto {
  @ApiProperty({ description: 'Start date (ISO 8601)', example: '2024-01-01T00:00:00.000Z' })
  @IsDateString()
  start: string;

  @ApiProperty({ description: 'End date (ISO 8601)', example: '2024-12-31T23:59:59.999Z' })
  @IsDateString()
  end: string;
}

/**
 * Export Request DTO
 * Parameters for requesting a data export
 */
export class ExportRequestDto {
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.JSON,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({
    description: 'Data categories to export',
    enum: DataCategory,
    isArray: true,
    example: [DataCategory.PROFILE, DataCategory.FINANCIAL],
  })
  @IsArray()
  @IsEnum(DataCategory, { each: true })
  categories: DataCategory[];

  @ApiPropertyOptional({
    description: 'Encrypt the export file',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  encrypted?: boolean;

  @ApiPropertyOptional({
    description: 'Include soft-deleted records',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;

  @ApiPropertyOptional({
    description: 'Date range filter',
    type: DateRangeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @ApiPropertyOptional({
    description: 'Compress export into ZIP archive',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  compress?: boolean;

  @ApiPropertyOptional({
    description: 'Organisation ID (admin only)',
    example: 'org_123',
  })
  @IsOptional()
  organisationId?: string;

  @ApiPropertyOptional({
    description: 'User ID to export (admin only)',
    example: 'user_123',
  })
  @IsOptional()
  userId?: string;
}
