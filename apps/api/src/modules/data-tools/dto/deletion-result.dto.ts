import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeletionStatus, DataCategory } from '../types/data-tools.types';

/**
 * Deletion Result DTO
 * Response for data deletion operations
 */
export class DeletionResultDto {
  @ApiProperty({
    description: 'Deletion job ID',
    example: 'del_abc123',
  })
  jobId: string;

  @ApiProperty({
    description: 'Deletion status',
    enum: DeletionStatus,
    example: 'COMPLETED',
  })
  status: DeletionStatus;

  @ApiProperty({
    description: 'Number of records deleted',
    example: 456,
  })
  recordsDeleted: number;

  @ApiProperty({
    description: 'Database tables affected',
    isArray: true,
    example: ['User', 'Invoice', 'Expense', 'Employee'],
  })
  tablesAffected: string[];

  @ApiProperty({
    description: 'Data categories deleted',
    enum: DataCategory,
    isArray: true,
    example: ['PROFILE', 'FINANCIAL'],
  })
  categories: DataCategory[];

  @ApiPropertyOptional({
    description: 'Error message if deletion failed',
    example: 'Database constraint violation: cannot delete user with active invoices',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Deletion started timestamp (ISO 8601)',
    example: '2024-01-01T10:00:00.000Z',
  })
  startedAt?: Date;

  @ApiPropertyOptional({
    description: 'Deletion completed timestamp (ISO 8601)',
    example: '2024-01-01T10:02:15.000Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Scheduled deletion date (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  scheduledFor?: Date;

  @ApiPropertyOptional({
    description: 'Confirmation token (if confirmation required)',
    example: 'conf_abc123xyz789',
  })
  confirmationToken?: string;
}
