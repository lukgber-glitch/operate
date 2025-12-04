import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export enum DateRangePreset {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

export class ExportOptionsDto {
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({
    description: 'File name (without extension)',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Compress output file',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  compress?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum file size in MB',
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  maxFileSizeMb?: number;

  @ApiPropertyOptional({
    description: 'Upload to cloud storage',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  uploadToStorage?: boolean;

  @ApiPropertyOptional({
    description: 'File TTL in seconds (auto-cleanup)',
    default: 86400, // 24 hours
  })
  @IsOptional()
  @IsNumber()
  @Min(3600)
  @Max(604800) // Max 7 days
  ttlSeconds?: number;

  @ApiPropertyOptional({
    description: 'Track export progress',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  trackProgress?: boolean;

  @ApiPropertyOptional({
    description: 'Send notification on completion',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifyOnComplete?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class TemplateConfigDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Template type',
    enum: ['pdf', 'excel'],
  })
  @IsString()
  type: 'pdf' | 'excel';

  @ApiProperty({
    description: 'Template configuration',
    type: 'object',
  })
  @IsObject()
  config: any;

  @ApiPropertyOptional({
    description: 'Is default template',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Organization ID (null for global templates)',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class StyleOptionsDto {
  @ApiPropertyOptional({ description: 'Primary color' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary color' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Font family' })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Custom CSS/Styles', type: 'object' })
  @IsOptional()
  @IsObject()
  customStyles?: Record<string, any>;
}
