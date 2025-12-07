import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDate,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BmdExportType, BmdExportFormat } from '../interfaces/bmd-config.interface';

/**
 * Date range DTO
 */
export class DateRangeDto {
  @ApiProperty({
    description: 'Start date (inclusive)',
    example: '2024-01-01',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({
    description: 'End date (inclusive)',
    example: '2024-12-31',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}

/**
 * BMD Export Options DTO
 */
export class BmdExportOptionsDto {
  @ApiPropertyOptional({
    description: 'Use semicolon as delimiter (default: true for BMD compatibility)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  useSemicolon?: boolean;

  @ApiPropertyOptional({
    description: 'Include header row',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeHeader?: boolean;

  @ApiPropertyOptional({
    description: 'Use ISO-8859-1 encoding (default: UTF-8)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  useIsoEncoding?: boolean;

  @ApiPropertyOptional({
    description: 'Include only posted transactions (Gegenbuchungen)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  postedOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Austrian SKR (Standard-Kontenrahmen) mapping',
    example: 'EKR',
    enum: ['EKR', 'BAB', 'CUSTOM'],
  })
  @IsOptional()
  @IsString()
  accountingFramework?: string;
}

/**
 * Create BMD Export DTO
 * Request body for creating a new BMD export
 */
export class CreateBmdExportDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  orgId!: string;

  @ApiProperty({
    description: 'Export types to generate',
    enum: BmdExportType,
    isArray: true,
    example: ['BOOKING_JOURNAL', 'CHART_OF_ACCOUNTS'],
  })
  @IsArray()
  exportTypes!: BmdExportType[];

  @ApiProperty({
    description: 'Date range for the export',
    type: DateRangeDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange!: DateRangeDto;

  @ApiPropertyOptional({
    description: 'Export format',
    enum: BmdExportFormat,
    example: 'CSV',
    default: 'CSV',
  })
  @IsOptional()
  format?: BmdExportFormat;

  @ApiPropertyOptional({
    description: 'Export options',
    type: BmdExportOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BmdExportOptionsDto)
  options?: BmdExportOptionsDto;

  @ApiPropertyOptional({
    description: 'Include archived data',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;
}
