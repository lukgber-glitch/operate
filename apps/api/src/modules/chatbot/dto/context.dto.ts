/**
 * Context DTOs
 * Data transfer objects for context API requests and responses
 */

import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Request DTO for building context
 */
export class ContextRequestDto {
  @ApiPropertyOptional({
    description: 'Current page route',
    example: '/invoices/inv_123',
  })
  @IsOptional()
  @IsString()
  currentPage?: string;

  @ApiPropertyOptional({
    description: 'Selected entity type',
    example: 'invoice',
  })
  @IsOptional()
  @IsString()
  selectedEntityType?: string;

  @ApiPropertyOptional({
    description: 'Selected entity ID',
    example: 'inv_123',
  })
  @IsOptional()
  @IsString()
  selectedEntityId?: string;

  @ApiPropertyOptional({
    description: 'Additional context data',
    example: { filter: 'overdue', sortBy: 'dueDate' },
  })
  @IsOptional()
  @IsObject()
  additionalContext?: Record<string, any>;
}

/**
 * User context in response
 */
export class UserContextDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'User role in organization' })
  role?: string;

  @ApiPropertyOptional({ description: 'User permissions' })
  permissions?: string[];

  @ApiPropertyOptional({ description: 'User locale' })
  locale?: string;
}

/**
 * Organization context in response
 */
export class OrgContextDto {
  @ApiProperty({ description: 'Organization ID' })
  id: string;

  @ApiProperty({ description: 'Organization name' })
  name: string;

  @ApiProperty({ description: 'Country code' })
  country: string;

  @ApiProperty({ description: 'Default currency' })
  currency: string;

  @ApiPropertyOptional({ description: 'Industry' })
  industry?: string;

  @ApiPropertyOptional({ description: 'Tax regime' })
  taxRegime?: string;

  @ApiPropertyOptional({ description: 'Fiscal year end' })
  fiscalYearEnd?: string;

  @ApiPropertyOptional({ description: 'Enabled features' })
  features?: string[];
}

/**
 * Page context in response
 */
export class PageContextDto {
  @ApiProperty({ description: 'Page type' })
  type: string;

  @ApiProperty({ description: 'Page route' })
  route: string;

  @ApiProperty({ description: 'Page description' })
  description: string;

  @ApiPropertyOptional({ description: 'Relevant entity types for this page' })
  relevantEntities?: string[];

  @ApiPropertyOptional({ description: 'Available actions on this page' })
  availableActions?: string[];
}

/**
 * Entity context in response
 */
export class EntityContextDto {
  @ApiProperty({ description: 'Entity type' })
  type: string;

  @ApiProperty({ description: 'Entity ID' })
  id: string;

  @ApiProperty({ description: 'Human-readable summary' })
  summary: string;

  @ApiProperty({ description: 'Relevant entity data' })
  data: Record<string, any>;

  @ApiPropertyOptional({ description: 'Related entities' })
  relatedEntities?: Array<{
    type: string;
    id: string;
    relation: string;
  }>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

/**
 * Activity context in response
 */
export class ActivityContextDto {
  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiPropertyOptional({ description: 'Entity type involved' })
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID involved' })
  entityId?: string;

  @ApiPropertyOptional({ description: 'Entity name/description' })
  entityName?: string;

  @ApiProperty({ description: 'Timestamp of action' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Action description' })
  description?: string;
}

/**
 * Complete context response
 */
export class ContextResponseDto {
  @ApiProperty({ description: 'User context', type: UserContextDto })
  @ValidateNested()
  @Type(() => UserContextDto)
  user: UserContextDto;

  @ApiProperty({ description: 'Organization context', type: OrgContextDto })
  @ValidateNested()
  @Type(() => OrgContextDto)
  organization: OrgContextDto;

  @ApiProperty({ description: 'Page context', type: PageContextDto })
  @ValidateNested()
  @Type(() => PageContextDto)
  page: PageContextDto;

  @ApiPropertyOptional({ description: 'Entity context', type: EntityContextDto })
  @ValidateNested()
  @Type(() => EntityContextDto)
  entity?: EntityContextDto;

  @ApiProperty({
    description: 'Recent activity',
    type: [ActivityContextDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ActivityContextDto)
  recentActivity: ActivityContextDto[];

  @ApiProperty({
    description: 'Suggested questions/actions',
    type: [String],
  })
  suggestions: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}
