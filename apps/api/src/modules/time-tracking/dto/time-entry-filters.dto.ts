import {
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SummaryPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class TimeEntryFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by client ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by billable status' })
  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @ApiPropertyOptional({ description: 'Filter by billed status' })
  @IsOptional()
  @IsBoolean()
  billed?: boolean;

  @ApiPropertyOptional({ description: 'Start date for range filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for range filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class TimeSummaryDto {
  @ApiPropertyOptional({ description: 'Start date for summary' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for summary' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Period for grouping',
    enum: SummaryPeriod,
    default: SummaryPeriod.DAY,
  })
  @IsOptional()
  @IsEnum(SummaryPeriod)
  period?: SummaryPeriod;
}
