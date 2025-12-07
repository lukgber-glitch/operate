/**
 * Action Confirmation DTOs
 * Data transfer objects for action confirmation endpoints
 */

import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActionType } from '../actions/action.types';

/**
 * DTO for confirming a pending action
 */
export class ConfirmActionDto {
  @ApiPropertyOptional({
    description: 'Message ID to associate with the confirmation',
    example: 'msg_123abc',
  })
  @IsOptional()
  @IsString()
  messageId?: string;
}

/**
 * DTO for canceling a pending action
 */
export class CancelActionDto {
  @ApiPropertyOptional({
    description: 'Optional reason for canceling the action',
    example: 'User changed their mind',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Response DTO for action status queries
 */
export class ActionStatusResponseDto {
  @ApiProperty({
    description: 'Confirmation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Action type',
    enum: ActionType,
    example: 'CREATE_INVOICE',
  })
  type: ActionType;

  @ApiProperty({
    description: 'Action description',
    example: 'Create invoice for customer Acme Corp',
  })
  description: string;

  @ApiProperty({
    description: 'Action parameters',
    example: { customerName: 'Acme Corp', amount: 1500, currency: 'EUR' },
  })
  parameters: Record<string, any>;

  @ApiProperty({
    description: 'Whether action requires confirmation',
    example: true,
  })
  confirmationRequired: boolean;

  @ApiProperty({
    description: 'When the action was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the action expires',
    example: '2024-01-15T10:35:00Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Current status of the action',
    enum: ['pending', 'expired'],
    example: 'pending',
  })
  status: 'pending' | 'expired';
}

/**
 * Response DTO for action execution results
 */
export class ActionExecutionResponseDto {
  @ApiProperty({
    description: 'Whether the action was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Result message',
    example: 'Invoice created successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'ID of the created/updated entity',
    example: 'inv_123abc',
  })
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Type of the created/updated entity',
    example: 'invoice',
  })
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Additional data from action execution',
    example: { invoiceNumber: 'INV-2024-001', amount: 1500 },
  })
  data?: any;

  @ApiPropertyOptional({
    description: 'Error message if action failed',
    example: 'Customer not found',
  })
  error?: string;
}
