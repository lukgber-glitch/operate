import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  Min,
  Length,
  IsObject,
} from 'class-validator';
import { DocumentType } from '@prisma/client';

/**
 * DTO for creating a new document
 */
export class CreateDocumentDto {
  @ApiProperty({
    description: 'Document name',
    example: 'Q4 Financial Report 2024.pdf',
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Quarterly financial report for Q4 2024',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.REPORT,
  })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({
    description: 'Original file name',
    example: 'financial-report-q4.pdf',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  @IsInt()
  @Min(0)
  fileSize: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'File URL (S3, Azure Storage, etc.)',
    example: 'https://storage.example.com/documents/abc123.pdf',
  })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Folder ID (optional)',
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
    description: 'Additional metadata (JSON)',
    example: { department: 'Finance', approvedBy: 'John Doe' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
