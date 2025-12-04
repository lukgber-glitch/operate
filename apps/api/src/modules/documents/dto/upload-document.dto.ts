import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  Length,
  IsBoolean,
} from 'class-validator';

/**
 * DTO for uploading a document
 * Used with multipart/form-data file upload
 */
export class UploadDocumentDto {
  @ApiProperty({
    description: 'Document name (optional - defaults to filename if not provided)',
    example: 'Q4 Financial Report 2024.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Quarterly financial report for Q4 2024',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Folder ID to upload to (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiPropertyOptional({
    description: 'Tags for organization',
    example: ['finance', 'quarterly', '2024'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Auto-classify document using AI (default: true)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoClassify?: boolean;

  @ApiProperty({
    description: 'File to upload',
    type: 'string',
    format: 'binary',
  })
  file: any; // Handled by multer middleware
}
