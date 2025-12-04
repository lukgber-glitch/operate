import {
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a refund
 */
export class CreateRefundDto {
  @ApiProperty({
    description: 'Payment intent ID to refund',
    example: 'pi_1234567890',
  })
  @IsString()
  paymentIntentId: string;

  @ApiPropertyOptional({
    description: 'Amount to refund in smallest currency unit (full refund if not specified)',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Reason for refund',
    enum: ['duplicate', 'fraudulent', 'requested_by_customer'],
  })
  @IsOptional()
  @IsEnum(['duplicate', 'fraudulent', 'requested_by_customer'])
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Reverse the transfer to connected account',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  reverseTransfer?: boolean;

  @ApiPropertyOptional({
    description: 'Refund the application fee',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  refundApplicationFee?: boolean;
}
