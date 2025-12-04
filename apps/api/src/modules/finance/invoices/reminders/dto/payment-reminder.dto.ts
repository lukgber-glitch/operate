import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReminderType, ReminderStatus } from '@prisma/client';

/**
 * DTO for creating a payment reminder
 */
export class CreateReminderDto {
  @ApiProperty({
    description: 'Type of reminder',
    enum: ReminderType,
    example: ReminderType.AFTER_DUE,
  })
  @IsEnum(ReminderType)
  reminderType: ReminderType;

  @ApiProperty({
    description: 'When to send the reminder',
    example: '2025-12-15T09:00:00Z',
  })
  @IsDateString()
  scheduledFor: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Payment reminder for Invoice #INV-2025-001',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Email body content',
    example: 'Dear customer, this is a friendly reminder...',
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Escalation level (1-3)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  escalationLevel?: number;
}

/**
 * DTO for updating reminder settings
 */
export class UpdateReminderSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable automatic reminders',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableAutoReminders?: boolean;

  @ApiPropertyOptional({
    description: 'Days before due date to send reminders',
    example: [7, 3, 1],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  reminderDaysBeforeDue?: number[];

  @ApiPropertyOptional({
    description: 'Days after due date to send reminders',
    example: [1, 7, 14, 30],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  reminderDaysAfterDue?: number[];

  @ApiPropertyOptional({
    description: 'Enable automatic escalation',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  autoEscalate?: boolean;

  @ApiPropertyOptional({
    description: 'Days overdue before escalation',
    example: 14,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  escalationThresholdDays?: number;

  @ApiPropertyOptional({
    description: 'Maximum escalation level',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  maxEscalationLevel?: number;

  @ApiPropertyOptional({
    description: 'Template for reminders before due date',
    example: 'Dear {customerName}, Invoice {invoiceNumber} is due on {dueDate}...',
  })
  @IsOptional()
  @IsString()
  beforeDueTemplate?: string;

  @ApiPropertyOptional({
    description: 'Template for reminders on due date',
  })
  @IsOptional()
  @IsString()
  onDueTemplate?: string;

  @ApiPropertyOptional({
    description: 'Template for reminders after due date',
  })
  @IsOptional()
  @IsString()
  afterDueTemplate?: string;

  @ApiPropertyOptional({
    description: 'Template for escalation notices',
  })
  @IsOptional()
  @IsString()
  escalationTemplate?: string;
}

/**
 * Query DTO for filtering reminders
 */
export class ReminderQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ReminderStatus,
    example: ReminderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @ApiPropertyOptional({
    description: 'Filter by reminder type',
    enum: ReminderType,
    example: ReminderType.AFTER_DUE,
  })
  @IsOptional()
  @IsEnum(ReminderType)
  reminderType?: ReminderType;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size',
    example: 20,
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
 * Response DTO for reminder history
 */
export class ReminderHistoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ReminderType })
  reminderType: ReminderType;

  @ApiProperty()
  scheduledFor: Date;

  @ApiProperty({ nullable: true })
  sentAt: Date | null;

  @ApiProperty()
  subject: string;

  @ApiProperty({ enum: ReminderStatus })
  status: ReminderStatus;

  @ApiProperty()
  escalationLevel: number;

  @ApiProperty({ nullable: true })
  failureReason: string | null;

  @ApiProperty()
  createdAt: Date;
}
