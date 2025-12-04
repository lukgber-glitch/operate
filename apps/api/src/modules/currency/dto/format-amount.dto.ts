import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Length,
  Matches,
} from 'class-validator';

export class FormatAmountDto {
  @ApiProperty({
    example: 1234.56,
    description: 'Amount to format',
    minimum: 0,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'USD',
    description: 'Currency code (ISO 4217)',
  })
  @IsString()
  @Length(3, 3, { message: 'Currency code must be exactly 3 characters' })
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency code must be 3 uppercase letters',
  })
  currency: string;

  @ApiProperty({
    example: 'en-US',
    description:
      'Optional locale for formatting (defaults to currency default locale)',
    required: false,
  })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({
    example: false,
    description: 'Include currency symbol in output',
    required: false,
    default: true,
  })
  @IsOptional()
  showSymbol?: boolean;

  @ApiProperty({
    example: false,
    description: 'Include currency code in output',
    required: false,
    default: false,
  })
  @IsOptional()
  showCode?: boolean;
}

export class FormatAmountResponseDto {
  @ApiProperty({ example: '$1,234.56', description: 'Formatted amount' })
  formatted: string;

  @ApiProperty({ example: 'USD', description: 'Currency code' })
  currency: string;

  @ApiProperty({ example: 'en-US', description: 'Locale used for formatting' })
  locale: string;
}

export class ParseAmountDto {
  @ApiProperty({
    example: '$1,234.56',
    description: 'Formatted amount string to parse',
  })
  @IsString()
  input: string;

  @ApiProperty({
    example: 'USD',
    description: 'Currency code (ISO 4217)',
  })
  @IsString()
  @Length(3, 3, { message: 'Currency code must be exactly 3 characters' })
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency code must be 3 uppercase letters',
  })
  currency: string;

  @ApiProperty({
    example: 'en-US',
    description: 'Optional locale for parsing',
    required: false,
  })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class ParseAmountResponseDto {
  @ApiProperty({ example: 1234.56, description: 'Parsed numeric amount' })
  amount: number;

  @ApiProperty({ example: 'USD', description: 'Currency code' })
  currency: string;

  @ApiProperty({ example: '$1,234.56', description: 'Original input' })
  input: string;
}
