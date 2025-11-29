/**
 * SAF-T Export Response DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportStatus, SaftVariant, ExportScope } from '../interfaces/saft-config.interface';

/**
 * SAF-T Export Response
 */
export class SaftExportResponseDto {
  @ApiProperty({
    description: 'Export ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  exportId!: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_123456',
  })
  organizationId!: string;

  @ApiProperty({
    description: 'Export status',
    enum: ExportStatus,
  })
  status!: ExportStatus;

  @ApiProperty({
    description: 'SAF-T variant',
    enum: SaftVariant,
  })
  variant!: SaftVariant;

  @ApiProperty({
    description: 'Export scope',
    enum: ExportScope,
  })
  scope!: ExportScope;

  @ApiProperty({
    description: 'Start date of export period',
    example: '2024-01-01',
  })
  startDate!: string;

  @ApiProperty({
    description: 'End date of export period',
    example: '2024-12-31',
  })
  endDate!: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1048576,
  })
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Number of entries included',
    example: 1000,
  })
  numberOfEntries?: number;

  @ApiPropertyOptional({
    description: 'Total debit amount',
    example: 500000.00,
  })
  totalDebit?: number;

  @ApiPropertyOptional({
    description: 'Total credit amount',
    example: 500000.00,
  })
  totalCredit?: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-03-15T10:30:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'User who created the export',
    example: 'user_123',
  })
  createdBy!: string;

  @ApiPropertyOptional({
    description: 'Completion timestamp',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Download URL (temporary)',
  })
  downloadUrl?: string;

  @ApiPropertyOptional({
    description: 'Validation errors if any',
    type: [String],
  })
  validationErrors?: string[];

  @ApiPropertyOptional({
    description: 'File checksum (SHA-256)',
  })
  checksum?: string;

  @ApiPropertyOptional({
    description: 'Export description',
  })
  description?: string;
}

/**
 * Validation Result Response
 */
export class ValidationResultDto {
  @ApiProperty({
    description: 'Whether the file is valid',
  })
  valid!: boolean;

  @ApiProperty({
    description: 'Validation errors',
    type: [Object],
  })
  errors!: Array<{
    code: string;
    message: string;
    path?: string;
    line?: number;
  }>;

  @ApiProperty({
    description: 'Validation warnings',
    type: [Object],
  })
  warnings!: Array<{
    code: string;
    message: string;
    path?: string;
  }>;

  @ApiProperty({
    description: 'Schema version used for validation',
    example: '2.00',
  })
  schemaVersion!: string;

  @ApiProperty({
    description: 'Validation timestamp',
  })
  validatedAt!: Date;
}

/**
 * Export List Response
 */
export class SaftExportListResponseDto {
  @ApiProperty({
    description: 'List of exports',
    type: [SaftExportResponseDto],
  })
  exports!: SaftExportResponseDto[];

  @ApiProperty({
    description: 'Total count',
    example: 42,
  })
  total!: number;

  @ApiProperty({
    description: 'Page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  pageSize!: number;
}

/**
 * Export Statistics Response
 */
export class ExportStatisticsDto {
  @ApiProperty({
    description: 'Total number of exports',
  })
  totalExports!: number;

  @ApiProperty({
    description: 'Exports by status',
    type: 'object',
    example: {
      COMPLETED: 10,
      PROCESSING: 2,
      FAILED: 1,
    },
  })
  byStatus!: Record<ExportStatus, number>;

  @ApiProperty({
    description: 'Exports by variant',
    type: 'object',
  })
  byVariant!: Record<SaftVariant, number>;

  @ApiProperty({
    description: 'Total file size in bytes',
  })
  totalFileSize!: number;

  @ApiProperty({
    description: 'Average processing time in seconds',
  })
  averageProcessingTime!: number;
}
