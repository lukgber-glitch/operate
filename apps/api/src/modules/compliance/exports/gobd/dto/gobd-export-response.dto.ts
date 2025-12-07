import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportStatus } from '../interfaces/gobd-config.interface';

/**
 * Export metadata response
 */
export class ExportMetadataResponseDto {
  @ApiProperty({
    description: 'Total number of files in the export',
    example: 156,
  })
  totalFiles!: number;

  @ApiProperty({
    description: 'Total size in bytes',
    example: 52428800,
  })
  totalSize!: number;

  @ApiProperty({
    description: 'Number of transactions',
    example: 1234,
  })
  transactionCount!: number;

  @ApiProperty({
    description: 'Number of documents',
    example: 567,
  })
  documentCount!: number;

  @ApiProperty({
    description: 'SHA-256 hash of the export archive',
    example: '7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730',
  })
  archiveHash!: string;
}

/**
 * GoBD Export Response DTO
 * Response body for GoBD export operations
 */
export class GobdExportResponseDto {
  @ApiProperty({
    description: 'Export ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orgId!: string;

  @ApiProperty({
    description: 'Export status',
    enum: ExportStatus,
    example: 'COMPLETED',
  })
  status!: ExportStatus;

  @ApiPropertyOptional({
    description: 'Export filename',
    example: 'gobd_export_20241129_120000.zip',
  })
  filename?: string | null;

  @ApiPropertyOptional({
    description: 'Download URL (only when status is READY)',
    example: '/api/compliance/exports/gobd/123e4567-e89b-12d3-a456-426614174000/download',
  })
  downloadUrl?: string;

  @ApiProperty({
    description: 'Export creation date',
    example: '2024-11-29T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Export completion date',
    example: '2024-11-29T12:05:30.000Z',
  })
  completedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Date range start',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Date range end',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Error message (only when status is FAILED)',
    example: 'Failed to generate export: Database connection error',
  })
  errorMessage?: string | null;

  @ApiPropertyOptional({
    description: 'Export metadata',
    type: ExportMetadataResponseDto,
  })
  metadata?: ExportMetadataResponseDto;

  @ApiPropertyOptional({
    description: 'Export expiry date (exports are auto-deleted after 30 days)',
    example: '2024-12-29T12:00:00.000Z',
  })
  expiresAt?: Date;

  constructor(partial: Partial<GobdExportResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Export list item DTO
 */
export class GobdExportListItemDto {
  @ApiProperty({
    description: 'Export ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Export status',
    enum: ExportStatus,
    example: 'COMPLETED',
  })
  status!: ExportStatus;

  @ApiPropertyOptional({
    description: 'Export filename',
    example: 'gobd_export_20241129_120000.zip',
  })
  filename?: string | null;

  @ApiProperty({
    description: 'Export creation date',
    example: '2024-11-29T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Date range start',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Date range end',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate?: Date | null;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 52428800,
  })
  fileSize?: number | null;
}

/**
 * Export list response DTO
 */
export class GobdExportListResponseDto {
  @ApiProperty({
    description: 'List of exports',
    type: [GobdExportListItemDto],
  })
  exports!: GobdExportListItemDto[];

  @ApiProperty({
    description: 'Total count',
    example: 10,
  })
  total!: number;

  constructor(exports: GobdExportListItemDto[], total: number) {
    this.exports = exports;
    this.total = total;
  }
}
