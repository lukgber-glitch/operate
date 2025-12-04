import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsObject,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StripeAccountType } from '../stripe.types';

/**
 * DTO for creating a Stripe Connect account
 */
export class CreateConnectAccountDto {
  @ApiProperty({
    description: 'Type of Connect account',
    enum: StripeAccountType,
    example: StripeAccountType.EXPRESS,
  })
  @IsEnum(StripeAccountType)
  type: StripeAccountType;

  @ApiProperty({
    description: 'Email address of the account holder',
    example: 'merchant@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Two-letter country code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'Country must be a valid 2-letter ISO country code',
  })
  country: string;

  @ApiPropertyOptional({
    description: 'Business profile information',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  businessProfile?: {
    name?: string;
    productDescription?: string;
    supportEmail?: string;
    url?: string;
  };

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

/**
 * DTO for creating onboarding link
 */
export class CreateOnboardingLinkDto {
  @ApiProperty({
    description: 'URL to redirect when user needs to refresh onboarding',
    example: 'https://yourapp.com/connect/refresh',
  })
  @IsString()
  refreshUrl: string;

  @ApiProperty({
    description: 'URL to redirect when onboarding is complete',
    example: 'https://yourapp.com/connect/return',
  })
  @IsString()
  returnUrl: string;
}

/**
 * DTO for configuring payouts
 */
export class ConfigurePayoutsDto {
  @ApiProperty({
    description: 'Payout schedule configuration',
    type: 'object',
  })
  @IsObject()
  schedule: {
    interval: 'manual' | 'daily' | 'weekly' | 'monthly';
    weeklyAnchor?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
    monthlyAnchor?: number;
    delayDays?: number;
  };
}
