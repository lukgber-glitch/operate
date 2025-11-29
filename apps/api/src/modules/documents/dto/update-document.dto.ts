import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  Length,
  IsObject,
} from 'class-validator';
import { DocumentType } from '@prisma/client';

/**
 * DTO for updating a document
 */
export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Document name',
    example: 'Q4 Financial Report 2024 (Updated).pdf',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Updated quarterly financial report for Q4 2024',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.REPORT,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({
    description: 'Folder ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiPropertyOptional({
    description: 'Tags for organization',
    example: ['finance', 'quarterly', '2024', 'reviewed'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { department: 'Finance', approvedBy: 'Jane Smith' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
