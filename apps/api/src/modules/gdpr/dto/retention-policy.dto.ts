import { IsString, IsInt, IsOptional, IsEnum, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataCategory, LegalBasis } from '../types/gdpr.types';

/**
 * DTO for creating a retention policy
 */
export class CreateRetentionPolicyDto {
  @ApiPropertyOptional({ description: 'Organisation ID (null for global policy)' })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiProperty({ enum: DataCategory, description: 'Category of data' })
  @IsEnum(DataCategory)
  dataCategory: DataCategory;

  @ApiProperty({ description: 'Retention period in days', minimum: 1 })
  @IsInt()
  @Min(1)
  retentionPeriod: number;

  @ApiProperty({ enum: LegalBasis, description: 'Legal basis for retention' })
  @IsEnum(LegalBasis)
  legalBasis: LegalBasis;

  @ApiPropertyOptional({ description: 'Description of the policy' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Enable automatic deletion', default: false })
  @IsOptional()
  @IsBoolean()
  autoDelete?: boolean;
}

/**
 * DTO for updating a retention policy
 */
export class UpdateRetentionPolicyDto {
  @ApiPropertyOptional({ description: 'Retention period in days', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  retentionPeriod?: number;

  @ApiPropertyOptional({ enum: LegalBasis, description: 'Legal basis for retention' })
  @IsOptional()
  @IsEnum(LegalBasis)
  legalBasis?: LegalBasis;

  @ApiPropertyOptional({ description: 'Description of the policy' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Enable automatic deletion' })
  @IsOptional()
  @IsBoolean()
  autoDelete?: boolean;

  @ApiPropertyOptional({ description: 'Whether policy is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO for querying retention policies
 */
export class QueryRetentionPolicyDto {
  @ApiPropertyOptional({ description: 'Filter by organisation ID' })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiPropertyOptional({ enum: DataCategory, description: 'Filter by data category' })
  @IsOptional()
  @IsEnum(DataCategory)
  dataCategory?: DataCategory;

  @ApiPropertyOptional({ enum: LegalBasis, description: 'Filter by legal basis' })
  @IsOptional()
  @IsEnum(LegalBasis)
  legalBasis?: LegalBasis;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by auto-delete enabled' })
  @IsOptional()
  @IsBoolean()
  autoDelete?: boolean;
}

/**
 * Response DTO for retention policy
 */
export class RetentionPolicyResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  organisationId?: string;

  @ApiProperty({ enum: DataCategory })
  dataCategory: DataCategory;

  @ApiProperty()
  retentionPeriod: number;

  @ApiProperty({ enum: LegalBasis })
  legalBasis: LegalBasis;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  autoDelete: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * DTO for data cleanup/deletion result
 */
export class DataCleanupResultDto {
  @ApiProperty()
  policyId: string;

  @ApiProperty({ enum: DataCategory })
  dataCategory: DataCategory;

  @ApiProperty()
  recordsDeleted: number;

  @ApiProperty()
  recordsAnonymized: number;

  @ApiProperty({ type: [String] })
  tablesAffected: string[];

  @ApiProperty()
  executedAt: Date;

  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[];
}
