/**
 * FinanzOnline Session DTOs
 * Data Transfer Objects for session management endpoints
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FinanzOnlineEnvironment,
  FinanzOnlineAuthType,
} from '../finanzonline.constants';

/**
 * Login Request DTO
 */
export class LoginDto {
  @ApiProperty({
    description: 'Teilnehmer-ID (Participant ID)',
    example: 'T123456789',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  teilnehmerId: string;

  @ApiProperty({
    description: 'Benutzer-ID (User ID)',
    example: 'U987654321',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  benId: string;

  @ApiPropertyOptional({
    description: 'PIN for authentication (required for USER_PIN auth type)',
    example: '1234',
  })
  @IsString()
  @IsOptional()
  @MinLength(4)
  @MaxLength(20)
  pin?: string;

  @ApiProperty({
    description: 'Authentication type',
    enum: FinanzOnlineAuthType,
    example: 'USER_PIN',
  })
  @IsNotEmpty()
  authType: FinanzOnlineAuthType;

  @ApiPropertyOptional({
    description: 'Hersteller-ID (Manufacturer/Software ID)',
    example: 'OPERATE',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  herstellerId?: string;

  @ApiProperty({
    description: 'Organization ID (tenant identifier)',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({
    description: 'FinanzOnline environment',
    enum: FinanzOnlineEnvironment,
    default: 'TEST',
  })
  @IsOptional()
  environment?: FinanzOnlineEnvironment;

  @ApiPropertyOptional({
    description: 'Enable automatic session refresh before expiry',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoRefresh?: boolean;
}

/**
 * Session Info Response DTO
 */
export class SessionInfoDto {
  @ApiProperty({
    description: 'Session ID',
    example: 'sess_abc123def456',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Teilnehmer-ID (Participant ID)',
    example: 'T123456789',
  })
  teilnehmerId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_1234567890',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Session creation timestamp',
    example: '2025-12-02T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Session expiration timestamp',
    example: '2025-12-02T14:00:00Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Is session currently valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Remaining time in seconds',
    example: 7200,
  })
  remainingTime: number;

  @ApiProperty({
    description: 'FinanzOnline environment',
    enum: FinanzOnlineEnvironment,
    example: 'TEST',
  })
  environment: FinanzOnlineEnvironment;

  @ApiPropertyOptional({
    description: 'Participant information (if available)',
  })
  participantInfo?: any;
}

/**
 * Keep Alive Request DTO
 */
export class KeepAliveDto {
  @ApiProperty({
    description: 'Session ID to keep alive',
    example: 'sess_abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

/**
 * Logout Request DTO
 */
export class LogoutDto {
  @ApiProperty({
    description: 'Session ID to logout',
    example: 'sess_abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

/**
 * Validate Session Request DTO
 */
export class ValidateSessionDto {
  @ApiProperty({
    description: 'Session ID to validate',
    example: 'sess_abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Organization ID to validate against',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}

/**
 * Generic success response DTO
 */
export class SuccessResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Optional message',
    example: 'Operation completed successfully',
  })
  message?: string;
}
