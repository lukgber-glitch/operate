import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsIn,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduledPaymentStatus } from '@prisma/client';

const ScheduledPaymentStatusValues = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;

/**
 * DTO for filtering scheduled payments
 */
export class ScheduledPaymentFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ScheduledPaymentStatus,
  })
  @IsOptional()
  @IsIn(ScheduledPaymentStatusValues)
  status?: ScheduledPaymentStatus;

  @ApiPropertyOptional({
    description: 'Filter by bill ID',
  })
  @IsOptional()
  @IsString()
  billId?: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice ID',
  })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({
    description: 'Filter by bank account ID',
  })
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date from (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date to (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    example: 'bank_transfer',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Search in reference or notes',
    example: 'BILL-2024',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['scheduledDate', 'amount', 'createdAt', 'status'],
    default: 'scheduledDate',
  })
  @IsOptional()
  @IsString()
  @IsIn(['scheduledDate', 'amount', 'createdAt', 'status'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
