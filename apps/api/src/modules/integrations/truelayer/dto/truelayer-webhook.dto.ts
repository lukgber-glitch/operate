import { IsString, IsObject, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrueLayerWebhookType } from '../truelayer.types';

/**
 * TrueLayer Webhook DTO
 */
export class TrueLayerWebhookDto {
  @ApiProperty({
    description: 'Webhook event type',
    enum: TrueLayerWebhookType,
    example: 'transaction.created',
  })
  @IsEnum(TrueLayerWebhookType)
  type: TrueLayerWebhookType;

  @ApiProperty({
    description: 'Unique event ID',
    example: 'evt_123456789',
  })
  @IsString()
  event_id: string;

  @ApiProperty({
    description: 'Event timestamp (ISO 8601)',
    example: '2024-12-02T10:30:00Z',
  })
  @IsDateString()
  event_timestamp: string;

  @ApiProperty({
    description: 'Resource ID (e.g., account_id, transaction_id)',
    example: 'acc_123456789',
  })
  @IsString()
  resource_id: string;

  @ApiProperty({
    description: 'Resource type (e.g., "account", "transaction")',
    example: 'transaction',
  })
  @IsString()
  resource_type: string;

  @ApiPropertyOptional({
    description: 'Access token for fetching updated resource data',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsOptional()
  resource_token?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata about the event',
    example: { provider: 'ob-lloyds' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
