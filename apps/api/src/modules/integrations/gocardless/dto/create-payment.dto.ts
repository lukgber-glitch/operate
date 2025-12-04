import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsISO8601, IsObject } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Mandate ID',
    example: 'MD000123',
  })
  @IsString()
  mandateId: string;

  @ApiProperty({
    description: 'Payment amount (in major currency units, e.g., GBP)',
    example: 100.00,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Currency code (must match mandate scheme)',
    example: 'GBP',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Charge date (YYYY-MM-DD format)',
    example: '2025-12-10',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  chargeDate?: string;

  @ApiProperty({
    description: 'Payment reference',
    example: 'INV-2025-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    description: 'Payment description',
    example: 'Invoice payment for December 2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Custom metadata',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiProperty({
    description: 'App fee amount (for partner integrations)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  appFee?: number;
}
