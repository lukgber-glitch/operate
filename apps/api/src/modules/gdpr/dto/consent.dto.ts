import { IsString, IsBoolean, IsOptional, IsEnum, IsIP, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentPurpose, ConsentSource } from '../types/gdpr.types';

/**
 * DTO for recording user consent
 */
export class RecordConsentDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: ConsentPurpose, description: 'Purpose of consent' })
  purpose: ConsentPurpose;

  @ApiProperty({ description: 'Whether consent is granted' })
  @IsBoolean()
  granted: boolean;

  @ApiProperty({ enum: ConsentSource, description: 'Source of consent' })
  source: ConsentSource;

  @ApiPropertyOptional({ description: 'IP address of user when consent was given' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'Version of consent policy' })
  @IsString()
  version: string;
}

/**
 * DTO for updating consent
 */
export class UpdateConsentDto {
  @ApiProperty({ description: 'Whether consent is granted' })
  @IsBoolean()
  granted: boolean;

  @ApiPropertyOptional({ description: 'IP address of user' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Version of consent policy' })
  @IsOptional()
  @IsString()
  version?: string;
}

/**
 * DTO for revoking consent
 */
export class RevokeConsentDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: ConsentPurpose, description: 'Purpose to revoke' })
  purpose: ConsentPurpose;

  @ApiPropertyOptional({ description: 'IP address of user' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

/**
 * DTO for querying consent records
 */
export class QueryConsentDto {
  @ApiPropertyOptional({ description: 'User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: ConsentPurpose, description: 'Filter by purpose' })
  @IsOptional()
  purpose?: ConsentPurpose;

  @ApiPropertyOptional({ description: 'Filter by granted status' })
  @IsOptional()
  @IsBoolean()
  granted?: boolean;

  @ApiPropertyOptional({ description: 'Filter by policy version' })
  @IsOptional()
  @IsString()
  version?: string;
}

/**
 * Response DTO for consent record
 */
export class ConsentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ConsentPurpose })
  purpose: ConsentPurpose;

  @ApiProperty()
  granted: boolean;

  @ApiPropertyOptional()
  grantedAt?: Date;

  @ApiPropertyOptional()
  revokedAt?: Date;

  @ApiProperty({ enum: ConsentSource })
  source: ConsentSource;

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  userAgent?: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
