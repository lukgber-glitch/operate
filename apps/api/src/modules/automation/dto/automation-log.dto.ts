import { IsString, IsEnum, IsNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Automation action types
 */
export enum AutomationAction {
  AUTO_APPROVED = 'AUTO_APPROVED',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  AUTO_CLASSIFIED = 'AUTO_CLASSIFIED',
  AUTO_SUGGESTED = 'AUTO_SUGGESTED',
}

/**
 * Automation features
 */
export enum AutomationFeature {
  CLASSIFICATION = 'classification',
  EXPENSE = 'expense',
  DEDUCTION = 'deduction',
  INVOICE = 'invoice',
}

/**
 * Automation Log DTO
 */
export class AutomationLogDto {
  @ApiProperty({
    description: 'Organisation ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  organisationId: string;

  @ApiProperty({
    description: 'Automation feature',
    enum: AutomationFeature,
    example: 'CLASSIFICATION',
  })
  feature: AutomationFeature;

  @ApiProperty({
    description: 'Action taken by automation',
    enum: AutomationAction,
    example: 'AUTO_APPROVED',
  })
  action: AutomationAction;

  @ApiProperty({
    description: 'ID of the resource affected',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  resourceId: string;

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.92,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  confidence?: number;

  @ApiProperty({
    description: 'Amount involved (in cents)',
    example: 15000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'Additional metadata',
    example: { category: 'Office Supplies', suggestedBy: 'AI' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Audit Filter DTO
 */
export class AuditFilterDto {
  @ApiProperty({
    description: 'Filter by feature',
    enum: AutomationFeature,
    required: false,
  })
  @IsOptional()
  feature?: AutomationFeature;

  @ApiProperty({
    description: 'Filter by action',
    enum: AutomationAction,
    required: false,
  })
  @IsOptional()
  action?: AutomationAction;

  @ApiProperty({
    description: 'Start date (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date (ISO 8601)',
    example: '2025-01-31T23:59:59Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
