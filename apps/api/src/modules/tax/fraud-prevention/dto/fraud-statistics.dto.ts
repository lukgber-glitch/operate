/**
 * Fraud Statistics DTOs
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsDate,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FraudAlertSeverityDto, FraudAlertTypeDto } from './fraud-alert.dto';

export class DateRangeDto {
  @ApiProperty({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  start!: Date;

  @ApiProperty({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  end!: Date;
}

export class TopCategoryDto {
  @ApiProperty({ description: 'Category code' })
  @IsString()
  categoryCode!: string;

  @ApiProperty({ description: 'Alert count' })
  @IsNumber()
  alertCount!: number;
}

export class FraudStatisticsDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  orgId!: string;

  @ApiProperty({ type: DateRangeDto, description: 'Period' })
  @ValidateNested()
  @Type(() => DateRangeDto)
  period!: DateRangeDto;

  @ApiProperty({ description: 'Total alerts' })
  @IsNumber()
  totalAlerts!: number;

  @ApiProperty({
    description: 'Alerts by severity',
    example: {
      info: 10,
      warning: 5,
      high: 2,
      critical: 1,
    },
  })
  alertsBySeverity!: Record<FraudAlertSeverityDto, number>;

  @ApiProperty({
    description: 'Alerts by type',
    example: {
      duplicate_transaction: 3,
      threshold_exceeded: 2,
      suspicious_pattern: 5,
    },
  })
  alertsByType!: Record<FraudAlertTypeDto, number>;

  @ApiProperty({ description: 'Reviewed alerts count' })
  @IsNumber()
  reviewedAlerts!: number;

  @ApiProperty({ description: 'Confirmed fraud count' })
  @IsNumber()
  confirmedFraud!: number;

  @ApiProperty({ description: 'False positives count' })
  @IsNumber()
  falsePositives!: number;

  @ApiProperty({ description: 'Precision (0-1)' })
  @IsNumber()
  precision!: number;

  @ApiProperty({ description: 'Average review time in hours' })
  @IsNumber()
  avgReviewTime!: number;

  @ApiProperty({ type: [TopCategoryDto], description: 'Top categories' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopCategoryDto)
  topCategories!: TopCategoryDto[];
}
