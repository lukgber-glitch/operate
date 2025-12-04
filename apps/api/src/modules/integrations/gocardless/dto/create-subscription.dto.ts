import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min, IsISO8601, IsObject, IsIn } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Mandate ID',
    example: 'MD000123',
  })
  @IsString()
  mandateId: string;

  @ApiProperty({
    description: 'Subscription amount (in major currency units)',
    example: 50.00,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'GBP',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Subscription name',
    example: 'Monthly Premium Subscription',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Interval unit',
    enum: ['weekly', 'monthly', 'yearly'],
    example: 'monthly',
  })
  @IsIn(['weekly', 'monthly', 'yearly'])
  intervalUnit: 'weekly' | 'monthly' | 'yearly';

  @ApiProperty({
    description: 'Interval multiplier',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  interval?: number;

  @ApiProperty({
    description: 'Day of month to charge (1-28)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dayOfMonth?: number;

  @ApiProperty({
    description: 'Month to start annual subscription',
    required: false,
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiProperty({
    description: 'Custom metadata',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
