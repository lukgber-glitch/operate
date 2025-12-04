import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  KycStatus,
  KycLevel,
  KycProvider,
  KycRiskLevel,
  DocumentInfo,
  CheckResult,
} from '../types/kyc.types';

/**
 * DTO for KYC verification status response
 */
export class VerificationStatusDto {
  @ApiProperty({
    description: 'Verification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organisationId: string;

  @ApiProperty({
    description: 'Current verification status',
    enum: KycStatus,
    example: KycStatus.PENDING,
  })
  status: KycStatus;

  @ApiProperty({
    description: 'Verification level',
    enum: KycLevel,
    example: KycLevel.ENHANCED,
  })
  level: KycLevel;

  @ApiProperty({
    description: 'Verification provider',
    enum: KycProvider,
    example: KycProvider.PERSONA,
  })
  provider: KycProvider;

  @ApiPropertyOptional({
    description: 'External provider reference ID',
    example: 'inq_ABC123XYZ',
  })
  providerRefId?: string;

  @ApiPropertyOptional({
    description: 'Risk score (0-100)',
    example: 25.5,
  })
  riskScore?: number;

  @ApiPropertyOptional({
    description: 'Risk level classification',
    enum: KycRiskLevel,
    example: KycRiskLevel.LOW,
  })
  riskLevel?: KycRiskLevel;

  @ApiPropertyOptional({
    description: 'When the verification was submitted',
    example: '2024-01-15T10:30:00Z',
  })
  submittedAt?: Date;

  @ApiPropertyOptional({
    description: 'When the verification was reviewed',
    example: '2024-01-15T14:30:00Z',
  })
  reviewedAt?: Date;

  @ApiPropertyOptional({
    description: 'User ID who reviewed the verification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  reviewedBy?: string;

  @ApiPropertyOptional({
    description: 'Reason for decision',
    example: 'All checks passed successfully',
  })
  decisionReason?: string;

  @ApiPropertyOptional({
    description: 'When the verification expires',
    example: '2025-01-15T10:30:00Z',
  })
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'List of submitted documents',
    type: [Object],
  })
  documents?: DocumentInfo[];

  @ApiPropertyOptional({
    description: 'Results of individual verification checks',
    type: [Object],
  })
  checks?: CheckResult[];

  @ApiProperty({
    description: 'When the verification was created',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the verification was last updated',
    example: '2024-01-15T14:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Embedded verification URL (for Persona)',
    example: 'https://withpersona.com/verify?inquiry-id=inq_ABC&session-token=tok_XYZ',
  })
  embeddedUrl?: string;

  @ApiPropertyOptional({
    description: 'Next steps for the user',
    example: 'Complete the identity verification using the provided link',
  })
  nextSteps?: string;
}
