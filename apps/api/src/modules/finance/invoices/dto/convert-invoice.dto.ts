import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Length } from 'class-validator';

/**
 * DTO for converting invoice to a different currency
 */
export class ConvertInvoiceDto {
  @ApiProperty({
    description: 'Target currency code (ISO 4217)',
    example: 'USD',
  })
  @IsString()
  @Length(3, 3)
  targetCurrency: string;

  @ApiPropertyOptional({
    description: 'Exchange rate to use (optional, uses 1:1 if not provided)',
    example: 1.07,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;
}

/**
 * DTO for getting invoice totals in a specific currency
 */
export class GetTotalsInCurrencyDto {
  @ApiProperty({
    description: 'Target currency code (ISO 4217)',
    example: 'EUR',
  })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice status',
    example: 'SENT',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice type',
    example: 'STANDARD',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  customerId?: string;
}
