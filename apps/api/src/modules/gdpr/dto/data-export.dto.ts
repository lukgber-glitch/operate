import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataExportFormat } from '../types/gdpr.types';

/**
 * DTO for requesting data export
 */
export class DataExportRequestDto {
  @ApiProperty({ description: 'User ID whose data to export' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ enum: DataExportFormat, description: 'Export format', default: 'JSON' })
  @IsOptional()
  format?: DataExportFormat;

  @ApiPropertyOptional({ description: 'Specific data categories to include', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeCategories?: string[];

  @ApiPropertyOptional({ description: 'Data categories to exclude', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeCategories?: string[];

  @ApiPropertyOptional({ description: 'Include audit logs' })
  @IsOptional()
  includeAuditLogs?: boolean;

  @ApiPropertyOptional({ description: 'Include consent records' })
  @IsOptional()
  includeConsents?: boolean;
}

/**
 * DTO for data export response
 */
export class DataExportResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  exportedAt: Date;

  @ApiProperty({ enum: DataExportFormat })
  format: DataExportFormat;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileSize: number; // bytes

  @ApiProperty()
  expiresAt: Date; // Download link expiration

  @ApiProperty()
  recordCount: number;

  @ApiProperty({ type: [String] })
  categoriesIncluded: string[];
}

/**
 * DTO for bulk data export
 */
export class BulkDataExportDto {
  @ApiProperty({ description: 'Array of user IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiPropertyOptional({ enum: DataExportFormat, description: 'Export format' })
  @IsOptional()
  format?: DataExportFormat;

  @ApiPropertyOptional({ description: 'Organisation ID for filtering' })
  @IsOptional()
  @IsString()
  organisationId?: string;
}
