import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Notification status enum
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Notification type enum
 */
export enum NotificationType {
  APPROVAL_NEEDED = 'approval_needed',
  FRAUD_ALERT = 'fraud_alert',
  DEADLINE = 'deadline',
  AUTO_ACTION = 'auto_action',
  SYSTEM = 'system',
}

/**
 * DTO for filtering notifications
 */
export class NotificationFilterDto {
  @ApiProperty({
    description: 'Filter by notification status',
    enum: NotificationStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({
    description: 'Filter by notification type',
    enum: NotificationType,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({
    description: 'Page number (1-based)',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

/**
 * DTO for notification response
 */
export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  orgId: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.APPROVAL_NEEDED,
  })
  type: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Approval Required',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your expense report requires approval',
  })
  message: string;

  @ApiProperty({
    description: 'Additional data',
    example: { expenseId: '123e4567-e89b-12d3-a456-426614174003' },
    required: false,
  })
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Notification status',
    enum: NotificationStatus,
    example: NotificationStatus.UNREAD,
  })
  status: string;

  @ApiProperty({
    description: 'Priority level (1-5)',
    example: 3,
  })
  priority: number;

  @ApiProperty({
    description: 'Read timestamp',
    example: '2024-07-15T12:30:00Z',
    required: false,
  })
  readAt?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-07-15T10:00:00Z',
  })
  createdAt: Date;
}

/**
 * DTO for unread count response
 */
export class UnreadCountDto {
  @ApiProperty({
    description: 'Number of unread notifications',
    example: 5,
  })
  count: number;
}
