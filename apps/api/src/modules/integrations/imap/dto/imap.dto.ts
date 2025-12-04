/**
 * IMAP DTOs
 * Data Transfer Objects for IMAP API endpoints
 */

import { IsString, IsNumber, IsBoolean, IsOptional, IsEmail, Min, Max, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestImapConnectionDto {
  @ApiProperty({ description: 'IMAP server host' })
  @IsString()
  host: string;

  @ApiProperty({ description: 'IMAP server port' })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({ description: 'Use TLS/SSL' })
  @IsBoolean()
  secure: boolean;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password or App Password' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Reject unauthorized TLS certificates', default: true })
  @IsBoolean()
  @IsOptional()
  rejectUnauthorized?: boolean;
}

export class SaveImapConnectionDto {
  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password or App Password' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'IMAP server host (optional if using preset)' })
  @IsString()
  @IsOptional()
  host?: string;

  @ApiPropertyOptional({ description: 'IMAP server port (optional if using preset)' })
  @IsNumber()
  @IsOptional()
  port?: number;

  @ApiPropertyOptional({ description: 'Use TLS/SSL (optional if using preset)' })
  @IsBoolean()
  @IsOptional()
  secure?: boolean;

  @ApiPropertyOptional({ description: 'Use preset configuration', enum: ['GMAIL', 'OUTLOOK', 'YAHOO', 'AOL', 'ICLOUD', 'ZOHO', 'GMX', 'FASTMAIL'] })
  @IsString()
  @IsOptional()
  preset?: string;
}

export class TriggerSyncDto {
  @ApiPropertyOptional({ description: 'Specific folder to sync (default: INBOX)' })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({ description: 'Sync only unseen messages' })
  @IsBoolean()
  @IsOptional()
  unseenOnly?: boolean;

  @ApiPropertyOptional({ description: 'Include attachments' })
  @IsBoolean()
  @IsOptional()
  includeAttachments?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of messages to sync' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sync messages since date (ISO 8601)' })
  @IsString()
  @IsOptional()
  since?: string;
}

export class StartIdleDto {
  @ApiPropertyOptional({ description: 'Folder to monitor (default: INBOX)' })
  @IsString()
  @IsOptional()
  folder?: string;
}

export class SearchEmailsDto {
  @ApiProperty({ description: 'Connection ID' })
  @IsString()
  connectionId: string;

  @ApiPropertyOptional({ description: 'Folder to search in (default: INBOX)' })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({ description: 'Search by sender email' })
  @IsString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'Search by recipient email' })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ description: 'Search by subject' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ description: 'Search in email body' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({ description: 'Messages since date (ISO 8601)' })
  @IsString()
  @IsOptional()
  since?: string;

  @ApiPropertyOptional({ description: 'Messages before date (ISO 8601)' })
  @IsString()
  @IsOptional()
  before?: string;

  @ApiPropertyOptional({ description: 'Filter by seen status' })
  @IsBoolean()
  @IsOptional()
  seen?: boolean;

  @ApiPropertyOptional({ description: 'Filter by flagged status' })
  @IsBoolean()
  @IsOptional()
  flagged?: boolean;
}

// Response DTOs

export class ImapConnectionStatusDto {
  @ApiProperty()
  connected: boolean;

  @ApiProperty()
  authenticated: boolean;

  @ApiPropertyOptional()
  selectedMailbox?: string;

  @ApiPropertyOptional({ type: [String] })
  capabilities?: string[];

  @ApiPropertyOptional()
  error?: string;
}

export class ImapFolderDto {
  @ApiProperty()
  path: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  specialUse?: string;

  @ApiPropertyOptional({ type: [String] })
  flags?: string[];

  @ApiProperty()
  listed: boolean;

  @ApiProperty()
  subscribed: boolean;

  @ApiPropertyOptional()
  messages?: number;

  @ApiPropertyOptional()
  unseen?: number;
}

export class ImapSyncResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  messagesProcessed: number;

  @ApiProperty()
  messagesSaved: number;

  @ApiProperty({ type: [String] })
  errors: string[];

  @ApiProperty()
  lastSyncDate: Date;
}

export class ImapServerPresetDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  host: string;

  @ApiProperty()
  port: number;

  @ApiProperty()
  secure: boolean;

  @ApiPropertyOptional()
  requiresAppPassword?: boolean;

  @ApiPropertyOptional()
  oauth2Support?: boolean;

  @ApiPropertyOptional()
  description?: string;
}

export class ConnectionPoolStatsDto {
  @ApiProperty()
  active: number;

  @ApiProperty()
  idle: number;

  @ApiProperty()
  waiting: number;

  @ApiProperty()
  total: number;
}
