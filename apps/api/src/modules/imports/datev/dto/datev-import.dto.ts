/**
 * DATEV Import DTOs
 */

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DatevImportFileType,
  DatevImportStatus,
  DatevImportMapping,
} from '../datev-import.types';

/**
 * Analyze DATEV File DTO
 */
export class AnalyzeDatevFileDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  orgId!: string;
}

/**
 * Preview DATEV Import DTO
 */
export class PreviewDatevImportDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  orgId!: string;

  @ApiPropertyOptional({
    description: 'Custom account mapping (optional)',
    type: 'object',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  mapping?: DatevImportMapping;
}

/**
 * Execute DATEV Import DTO
 */
export class ExecuteDatevImportDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  orgId!: string;

  @ApiPropertyOptional({
    description: 'Dry run mode (preview only, no actual import)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: 'Skip validation checks',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  skipValidation?: boolean;

  @ApiPropertyOptional({
    description: 'Update existing records',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean;

  @ApiPropertyOptional({
    description: 'Skip duplicate records',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;

  @ApiPropertyOptional({
    description: 'Batch size for processing',
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  batchSize?: number;

  @ApiPropertyOptional({
    description: 'Continue importing even if some records fail',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  continueOnError?: boolean;

  @ApiPropertyOptional({
    description: 'Custom account mapping',
    type: 'object',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  mapping?: DatevImportMapping;
}

/**
 * DATEV Import Analysis Response DTO
 */
export class DatevImportAnalysisResponseDto {
  @ApiProperty({
    description: 'File type detected',
    enum: DatevImportFileType,
  })
  fileType!: DatevImportFileType;

  @ApiProperty({
    description: 'Number of records in file',
  })
  recordCount!: number;

  @ApiProperty({
    description: 'SKR type (03 or 04)',
    example: '03',
  })
  skrType!: string;

  @ApiProperty({
    description: 'Date range of the data',
  })
  dateRange!: {
    from: Date;
    to: Date;
  };

  @ApiProperty({
    description: 'Company configuration from DATEV header',
  })
  companyConfig!: {
    consultantNumber: number;
    clientNumber: number;
    fiscalYearStart: number;
  };

  @ApiProperty({
    description: 'Estimated import time in seconds',
  })
  estimatedImportTime!: number;

  @ApiProperty({
    description: 'Warnings detected',
    type: [String],
  })
  warnings!: string[];

  @ApiProperty({
    description: 'Errors detected',
    type: [String],
  })
  errors!: string[];
}

/**
 * DATEV Import Preview Response DTO
 */
export class DatevImportPreviewResponseDto {
  @ApiProperty({
    description: 'File analysis',
    type: DatevImportAnalysisResponseDto,
  })
  analysis!: DatevImportAnalysisResponseDto;

  @ApiProperty({
    description: 'Sample records (first 10)',
    type: [Object],
  })
  sampleRecords!: any[];

  @ApiProperty({
    description: 'Account mapping',
    type: 'object',
  })
  mapping!: DatevImportMapping;

  @ApiProperty({
    description: 'Validation summary',
  })
  validationSummary!: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    warnings: number;
  };
}

/**
 * DATEV Import Job Response DTO
 */
export class DatevImportJobResponseDto {
  @ApiProperty({
    description: 'Job ID',
    example: 'datev_import_1234567890_abc123',
  })
  id!: string;

  @ApiProperty({
    description: 'Organization ID',
  })
  orgId!: string;

  @ApiProperty({
    description: 'File type',
    enum: DatevImportFileType,
  })
  fileType!: DatevImportFileType;

  @ApiProperty({
    description: 'Filename',
  })
  filename!: string;

  @ApiProperty({
    description: 'Import status',
    enum: DatevImportStatus,
  })
  status!: DatevImportStatus;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
  })
  progress!: number;

  @ApiProperty({
    description: 'Total records to process',
  })
  totalRecords!: number;

  @ApiProperty({
    description: 'Records processed so far',
  })
  processedRecords!: number;

  @ApiProperty({
    description: 'Successfully imported records',
  })
  successfulRecords!: number;

  @ApiProperty({
    description: 'Failed records',
  })
  failedRecords!: number;

  @ApiProperty({
    description: 'Warnings',
    type: [String],
  })
  warnings!: string[];

  @ApiProperty({
    description: 'Errors',
    type: [String],
  })
  errors!: string[];

  @ApiPropertyOptional({
    description: 'Start time',
  })
  startedAt?: Date;

  @ApiPropertyOptional({
    description: 'Completion time',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Creation time',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Metadata',
  })
  metadata!: {
    skrType: string;
    dateRange: {
      from: Date;
      to: Date;
    };
    consultantNumber: number;
    clientNumber: number;
  };
}
