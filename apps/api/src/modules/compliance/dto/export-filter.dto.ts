import {
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExportStatus } from '../interfaces/export-status.interface';

/**
 * Export Filter DTO
 * Query parameters for filtering and paginating exports
 */
export class ExportFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by export type',
    enum: ['gobd', 'saft'],
    example: 'gobd',
  })
  @IsOptional()
  @IsEnum(['gobd', 'saft'], {
    message: 'Type must be either "gobd" or "saft"',
  })
  type?: 'gobd' | 'saft';

  @ApiPropertyOptional({
    description: 'Filter by export status',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
  })
  @IsOptional()
  status?: ExportStatus;

  @ApiPropertyOptional({
    description: 'Filter exports created after this date (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter exports created before this date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'completedAt', 'status', 'type'],
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'completedAt', 'status', 'type'])
  sortBy?: 'createdAt' | 'completedAt' | 'status' | 'type' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
