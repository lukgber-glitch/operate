import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionTier, PlatformFeature } from '../types/subscription.types';

/**
 * Start Trial DTO
 */
export class StartTrialDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiPropertyOptional({ description: 'Trial tier (default: PRO)', enum: SubscriptionTier })
  @IsOptional()
  tier?: SubscriptionTier;
}

/**
 * Upgrade Subscription DTO
 */
export class UpgradeSubscriptionDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({ description: 'Target subscription tier', enum: SubscriptionTier })
  targetTier: SubscriptionTier;

  @ApiPropertyOptional({ description: 'Stripe payment method ID' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

/**
 * Downgrade Subscription DTO
 */
export class DowngradeSubscriptionDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({ description: 'Target subscription tier', enum: SubscriptionTier })
  targetTier: SubscriptionTier;

  @ApiPropertyOptional({ description: 'Apply at period end', default: true })
  @IsOptional()
  @IsBoolean()
  atPeriodEnd?: boolean;
}

/**
 * Cancel Subscription DTO
 */
export class CancelSubscriptionDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiPropertyOptional({ description: 'Cancel at period end', default: true })
  @IsOptional()
  @IsBoolean()
  atPeriodEnd?: boolean;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Check Feature DTO
 */
export class CheckFeatureDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({ description: 'Feature to check', enum: PlatformFeature })
  feature: PlatformFeature;
}

/**
 * Subscription Response DTO
 */
export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Organization ID' })
  orgId: string;

  @ApiProperty({ description: 'Subscription tier', enum: SubscriptionTier })
  tier: SubscriptionTier;

  @ApiProperty({ description: 'Subscription status' })
  status: string;

  @ApiProperty({ description: 'Current period start' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current period end' })
  currentPeriodEnd: Date;

  @ApiPropertyOptional({ description: 'Trial end date' })
  trialEnd?: Date;

  @ApiProperty({ description: 'Will cancel at period end' })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ description: 'Number of seats' })
  seats: number;

  @ApiProperty({ description: 'Available features' })
  features: PlatformFeature[];

  @ApiProperty({ description: 'Usage metrics' })
  usage: {
    invoicesCreated: number;
    invoicesLimit: number;
    activeUsers: number;
    usersLimit: number;
    percentUsed: {
      invoices: number;
      users: number;
    };
  };
}

/**
 * Usage Stats Response DTO
 */
export class UsageStatsDto {
  @ApiProperty({ description: 'Organization ID' })
  orgId: string;

  @ApiProperty({ description: 'Period start' })
  periodStart: Date;

  @ApiProperty({ description: 'Period end' })
  periodEnd: Date;

  @ApiProperty({ description: 'Invoices created this period' })
  invoicesCreated: number;

  @ApiProperty({ description: 'Invoice limit for tier' })
  invoicesLimit: number;

  @ApiProperty({ description: 'Active users' })
  activeUsers: number;

  @ApiProperty({ description: 'User limit for tier' })
  usersLimit: number;

  @ApiProperty({ description: 'Warnings (if approaching limit)' })
  warnings: string[];
}

/**
 * Portal Session Response DTO
 */
export class PortalSessionResponseDto {
  @ApiProperty({ description: 'Customer portal URL' })
  url: string;
}
