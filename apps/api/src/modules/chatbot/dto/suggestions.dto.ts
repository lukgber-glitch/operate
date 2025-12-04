import { IsString, IsOptional, IsEnum, IsObject, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SuggestionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum SuggestionType {
  TAX_DEADLINE = 'TAX_DEADLINE',
  INVOICE_REMINDER = 'INVOICE_REMINDER',
  EXPENSE_ANOMALY = 'EXPENSE_ANOMALY',
  CASH_FLOW = 'CASH_FLOW',
  CLIENT_FOLLOWUP = 'CLIENT_FOLLOWUP',
  COMPLIANCE = 'COMPLIANCE',
  OPTIMIZATION = 'OPTIMIZATION',
  INSIGHT = 'INSIGHT',
}

export class SuggestionDto {
  @ApiProperty({ description: 'Unique suggestion ID' })
  id: string;

  @ApiProperty({ description: 'Suggestion title' })
  title: string;

  @ApiProperty({ description: 'Detailed description' })
  description: string;

  @ApiProperty({ description: 'Call-to-action label', example: 'Pay Now' })
  actionLabel?: string;

  @ApiProperty({ enum: SuggestionType })
  type: SuggestionType;

  @ApiProperty({ enum: SuggestionPriority })
  priority: SuggestionPriority;

  @ApiPropertyOptional({ description: 'Entity type (invoice, expense, etc.)' })
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  entityId?: string;

  @ApiPropertyOptional({ description: 'Action type', example: 'navigate' })
  actionType?: string;

  @ApiPropertyOptional({ description: 'Action parameters' })
  actionParams?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional structured data' })
  data?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Expiration timestamp' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'AI confidence score (0-1)' })
  confidence?: number;
}

export class ContextDto {
  @ApiProperty({ description: 'Current page path', example: '/finance/invoices' })
  @IsString()
  page: string;

  @ApiPropertyOptional({ description: 'Applied filters' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Selected item IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedItems?: string[];

  @ApiPropertyOptional({ description: 'Additional context data' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ApplySuggestionDto {
  @ApiPropertyOptional({ description: 'Additional parameters for the action' })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}

export class DismissSuggestionDto {
  @ApiPropertyOptional({ description: 'Reason for dismissing' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class GetSuggestionsQueryDto {
  @ApiPropertyOptional({ description: 'Context path', example: 'finance.invoices' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'Maximum number of suggestions', example: 5 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: SuggestionPriority, description: 'Minimum priority' })
  @IsOptional()
  @IsEnum(SuggestionPriority)
  minPriority?: SuggestionPriority;
}
