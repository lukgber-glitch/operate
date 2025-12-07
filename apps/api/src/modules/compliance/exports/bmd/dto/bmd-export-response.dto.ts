import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportStatus } from '../interfaces/bmd-config.interface';

/**
 * BMD Export Response DTO
 */
export class BmdExportResponseDto {
  @ApiProperty({
    description: 'Export ID',
    example: 'bmd_1234567890_abc123',
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
    example: 'READY',
  })
  status!: ExportStatus;

  @ApiProperty({
    description: 'Export filename',
    example: 'bmd_export_2024_org_123.zip',
  })
  filename!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Completion timestamp',
    example: '2024-01-01T00:05:00.000Z',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Date range start',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate!: Date;

  @ApiProperty({
    description: 'Date range end',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate!: Date;

  @ApiPropertyOptional({
    description: 'Download URL (when ready)',
    example: '/api/compliance/exports/bmd/bmd_1234567890_abc123/download',
  })
  downloadUrl?: string;

  @ApiPropertyOptional({
    description: 'Error message (if failed)',
    example: 'Export generation failed: Database connection error',
  })
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024000,
  })
  fileSize?: number;

  constructor(partial: Partial<BmdExportResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * BMD Export List Item DTO
 */
export class BmdExportListItemDto {
  @ApiProperty({
    description: 'Export ID',
    example: 'bmd_1234567890_abc123',
  })
  id!: string;

  @ApiProperty({
    description: 'Export status',
    enum: ExportStatus,
    example: 'READY',
  })
  status!: ExportStatus;

  @ApiProperty({
    description: 'Export filename',
    example: 'bmd_export_2024_org_123.zip',
  })
  filename!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Date range start',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate!: Date;

  @ApiProperty({
    description: 'Date range end',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate!: Date;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024000,
  })
  fileSize?: number;
}

/**
 * BMD Export List Response DTO
 */
export class BmdExportListResponseDto {
  @ApiProperty({
    description: 'List of BMD exports',
    type: [BmdExportListItemDto],
  })
  items!: BmdExportListItemDto[];

  @ApiProperty({
    description: 'Total number of exports',
    example: 42,
  })
  total!: number;

  constructor(items: BmdExportListItemDto[], total: number) {
    this.items = items;
    this.total = total;
  }
}
