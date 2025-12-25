import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsObject,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Notification channel settings for a single notification type
 */
export class NotificationChannelSettings {
  @ApiProperty({
    description: 'Enable in-app notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  inApp: boolean;

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
}

/**
 * Channel preferences for all notification types
 */
export class ChannelPreferencesMap {
  @ApiProperty({
    description: 'Invoice due notifications',
    type: NotificationChannelSettings,
  })
  @ValidateNested()
  @Type(() => NotificationChannelSettings)
  INVOICE_DUE?: NotificationChannelSettings;

  @ApiProperty({
    description: 'Payment received notifications',
    type: NotificationChannelSettings,
  })
  @ValidateNested()
  @Type(() => NotificationChannelSettings)
  PAYMENT_RECEIVED?: NotificationChannelSettings;

  @ApiProperty({
    description: 'Task assigned notifications',
    type: NotificationChannelSettings,
  })
  @ValidateNested()
  @Type(() => NotificationChannelSettings)
  TASK_ASSIGNED?: NotificationChannelSettings;

  @ApiProperty({
    description: 'Document classified notifications',
    type: NotificationChannelSettings,
  })
  @ValidateNested()
  @Type(() => NotificationChannelSettings)
  DOCUMENT_CLASSIFIED?: NotificationChannelSettings;

  @ApiProperty({
    description: 'Tax deadline notifications',
    type: NotificationChannelSettings,
  })
  @ValidateNested()
  @Type(() => NotificationChannelSettings)
  TAX_DEADLINE?: NotificationChannelSettings;

  @ApiProperty({
    description: 'System update notifications',
    type: NotificationChannelSettings,
  })
  @ValidateNested()
  @Type(() => NotificationChannelSettings)
  SYSTEM_UPDATE?: NotificationChannelSettings;

  @ApiProperty({
    description: 'General system notifications',
    type: NotificationChannelSettings,
  })
  @ValidateNested()
  @Type(() => NotificationChannelSettings)
  SYSTEM?: NotificationChannelSettings;
}

/**
 * DTO for notification preferences response
 */
export class NotificationPreferencesDto {
  @ApiProperty({
    description: 'Preference ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

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
    description: 'Do not disturb mode (suppress all notifications)',
    example: false,
    default: false,
  })
  @IsBoolean()
  doNotDisturb: boolean;

  @ApiProperty({
    description: 'Quiet hours start (HH:mm format, e.g., "22:00")',
    example: '22:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @ApiProperty({
    description: 'Quiet hours end (HH:mm format, e.g., "08:00")',
    example: '08:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @ApiProperty({
    description: 'Channel preferences per notification type',
    type: ChannelPreferencesMap,
  })
  channelPreferences: ChannelPreferencesMap;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-07-15T12:30:00Z',
  })
  createdAt: Date;

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
    description: 'Do not disturb mode',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  doNotDisturb?: boolean;

  @ApiProperty({
    description: 'Quiet hours start (HH:mm format)',
    example: '22:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'quietHoursStart must be in HH:mm format (e.g., "22:00")',
  })
  quietHoursStart?: string;

  @ApiProperty({
    description: 'Quiet hours end (HH:mm format)',
    example: '08:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'quietHoursEnd must be in HH:mm format (e.g., "08:00")',
  })
  quietHoursEnd?: string;

  @ApiProperty({
    description: 'Channel preferences per notification type',
    type: ChannelPreferencesMap,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ChannelPreferencesMap)
  channelPreferences?: ChannelPreferencesMap;
}
