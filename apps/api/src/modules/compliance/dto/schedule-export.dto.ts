import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEmail,
  IsUrl,
  IsNumber,
  Min,
  Max,
  IsString,
  ValidateIf,
  IsTimeZone,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportFrequency } from '../interfaces/scheduled-export.interface';

/**
 * Schedule Export DTO
 * Request payload for creating or updating a scheduled export
 */
export class ScheduleExportDto {
  @ApiProperty({
    description: 'Export type',
    enum: ['gobd', 'saft'],
    example: 'gobd',
  })
  @IsEnum(['gobd', 'saft'], {
    message: 'Export type must be either "gobd" or "saft"',
  })
  type: 'gobd' | 'saft';

  @ApiProperty({
    description: 'Export frequency',
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
    example: 'MONTHLY',
  })
  frequency: ExportFrequency;

  @ApiPropertyOptional({
    description: 'Day of week (0-6, Sunday-Saturday) for weekly exports',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @ValidateIf((o) => o.frequency === ExportFrequency.WEEKLY)
  @IsNumber()
  @Min(0, { message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' })
  @Max(6, { message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' })
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Day of month (1-31) for monthly exports',
    example: 1,
    minimum: 1,
    maximum: 31,
  })
  @ValidateIf((o) => o.frequency === ExportFrequency.MONTHLY)
  @IsNumber()
  @Min(1, { message: 'Day of month must be between 1 and 31' })
  @Max(31, { message: 'Day of month must be between 1 and 31' })
  dayOfMonth?: number;

  @ApiProperty({
    description: 'Timezone for scheduling (IANA timezone name)',
    example: 'Europe/Berlin',
    default: 'UTC',
  })
  @IsString()
  @IsTimeZone({ message: 'Timezone must be a valid IANA timezone name' })
  timezone: string = 'UTC';

  @ApiProperty({
    description: 'Whether the schedule is enabled',
    example: true,
    default: true,
  })
  @IsBoolean()
  enabled: boolean = true;

  @ApiProperty({
    description: 'Whether to include documents in the export',
    example: true,
    default: false,
  })
  @IsBoolean()
  includeDocuments: boolean = false;

  @ApiProperty({
    description: 'Email addresses to notify on completion',
    example: ['accountant@example.com', 'cfo@example.com'],
    type: [String],
  })
  @IsArray()
  @IsEmail({}, { each: true, message: 'Each notification email must be valid' })
  notifyEmail: string[];

  @ApiPropertyOptional({
    description: 'Webhook URL to call on completion',
    example: 'https://example.com/webhooks/export-completed',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Webhook URL must be a valid URL' })
  webhookUrl?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of retries before disabling',
    example: 3,
    default: 3,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Max retries must be at least 0' })
  @Max(10, { message: 'Max retries must not exceed 10' })
  maxRetries?: number = 3;
}

/**
 * Update Schedule Export DTO
 * Partial update for scheduled exports
 */
export class UpdateScheduleExportDto {
  @ApiPropertyOptional({
    description: 'Whether the schedule is enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to include documents in the export',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeDocuments?: boolean;

  @ApiPropertyOptional({
    description: 'Email addresses to notify on completion',
    example: ['accountant@example.com'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  notifyEmail?: string[];

  @ApiPropertyOptional({
    description: 'Webhook URL to call on completion',
    example: 'https://example.com/webhooks/export-completed',
  })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of retries before disabling',
    example: 3,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRetries?: number;
}

/**
 * Schedule Response DTO
 */
export class ScheduleResponseDto {
  @ApiProperty({
    description: 'Schedule unique identifier',
    example: 'sched_123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_987654321',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Export type',
    enum: ['gobd', 'saft'],
    example: 'gobd',
  })
  type: 'gobd' | 'saft';

  @ApiProperty({
    description: 'Export frequency',
    enum: ExportFrequency,
    example: 'MONTHLY',
  })
  frequency: ExportFrequency;

  @ApiPropertyOptional({
    description: 'Day of week for weekly exports',
    example: 1,
  })
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Day of month for monthly exports',
    example: 1,
  })
  dayOfMonth?: number;

  @ApiProperty({
    description: 'Timezone',
    example: 'Europe/Berlin',
  })
  timezone: string;

  @ApiProperty({
    description: 'Whether the schedule is enabled',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Whether to include documents',
    example: true,
  })
  includeDocuments: boolean;

  @ApiProperty({
    description: 'Notification emails',
    example: ['accountant@example.com'],
  })
  notifyEmail: string[];

  @ApiPropertyOptional({
    description: 'Webhook URL',
    example: 'https://example.com/webhooks/export-completed',
  })
  webhookUrl?: string;

  @ApiPropertyOptional({
    description: 'Last successful run timestamp',
    example: '2024-04-01T00:00:00Z',
  })
  lastRun?: Date;

  @ApiProperty({
    description: 'Next scheduled run timestamp',
    example: '2024-05-01T00:00:00Z',
  })
  nextRun: Date;

  @ApiProperty({
    description: 'Number of consecutive failures',
    example: 0,
  })
  failureCount: number;

  @ApiProperty({
    description: 'Maximum retries',
    example: 3,
  })
  maxRetries: number;

  @ApiProperty({
    description: 'Created by user ID',
    example: 'user_123',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-04-01T00:00:00Z',
  })
  updatedAt: Date;
}
