import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryConfigDto } from './delivery-config.dto';
import { ReportParamsDto } from './report-params.dto';

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
}

export class ScheduleConfigDto {
  @ApiProperty({
    description: 'Schedule frequency',
    enum: ScheduleFrequency,
    example: ScheduleFrequency.MONTHLY,
  })
  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency;

  @ApiProperty({
    description: 'Time of day to run (HH:mm format)',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:mm format',
  })
  timeOfDay: string;

  @ApiProperty({
    description: 'Timezone for schedule execution',
    example: 'Europe/Berlin',
  })
  @IsString()
  timezone: string;

  @ApiPropertyOptional({
    description: 'Day of week for weekly schedule (0=Sunday, 6=Saturday)',
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Day of month for monthly schedule (1-31)',
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiPropertyOptional({
    description: 'Custom cron expression (for CUSTOM frequency)',
    example: '0 9 * * 1',
  })
  @IsOptional()
  @IsString()
  cronExpression?: string;

  @ApiPropertyOptional({
    description: 'Enable catch-up for missed schedules',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  catchUpMissed?: boolean;
}

export class CreateScheduleDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'org_123',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Schedule name',
    example: 'Monthly P&L Report',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Schedule description',
    example: 'Automated monthly profit & loss statement',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Schedule configuration',
    type: ScheduleConfigDto,
  })
  @ValidateNested()
  @Type(() => ScheduleConfigDto)
  schedule: ScheduleConfigDto;

  @ApiProperty({
    description: 'Report parameters',
    type: ReportParamsDto,
  })
  @ValidateNested()
  @Type(() => ReportParamsDto)
  reportParams: ReportParamsDto;

  @ApiProperty({
    description: 'Delivery configuration',
    type: DeliveryConfigDto,
  })
  @ValidateNested()
  @Type(() => DeliveryConfigDto)
  deliveryConfig: DeliveryConfigDto;

  @ApiPropertyOptional({
    description: 'Start schedule immediately',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  startImmediately?: boolean;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({
    description: 'Schedule name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Schedule description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Schedule configuration',
    type: ScheduleConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleConfigDto)
  schedule?: ScheduleConfigDto;

  @ApiPropertyOptional({
    description: 'Report parameters',
    type: ReportParamsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportParamsDto)
  reportParams?: ReportParamsDto;

  @ApiPropertyOptional({
    description: 'Delivery configuration',
    type: DeliveryConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryConfigDto)
  deliveryConfig?: DeliveryConfigDto;
}

export class ScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: ScheduleStatus })
  status: ScheduleStatus;

  @ApiProperty({ type: ScheduleConfigDto })
  schedule: ScheduleConfigDto;

  @ApiProperty({ type: ReportParamsDto })
  reportParams: ReportParamsDto;

  @ApiProperty({ type: DeliveryConfigDto })
  deliveryConfig: DeliveryConfigDto;

  @ApiPropertyOptional()
  nextRunAt?: Date;

  @ApiPropertyOptional()
  lastRunAt?: Date;

  @ApiPropertyOptional()
  lastError?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  createdBy?: string;
}

export class ScheduleListResponseDto {
  @ApiProperty({ type: [ScheduleResponseDto] })
  schedules: ScheduleResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}
