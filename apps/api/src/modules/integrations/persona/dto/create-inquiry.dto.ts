import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonaVerificationLevel } from '../types/persona.types';

/**
 * DTO for creating a Persona inquiry
 */
export class CreateInquiryDto {
  @ApiProperty({
    description: 'Persona template ID to use for the inquiry',
    example: 'itmpl_XXXXXXXXXXXXXXXXXX',
  })
  @IsString()
  templateId: string;

  @ApiPropertyOptional({
    description: 'Internal reference ID for tracking',
    example: 'user_12345_verification',
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Organization ID (will be set from user context if not provided)',
    example: 'org_12345',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Verification level required',
    enum: PersonaVerificationLevel,
    example: 'ENHANCED',
  })
  @IsOptional()
  verificationLevel?: PersonaVerificationLevel;

  @ApiPropertyOptional({
    description: 'Pre-fill fields for the inquiry',
    example: {
      name_first: 'John',
      name_last: 'Doe',
      email_address: 'john.doe@example.com',
    },
  })
  @IsOptional()
  @IsObject()
  fields?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Tags for categorizing the inquiry',
    example: ['onboarding', 'high-priority'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      source: 'web-app',
      campaign: 'q4-2025',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Redirect URL after inquiry completion',
    example: 'https://app.operate.coach/kyc/complete',
  })
  @IsOptional()
  @IsString()
  redirectUrl?: string;
}
