import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsBoolean,
} from 'class-validator';

/**
 * DTO for listing messages
 */
export class ListMessagesDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiPropertyOptional({
    description: 'OData filter query',
    example: "hasAttachments eq true and contains(subject, 'invoice')",
  })
  @IsOptional()
  @IsString()
  filter?: string;

  @ApiPropertyOptional({
    description: 'OData search query',
    example: 'invoice OR receipt',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  maxResults?: number;

  @ApiPropertyOptional({
    description: 'Skip N results for pagination',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    description: 'OData orderBy clause',
    example: 'receivedDateTime desc',
  })
  @IsOptional()
  @IsString()
  orderBy?: string;
}

/**
 * DTO for getting a single message
 */
export class GetMessageDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Message ID',
    example: 'AAMkAGI2...',
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;
}

/**
 * DTO for getting attachments
 */
export class GetAttachmentsDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Message ID',
    example: 'AAMkAGI2...',
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;
}

/**
 * DTO for downloading an attachment
 */
export class DownloadAttachmentDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Message ID',
    example: 'AAMkAGI2...',
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'Attachment ID',
    example: 'AAMkAGI2...',
  })
  @IsString()
  @IsNotEmpty()
  attachmentId: string;
}

/**
 * DTO for searching invoice emails
 */
export class SearchInvoiceEmailsDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  since?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  maxResults?: number;

  @ApiPropertyOptional({
    description: 'Only fetch unread messages',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}

/**
 * DTO for moving message to folder
 */
export class MoveToFolderDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Message ID',
    example: 'AAMkAGI2...',
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'Destination folder ID',
    example: 'AAMkAGI2...',
  })
  @IsString()
  @IsNotEmpty()
  folderId: string;
}

/**
 * DTO for creating a folder
 */
export class CreateFolderDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Folder name',
    example: 'Operate - Processed',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

/**
 * Response DTO for email message
 */
export class EmailMessageDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Subject' })
  subject: string;

  @ApiProperty({ description: 'From address' })
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };

  @ApiProperty({ description: 'To recipients' })
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;

  @ApiProperty({ description: 'Received date/time' })
  receivedDateTime: string;

  @ApiProperty({ description: 'Has attachments' })
  hasAttachments: boolean;

  @ApiProperty({ description: 'Is read' })
  isRead: boolean;

  @ApiProperty({ description: 'Body preview' })
  bodyPreview: string;

  @ApiPropertyOptional({ description: 'Importance' })
  importance?: string;
}

/**
 * Response DTO for attachment
 */
export class AttachmentDto {
  @ApiProperty({ description: 'Attachment ID' })
  id: string;

  @ApiProperty({ description: 'Attachment name' })
  name: string;

  @ApiProperty({ description: 'Content type' })
  contentType: string;

  @ApiProperty({ description: 'Size in bytes' })
  size: number;

  @ApiProperty({ description: 'Is inline attachment' })
  isInline: boolean;
}
