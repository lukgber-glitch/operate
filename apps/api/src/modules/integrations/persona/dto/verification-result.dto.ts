import { ApiProperty } from '@nestjs/swagger';
import {
  PersonaInquiryStatus,
  PersonaVerificationStatus,
  PersonaVerificationType,
} from '../types/persona.types';

/**
 * Individual verification check result
 */
export class VerificationCheckDto {
  @ApiProperty({
    description: 'Name of the check',
    example: 'id_comparison',
  })
  name: string;

  @ApiProperty({
    description: 'Status of the check',
    enum: PersonaVerificationStatus,
    example: PersonaVerificationStatus.PASSED,
  })
  status: PersonaVerificationStatus;

  @ApiProperty({
    description: 'Reasons for failure (if applicable)',
    example: ['document_expired', 'poor_quality'],
    required: false,
  })
  reasons?: string[];

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;
}

/**
 * Individual verification result
 */
export class VerificationDto {
  @ApiProperty({
    description: 'Verification ID',
    example: 'ver_XXXXXXXXXXXXXXXXXX',
  })
  id: string;

  @ApiProperty({
    description: 'Type of verification',
    enum: PersonaVerificationType,
    example: PersonaVerificationType.GOVERNMENT_ID,
  })
  type: PersonaVerificationType;

  @ApiProperty({
    description: 'Overall status of the verification',
    enum: PersonaVerificationStatus,
    example: PersonaVerificationStatus.PASSED,
  })
  status: PersonaVerificationStatus;

  @ApiProperty({
    description: 'Individual checks performed',
    type: [VerificationCheckDto],
  })
  checks: VerificationCheckDto[];

  @ApiProperty({
    description: 'Timestamp when verification was created',
    example: '2025-12-03T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when verification was completed',
    example: '2025-12-03T10:35:00Z',
    required: false,
  })
  completedAt?: Date;
}

/**
 * Complete verification result for an inquiry
 */
export class VerificationResultDto {
  @ApiProperty({
    description: 'Inquiry ID',
    example: 'inq_XXXXXXXXXXXXXXXXXX',
  })
  inquiryId: string;

  @ApiProperty({
    description: 'Overall inquiry status',
    enum: PersonaInquiryStatus,
    example: PersonaInquiryStatus.APPROVED,
  })
  status: PersonaInquiryStatus;

  @ApiProperty({
    description: 'Internal reference ID',
    example: 'user_12345_verification',
    required: false,
  })
  referenceId?: string;

  @ApiProperty({
    description: 'User ID associated with this inquiry',
    example: 'user_12345',
  })
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_12345',
  })
  organizationId: string;

  @ApiProperty({
    description: 'List of verifications performed',
    type: [VerificationDto],
  })
  verifications: VerificationDto[];

  @ApiProperty({
    description: 'Timestamp when inquiry was created',
    example: '2025-12-03T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when inquiry was completed',
    example: '2025-12-03T10:35:00Z',
    required: false,
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Whether the verification was successful',
    example: true,
  })
  isApproved: boolean;

  @ApiProperty({
    description: 'Summary of failed checks (if any)',
    required: false,
  })
  failureReasons?: string[];
}
