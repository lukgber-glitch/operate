import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycDecisionType, KycStatus } from '../types/kyc.types';

/**
 * DTO for making a KYC verification decision
 */
export class MakeDecisionDto {
  @ApiProperty({
    description: 'Verification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  verificationId: string;

  @ApiProperty({
    description: 'Decision type',
    enum: KycDecisionType,
    example: 'APPROVE',
  })
  decision: KycDecisionType;

  @ApiPropertyOptional({
    description: 'Reason for the decision',
    example: 'All identity checks passed successfully',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the decision',
    example: { reviewNotes: 'ID verified manually', checkedBy: 'Jane Smith' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for KYC decision response
 */
export class KycDecisionResponseDto {
  @ApiProperty({
    description: 'Decision ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Verification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  verificationId: string;

  @ApiProperty({
    description: 'Decision made',
    enum: KycDecisionType,
    example: 'APPROVE',
  })
  decision: KycDecisionType;

  @ApiPropertyOptional({
    description: 'Reason for decision',
    example: 'All identity checks passed successfully',
  })
  reason?: string;

  @ApiProperty({
    description: 'User ID who made the decision',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  decidedBy: string;

  @ApiProperty({
    description: 'Decision type (automated or manual)',
    example: 'manual',
  })
  decisionType: string;

  @ApiProperty({
    description: 'Previous verification status',
    enum: KycStatus,
    example: 'PENDING',
  })
  previousStatus: KycStatus;

  @ApiProperty({
    description: 'New verification status',
    enum: KycStatus,
    example: 'APPROVED',
  })
  newStatus: KycStatus;

  @ApiPropertyOptional({
    description: 'Additional decision metadata',
    type: Object,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'When the decision was made',
    example: '2024-01-15T14:30:00Z',
  })
  createdAt: Date;
}
