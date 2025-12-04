import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsDate, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Request DTO for listing messages
 */
export class ListMessagesDto {
  @ApiPropertyOptional({
    description: 'Search query (Gmail search syntax)',
    example: 'subject:invoice has:attachment',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  maxResults?: number = 10;

  @ApiPropertyOptional({
    description: 'Page token for pagination',
  })
  @IsOptional()
  @IsString()
  pageToken?: string;

  @ApiPropertyOptional({
    description: 'Label IDs to filter by',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional({
    description: 'Include spam and trash',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeSpamTrash?: boolean = false;
}

/**
 * Request DTO for searching invoice emails
 */
export class SearchInvoiceEmailsDto {
  @ApiPropertyOptional({
    description: 'Search emails since this date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  since?: Date;

  @ApiPropertyOptional({
    description: 'Search emails until this date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  until?: Date;

  @ApiPropertyOptional({
    description: 'Filter by sender email',
    example: 'noreply@stripe.com',
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Only include emails with attachments',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  hasAttachment?: boolean = true;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  maxResults?: number = 50;
}

/**
 * Request DTO for getting a message
 */
export class GetMessageDto {
  @ApiProperty({
    description: 'Gmail message ID',
    example: '18d1234567890abcd',
  })
  @IsString()
  messageId: string;

  @ApiPropertyOptional({
    description: 'Message format (full, metadata, minimal, raw)',
    example: 'full',
    default: 'full',
  })
  @IsOptional()
  @IsString()
  format?: 'full' | 'metadata' | 'minimal' | 'raw' = 'full';
}

/**
 * Request DTO for downloading attachment
 */
export class GetAttachmentDto {
  @ApiProperty({
    description: 'Gmail message ID',
    example: '18d1234567890abcd',
  })
  @IsString()
  messageId: string;

  @ApiProperty({
    description: 'Gmail attachment ID',
    example: 'ANGjdJ8wq1234567890',
  })
  @IsString()
  attachmentId: string;
}

/**
 * Response DTO for message header
 */
export class GmailHeaderDto {
  @ApiProperty({
    description: 'Header name',
    example: 'Subject',
  })
  name: string;

  @ApiProperty({
    description: 'Header value',
    example: 'Your Invoice #12345',
  })
  value: string;
}

/**
 * Response DTO for message body
 */
export class GmailMessageBodyDto {
  @ApiPropertyOptional({
    description: 'Attachment ID if this part is an attachment',
  })
  attachmentId?: string;

  @ApiPropertyOptional({
    description: 'Size of the body in bytes',
  })
  size?: number;

  @ApiPropertyOptional({
    description: 'Base64url encoded data',
  })
  data?: string;
}

/**
 * Response DTO for message part
 */
export class GmailMessagePartDto {
  @ApiPropertyOptional({
    description: 'Part ID',
  })
  partId?: string;

  @ApiPropertyOptional({
    description: 'MIME type',
    example: 'text/plain',
  })
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Filename if attachment',
    example: 'invoice.pdf',
  })
  filename?: string;

  @ApiPropertyOptional({
    description: 'Message headers',
    type: [GmailHeaderDto],
  })
  headers?: GmailHeaderDto[];

  @ApiPropertyOptional({
    description: 'Message body',
    type: GmailMessageBodyDto,
  })
  body?: GmailMessageBodyDto;

  @ApiPropertyOptional({
    description: 'Nested message parts',
    type: [GmailMessagePartDto],
  })
  parts?: GmailMessagePartDto[];
}

/**
 * Response DTO for Gmail message
 */
export class GmailMessageDto {
  @ApiProperty({
    description: 'Message ID',
    example: '18d1234567890abcd',
  })
  id: string;

  @ApiProperty({
    description: 'Thread ID',
    example: '18d1234567890abcd',
  })
  threadId: string;

  @ApiPropertyOptional({
    description: 'Label IDs',
    example: ['INBOX', 'UNREAD'],
    isArray: true,
  })
  labelIds?: string[];

  @ApiPropertyOptional({
    description: 'Message snippet (preview)',
    example: 'Thank you for your purchase. Your invoice is attached.',
  })
  snippet?: string;

  @ApiPropertyOptional({
    description: 'History ID',
  })
  historyId?: string;

  @ApiPropertyOptional({
    description: 'Internal date (timestamp in ms)',
    example: '1705320000000',
  })
  internalDate?: string;

  @ApiPropertyOptional({
    description: 'Message payload',
    type: GmailMessagePartDto,
  })
  payload?: GmailMessagePartDto;

  @ApiPropertyOptional({
    description: 'Estimated message size in bytes',
  })
  sizeEstimate?: number;

  @ApiPropertyOptional({
    description: 'Base64url encoded raw message (if format=raw)',
  })
  raw?: string;
}

/**
 * Response DTO for list messages
 */
export class GmailListMessagesResponseDto {
  @ApiProperty({
    description: 'Array of messages',
    type: [GmailMessageDto],
  })
  messages: GmailMessageDto[];

  @ApiPropertyOptional({
    description: 'Next page token for pagination',
  })
  nextPageToken?: string;

  @ApiPropertyOptional({
    description: 'Estimated total number of results',
  })
  resultSizeEstimate?: number;
}

/**
 * Response DTO for attachment
 */
export class GmailAttachmentDto {
  @ApiProperty({
    description: 'Attachment ID',
    example: 'ANGjdJ8wq1234567890',
  })
  attachmentId: string;

  @ApiProperty({
    description: 'Attachment size in bytes',
    example: 153642,
  })
  size: number;

  @ApiProperty({
    description: 'Base64url encoded attachment data',
  })
  data: string;

  @ApiPropertyOptional({
    description: 'Filename',
    example: 'invoice.pdf',
  })
  filename?: string;

  @ApiPropertyOptional({
    description: 'MIME type',
    example: 'application/pdf',
  })
  mimeType?: string;
}
