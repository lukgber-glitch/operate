import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsObject,
  IsBoolean,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportType {
  DATEV = 'DATEV',
  SAFT = 'SAFT',
  BMD = 'BMD',
}

export class CreateScheduledExportDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({ description: 'Name of the scheduled export' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Export type',
    enum: ExportType,
  })
  @IsEnum(ExportType)
  @IsNotEmpty()
  exportType: ExportType;

  @ApiProperty({
    description: 'Export configuration (format-specific)',
    example: {
      dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' },
      format: 'xml',
    },
  })
  @IsObject()
  @IsNotEmpty()
  config: Record<string, any>;

  @ApiProperty({
    description: 'Cron expression for scheduling',
    example: '0 0 1 * *',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/, {
    message: 'Invalid cron expression',
  })
  schedule: string;

  @ApiPropertyOptional({
    description: 'Timezone for schedule',
    default: 'Europe/Berlin',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Email address for notifications',
  })
  @IsEmail()
  @IsOptional()
  notifyEmail?: string;

  @ApiPropertyOptional({
    description: 'Whether the schedule is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
