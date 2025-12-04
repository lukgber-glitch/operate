import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CountryCode, Products } from 'plaid';

/**
 * Create Plaid Link Token DTO
 */
export class CreateLinkTokenDto {
  @ApiProperty({
    description: 'User ID for the link token',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Client name to display in Plaid Link',
    example: 'Operate',
  })
  @IsString()
  clientName: string;

  @ApiPropertyOptional({
    description: 'Language for Plaid Link UI',
    example: 'en',
    default: 'en',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    description: 'Country codes for bank selection',
    type: [String],
    example: ['US'],
    default: ['US'],
  })
  @IsArray()
  @IsEnum(CountryCode, { each: true })
  @IsOptional()
  countryCodes?: CountryCode[];

  @ApiPropertyOptional({
    description: 'Plaid products to access',
    type: [String],
    example: ['auth', 'transactions'],
    default: ['auth', 'transactions', 'balance'],
  })
  @IsArray()
  @IsEnum(Products, { each: true })
  @IsOptional()
  products?: Products[];

  @ApiPropertyOptional({
    description: 'Webhook URL for Plaid notifications',
    example: 'https://api.operate.com/plaid/webhook',
  })
  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @ApiPropertyOptional({
    description: 'Redirect URI after OAuth flow',
    example: 'https://app.operate.com/integrations/plaid/callback',
  })
  @IsString()
  @IsOptional()
  redirectUri?: string;
}
