import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportStatus } from '../interfaces/export-status.interface';

/**
 * Date Range DTO
 */
export class DateRangeDto {
  @ApiProperty({
    description: 'Start date',
    example: '2024-01-01',
  })
  start: string;

  @ApiProperty({
    description: 'End date',
    example: '2024-03-31',
  })
  end: string;
}

/**
 * Export Response DTO
 * API response for export operations
 */
export class ExportResponseDto {
  @ApiProperty({
    description: 'Export unique identifier',
    example: 'exp_123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_987654321',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Export type',
    enum: ['gobd', 'saft'],
    example: 'gobd',
  })
  type: 'gobd' | 'saft';

  @ApiProperty({
    description: 'Current export status',
    enum: ExportStatus,
    example: 'COMPLETED',
  })
  status: ExportStatus;

  @ApiProperty({
    description: 'Date range covered by the export',
    type: DateRangeDto,
  })
  dateRange: DateRangeDto;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100)',
    example: 100,
  })
  progress?: number;

  @ApiPropertyOptional({
    description: 'Current processing step',
    example: 'Generating XML files',
  })
  currentStep?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 15234567,
  })
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'SHA-256 checksum of the export file',
    example: 'sha256:abc123def456...',
  })
  checksum?: string;

  @ApiPropertyOptional({
    description: 'Whether documents are included',
    example: true,
  })
  includeDocuments?: boolean;

  @ApiPropertyOptional({
    description: 'Export comment or description',
    example: 'Q1 2024 tax audit export',
  })
  comment?: string;

  @ApiPropertyOptional({
    description: 'Error message if export failed',
    example: 'Database connection timeout',
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'User ID who created the export',
    example: 'user_123',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Export creation timestamp',
    example: '2024-04-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Export completion timestamp',
    example: '2024-04-01T10:05:30Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Download URL for completed export',
    example: '/api/v1/compliance/exports/exp_123456789/download',
  })
  downloadUrl?: string;

  @ApiPropertyOptional({
    description: 'Expiration timestamp for the download',
    example: '2024-04-08T10:05:30Z',
  })
  expiresAt?: Date;
}

/**
 * Paginated Export Response DTO
 */
export class PaginatedExportResponseDto {
  @ApiProperty({
    description: 'Array of exports',
    type: [ExportResponseDto],
  })
  data: ExportResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  meta: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}
