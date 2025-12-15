/**
 * DTO for marking a bill as paid
 */

import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkBillPaidDto {
  @ApiPropertyOptional({
    description: 'Date when the bill was paid (defaults to today)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @ApiPropertyOptional({
    description: 'Amount paid (defaults to full amount)',
    example: 150.5,
  })
  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @ApiPropertyOptional({
    description: 'Transaction ID if linking to a bank transaction',
    example: 'txn_abc123',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the payment',
    example: 'Paid via bank transfer',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
