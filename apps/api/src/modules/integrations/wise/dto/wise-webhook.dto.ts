import { IsString, IsNumber, IsEnum, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WiseWebhookEvent, WiseTransferStatus, WiseCurrency } from '../wise.types';

/**
 * Wise Webhook Payload DTO
 */
export class WiseWebhookDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: '12345678-1234-1234-1234-123456789012',
  })
  @IsString()
  subscriptionId: string;

  @ApiProperty({
    description: 'Event type',
    enum: WiseWebhookEvent,
  })
  @IsEnum(WiseWebhookEvent)
  eventType: WiseWebhookEvent;

  @ApiProperty({
    description: 'Event creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Event data payload',
  })
  @IsObject()
  data: {
    resource: {
      id: number;
      profile_id: number;
      account_id: number;
      type: string;
    };
    current_state?: WiseTransferStatus;
    previous_state?: WiseTransferStatus;
    occurred_at: string;
    amount?: number;
    currency?: WiseCurrency;
    transaction_type?: string;
    post_transaction_balance_amount?: number;
  };
}
