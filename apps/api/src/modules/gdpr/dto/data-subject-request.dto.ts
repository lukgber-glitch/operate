import { IsString, IsOptional, IsEnum, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataSubjectRequestType, DataSubjectRequestStatus } from '../types/gdpr.types';

/**
 * DTO for creating a Data Subject Request
 */
export class CreateDataSubjectRequestDto {
  @ApiProperty({ description: 'User ID making the request' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Organisation ID (if applicable)' })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiProperty({ enum: DataSubjectRequestType, description: 'Type of request' })
  requestType: DataSubjectRequestType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for updating DSR status
 */
export class UpdateDataSubjectRequestDto {
  @ApiProperty({ enum: DataSubjectRequestStatus, description: 'New status' })
  status: DataSubjectRequestStatus;

  @ApiPropertyOptional({ description: 'Reason for status change (required for rejection)' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'ID of user completing the request' })
  @IsOptional()
  @IsString()
  completedBy?: string;

  @ApiPropertyOptional({ description: 'URL of result file (for access/portability requests)' })
  @IsOptional()
  @IsString()
  resultFileUrl?: string;
}

/**
 * DTO for extending DSR deadline
 */
export class ExtendDataSubjectRequestDto {
  @ApiProperty({ description: 'Reason for extension' })
  @IsString()
  extensionReason: string;

  @ApiPropertyOptional({ description: 'New due date (optional, defaults to +60 days)' })
  @IsOptional()
  @IsDateString()
  extendedDueDate?: string;
}

/**
 * DTO for querying DSRs
 */
export class QueryDataSubjectRequestDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by organisation ID' })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiPropertyOptional({ enum: DataSubjectRequestType, description: 'Filter by request type' })
  @IsOptional()
  requestType?: DataSubjectRequestType;

  @ApiPropertyOptional({ enum: DataSubjectRequestStatus, description: 'Filter by status' })
  @IsOptional()
  status?: DataSubjectRequestStatus;

  @ApiPropertyOptional({ description: 'Filter by overdue requests' })
  @IsOptional()
  overdue?: boolean;
}

/**
 * Response DTO for Data Subject Request
 */
export class DataSubjectRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requestId: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  organisationId?: string;

  @ApiProperty({ enum: DataSubjectRequestType })
  requestType: DataSubjectRequestType;

  @ApiProperty({ enum: DataSubjectRequestStatus })
  status: DataSubjectRequestStatus;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty()
  requestedAt: Date;

  @ApiPropertyOptional()
  acknowledgedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  dueDate: Date;

  @ApiPropertyOptional()
  extendedDueDate?: Date;

  @ApiPropertyOptional()
  extensionReason?: string;

  @ApiPropertyOptional()
  completedBy?: string;

  @ApiPropertyOptional()
  resultFileUrl?: string;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ description: 'Days remaining until due date' })
  daysRemaining?: number;

  @ApiProperty({ description: 'Whether request is overdue' })
  isOverdue?: boolean;
}
