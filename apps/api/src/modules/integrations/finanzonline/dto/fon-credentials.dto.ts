import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FonEnvironment } from '../interfaces/fon-config.interface';

/**
 * FinanzOnline credentials DTO
 * Used for authentication with the FinanzOnline WebService
 */
export class FonCredentialsDto {
  @ApiProperty({
    description: 'Austrian tax ID (Steuernummer) - Format: XX-YYY/ZZZZ',
    example: '12-345/6789',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}-\d{3}\/\d{4}$/, {
    message: 'Tax ID must be in format: XX-YYY/ZZZZ',
  })
  taxId!: string;

  @ApiProperty({
    description: 'Certificate content (PEM or P12 base64 encoded)',
    example: 'MIIFXzCCBEegAwIBAgIQDv...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(100)
  certificate!: string;

  @ApiPropertyOptional({
    description: 'Certificate password (required for P12 certificates)',
    example: 'mySecurePassword123',
  })
  @IsString()
  @IsOptional()
  certificatePassword?: string;

  @ApiProperty({
    description: 'Certificate type',
    enum: ['PEM', 'P12'],
    example: 'PEM',
  })
  @IsEnum(['PEM', 'P12'])
  @IsNotEmpty()
  certificateType!: 'PEM' | 'P12';

  @ApiPropertyOptional({
    description: 'Environment to use (defaults to production)',
    enum: FonEnvironment,
    example: 'SANDBOX',
  })
  @IsOptional()
  environment?: FonEnvironment;
}

/**
 * Stored credentials DTO (with encryption)
 * Used internally for storing encrypted credentials
 */
export class StoredFonCredentialsDto {
  @ApiProperty({
    description: 'Encrypted certificate',
  })
  @IsString()
  @IsNotEmpty()
  encryptedCertificate!: string;

  @ApiPropertyOptional({
    description: 'Encrypted certificate password',
  })
  @IsString()
  @IsOptional()
  encryptedPassword?: string;

  @ApiProperty({
    description: 'Certificate type',
    enum: ['PEM', 'P12'],
  })
  @IsEnum(['PEM', 'P12'])
  certificateType!: 'PEM' | 'P12';

  @ApiProperty({
    description: 'Encryption initialization vector',
  })
  @IsString()
  @IsNotEmpty()
  iv!: string;

  @ApiProperty({
    description: 'Encryption authentication tag',
  })
  @IsString()
  @IsNotEmpty()
  authTag!: string;
}

/**
 * Session info DTO
 * Returned after successful authentication
 */
export class FonSessionDto {
  @ApiProperty({
    description: 'Session ID',
    example: 'sess_1234567890abcdef',
  })
  sessionId!: string;

  @ApiProperty({
    description: 'Session token (do not expose to frontend)',
    example: 'tok_abcdef1234567890',
  })
  token!: string;

  @ApiProperty({
    description: 'Session creation timestamp',
    example: '2025-11-29T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Session expiration timestamp',
    example: '2025-11-29T12:00:00Z',
  })
  expiresAt!: Date;

  @ApiProperty({
    description: 'Tax ID associated with session',
    example: '12-345/6789',
  })
  taxId!: string;

  @ApiProperty({
    description: 'Environment used',
    enum: FonEnvironment,
    example: 'PRODUCTION',
  })
  environment!: FonEnvironment;
}

/**
 * Validate tax ID DTO
 */
export class ValidateTaxIdDto {
  @ApiProperty({
    description: 'Austrian tax ID to validate',
    example: '12-345/6789',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}-\d{3}\/\d{4}$/, {
    message: 'Tax ID must be in format: XX-YYY/ZZZZ',
  })
  taxId!: string;
}

/**
 * Tax ID validation result DTO
 */
export class TaxIdValidationResultDto {
  @ApiProperty({
    description: 'Whether the tax ID format is valid',
    example: true,
  })
  valid!: boolean;

  @ApiProperty({
    description: 'Tax ID that was validated',
    example: '12-345/6789',
  })
  taxId!: string;

  @ApiPropertyOptional({
    description: 'Validation error message if invalid',
    example: 'Invalid tax ID format',
  })
  errorMessage?: string;
}
