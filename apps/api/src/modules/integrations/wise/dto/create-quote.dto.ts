import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WiseCurrency, WiseQuoteType } from '../wise.types';

/**
 * Create Quote DTO
 * Request to get an exchange rate quote for a transfer
 */
export class CreateQuoteDto {
  @ApiProperty({
    description: 'Source currency code (ISO 4217)',
    example: 'EUR',
  })
  @IsString()
  sourceCurrency: WiseCurrency;

  @ApiProperty({
    description: 'Target currency code (ISO 4217)',
    example: 'USD',
  })
  @IsString()
  targetCurrency: WiseCurrency;

  @ApiPropertyOptional({
    description: 'Source amount (you send)',
    example: 1000,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sourceAmount?: number;

  @ApiPropertyOptional({
    description: 'Target amount (recipient gets)',
    example: 1100,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  targetAmount?: number;

  @ApiPropertyOptional({
    description: 'Quote type',
    enum: WiseQuoteType,
    default: WiseQuoteType.REGULAR,
  })
  @IsOptional()
  @IsEnum(WiseQuoteType)
  type?: WiseQuoteType;
}
