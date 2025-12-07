import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { KycStatus, KycLevel, KycRiskLevel } from '../types/kyc.types';

/**
 * DTO for KYC report query parameters
 */
export class KycReportQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for report',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for report',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: KycStatus,
  })
  @IsOptional()
  status?: KycStatus;
}

/**
 * DTO for KYC statistics response
 */
export class KycStatisticsDto {
  @ApiProperty({
    description: 'Total number of verifications',
    example: 1250,
  })
  total: number;

  @ApiProperty({
    description: 'Count by status',
    example: {
      approved: 850,
      pending: 150,
      in_review: 100,
      rejected: 100,
      expired: 50,
      not_started: 0,
    },
  })
  byStatus: Record<string, number>;

  @ApiProperty({
    description: 'Count by risk level',
    example: {
      low: 900,
      medium: 250,
      high: 80,
      critical: 20,
    },
  })
  byRiskLevel: Record<string, number>;

  @ApiProperty({
    description: 'Count by provider',
    example: {
      persona: 1100,
      internal: 150,
    },
  })
  byProvider: Record<string, number>;

  @ApiProperty({
    description: 'Average processing time in hours',
    example: 24.5,
  })
  averageProcessingTime: number;

  @ApiProperty({
    description: 'Number of verifications pending review',
    example: 100,
  })
  pendingReview: number;

  @ApiProperty({
    description: 'Number of verifications expiring within 30 days',
    example: 45,
  })
  expiringIn30Days: number;

  @ApiPropertyOptional({
    description: 'Approval rate (percentage)',
    example: 68.0,
  })
  approvalRate?: number;

  @ApiPropertyOptional({
    description: 'Rejection rate (percentage)',
    example: 8.0,
  })
  rejectionRate?: number;
}

/**
 * DTO for pending review item
 */
export class PendingReviewItemDto {
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
    description: 'User full name',
    example: 'John Doe',
  })
  userName: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  userEmail: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organisationId: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Acme Corp',
  })
  organisationName: string;

  @ApiProperty({
    description: 'Verification level',
    enum: KycLevel,
    example: 'ENHANCED',
  })
  level: KycLevel;

  @ApiPropertyOptional({
    description: 'Risk score',
    example: 45.5,
  })
  riskScore?: number;

  @ApiPropertyOptional({
    description: 'Risk level',
    enum: KycRiskLevel,
    example: 'MEDIUM',
  })
  riskLevel?: KycRiskLevel;

  @ApiProperty({
    description: 'When submitted',
    example: '2024-01-15T10:30:00Z',
  })
  submittedAt: Date;

  @ApiProperty({
    description: 'Days waiting for review',
    example: 3,
  })
  daysWaiting: number;

  @ApiPropertyOptional({
    description: 'Provider reference ID',
    example: 'inq_ABC123XYZ',
  })
  providerRefId?: string;
}
