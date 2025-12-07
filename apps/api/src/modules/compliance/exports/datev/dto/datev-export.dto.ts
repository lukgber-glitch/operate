import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  IsEnum,
  ValidateNested,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DATEV Standard Kontenrahmen (SKR) Types
 */
export enum DatevSKRType {
  SKR03 = '03', // Standard chart of accounts (most common for industrial companies)
  SKR04 = '04', // Chart of accounts for SMEs and service providers
}

/**
 * DATEV Export Format Version
 */
export enum DatevFormatVersion {
  V7_0 = '7.0', // Current DATEV ASCII format version
}

/**
 * Date range DTO for DATEV export
 */
export class DatevDateRangeDto {
  @ApiProperty({
    description: 'Start date for export (inclusive)',
    example: '2024-01-01',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({
    description: 'End date for export (inclusive)',
    example: '2024-12-31',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}

/**
 * DATEV Company Configuration
 */
export class DatevCompanyConfigDto {
  @ApiProperty({
    description: 'Tax consultant number (Berater-Nr)',
    example: '1234567',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(9999999)
  consultantNumber!: number;

  @ApiProperty({
    description: 'Client number (Mandanten-Nr)',
    example: '12345',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(99999)
  clientNumber!: number;

  @ApiProperty({
    description: 'Fiscal year start (YYYYMMDD)',
    example: 20240101,
  })
  @IsNotEmpty()
  @IsNumber()
  fiscalYearStart!: number;

  @ApiProperty({
    description: 'Standard chart of accounts (SKR)',
    enum: DatevSKRType,
    example: DatevSKRType.SKR03,
  })
  @IsNotEmpty()
  skrType!: DatevSKRType;

  @ApiPropertyOptional({
    description: 'Account length (default: 4)',
    example: 4,
    default: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(8)
  accountLength?: number;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Musterfirma GmbH',
  })
  @IsOptional()
  @IsString()
  companyName?: string;
}

/**
 * DATEV Export Options
 */
export class DatevExportOptionsDto {
  @ApiPropertyOptional({
    description: 'Include account labels (Kontenbeschriftung)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeAccountLabels?: boolean;

  @ApiPropertyOptional({
    description: 'Include customer data',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeCustomers?: boolean;

  @ApiPropertyOptional({
    description: 'Include supplier data',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeSuppliers?: boolean;

  @ApiPropertyOptional({
    description: 'Include transaction details',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeTransactions?: boolean;

  @ApiPropertyOptional({
    description: 'Format version',
    enum: DatevFormatVersion,
    default: 'V7_0',
  })
  @IsOptional()
  formatVersion?: DatevFormatVersion;

  @ApiPropertyOptional({
    description: 'Origin identifier',
    example: 'CoachOS',
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({
    description: 'Export label',
    example: 'Q4 2024 Export',
  })
  @IsOptional()
  @IsString()
  label?: string;
}

/**
 * Create DATEV Export DTO
 */
export class CreateDatevExportDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  orgId!: string;

  @ApiProperty({
    description: 'Date range for the export',
    type: DatevDateRangeDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DatevDateRangeDto)
  dateRange!: DatevDateRangeDto;

  @ApiProperty({
    description: 'DATEV company configuration',
    type: DatevCompanyConfigDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DatevCompanyConfigDto)
  companyConfig!: DatevCompanyConfigDto;

  @ApiPropertyOptional({
    description: 'Export options',
    type: DatevExportOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DatevExportOptionsDto)
  options?: DatevExportOptionsDto;
}

/**
 * DATEV Export Response DTO
 */
export class DatevExportResponseDto {
  @ApiProperty({
    description: 'Export ID',
    example: 'datev_1234567890_abc123',
  })
  id!: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orgId!: string;

  @ApiProperty({
    description: 'Export status',
    enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED', 'DOWNLOADED'],
  })
  status!: string;

  @ApiProperty({
    description: 'Filename',
    example: 'DATEV_Export_20240101_20241231.zip',
  })
  filename!: string;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Completion timestamp',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Download URL (available when status is READY)',
    example: '/api/compliance/exports/datev/datev_1234567890_abc123/download',
  })
  downloadUrl?: string;

  @ApiPropertyOptional({
    description: 'Error message (if status is FAILED)',
  })
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
  })
  fileSize?: number;

  constructor(partial: Partial<DatevExportResponseDto>) {
    Object.assign(this, partial);
  }
}
