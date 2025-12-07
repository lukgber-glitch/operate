import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Subscription Pricing Tier
 */
export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Subscription Status
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  TRIALING = 'TRIALING',
  PAUSED = 'PAUSED',
}

/**
 * Billing Interval
 */
export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * Proration Behavior
 */
export enum ProrationBehavior {
  CREATE_PRORATIONS = 'create_prorations',
  NONE = 'none',
  ALWAYS_INVOICE = 'always_invoice',
}

/**
 * Subscription Item DTO
 */
export class SubscriptionItemDto {
  @ApiPropertyOptional({ description: 'Subscription item ID for updates' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Price ID from Stripe' })
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @ApiPropertyOptional({ description: 'Quantity of the subscription item', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

/**
 * Create Subscription DTO
 */
export class CreateSubscriptionDto {
  @ApiProperty({ description: 'User ID who owns the subscription' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Stripe Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Subscription items (prices)', type: [SubscriptionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionItemDto)
  items: SubscriptionItemDto[];

  @ApiPropertyOptional({ description: 'Default payment method ID' })
  @IsOptional()
  @IsString()
  defaultPaymentMethod?: string;

  @ApiPropertyOptional({ description: 'Trial period in days', default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialPeriodDays?: number;

  @ApiPropertyOptional({ description: 'Proration behavior', enum: ProrationBehavior, default: ProrationBehavior.CREATE_PRORATIONS })
  @IsOptional()
  prorationBehavior?: ProrationBehavior;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Coupon ID to apply' })
  @IsOptional()
  @IsString()
  couponId?: string;

  @ApiPropertyOptional({ description: 'Promotional code to apply' })
  @IsOptional()
  @IsString()
  promotionCode?: string;
}

/**
 * Update Subscription DTO
 */
export class UpdateSubscriptionDto {
  @ApiProperty({ description: 'User ID who owns the subscription' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Stripe Subscription ID' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiPropertyOptional({ description: 'Updated subscription items', type: [SubscriptionItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionItemDto)
  items?: SubscriptionItemDto[];

  @ApiPropertyOptional({ description: 'Proration behavior', enum: ProrationBehavior, default: ProrationBehavior.CREATE_PRORATIONS })
  @IsOptional()
  prorationBehavior?: ProrationBehavior;

  @ApiPropertyOptional({ description: 'Cancel at period end' })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({ description: 'Default payment method ID' })
  @IsOptional()
  @IsString()
  defaultPaymentMethod?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, string>;
}

/**
 * Cancel Subscription DTO
 */
export class CancelSubscriptionDto {
  @ApiProperty({ description: 'User ID who owns the subscription' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Stripe Subscription ID' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiPropertyOptional({ description: 'Cancel at period end instead of immediately', default: false })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

/**
 * Pause Subscription DTO
 */
export class PauseSubscriptionDto {
  @ApiProperty({ description: 'User ID who owns the subscription' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Stripe Subscription ID' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiPropertyOptional({ description: 'Resume date (ISO 8601 format)' })
  @IsOptional()
  @IsString()
  resumeAt?: string;
}

/**
 * Resume Subscription DTO
 */
export class ResumeSubscriptionDto {
  @ApiProperty({ description: 'User ID who owns the subscription' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Stripe Subscription ID' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;
}

/**
 * Subscription Item Response
 */
export class SubscriptionItemResponse {
  @ApiProperty({ description: 'Subscription item ID' })
  id: string;

  @ApiProperty({ description: 'Price ID' })
  priceId: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Price details' })
  price: {
    id: string;
    unitAmount: number;
    currency: string;
    interval: BillingInterval;
    intervalCount: number;
  };
}

/**
 * Subscription Response DTO
 */
export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({ description: 'Stripe Customer ID' })
  customerId: string;

  @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Subscription items', type: [SubscriptionItemResponse] })
  items: SubscriptionItemResponse[];

  @ApiProperty({ description: 'Current period start (Unix timestamp)' })
  currentPeriodStart: number;

  @ApiProperty({ description: 'Current period end (Unix timestamp)' })
  currentPeriodEnd: number;

  @ApiPropertyOptional({ description: 'Trial start (Unix timestamp)' })
  trialStart?: number;

  @ApiPropertyOptional({ description: 'Trial end (Unix timestamp)' })
  trialEnd?: number;

  @ApiProperty({ description: 'Cancel at period end' })
  cancelAtPeriodEnd: boolean;

  @ApiPropertyOptional({ description: 'Canceled at (Unix timestamp)' })
  canceledAt?: number;

  @ApiPropertyOptional({ description: 'Ended at (Unix timestamp)' })
  endedAt?: number;

  @ApiPropertyOptional({ description: 'Latest invoice ID' })
  latestInvoiceId?: string;

  @ApiPropertyOptional({ description: 'Default payment method ID' })
  defaultPaymentMethod?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, string>;

  @ApiProperty({ description: 'Created timestamp (Unix timestamp)' })
  created: number;
}

/**
 * Create Product DTO
 */
export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Subscription tier', enum: SubscriptionTier })
  @IsOptional()
  tier?: SubscriptionTier;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Product features list' })
  @IsOptional()
  @IsArray()
  features?: string[];
}

/**
 * Create Price DTO
 */
export class CreatePriceDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Unit amount in smallest currency unit (cents)' })
  @IsNumber()
  @Min(0)
  unitAmount: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', default: 'usd' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Billing interval', enum: BillingInterval })
  interval: BillingInterval;

  @ApiPropertyOptional({ description: 'Interval count (e.g., 3 for quarterly)', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalCount?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Nickname for the price' })
  @IsOptional()
  @IsString()
  nickname?: string;
}

/**
 * Create Customer Portal Session DTO
 */
export class CreatePortalSessionDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Stripe Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Return URL after portal session' })
  @IsString()
  @IsNotEmpty()
  returnUrl: string;
}

/**
 * Billing History Response DTO
 */
export class BillingHistoryDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Amount paid' })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Invoice status' })
  status: string;

  @ApiProperty({ description: 'Invoice URL' })
  invoiceUrl: string;

  @ApiProperty({ description: 'Invoice PDF URL' })
  invoicePdf: string;

  @ApiProperty({ description: 'Created timestamp (Unix timestamp)' })
  created: number;

  @ApiPropertyOptional({ description: 'Period start (Unix timestamp)' })
  periodStart?: number;

  @ApiPropertyOptional({ description: 'Period end (Unix timestamp)' })
  periodEnd?: number;
}
