/**
 * Fraud Check Result DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsBoolean,
  IsArray,
  IsDate,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FraudAlertDto, RecommendedActionDto } from './fraud-alert.dto';

export class DuplicateCheckDto {
  @ApiProperty({ description: 'Exact same amount' })
  @IsBoolean()
  sameAmount!: boolean;

  @ApiProperty({ description: 'Exact same date' })
  @IsBoolean()
  sameDate!: boolean;

  @ApiProperty({ description: 'Exact same description' })
  @IsBoolean()
  sameDescription!: boolean;

  @ApiProperty({ description: 'Exact same counterparty' })
  @IsBoolean()
  sameCounterparty!: boolean;

  @ApiProperty({ description: 'Similar amount (within 5%)' })
  @IsBoolean()
  similarAmount!: boolean;

  @ApiProperty({ description: 'Proximate date (within 7 days)' })
  @IsBoolean()
  proximateDate!: boolean;

  @ApiProperty({ description: 'Similar description' })
  @IsBoolean()
  similarDescription!: boolean;

  @ApiProperty({ description: 'Duplicate score (0-1)' })
  @IsNumber()
  duplicateScore!: number;

  @ApiProperty({ description: 'Is duplicate flag' })
  @IsBoolean()
  isDuplicate!: boolean;

  @ApiPropertyOptional({ description: 'Matched transaction ID' })
  @IsOptional()
  @IsUUID()
  matchedTransactionId?: string;
}

export class ThresholdConfigDto {
  @ApiProperty({ description: 'Country code' })
  @IsString()
  countryCode!: string;

  @ApiProperty({ description: 'Category code' })
  @IsString()
  categoryCode!: string;

  @ApiPropertyOptional({ description: 'Daily limit in cents' })
  @IsOptional()
  @IsNumber()
  dailyLimit?: number;

  @ApiPropertyOptional({ description: 'Monthly limit in cents' })
  @IsOptional()
  @IsNumber()
  monthlyLimit?: number;

  @ApiPropertyOptional({ description: 'Annual limit in cents' })
  @IsOptional()
  @IsNumber()
  annualLimit?: number;

  @ApiPropertyOptional({ description: 'Per transaction limit in cents' })
  @IsOptional()
  @IsNumber()
  perTransactionLimit?: number;

  @ApiProperty({ description: 'Warning threshold (0-1)' })
  @IsNumber()
  warningThreshold!: number;
}

export class ThresholdStatusDto {
  @ApiProperty({ description: 'Category code' })
  @IsString()
  categoryCode!: string;

  @ApiProperty({ type: ThresholdConfigDto, description: 'Threshold config' })
  @ValidateNested()
  @Type(() => ThresholdConfigDto)
  config!: ThresholdConfigDto;

  @ApiProperty({ description: 'Daily usage in cents' })
  @IsNumber()
  dailyUsage!: number;

  @ApiProperty({ description: 'Monthly usage in cents' })
  @IsNumber()
  monthlyUsage!: number;

  @ApiProperty({ description: 'Annual usage in cents' })
  @IsNumber()
  annualUsage!: number;

  @ApiProperty({ description: 'Daily percentage (0-1)' })
  @IsNumber()
  dailyPercentage!: number;

  @ApiProperty({ description: 'Monthly percentage (0-1)' })
  @IsNumber()
  monthlyPercentage!: number;

  @ApiProperty({ description: 'Annual percentage (0-1)' })
  @IsNumber()
  annualPercentage!: number;

  @ApiProperty({ description: 'Has warning' })
  @IsBoolean()
  hasWarning!: boolean;

  @ApiProperty({ description: 'Has exceeded limit' })
  @IsBoolean()
  hasExceeded!: boolean;

  @ApiPropertyOptional({
    enum: ['daily', 'monthly', 'annual', 'per_transaction'],
    description: 'Limit type exceeded',
  })
  @IsOptional()
  @IsEnum(['daily', 'monthly', 'annual', 'per_transaction'])
  limitType?: 'daily' | 'monthly' | 'annual' | 'per_transaction';
}

export class NormalRangeDto {
  @ApiProperty({ description: 'Minimum normal value' })
  @IsNumber()
  min!: number;

  @ApiProperty({ description: 'Maximum normal value' })
  @IsNumber()
  max!: number;

  @ApiProperty({ description: 'Mean value' })
  @IsNumber()
  mean!: number;

  @ApiProperty({ description: 'Standard deviation' })
  @IsNumber()
  stdDev!: number;
}

export class AnomalyScoreDto {
  @ApiProperty({ description: 'Anomaly score (0-1)' })
  @IsNumber()
  score!: number;

  @ApiProperty({ description: 'Is anomaly flag' })
  @IsBoolean()
  isAnomaly!: boolean;

  @ApiProperty({ description: 'Reason for anomaly' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Comparison value' })
  @IsOptional()
  @IsNumber()
  comparisonValue?: number;

  @ApiPropertyOptional({ type: NormalRangeDto, description: 'Normal range' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NormalRangeDto)
  normalRange?: NormalRangeDto;
}

export class VelocityCheckDto {
  @ApiProperty({ description: 'Current rate (transactions per day)' })
  @IsNumber()
  currentRate!: number;

  @ApiProperty({ description: 'Historical rate (transactions per day)' })
  @IsNumber()
  historicalRate!: number;

  @ApiProperty({ description: 'Acceleration rate' })
  @IsNumber()
  accelerationRate!: number;

  @ApiProperty({ description: 'Is spike flag' })
  @IsBoolean()
  isSpike!: boolean;

  @ApiProperty({ description: 'Threshold for spike detection' })
  @IsNumber()
  threshold!: number;
}

export class FraudCheckResultDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsUUID()
  transactionId!: string;

  @ApiProperty({ description: 'Has fraud signals' })
  @IsBoolean()
  hasFraudSignals!: boolean;

  @ApiPropertyOptional({
    type: DuplicateCheckDto,
    description: 'Duplicate check result',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DuplicateCheckDto)
  duplicateCheck?: DuplicateCheckDto;

  @ApiPropertyOptional({
    type: ThresholdStatusDto,
    description: 'Threshold status',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThresholdStatusDto)
  thresholdStatus?: ThresholdStatusDto;

  @ApiPropertyOptional({
    type: AnomalyScoreDto,
    description: 'Anomaly score',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnomalyScoreDto)
  anomalyScore?: AnomalyScoreDto;

  @ApiPropertyOptional({
    type: VelocityCheckDto,
    description: 'Velocity check',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VelocityCheckDto)
  velocityCheck?: VelocityCheckDto;

  @ApiProperty({ type: [FraudAlertDto], description: 'Fraud alerts' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FraudAlertDto)
  alerts!: FraudAlertDto[];

  @ApiProperty({
    enum: RecommendedActionDto,
    description: 'Recommended action',
  })
  recommendedAction!: RecommendedActionDto;

  @ApiProperty({ description: 'Blocked by system' })
  @IsBoolean()
  blockedBySystem!: boolean;

  @ApiProperty({ description: 'Checked at timestamp' })
  @IsDate()
  @Type(() => Date)
  checkedAt!: Date;

  @ApiProperty({
    type: [String],
    description: 'List of checks performed',
  })
  @IsArray()
  @IsString({ each: true })
  checksPerformed!: string[];
}

export class CheckTransactionDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsUUID()
  transactionId!: string;

  @ApiPropertyOptional({ description: 'Country code (defaults to DE)' })
  @IsOptional()
  @IsString()
  countryCode?: string;
}

export class CheckBatchDto {
  @ApiProperty({ type: [String], description: 'Transaction IDs' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  transactionIds!: string[];

  @ApiPropertyOptional({ description: 'Country code (defaults to DE)' })
  @IsOptional()
  @IsString()
  countryCode?: string;
}
