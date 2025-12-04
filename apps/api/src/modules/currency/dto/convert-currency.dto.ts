import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Length,
  Matches,
} from 'class-validator';

export class ConvertCurrencyDto {
  @ApiProperty({
    example: 100.5,
    description: 'Amount to convert',
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Amount must be non-negative' })
  amount: number;

  @ApiProperty({
    example: 'USD',
    description: 'Source currency code (ISO 4217)',
  })
  @IsString()
  @Length(3, 3, { message: 'Currency code must be exactly 3 characters' })
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency code must be 3 uppercase letters',
  })
  from: string;

  @ApiProperty({
    example: 'EUR',
    description: 'Target currency code (ISO 4217)',
  })
  @IsString()
  @Length(3, 3, { message: 'Currency code must be exactly 3 characters' })
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency code must be 3 uppercase letters',
  })
  to: string;

  @ApiProperty({
    example: 0.92,
    description: 'Optional fixed exchange rate (if not provided, uses latest rate)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Exchange rate must be positive' })
  rate?: number;
}

export class ConvertCurrencyResponseDto {
  @ApiProperty({ example: 100.5, description: 'Original amount' })
  amount: number;

  @ApiProperty({ example: 'USD', description: 'Source currency' })
  from: string;

  @ApiProperty({ example: 'EUR', description: 'Target currency' })
  to: string;

  @ApiProperty({ example: 92.46, description: 'Converted amount' })
  convertedAmount: number;

  @ApiProperty({ example: 0.92, description: 'Exchange rate used' })
  rate: number;

  @ApiProperty({
    example: '2024-12-02T10:30:00Z',
    description: 'Timestamp of conversion',
  })
  timestamp: string;
}
