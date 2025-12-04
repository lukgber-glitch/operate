import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsEnum, IsOptional } from 'class-validator';

export class CurrencyDto {
  @ApiProperty({ example: 'USD', description: 'ISO 4217 currency code' })
  @IsString()
  code: string;

  @ApiProperty({ example: '$', description: 'Currency symbol' })
  @IsString()
  symbol: string;

  @ApiProperty({ example: 'US Dollar', description: 'Full currency name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2, description: 'Number of decimal places' })
  @IsNumber()
  decimals: number;

  @ApiProperty({ example: ['US', 'PR', 'GU'], description: 'ISO country codes' })
  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @ApiProperty({ example: '🇺🇸', description: 'Emoji flag of primary country' })
  @IsString()
  flag: string;

  @ApiProperty({ enum: ['before', 'after'], example: 'before' })
  @IsEnum(['before', 'after'])
  format: 'before' | 'after';

  @ApiProperty({ example: 'en-US', required: false })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({ enum: ['standard', 'cash'], example: 'standard', required: false })
  @IsOptional()
  @IsEnum(['standard', 'cash'])
  rounding?: 'standard' | 'cash';
}
