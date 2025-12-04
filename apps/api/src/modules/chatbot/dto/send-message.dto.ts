/**
 * Send Message DTO
 * Data transfer object for sending a message in a conversation
 */

import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty({
    description: 'File name',
    example: 'receipt.pdf',
  })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'File type (MIME type)',
    example: 'application/pdf',
  })
  @IsNotEmpty()
  @IsString()
  fileType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 102400,
  })
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty({
    description: 'Storage path or URL to the file',
    example: 's3://bucket/receipts/receipt_123.pdf',
  })
  @IsNotEmpty()
  @IsString()
  storagePath: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Can you help me create an invoice for Client XYZ?',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'File attachments (images, PDFs, etc.)',
    type: [AttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
