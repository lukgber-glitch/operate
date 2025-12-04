import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsArray } from 'class-validator';

/**
 * Request DTO for generating Gmail OAuth URL
 */
export class GenerateGmailAuthUrlDto {
  @ApiProperty({
    description: 'User ID requesting Gmail connection',
    example: 'user_123abc',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_456def',
  })
  @IsString()
  orgId: string;

  @ApiPropertyOptional({
    description: 'Custom redirect URI (optional)',
    example: 'https://app.example.com/integrations/gmail/callback',
  })
  @IsOptional()
  @IsUrl()
  redirectUri?: string;

  @ApiPropertyOptional({
    description: 'Additional Gmail scopes to request',
    example: ['https://www.googleapis.com/auth/gmail.readonly'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalScopes?: string[];
}

/**
 * Response DTO for Gmail OAuth URL
 */
export class GmailAuthUrlResponseDto {
  @ApiProperty({
    description: 'OAuth authorization URL',
    example: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...',
  })
  authUrl: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'random_state_abc123',
  })
  state: string;
}

/**
 * Query parameters from Gmail OAuth callback
 */
export class GmailCallbackQueryDto {
  @ApiPropertyOptional({
    description: 'Authorization code from Gmail',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'State parameter for validation',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Error code if authorization failed',
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({
    description: 'Error description if authorization failed',
  })
  @IsOptional()
  @IsString()
  error_description?: string;
}

/**
 * Response DTO for connection info
 */
export class GmailConnectionInfoDto {
  @ApiProperty({
    description: 'Connection ID',
    example: 'conn_123abc',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user_123abc',
  })
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_456def',
  })
  orgId: string;

  @ApiProperty({
    description: 'Email provider',
    example: 'GMAIL',
  })
  provider: string;

  @ApiProperty({
    description: 'Connected email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Granted OAuth scopes',
    example: ['https://www.googleapis.com/auth/gmail.readonly'],
    isArray: true,
  })
  scopes: string[];

  @ApiProperty({
    description: 'Whether sync is enabled',
    example: true,
  })
  syncEnabled: boolean;

  @ApiProperty({
    description: 'Current sync status',
    example: 'SYNCED',
  })
  syncStatus: string;

  @ApiPropertyOptional({
    description: 'Last successful sync timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  lastSyncAt?: Date;

  @ApiPropertyOptional({
    description: 'Last sync error message',
    example: null,
  })
  syncError?: string;

  @ApiPropertyOptional({
    description: 'Access token expiration time',
    example: '2024-01-15T11:30:00Z',
  })
  tokenExpiresAt?: Date;

  @ApiProperty({
    description: 'Connection created timestamp',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Connection updated timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

/**
 * Response DTO for disconnect operation
 */
export class GmailDisconnectResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Gmail disconnected successfully',
  })
  message: string;
}

/**
 * Response DTO for test connection
 */
export class GmailTestConnectionResponseDto {
  @ApiProperty({
    description: 'Test success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Connected email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Number of recent messages found',
    example: 10,
  })
  messageCount: number;

  @ApiPropertyOptional({
    description: 'Error message if test failed',
  })
  error?: string;
}
