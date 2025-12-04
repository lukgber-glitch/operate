import {
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsArray,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUPPORTED_CURRENCIES } from '../stripe.types';

/**
 * DTO for creating a payment intent
 */
export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Amount in smallest currency unit (e.g., cents for USD)',
    example: 10000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Three-letter ISO currency code',
    example: 'USD',
    enum: SUPPORTED_CURRENCIES,
  })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional({
    description: 'Connected Stripe account ID for split payments',
    example: 'acct_1234567890',
  })
  @IsOptional()
  @IsString()
  connectedAccountId?: string;

  @ApiPropertyOptional({
    description: 'Platform fee amount in smallest currency unit',
    example: 250,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  platformFeeAmount?: number;

  @ApiPropertyOptional({
    description: 'Platform fee percentage (0-100)',
    example: 2.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeePercent?: number;

  @ApiPropertyOptional({
    description: 'Payment description',
    example: 'Payment for services',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Capture method',
    enum: ['automatic', 'manual'],
    default: 'automatic',
  })
  @IsOptional()
  @IsEnum(['automatic', 'manual'])
  captureMethod?: 'automatic' | 'manual';

  @ApiPropertyOptional({
    description: 'Confirmation method',
    enum: ['automatic', 'manual'],
    default: 'automatic',
  })
  @IsOptional()
  @IsEnum(['automatic', 'manual'])
  confirmationMethod?: 'automatic' | 'manual';

  @ApiPropertyOptional({
    description: 'Payment method types',
    example: ['card'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethodTypes?: string[];
}

/**
 * DTO for confirming a payment intent
 */
export class ConfirmPaymentIntentDto {
  @ApiPropertyOptional({
    description: 'Payment method ID',
    example: 'pm_1234567890',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
