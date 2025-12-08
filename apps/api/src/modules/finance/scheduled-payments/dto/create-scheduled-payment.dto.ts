import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
  IsObject,
  IsIn,
} from 'class-validator';
import { ScheduledPaymentStatus } from '@prisma/client';

// Define values for validation
const PaymentMethodValues = [
  'bank_transfer',
  'card',
  'direct_debit',
  'check',
] as const;

/**
 * DTO for creating a scheduled payment
 */
export class CreateScheduledPaymentDto {
  @ApiPropertyOptional({
    description: 'Bill ID to schedule payment for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  billId?: string;

  @ApiPropertyOptional({
    description: 'Invoice ID to schedule payment for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 1250.5,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    description: 'Scheduled payment date (ISO 8601)',
    example: '2024-02-15',
  })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PaymentMethodValues,
    example: 'bank_transfer',
  })
  @IsOptional()
  @IsIn(PaymentMethodValues)
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Bank account ID to use for payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiPropertyOptional({
    description: 'Payment reference',
    example: 'BILL-2024-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Notes about the scheduled payment',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { approvedBy: 'user-id', department: 'operations' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
