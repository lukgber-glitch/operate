import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SevDeskMigrationStatus,
  SevDeskEntityType,
  SevDeskValidationReport,
  SevDeskMigrationSummary,
} from '../sevdesk.types';

/**
 * DTO for migration job response
 */
export class MigrationJobResponseDto {
  @ApiProperty({
    description: 'Job ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId: string;

  @ApiProperty({
    description: 'User ID who created the job',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Current job status',
    enum: SevDeskMigrationStatus,
    example: SevDeskMigrationStatus.COMPLETED,
  })
  status: SevDeskMigrationStatus;

  @ApiProperty({
    description: 'Entity type being migrated',
    enum: SevDeskEntityType,
    example: SevDeskEntityType.CONTACT,
  })
  entityType: SevDeskEntityType;

  @ApiProperty({
    description: 'Original file name',
    example: 'sevdesk-contacts-export.csv',
  })
  fileName: string;

  @ApiProperty({
    description: 'Total number of records',
    example: 150,
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Number of processed records',
    example: 150,
  })
  processedRecords: number;

  @ApiProperty({
    description: 'Number of successful records',
    example: 145,
  })
  successfulRecords: number;

  @ApiProperty({
    description: 'Number of failed records',
    example: 5,
  })
  failedRecords: number;

  @ApiPropertyOptional({
    description: 'Validation report (for preview mode)',
    type: 'object',
  })
  validationReport?: SevDeskValidationReport;

  @ApiPropertyOptional({
    description: 'Migration summary (after execution)',
    type: 'object',
  })
  migrationSummary?: SevDeskMigrationSummary;

  @ApiProperty({
    description: 'Whether this is a dry-run',
    example: true,
  })
  dryRun: boolean;

  @ApiProperty({
    description: 'Job creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Job start timestamp',
    example: '2024-01-15T10:30:05Z',
  })
  startedAt?: Date;

  @ApiPropertyOptional({
    description: 'Job completion timestamp',
    example: '2024-01-15T10:32:30Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Error message if job failed',
    example: 'Failed to parse CSV file',
  })
  error?: string;

  @ApiProperty({
    description: 'Progress percentage',
    example: 100,
  })
  progress: number;

  constructor(partial: Partial<MigrationJobResponseDto>) {
    Object.assign(this, partial);
    this.progress = this.totalRecords > 0
      ? Math.round((this.processedRecords / this.totalRecords) * 100)
      : 0;
  }
}
