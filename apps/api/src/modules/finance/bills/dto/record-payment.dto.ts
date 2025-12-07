import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsDateString,
  IsString,
  IsOptional,
  Min,
  MaxLength,
  IsObject,
} from 'class-validator';

/**
 * DTO for recording a bill payment
 */
export class RecordPaymentDto {
  @ApiProperty({
    description: 'Payment amount',
    example: 150.00,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Payment date (ISO 8601)',
    example: '2024-02-01',
  })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'bank_transfer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Link to bank transaction ID',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'External bank transaction ID',
  })
  @IsOptional()
  @IsString()
  bankTransactionId?: string;

  @ApiPropertyOptional({
    description: 'Payment reference',
    example: 'Payment for INV-2024-001',
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({
    description: 'Payment notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { reconciled: true },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
