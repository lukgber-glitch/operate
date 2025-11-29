import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';

/**
 * DTO for creating a notification
 * Used internally by other services to create notifications
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Notification type',
    example: 'approval_needed',
    enum: [
      'approval_needed',
      'fraud_alert',
      'deadline',
      'auto_action',
      'system',
    ],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Approval Required',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your expense report requires approval',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Additional data (optional)',
    example: { expenseId: '123e4567-e89b-12d3-a456-426614174002' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Priority level (1-5, 5 being highest)',
    example: 3,
    default: 3,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;
}
