import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DunningStatus } from '@prisma/client';

/**
 * Start Dunning DTO
 * Used when initiating dunning process for failed payment
 */
export class StartDunningDto {
  @ApiProperty({ description: 'Subscription ID' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiPropertyOptional({ description: 'When payment failed' })
  @IsOptional()
  @IsDateString()
  failedAt?: string;

  @ApiPropertyOptional({ description: 'Error message from payment failure' })
  @IsOptional()
  @IsString()
  lastError?: string;
}

/**
 * Manual Retry DTO
 * Used for admin-triggered payment retry
 */
export class ManualRetryDto {
  @ApiProperty({ description: 'Subscription ID to retry' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;
}

/**
 * Manual Resolve DTO
 * Used when admin manually resolves dunning
 */
export class ManualResolveDto {
  @ApiProperty({ description: 'Subscription ID to resolve' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty({ description: 'Admin user ID performing action' })
  @IsString()
  @IsNotEmpty()
  adminUserId: string;

  @ApiPropertyOptional({ description: 'Reason for manual resolution' })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Manual Suspend DTO
 * Used when admin manually suspends account
 */
export class ManualSuspendDto {
  @ApiProperty({ description: 'Subscription ID to suspend' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty({ description: 'Admin user ID performing action' })
  @IsString()
  @IsNotEmpty()
  adminUserId: string;

  @ApiPropertyOptional({ description: 'Reason for suspension' })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Dunning State Response DTO
 */
export class DunningStateResponseDto {
  @ApiProperty({ description: 'Dunning state ID' })
  id: string;

  @ApiProperty({ description: 'Subscription ID' })
  subscriptionId: string;

  @ApiProperty({ description: 'When payment initially failed' })
  failedAt: Date;

  @ApiProperty({ description: 'Number of retry attempts' })
  retryCount: number;

  @ApiProperty({ description: 'Next scheduled retry time' })
  nextRetryAt: Date | null;

  @ApiProperty({ description: 'Current dunning state', enum: DunningStatus })
  state: DunningStatus;

  @ApiProperty({ description: 'Last error message' })
  lastError: string | null;

  @ApiProperty({ description: 'When dunning was resolved' })
  resolvedAt: Date | null;

  @ApiProperty({ description: 'Days since payment failed' })
  daysSinceFailure: number;

  @ApiProperty({ description: 'Current action being taken' })
  currentAction: string;

  @ApiProperty({ description: 'Next scheduled action' })
  nextAction: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

/**
 * Dunning List Response DTO
 */
export class DunningListResponseDto {
  @ApiProperty({ description: 'Total count of dunning states' })
  total: number;

  @ApiProperty({ description: 'Count by state' })
  countByState: Record<DunningStatus, number>;

  @ApiProperty({ description: 'Dunning states', type: [DunningStateResponseDto] })
  items: DunningStateResponseDto[];
}

/**
 * Dunning Query DTO
 * For filtering dunning list
 */
export class DunningQueryDto {
  @ApiPropertyOptional({ description: 'Filter by state', enum: DunningStatus })
  @IsOptional()
  state?: DunningStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  limit?: number = 20;
}

/**
 * Dunning Statistics DTO
 */
export class DunningStatsDto {
  @ApiProperty({ description: 'Total active dunning processes' })
  totalActive: number;

  @ApiProperty({ description: 'Total resolved this month' })
  resolvedThisMonth: number;

  @ApiProperty({ description: 'Total suspended this month' })
  suspendedThisMonth: number;

  @ApiProperty({ description: 'Average days to resolution' })
  avgDaysToResolution: number;

  @ApiProperty({ description: 'Recovery rate (percentage)' })
  recoveryRate: number;

  @ApiProperty({ description: 'Count by state' })
  countByState: Record<DunningStatus, number>;

  @ApiProperty({ description: 'Estimated revenue at risk' })
  revenueAtRisk: number;
}

/**
 * Helper function to map dunning state to response DTO
 */
export function mapDunningStateToDto(state: any): DunningStateResponseDto {
  const now = new Date();
  const daysSinceFailure = Math.floor(
    (now.getTime() - new Date(state.failedAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  const actionMap: Record<DunningStatus, string> = {
    [DunningStatus.RETRYING]: 'Automatic payment retry in progress',
    [DunningStatus.WARNING_SENT]: 'Warning email sent, awaiting payment',
    [DunningStatus.ACTION_REQUIRED]: 'Action required email sent',
    [DunningStatus.FINAL_WARNING]: 'Final warning sent, suspension imminent',
    [DunningStatus.SUSPENDED]: 'Account suspended',
    [DunningStatus.RESOLVED]: 'Payment recovered',
  };

  const nextActionMap: Record<DunningStatus, string | null> = {
    [DunningStatus.RETRYING]: 'Send warning email in 3 days',
    [DunningStatus.WARNING_SENT]: 'Send action required email in 4 days',
    [DunningStatus.ACTION_REQUIRED]: 'Send final warning in 7 days',
    [DunningStatus.FINAL_WARNING]: 'Suspend account in 7 days',
    [DunningStatus.SUSPENDED]: null,
    [DunningStatus.RESOLVED]: null,
  };

  return {
    id: state.id,
    subscriptionId: state.subscriptionId,
    failedAt: state.failedAt,
    retryCount: state.retryCount,
    nextRetryAt: state.nextRetryAt,
    state: state.state,
    lastError: state.lastError,
    resolvedAt: state.resolvedAt,
    daysSinceFailure,
    currentAction: actionMap[state.state],
    nextAction: nextActionMap[state.state],
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
}
