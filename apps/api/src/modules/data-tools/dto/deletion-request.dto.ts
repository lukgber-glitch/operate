import { IsEnum, IsOptional, IsBoolean, IsArray, IsDateString, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeletionMode, DataCategory } from '../types/data-tools.types';

/**
 * Deletion Request DTO
 * Parameters for requesting data deletion
 */
export class DeletionRequestDto {
  @ApiProperty({
    description: 'Deletion mode',
    enum: DeletionMode,
    example: DeletionMode.SOFT,
  })
  @IsEnum(DeletionMode)
  mode: DeletionMode;

  @ApiProperty({
    description: 'Data categories to delete',
    enum: DataCategory,
    isArray: true,
    example: [DataCategory.PROFILE, DataCategory.FINANCIAL],
  })
  @IsArray()
  @IsEnum(DataCategory, { each: true })
  categories: DataCategory[];

  @ApiPropertyOptional({
    description: 'Schedule deletion for future date (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({
    description: 'Cascade delete related records',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  cascade?: boolean;

  @ApiPropertyOptional({
    description: 'Require confirmation token before deletion',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  confirmationRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Organisation ID (admin only)',
    example: 'org_123',
  })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiPropertyOptional({
    description: 'User ID to delete (admin only)',
    example: 'user_123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Confirmation token (required if confirmationRequired is true)',
    example: 'conf_abc123xyz789',
  })
  @IsOptional()
  @IsString()
  confirmationToken?: string;
}
