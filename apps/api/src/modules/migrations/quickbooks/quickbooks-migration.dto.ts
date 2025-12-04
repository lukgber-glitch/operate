/**
 * QuickBooks Migration DTOs
 * Request and response DTOs for migration endpoints
 */

import { IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString, IsObject, IsArray, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  MigrationEntityType,
  ConflictResolutionStrategy,
  MigrationStatus,
  MigrationConfig,
  EntityMigrationProgress,
  MigrationError,
} from './quickbooks-migration.types';

export class StartMigrationDto {
  @ApiProperty({
    description: 'Entity types to migrate',
    enum: MigrationEntityType,
    isArray: true,
    example: [
      MigrationEntityType.CUSTOMERS,
      MigrationEntityType.INVOICES,
      MigrationEntityType.PAYMENTS,
    ],
  })
  @IsArray()
  @IsEnum(MigrationEntityType, { each: true })
  entities: MigrationEntityType[];

  @ApiPropertyOptional({
    description: 'Conflict resolution strategy',
    enum: ConflictResolutionStrategy,
    default: ConflictResolutionStrategy.SKIP,
  })
  @IsOptional()
  @IsEnum(ConflictResolutionStrategy)
  conflictResolution?: ConflictResolutionStrategy = ConflictResolutionStrategy.SKIP;

  @ApiPropertyOptional({
    description: 'Batch size for processing',
    default: 50,
    minimum: 10,
    maximum: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  batchSize?: number = 50;

  @ApiPropertyOptional({
    description: 'Rate limit delay in milliseconds',
    default: 500,
    minimum: 100,
    maximum: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  rateLimitDelay?: number = 500;

  @ApiPropertyOptional({
    description: 'Include inactive entities',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean = false;

  @ApiPropertyOptional({
    description: 'Start date for data range filter (ISO 8601)',
    example: '2023-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateRangeStart?: string;

  @ApiPropertyOptional({
    description: 'End date for data range filter (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateRangeEnd?: string;

  @ApiPropertyOptional({
    description: 'Custom field mappings',
    example: { 'QB_CustomField1': 'operate_custom_field_1' },
  })
  @IsOptional()
  @IsObject()
  fieldMappings?: Record<string, string>;
}

export class MigrationStatusResponseDto {
  @ApiProperty({
    description: 'Migration ID',
    example: 'cm123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_123',
  })
  orgId: string;

  @ApiProperty({
    description: 'Migration status',
    enum: MigrationStatus,
  })
  status: MigrationStatus;

  @ApiProperty({
    description: 'Migration configuration',
  })
  config: MigrationConfig;

  @ApiProperty({
    description: 'Progress per entity type',
    type: [Object],
  })
  progress: EntityMigrationProgress[];

  @ApiProperty({
    description: 'Total items across all entities',
  })
  totalItems: number;

  @ApiProperty({
    description: 'Processed items across all entities',
  })
  processedItems: number;

  @ApiProperty({
    description: 'Successfully migrated items',
  })
  successfulItems: number;

  @ApiProperty({
    description: 'Failed items',
  })
  failedItems: number;

  @ApiProperty({
    description: 'Skipped items',
  })
  skippedItems: number;

  @ApiPropertyOptional({
    description: 'Currently processing entity type',
    enum: MigrationEntityType,
  })
  currentEntity?: MigrationEntityType;

  @ApiProperty({
    description: 'Migration start time',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'Migration completion time',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Migration pause time',
  })
  pausedAt?: Date;

  @ApiPropertyOptional({
    description: 'Estimated completion time',
  })
  estimatedCompletionTime?: Date;

  @ApiProperty({
    description: 'User who initiated migration',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Overall progress percentage',
    example: 65.5,
  })
  percentComplete: number;

  @ApiPropertyOptional({
    description: 'Estimated time remaining in milliseconds',
  })
  estimatedTimeRemaining?: number;

  @ApiPropertyOptional({
    description: 'Recent errors (last 10)',
    type: [Object],
  })
  recentErrors?: MigrationError[];
}

export class StartMigrationResponseDto {
  @ApiProperty({
    description: 'Migration ID',
    example: 'cm123456789',
  })
  migrationId: string;

  @ApiProperty({
    description: 'Migration status',
    enum: MigrationStatus,
    example: MigrationStatus.IN_PROGRESS,
  })
  status: MigrationStatus;

  @ApiProperty({
    description: 'Migration configuration',
  })
  config: MigrationConfig;

  @ApiProperty({
    description: 'Migration start time',
  })
  startedAt: Date;

  @ApiProperty({
    description: 'Success message',
    example: 'Migration started successfully',
  })
  message: string;
}

export class PauseMigrationResponseDto {
  @ApiProperty({
    description: 'Migration ID',
  })
  migrationId: string;

  @ApiProperty({
    description: 'Migration status',
    enum: MigrationStatus,
    example: MigrationStatus.PAUSED,
  })
  status: MigrationStatus;

  @ApiProperty({
    description: 'Pause time',
  })
  pausedAt: Date;

  @ApiProperty({
    description: 'Success message',
  })
  message: string;
}

export class ResumeMigrationResponseDto {
  @ApiProperty({
    description: 'Migration ID',
  })
  migrationId: string;

  @ApiProperty({
    description: 'Migration status',
    enum: MigrationStatus,
    example: MigrationStatus.IN_PROGRESS,
  })
  status: MigrationStatus;

  @ApiProperty({
    description: 'Resume time',
  })
  resumedAt: Date;

  @ApiProperty({
    description: 'Success message',
  })
  message: string;
}

export class RollbackMigrationResponseDto {
  @ApiProperty({
    description: 'Migration ID',
  })
  migrationId: string;

  @ApiProperty({
    description: 'Migration status',
    enum: MigrationStatus,
    example: MigrationStatus.ROLLED_BACK,
  })
  status: MigrationStatus;

  @ApiProperty({
    description: 'Rollback completion time',
  })
  rolledBackAt: Date;

  @ApiProperty({
    description: 'Number of entities rolled back',
  })
  entitiesRolledBack: number;

  @ApiProperty({
    description: 'Success message',
  })
  message: string;
}

export class MigrationErrorDto {
  @ApiProperty({
    description: 'Entity type',
    enum: MigrationEntityType,
  })
  entityType: MigrationEntityType;

  @ApiProperty({
    description: 'QuickBooks entity ID',
  })
  entityId: string;

  @ApiProperty({
    description: 'Error message',
  })
  error: string;

  @ApiPropertyOptional({
    description: 'Error code',
  })
  errorCode?: string;

  @ApiProperty({
    description: 'Timestamp',
  })
  timestamp: Date;
}

export class MigrationSummaryDto {
  @ApiProperty({
    description: 'Total entities across all types',
  })
  totalEntities: number;

  @ApiProperty({
    description: 'Successfully migrated entities',
  })
  successfulEntities: number;

  @ApiProperty({
    description: 'Failed entities',
  })
  failedEntities: number;

  @ApiProperty({
    description: 'Skipped entities',
  })
  skippedEntities: number;

  @ApiProperty({
    description: 'Migration duration in milliseconds',
  })
  duration: number;

  @ApiProperty({
    description: 'Duration formatted as human-readable string',
    example: '2 hours 15 minutes',
  })
  durationFormatted: string;
}

export class EntityProgressDto {
  @ApiProperty({
    description: 'Entity type',
    enum: MigrationEntityType,
  })
  entityType: MigrationEntityType;

  @ApiProperty({
    description: 'Entity migration status',
    enum: MigrationStatus,
  })
  status: MigrationStatus;

  @ApiProperty({
    description: 'Total items for this entity',
  })
  totalItems: number;

  @ApiProperty({
    description: 'Processed items',
  })
  processedItems: number;

  @ApiProperty({
    description: 'Successfully migrated items',
  })
  successfulItems: number;

  @ApiProperty({
    description: 'Failed items',
  })
  failedItems: number;

  @ApiProperty({
    description: 'Skipped items',
  })
  skippedItems: number;

  @ApiProperty({
    description: 'Current batch number',
  })
  currentBatch: number;

  @ApiProperty({
    description: 'Total number of batches',
  })
  totalBatches: number;

  @ApiProperty({
    description: 'Progress percentage',
    example: 75.5,
  })
  percentComplete: number;

  @ApiPropertyOptional({
    description: 'Start time',
  })
  startedAt?: Date;

  @ApiPropertyOptional({
    description: 'Completion time',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Error message if failed',
  })
  error?: string;
}

export class ListMigrationsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: MigrationStatus,
  })
  @IsOptional()
  @IsEnum(MigrationStatus)
  status?: MigrationStatus;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of results to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset?: number = 0;
}

export class MigrationListItemDto {
  @ApiProperty({
    description: 'Migration ID',
  })
  id: string;

  @ApiProperty({
    description: 'Migration status',
    enum: MigrationStatus,
  })
  status: MigrationStatus;

  @ApiProperty({
    description: 'Entity types included',
    enum: MigrationEntityType,
    isArray: true,
  })
  entities: MigrationEntityType[];

  @ApiProperty({
    description: 'Progress percentage',
  })
  percentComplete: number;

  @ApiProperty({
    description: 'Total items',
  })
  totalItems: number;

  @ApiProperty({
    description: 'Successful items',
  })
  successfulItems: number;

  @ApiProperty({
    description: 'Failed items',
  })
  failedItems: number;

  @ApiProperty({
    description: 'Start time',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'Completion time',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Created by user',
  })
  createdBy: string;
}
