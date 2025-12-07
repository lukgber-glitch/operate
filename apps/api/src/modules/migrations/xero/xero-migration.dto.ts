/**
 * Xero Migration DTOs
 * Request and response data transfer objects
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  XeroEntityType,
  ConflictStrategy,
  MigrationStatus,
  EntityMappingConfig,
} from './xero-migration.types';

/**
 * Entity mapping configuration DTO
 */
export class EntityMappingConfigDto implements EntityMappingConfig {
  @ApiProperty({ enum: XeroEntityType })
  entityType: XeroEntityType;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ enum: ConflictStrategy })
  conflictStrategy: ConflictStrategy;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  fieldMappings?: Record<string, string>;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

/**
 * Start migration request DTO
 */
export class StartMigrationDto {
  @ApiProperty({ description: 'Xero tenant/organization ID' })
  @IsString()
  xeroTenantId: string;

  @ApiProperty({ description: 'Target Operate organization ID' })
  @IsString()
  orgId: string;

  @ApiProperty({
    description: 'Entity mapping configurations',
    type: [EntityMappingConfigDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityMappingConfigDto)
  entityMappings: EntityMappingConfigDto[];

  @ApiPropertyOptional({ description: 'Only migrate records after this date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Batch size for API calls',
    default: 100,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  batchSize?: number;

  @ApiPropertyOptional({
    description: 'Number of parallel API requests',
    default: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  parallelRequests?: number;
}

/**
 * Migration status response DTO
 */
export class MigrationStatusDto {
  @ApiProperty()
  migrationId: string;

  @ApiProperty({ enum: MigrationStatus })
  status: MigrationStatus;

  @ApiProperty()
  overallProgress: number;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  estimatedCompletionAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  totalEntitiesProcessed: number;

  @ApiProperty()
  totalEntitiesSucceeded: number;

  @ApiProperty()
  totalEntitiesFailed: number;

  @ApiProperty()
  totalEntitiesSkipped: number;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  entityProgress: any[];

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  errors: any[];

  @ApiProperty({ type: 'array', items: { type: 'string' } })
  warnings: string[];

  @ApiProperty({ type: 'object' })
  metadata: Record<string, any>;
}

/**
 * Xero organization response DTO
 */
export class XeroOrganizationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  countryCode: string;

  @ApiProperty()
  baseCurrency: string;

  @ApiProperty()
  isDemoCompany: boolean;

  @ApiPropertyOptional()
  taxNumber?: string;

  @ApiPropertyOptional()
  registrationNumber?: string;

  @ApiProperty()
  createdDate: string;

  @ApiProperty()
  updatedDate: string;
}

/**
 * List organizations response DTO
 */
export class ListOrganizationsDto {
  @ApiProperty({ type: [XeroOrganizationDto] })
  organizations: XeroOrganizationDto[];

  @ApiProperty()
  connectionStatus: string;

  @ApiProperty()
  connectedAt: Date;

  @ApiPropertyOptional()
  lastSyncAt?: Date;
}

/**
 * Pause migration request DTO
 */
export class PauseMigrationDto {
  @ApiProperty()
  @IsString()
  migrationId: string;
}

/**
 * Resume migration request DTO
 */
export class ResumeMigrationDto {
  @ApiProperty()
  @IsString()
  migrationId: string;
}

/**
 * Cancel migration request DTO
 */
export class CancelMigrationDto {
  @ApiProperty()
  @IsString()
  migrationId: string;
}

/**
 * Migration summary DTO
 */
export class MigrationSummaryDto {
  @ApiProperty()
  migrationId: string;

  @ApiProperty({ enum: MigrationStatus })
  status: MigrationStatus;

  @ApiProperty()
  xeroTenantId: string;

  @ApiProperty()
  xeroOrgName: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  duration?: number; // in seconds

  @ApiProperty()
  totalEntitiesProcessed: number;

  @ApiProperty()
  totalEntitiesSucceeded: number;

  @ApiProperty()
  totalEntitiesFailed: number;

  @ApiProperty()
  totalEntitiesSkipped: number;

  @ApiProperty()
  overallProgress: number;
}

/**
 * List migrations response DTO
 */
export class ListMigrationsDto {
  @ApiProperty({ type: [MigrationSummaryDto] })
  migrations: MigrationSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}

/**
 * Entity migration detail DTO
 */
export class EntityMigrationDetailDto {
  @ApiProperty({ enum: XeroEntityType })
  entityType: XeroEntityType;

  @ApiProperty({ enum: MigrationStatus })
  status: MigrationStatus;

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  processedCount: number;

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  failedCount: number;

  @ApiProperty()
  skippedCount: number;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  errors: any[];

  @ApiProperty()
  duration?: number; // in seconds
}

/**
 * Migration log entry DTO
 */
export class MigrationLogEntryDto {
  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  level: 'info' | 'warn' | 'error';

  @ApiProperty()
  message: string;

  @ApiPropertyOptional({ enum: XeroEntityType })
  entityType?: XeroEntityType;

  @ApiPropertyOptional()
  xeroId?: string;

  @ApiPropertyOptional({ type: 'object' })
  metadata?: Record<string, any>;
}

/**
 * Default entity mapping configurations
 */
export const DEFAULT_ENTITY_MAPPINGS: EntityMappingConfigDto[] = [
  {
    entityType: XeroEntityType.ACCOUNTS,
    enabled: true,
    conflictStrategy: ConflictStrategy.SKIP,
  },
  {
    entityType: XeroEntityType.TAX_RATES,
    enabled: true,
    conflictStrategy: ConflictStrategy.SKIP,
  },
  {
    entityType: XeroEntityType.TRACKING_CATEGORIES,
    enabled: true,
    conflictStrategy: ConflictStrategy.SKIP,
  },
  {
    entityType: XeroEntityType.CONTACTS,
    enabled: true,
    conflictStrategy: ConflictStrategy.SKIP,
  },
  {
    entityType: XeroEntityType.ITEMS,
    enabled: true,
    conflictStrategy: ConflictStrategy.SKIP,
  },
  {
    entityType: XeroEntityType.INVOICES,
    enabled: true,
    conflictStrategy: ConflictStrategy.SKIP,
  },
  {
    entityType: XeroEntityType.CREDIT_NOTES,
    enabled: true,
    conflictStrategy: ConflictStrategy.SKIP,
  },
  {
    entityType: XeroEntityType.PAYMENTS,
    enabled: true,
    conflictStrategy: ConflictStrategy.SKIP,
  },
  {
    entityType: XeroEntityType.BANK_TRANSACTIONS,
    enabled: true,
    conflictStrategy: ConflictStrategy.SKIP,
  },
];
