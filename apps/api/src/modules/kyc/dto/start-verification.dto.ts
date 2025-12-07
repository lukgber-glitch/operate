import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycLevel, KycProvider } from '../types/kyc.types';

/**
 * DTO for starting a KYC verification process
 */
export class StartVerificationDto {
  @ApiProperty({
    description: 'User ID to verify',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  organisationId: string;

  @ApiProperty({
    description: 'KYC verification level',
    enum: KycLevel,
    example: 'ENHANCED',
  })
  level: KycLevel;

  @ApiPropertyOptional({
    description: 'Preferred verification provider',
    enum: KycProvider,
    example: 'PERSONA',
  })
  @IsOptional()
  provider?: KycProvider;

  @ApiPropertyOptional({
    description: 'Additional metadata for verification',
    example: { referenceId: 'ORDER-12345', ipAddress: '192.168.1.1' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
