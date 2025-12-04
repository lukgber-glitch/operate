import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

/**
 * Text case for address validation
 */
export enum TextCase {
  MIXED = 'Mixed',
  UPPER = 'Upper',
}

/**
 * Validate Address Request DTO
 */
export class ValidateAddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  line1: string;

  @ApiPropertyOptional({ example: 'Suite 100' })
  @IsString()
  @IsOptional()
  line2?: string;

  @ApiPropertyOptional({ example: 'Apt 5B' })
  @IsString()
  @IsOptional()
  line3?: string;

  @ApiProperty({ example: 'Seattle' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'WA' })
  @IsString()
  region: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  country: string;

  @ApiProperty({ example: '98101' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({ example: TextCase.UPPER, enum: TextCase })
  @IsEnum(TextCase)
  @IsOptional()
  textCase?: TextCase;
}

/**
 * Address validation result
 */
export class ValidateAddressResponseDto {
  @ApiProperty()
  validatedAddresses: Array<{
    line1: string;
    line2?: string;
    line3?: string;
    city: string;
    region: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    addressType?: string;
  }>;

  @ApiProperty()
  coordinates: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty()
  resolutionQuality: string;

  @ApiPropertyOptional()
  taxAuthorities?: Array<{
    avalaraId: string;
    jurisdictionName: string;
    jurisdictionType: string;
    signatureCode: string;
  }>;

  @ApiPropertyOptional()
  messages?: Array<{
    severity: string;
    summary: string;
    details?: string;
  }>;
}
