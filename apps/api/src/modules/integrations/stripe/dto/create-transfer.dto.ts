import {
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  Min,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a transfer
 */
export class CreateTransferDto {
  @ApiProperty({
    description: 'Amount in smallest currency unit (e.g., cents for USD)',
    example: 5000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Three-letter ISO currency code',
    example: 'USD',
  })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({
    description: 'Destination Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString()
  destinationAccountId: string;

  @ApiPropertyOptional({
    description: 'Transfer description',
    example: 'Transfer for services rendered',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Source transaction ID',
    example: 'ch_1234567890',
  })
  @IsOptional()
  @IsString()
  sourceTransaction?: string;
}
