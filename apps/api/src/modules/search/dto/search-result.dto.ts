/**
 * Search Result DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchableEntityType, SearchResult } from '../interfaces/search-result.interface';

export class SearchResultDto implements SearchResult {
  @ApiProperty({
    description: 'Type of entity',
    enum: SearchableEntityType,
    example: SearchableEntityType.INVOICE,
  })
  entityType: SearchableEntityType;

  @ApiProperty({
    description: 'Entity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  entityId: string;

  @ApiProperty({
    description: 'Primary title/name of the entity',
    example: 'INV-2024-001',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Secondary information',
    example: 'Acme Corp - $1,250.00',
  })
  subtitle?: string;

  @ApiPropertyOptional({
    description: 'Additional description or context',
    example: 'Invoice for consulting services',
  })
  description?: string;

  @ApiProperty({
    description: 'URL to view the entity',
    example: '/invoices/123e4567-e89b-12d3-a456-426614174000',
  })
  url: string;

  @ApiProperty({
    description: 'Relevance score (0-1)',
    example: 0.95,
  })
  relevanceScore: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { status: 'paid', amount: 1250 },
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Entity creation date',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Entity last update date',
  })
  updatedAt?: Date;
}

export class SearchResponseDto {
  @ApiProperty({
    description: 'Search results',
    type: [SearchResultDto],
  })
  results: SearchResultDto[];

  @ApiProperty({
    description: 'Total number of results found',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Query that was executed',
    example: 'invoice 2024',
  })
  query: string;

  @ApiProperty({
    description: 'Time taken to execute search in milliseconds',
    example: 23,
  })
  executionTime: number;

  @ApiPropertyOptional({
    description: 'Entity types that were searched',
    enum: SearchableEntityType,
    isArray: true,
  })
  types?: SearchableEntityType[];
}

export class ReindexResponseDto {
  @ApiProperty({
    description: 'Job ID for tracking reindex progress',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  jobId: string;

  @ApiProperty({
    description: 'Status message',
    example: 'Reindex job started successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Estimated time in seconds',
    example: 120,
  })
  estimatedTime: number;
}
