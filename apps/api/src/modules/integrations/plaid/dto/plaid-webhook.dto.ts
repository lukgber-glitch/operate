import { IsString, IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaidWebhookType } from '../plaid.types';

/**
 * Plaid Webhook DTO
 */
export class PlaidWebhookDto {
  @ApiProperty({
    description: 'Webhook type',
    enum: PlaidWebhookType,
    example: 'TRANSACTIONS',
  })
  @IsEnum(PlaidWebhookType)
  webhook_type: PlaidWebhookType;

  @ApiProperty({
    description: 'Webhook code indicating specific event',
    example: 'INITIAL_UPDATE',
  })
  @IsString()
  webhook_code: string;

  @ApiProperty({
    description: 'Item ID associated with the webhook',
    example: 'eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6',
  })
  @IsString()
  item_id: string;

  @ApiPropertyOptional({
    description: 'Error details if webhook indicates an error',
    type: 'object',
  })
  @IsOptional()
  error?: {
    error_code: string;
    error_message: string;
  };

  @ApiPropertyOptional({
    description: 'Number of new transactions available',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  new_transactions?: number;

  @ApiPropertyOptional({
    description: 'Array of removed transaction IDs',
    type: [String],
    example: ['lPNjeW1nR6CDn5okmGQ6hEpMo4lLNoSrzqDje'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  removed_transactions?: string[];
}
