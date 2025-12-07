import { IsEnum, IsOptional, IsBoolean, IsNumber, IsString, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FreeFinanceMigrationType } from '../freefinance.types';

/**
 * DTO for file upload
 */
export class UploadFreeFinanceFileDto {
  @ApiProperty({
    description: 'Type of data being migrated',
    enum: FreeFinanceMigrationType,
    example: 'CUSTOMERS',
  })
  type: FreeFinanceMigrationType;

  @ApiProperty({
    description: 'CSV or Excel file',
    type: 'string',
    format: 'binary',
  })
  file: any;
}

/**
 * DTO for migration preview
 */
export class PreviewMigrationDto {
  @ApiProperty({
    description: 'Type of data being migrated',
    enum: FreeFinanceMigrationType,
  })
  type: FreeFinanceMigrationType;

  @ApiPropertyOptional({
    description: 'Custom field mapping (source field -> target field)',
    type: 'object',
    example: {
      'Kundennummer': 'customerNumber',
      'Firma': 'companyName',
    },
  })
  @IsOptional()
  @IsObject()
  customFieldMapping?: Record<string, string>;
}

/**
 * DTO for migration execution
 */
export class ExecuteMigrationDto {
  @ApiProperty({
    description: 'Type of data being migrated',
    enum: FreeFinanceMigrationType,
  })
  type: FreeFinanceMigrationType;

  @ApiPropertyOptional({
    description: 'Dry run mode - validate and preview without actually importing',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;

  @ApiPropertyOptional({
    description: 'Batch size for processing',
    default: 100,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  batchSize?: number = 100;

  @ApiPropertyOptional({
    description: 'Skip duplicate records',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean = true;

  @ApiPropertyOptional({
    description: 'Update existing records if found',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean = false;

  @ApiPropertyOptional({
    description: 'Validate only without importing',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Strict mode - fail on warnings',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  strictMode?: boolean = false;

  @ApiPropertyOptional({
    description: 'Auto-create missing customer/vendor references',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  createMissingReferences?: boolean = false;

  @ApiPropertyOptional({
    description: 'Default country code (ISO 3166-1 alpha-2)',
    default: 'AT',
  })
  @IsOptional()
  @IsString()
  defaultCountry?: string = 'AT';

  @ApiPropertyOptional({
    description: 'Default currency code (ISO 4217)',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  defaultCurrency?: string = 'EUR';

  @ApiPropertyOptional({
    description: 'Date format override',
    example: 'DD.MM.YYYY',
  })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({
    description: 'File encoding override',
    default: 'utf8',
  })
  @IsOptional()
  @IsString()
  encoding?: string;

  @ApiPropertyOptional({
    description: 'CSV delimiter override',
    default: ';',
  })
  @IsOptional()
  @IsString()
  delimiter?: string;

  @ApiPropertyOptional({
    description: 'Custom field mapping',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  customFieldMapping?: Record<string, string>;
}

/**
 * DTO for validation request
 */
export class ValidateMigrationDto {
  @ApiProperty({
    description: 'Type of data being validated',
    enum: FreeFinanceMigrationType,
  })
  type: FreeFinanceMigrationType;

  @ApiPropertyOptional({
    description: 'Strict mode - fail on warnings',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  strictMode?: boolean = false;

  @ApiPropertyOptional({
    description: 'Custom field mapping',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  customFieldMapping?: Record<string, string>;
}

/**
 * Response DTO for upload
 */
export class UploadResponseDto {
  @ApiProperty({
    description: 'Temporary file ID for subsequent operations',
  })
  fileId: string;

  @ApiProperty({
    description: 'Original filename',
  })
  originalName: string;

  @ApiProperty({
    description: 'File size in bytes',
  })
  size: number;

  @ApiProperty({
    description: 'Detected migration type',
    enum: FreeFinanceMigrationType,
    required: false,
  })
  detectedType?: FreeFinanceMigrationType;

  @ApiProperty({
    description: 'Number of rows detected',
  })
  rowCount: number;

  @ApiProperty({
    description: 'Number of columns detected',
  })
  columnCount: number;
}

/**
 * Response DTO for preview
 */
export class PreviewResponseDto {
  @ApiProperty({
    description: 'Migration type',
    enum: FreeFinanceMigrationType,
  })
  type: FreeFinanceMigrationType;

  @ApiProperty({
    description: 'Total number of records',
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Number of valid records',
  })
  validRecords: number;

  @ApiProperty({
    description: 'Number of invalid records',
  })
  invalidRecords: number;

  @ApiProperty({
    description: 'Validation errors',
    type: 'array',
  })
  errors: any[];

  @ApiProperty({
    description: 'Validation warnings',
    type: 'array',
  })
  warnings: any[];

  @ApiProperty({
    description: 'Sample data (first 10 records)',
    type: 'array',
  })
  sampleData: any[];

  @ApiProperty({
    description: 'Detected columns',
    type: 'array',
  })
  detectedColumns: string[];

  @ApiProperty({
    description: 'Field mapping used',
    type: 'object',
  })
  fieldMapping: Record<string, string>;

  @ApiProperty({
    description: 'Statistics about the data',
    type: 'object',
  })
  stats: any;
}

/**
 * Response DTO for execution
 */
export class ExecuteResponseDto {
  @ApiProperty({
    description: 'Migration job ID for tracking progress',
  })
  jobId: string;

  @ApiProperty({
    description: 'Initial status',
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    description: 'Message',
  })
  message: string;
}

/**
 * Response DTO for status
 */
export class StatusResponseDto {
  @ApiProperty({
    description: 'Job ID',
  })
  jobId: string;

  @ApiProperty({
    description: 'Current status',
    enum: ['pending', 'processing', 'validating', 'importing', 'completed', 'failed', 'cancelled'],
  })
  status: string;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
  })
  progress: number;

  @ApiProperty({
    description: 'Current phase description',
  })
  currentPhase: string;

  @ApiProperty({
    description: 'Total records',
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Processed records',
  })
  processedRecords: number;

  @ApiProperty({
    description: 'Successfully imported',
  })
  successCount: number;

  @ApiProperty({
    description: 'Failed imports',
  })
  failureCount: number;

  @ApiProperty({
    description: 'Number of warnings',
  })
  warningCount: number;

  @ApiProperty({
    description: 'Errors',
    type: 'array',
  })
  errors: any[];

  @ApiProperty({
    description: 'Warnings',
    type: 'array',
  })
  warnings: any[];

  @ApiProperty({
    description: 'Start time',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  startedAt?: Date;

  @ApiProperty({
    description: 'Completion time',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Estimated completion time',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  estimatedCompletion?: Date;

  @ApiProperty({
    description: 'Processing rate (records per second)',
    required: false,
  })
  processingRate?: number;
}

/**
 * Response DTO for validation
 */
export class ValidationResponseDto {
  @ApiProperty({
    description: 'Whether the data is valid',
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Validation errors',
    type: 'array',
  })
  errors: any[];

  @ApiProperty({
    description: 'Validation warnings',
    type: 'array',
  })
  warnings: any[];

  @ApiProperty({
    description: 'Statistics',
    type: 'object',
  })
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicates: number;
    emptyRows: number;
  };

  @ApiProperty({
    description: 'Data quality metrics',
    type: 'object',
  })
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
  };
}
