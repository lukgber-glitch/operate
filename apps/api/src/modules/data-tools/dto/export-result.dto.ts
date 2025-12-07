import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportStatus, DataCategory } from '../types/data-tools.types';

/**
 * Export Result DTO
 * Response for data export operations
 */
export class ExportResultDto {
  @ApiProperty({
    description: 'Export job ID',
    example: 'export_abc123',
  })
  jobId: string;

  @ApiProperty({
    description: 'Export status',
    enum: ExportStatus,
    example: 'COMPLETED',
  })
  status: ExportStatus;

  @ApiPropertyOptional({
    description: 'Download URL for the export file',
    example: 'https://storage.example.com/exports/user_123_20240101.zip',
  })
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1048576,
  })
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Download token for authenticated access',
    example: 'tok_xyz789',
  })
  downloadToken?: string;

  @ApiPropertyOptional({
    description: 'Expiration date of the download link (ISO 8601)',
    example: '2024-01-08T00:00:00.000Z',
  })
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Number of records exported',
    example: 1234,
  })
  recordsExported?: number;

  @ApiProperty({
    description: 'Data categories included in export',
    enum: DataCategory,
    isArray: true,
    example: ['PROFILE', 'FINANCIAL'],
  })
  categoriesExported: DataCategory[];

  @ApiPropertyOptional({
    description: 'Error message if export failed',
    example: 'Failed to generate PDF: insufficient memory',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Export started timestamp (ISO 8601)',
    example: '2024-01-01T10:00:00.000Z',
  })
  startedAt?: Date;

  @ApiPropertyOptional({
    description: 'Export completed timestamp (ISO 8601)',
    example: '2024-01-01T10:05:30.000Z',
  })
  completedAt?: Date;
}
