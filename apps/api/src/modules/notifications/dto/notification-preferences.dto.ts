import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsObject } from 'class-validator';

/**
 * Notification channel preferences
 */
export class NotificationChannelPreferences {
  @ApiProperty({
    description: 'Enable email notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  email: boolean;

  @ApiProperty({
    description: 'Enable push notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  push: boolean;

  @ApiProperty({
    description: 'Enable in-app notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  inApp: boolean;
}

/**
 * Notification type preferences
 */
export class NotificationTypePreferences {
  [key: string]: boolean;

  @ApiProperty({
    description: 'Invoice due notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  invoice_due: boolean;

  @ApiProperty({
    description: 'Task assigned notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  task_assigned: boolean;

  @ApiProperty({
    description: 'Document classified notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  document_classified: boolean;

  @ApiProperty({
    description: 'Tax deadline notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  tax_deadline: boolean;

  @ApiProperty({
    description: 'Approval needed notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  approval_needed: boolean;

  @ApiProperty({
    description: 'Fraud alert notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  fraud_alert: boolean;

  @ApiProperty({
    description: 'System notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  system: boolean;
}

/**
 * DTO for notification preferences
 */
export class NotificationPreferencesDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  orgId: string;

  @ApiProperty({
    description: 'Notification channel preferences',
    type: NotificationChannelPreferences,
  })
  channels: NotificationChannelPreferences;

  @ApiProperty({
    description: 'Notification type preferences',
    type: NotificationTypePreferences,
  })
  types: NotificationTypePreferences;

  @ApiProperty({
    description: 'Do not disturb mode (suppress all notifications)',
    example: false,
    default: false,
  })
  @IsBoolean()
  doNotDisturb: boolean;

  @ApiProperty({
    description: 'Quiet hours start (24-hour format, e.g., "22:00")',
    example: '22:00',
    required: false,
  })
  @IsOptional()
  quietHoursStart?: string;

  @ApiProperty({
    description: 'Quiet hours end (24-hour format, e.g., "08:00")',
    example: '08:00',
    required: false,
  })
  @IsOptional()
  quietHoursEnd?: string;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-07-15T12:30:00Z',
  })
  updatedAt: Date;
}

/**
 * DTO for updating notification preferences
 */
export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    description: 'Notification channel preferences',
    type: NotificationChannelPreferences,
    required: false,
  })
  @IsOptional()
  @IsObject()
  channels?: NotificationChannelPreferences;

  @ApiProperty({
    description: 'Notification type preferences',
    type: NotificationTypePreferences,
    required: false,
  })
  @IsOptional()
  @IsObject()
  types?: NotificationTypePreferences;

  @ApiProperty({
    description: 'Do not disturb mode',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  doNotDisturb?: boolean;

  @ApiProperty({
    description: 'Quiet hours start (24-hour format)',
    example: '22:00',
    required: false,
  })
  @IsOptional()
  quietHoursStart?: string;

  @ApiProperty({
    description: 'Quiet hours end (24-hour format)',
    example: '08:00',
    required: false,
  })
  @IsOptional()
  quietHoursEnd?: string;
}
