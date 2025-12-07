import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  MinLength,
} from 'class-validator';
import { TaxCredentialType } from '@prisma/client';

/**
 * DTO for creating tax credential
 */
export class CreateTaxCredentialDto {
  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'DE',
  })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({
    description: 'Credential type',
    enum: TaxCredentialType,
    example: 'TAX_ID',
  })
  type: TaxCredentialType;

  @ApiProperty({
    description: 'Credential name',
    example: 'German Tax ID',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Credential value (will be encrypted)',
    example: '12/345/67890',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  value: string;

  @ApiPropertyOptional({
    description: 'Credential expiration date',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

/**
 * DTO for updating tax credential
 */
export class UpdateTaxCredentialDto {
  @ApiPropertyOptional({
    description: 'Credential name',
    example: 'German Tax ID',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Credential value (will be encrypted)',
    example: '12/345/67890',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  value?: string;

  @ApiPropertyOptional({
    description: 'Credential expiration date',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

/**
 * Tax Credential DTO for API responses
 * Note: Value is not exposed for security reasons
 */
export class TaxCredentialDto {
  @ApiProperty({
    description: 'Credential unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Organisation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orgId: string;

  @ApiProperty({
    description: 'Country code',
    example: 'DE',
  })
  countryCode: string;

  @ApiProperty({
    description: 'Credential type',
    enum: TaxCredentialType,
    example: 'TAX_ID',
  })
  type: TaxCredentialType;

  @ApiProperty({
    description: 'Credential name',
    example: 'German Tax ID',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Credential expiration date',
    example: '2025-12-31T00:00:00Z',
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'Whether credential is active',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Last verification timestamp',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  lastVerifiedAt: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}
