import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AutomationAuditLog, AutomationMode } from '@prisma/client';

/**
 * Query parameters for filtering audit logs
 */
export class AuditLogQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by automation feature',
    example: 'invoices',
  })
  @IsString()
  @IsOptional()
  feature?: string;

  @ApiPropertyOptional({
    description: 'Filter by action type',
    example: 'invoice_auto_created',
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    example: 'Invoice',
  })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific entity ID',
    example: 'inv_123456789',
  })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter by auto-approval status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  wasAutoApproved?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by user ID who triggered the action',
    example: 'user_123456789',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

/**
 * Response DTO for audit log entry
 */
export class AuditLogResponseDto {
  @ApiProperty({
    description: 'Audit log ID',
    example: 'log_clxyz123456',
  })
  id: string;

  @ApiProperty({
    description: 'Organisation ID',
    example: 'org_123456789',
  })
  organisationId: string;

  @ApiProperty({
    description: 'Action that was performed',
    example: 'invoice_auto_created',
  })
  action: string;

  @ApiProperty({
    description: 'Feature that triggered the action',
    example: 'invoices',
  })
  feature: string;

  @ApiProperty({
    description: 'Automation mode at time of action',
    enum: AutomationMode,
    example: AutomationMode.AUTO_APPROVE,
  })
  mode: AutomationMode;

  @ApiProperty({
    description: 'Type of entity affected',
    example: 'Invoice',
  })
  entityType: string;

  @ApiProperty({
    description: 'ID of entity affected',
    example: 'inv_123456789',
  })
  entityId: string;

  @ApiPropertyOptional({
    description: 'AI confidence score (0-1)',
    example: 0.95,
  })
  confidenceScore?: number;

  @ApiProperty({
    description: 'Whether action was auto-approved',
    example: true,
  })
  wasAutoApproved: boolean;

  @ApiPropertyOptional({
    description: 'Input data that triggered the automation',
    example: { amount: 1500, category: 'Office Supplies' },
  })
  inputData?: any;

  @ApiPropertyOptional({
    description: 'Output data from the automation',
    example: { invoiceId: 'inv_123', status: 'approved' },
  })
  outputData?: any;

  @ApiPropertyOptional({
    description: 'User who triggered the action (null for fully automated)',
  })
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };

  @ApiProperty({
    description: 'Timestamp when action was performed',
    example: '2025-12-01T10:30:00Z',
  })
  createdAt: Date;
}

/**
 * Paginated response for audit logs
 */
export class PaginatedAuditLogDto {
  @ApiProperty({
    description: 'Array of audit log entries',
    type: [AuditLogResponseDto],
  })
  data: AutomationAuditLog[];

  @ApiProperty({
    description: 'Total number of audit logs matching the query',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;
}

/**
 * Automation statistics DTO
 */
export class AutomationStatsDto {
  @ApiProperty({
    description: 'Total number of automated actions in period',
    example: 1234,
  })
  totalAutomatedActions: number;

  @ApiProperty({
    description: 'Number of auto-approved actions',
    example: 987,
  })
  autoApprovedCount: number;

  @ApiProperty({
    description: 'Number of manual overrides',
    example: 247,
  })
  manualOverrideCount: number;

  @ApiProperty({
    description: 'Average confidence score across all actions',
    example: 0.89,
  })
  averageConfidenceScore: number;

  @ApiProperty({
    description: 'Action counts by feature',
    example: {
      invoices: 500,
      expenses: 400,
      classification: 334,
    },
  })
  byFeature: Record<string, number>;

  @ApiProperty({
    description: 'Action counts by automation mode',
    example: {
      AUTO_APPROVE: 987,
      SUGGEST: 200,
      MANUAL: 47,
    },
  })
  byMode: Record<string, number>;

  @ApiProperty({
    description: 'Time period for statistics',
    enum: ['day', 'week', 'month'],
    example: 'week',
  })
  period: 'day' | 'week' | 'month';

  @ApiProperty({
    description: 'Start date of the period',
    example: '2025-11-24T00:00:00Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of the period',
    example: '2025-12-01T23:59:59Z',
  })
  endDate: Date;
}

/**
 * Export audit logs DTO
 */
export class ExportAuditLogsDto {
  @ApiProperty({
    description: 'Start date for export range (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsDateString()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    description: 'End date for export range (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    description: 'Export format',
    enum: ['json', 'csv'],
    example: 'csv',
  })
  @IsEnum(['json', 'csv'])
  format: 'json' | 'csv';

  @ApiPropertyOptional({
    description: 'Filter by feature (optional)',
    example: 'invoices',
  })
  @IsString()
  @IsOptional()
  feature?: string;

  @ApiPropertyOptional({
    description: 'Filter by action (optional)',
    example: 'invoice_auto_created',
  })
  @IsString()
  @IsOptional()
  action?: string;
}

/**
 * Entity audit trail response
 */
export class EntityAuditTrailDto {
  @ApiProperty({
    description: 'Entity type',
    example: 'Invoice',
  })
  entityType: string;

  @ApiProperty({
    description: 'Entity ID',
    example: 'inv_123456789',
  })
  entityId: string;

  @ApiProperty({
    description: 'Complete audit trail for the entity',
    type: [AuditLogResponseDto],
  })
  auditTrail: AutomationAuditLog[];

  @ApiProperty({
    description: 'Total number of audit entries',
    example: 5,
  })
  totalEntries: number;
}
