import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, DocumentStatus } from '@prisma/client';

/**
 * DTO for document response
 */
export class DocumentResponseDto {
  @ApiProperty({
    description: 'Document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Organisation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orgId: string;

  @ApiProperty({
    description: 'Document name',
    example: 'Q4 Financial Report 2024.pdf',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Quarterly financial report for Q4 2024',
  })
  description?: string;

  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.REPORT,
  })
  type: DocumentType;

  @ApiProperty({
    description: 'Document status',
    enum: DocumentStatus,
    example: DocumentStatus.ACTIVE,
  })
  status: DocumentStatus;

  @ApiProperty({
    description: 'Original file name',
    example: 'financial-report-q4.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  fileSize: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'File URL',
    example: 'https://storage.example.com/documents/abc123.pdf',
  })
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Folder ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  folderId?: string;

  @ApiProperty({
    description: 'Tags',
    example: ['finance', 'quarterly', '2024'],
    type: [String],
  })
  tags: string[];

  @ApiProperty({
    description: 'User who uploaded the document',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uploadedBy: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      department: 'Finance',
      approvedBy: 'John Doe',
      classification: {
        confidence: 0.95,
        extractedData: {
          invoiceNumber: 'INV-2024-001'
        }
      }
    },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Document version',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: 'Parent document ID (for versioning)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  parentId?: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-12-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-12-01T10:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Folder information (if document is in a folder)',
  })
  folder?: {
    id: string;
    name: string;
    path: string;
  };
}
