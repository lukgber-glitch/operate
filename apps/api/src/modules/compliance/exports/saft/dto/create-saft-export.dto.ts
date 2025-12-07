/**
 * DTOs for SAF-T Export Creation and Management
 */

import { IsEnum, IsOptional, IsBoolean, IsDateString, IsObject, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SaftVariant, ExportScope } from '../interfaces/saft-config.interface';

/**
 * Date range DTO
 */
export class DateRangeDto {
  @ApiProperty({
    description: 'Start date of the export period (ISO 8601)',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date of the export period (ISO 8601)',
    example: '2024-12-31',
  })
  @IsDateString()
  endDate!: string;
}

/**
 * Create SAF-T Export DTO
 */
export class CreateSaftExportDto {
  @ApiProperty({
    description: 'SAF-T variant/country format',
    enum: SaftVariant,
    example: 'INTERNATIONAL',
  })
  variant!: SaftVariant;

  @ApiProperty({
    description: 'Export scope',
    enum: ExportScope,
    example: 'FULL',
  })
  scope!: ExportScope;

  @ApiProperty({
    description: 'Date range for the export',
    type: DateRangeDto,
  })
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange!: DateRangeDto;

  @ApiPropertyOptional({
    description: 'Include opening balances',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeOpeningBalances?: boolean;

  @ApiPropertyOptional({
    description: 'Include closing balances',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeClosingBalances?: boolean;

  @ApiPropertyOptional({
    description: 'Include detailed tax information',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeTaxDetails?: boolean;

  @ApiPropertyOptional({
    description: 'Include customer and supplier details',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeCustomerSupplierDetails?: boolean;

  @ApiPropertyOptional({
    description: 'Compress output to ZIP format',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  compression?: boolean;

  @ApiPropertyOptional({
    description: 'Validate against XSD schema',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  validation?: boolean;

  @ApiPropertyOptional({
    description: 'Country-specific extensions and options',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  countrySpecificExtensions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Optional description for the export',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Update SAF-T Export DTO
 */
export class UpdateSaftExportDto {
  @ApiPropertyOptional({
    description: 'Update export description',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * SAF-T Export Filter DTO
 */
export class SaftExportFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by variant',
    enum: SaftVariant,
  })
  @IsOptional()
  variant?: SaftVariant;

  @ApiPropertyOptional({
    description: 'Filter by scope',
    enum: ExportScope,
  })
  @IsOptional()
  scope?: ExportScope;

  @ApiPropertyOptional({
    description: 'Filter by start date (from)',
  })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (to)',
  })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;
}
