import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DownloadResponseDto {
  @ApiProperty({ description: 'Export file ID' })
  id: string;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'File format (pdf, excel, zip)' })
  format: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSizeBytes: number;

  @ApiProperty({ description: 'Signed download URL (expires in 1 hour)' })
  downloadUrl: string;

  @ApiProperty({ description: 'URL expiration timestamp' })
  expiresAt: Date;

  @ApiPropertyOptional({ description: 'File will be deleted at this time' })
  deleteAt?: Date;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'MIME type' })
  mimeType?: string;

  @ApiPropertyOptional({ description: 'File checksum (SHA256)' })
  checksum?: string;
}

export class ExportProgressDto {
  @ApiProperty({ description: 'Export job ID' })
  jobId: string;

  @ApiProperty({
    description: 'Current status',
    enum: ['queued', 'processing', 'completed', 'failed'],
  })
  status: 'queued' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  progress: number;

  @ApiPropertyOptional({ description: 'Current step description' })
  currentStep?: string;

  @ApiPropertyOptional({ description: 'Estimated time remaining in seconds' })
  estimatedTimeRemaining?: number;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Result data if completed', type: DownloadResponseDto })
  result?: DownloadResponseDto;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completed at timestamp' })
  completedAt?: Date;
}

export class ExportTemplateDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  description?: string;

  @ApiProperty({
    description: 'Template type',
    enum: ['pdf', 'excel'],
  })
  type: 'pdf' | 'excel';

  @ApiProperty({ description: 'Is default template for this type' })
  isDefault: boolean;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  previewUrl?: string;

  @ApiProperty({ description: 'Template configuration', type: 'object' })
  config: any;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Organization ID (null for global templates)' })
  organizationId?: string;
}
