import {
  IsEnum,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Export DTO
 * Request payload for creating a new compliance export
 */
export class CreateExportDto {
  @ApiProperty({
    description: 'Export type',
    enum: ['gobd', 'saft'],
    example: 'gobd',
  })
  @IsEnum(['gobd', 'saft'], {
    message: 'Export type must be either "gobd" or "saft"',
  })
  type: 'gobd' | 'saft';

  @ApiProperty({
    description: 'Start date of the export period (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO 8601 date string' })
  startDate: string;

  @ApiProperty({
    description: 'End date of the export period (ISO 8601 format)',
    example: '2024-03-31',
  })
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string' })
  endDate: string;

  @ApiPropertyOptional({
    description: 'Include supporting documents (PDFs, images) in export',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDocuments?: boolean;

  @ApiPropertyOptional({
    description: 'Optional comment or description for the export',
    example: 'Q1 2024 tax audit export',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Comment must not exceed 500 characters' })
  comment?: string;

  @ApiPropertyOptional({
    description: 'Additional export-specific options',
    example: { includeArchived: false, filterByDepartment: 'accounting' },
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}
