import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

/**
 * DTO for generating Outlook OAuth authorization URL
 */
export class OutlookAuthUrlRequestDto {
  @ApiProperty({
    description: 'User ID requesting authorization',
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
    description: 'Custom redirect URI (optional)',
    example: 'https://app.example.com/integrations/outlook/callback',
  })
  @IsOptional()
  @IsUrl()
  redirectUri?: string;
}

/**
 * DTO for Outlook OAuth authorization URL response
 */
export class OutlookAuthUrlResponseDto {
  @ApiProperty({
    description: 'Microsoft OAuth2 authorization URL',
    example:
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=...&response_type=code&redirect_uri=...&scope=Mail.Read...',
  })
  @IsString()
  authUrl: string;

  @ApiProperty({
    description: 'OAuth state parameter (for CSRF protection)',
    example: 'abc123xyz789',
  })
  @IsString()
  state: string;
}

/**
 * DTO for OAuth callback query parameters
 */
export class OutlookCallbackDto {
  @ApiPropertyOptional({
    description: 'Authorization code from Microsoft',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'State parameter for CSRF protection',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Error code from Microsoft (if authorization failed)',
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({
    description: 'Error description from Microsoft',
  })
  @IsOptional()
  @IsString()
  error_description?: string;
}

/**
 * DTO for Outlook connection status
 */
export class OutlookConnectionStatusDto {
  @ApiProperty({
    description: 'Connection ID',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: 'clx1234567890',
  })
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_1234567890',
  })
  orgId: string;

  @ApiProperty({
    description: 'Email provider',
    example: 'OUTLOOK',
  })
  provider: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@company.com',
  })
  email: string;

  @ApiProperty({
    description: 'Scopes granted',
    example: ['Mail.Read', 'Mail.ReadWrite', 'User.Read', 'offline_access'],
  })
  scopes: string[];

  @ApiProperty({
    description: 'Whether sync is enabled',
    example: true,
  })
  syncEnabled: boolean;

  @ApiPropertyOptional({
    description: 'Last sync timestamp',
    example: '2024-12-03T10:00:00.000Z',
  })
  lastSyncAt?: Date;

  @ApiProperty({
    description: 'Sync status',
    example: 'SYNCED',
  })
  syncStatus: string;

  @ApiPropertyOptional({
    description: 'Sync error message',
  })
  syncError?: string;

  @ApiPropertyOptional({
    description: 'Token expiry timestamp',
    example: '2024-12-03T11:00:00.000Z',
  })
  tokenExpiresAt?: Date;

  @ApiProperty({
    description: 'Connection created timestamp',
    example: '2024-12-03T09:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Connection last updated timestamp',
    example: '2024-12-03T10:00:00.000Z',
  })
  updatedAt: Date;
}

/**
 * DTO for disconnect request
 */
export class OutlookDisconnectDto {
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
}

/**
 * DTO for test connection response
 */
export class OutlookTestConnectionDto {
  @ApiProperty({
    description: 'Whether the connection test succeeded',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Test result message',
    example: 'Successfully connected to Outlook. Found 42 unread messages.',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'User profile information',
    example: {
      displayName: 'John Doe',
      email: 'john.doe@company.com',
      mailboxType: 'User',
    },
  })
  userProfile?: {
    displayName: string;
    email: string;
    mailboxType: string;
  };

  @ApiPropertyOptional({
    description: 'Mailbox statistics',
    example: {
      totalMessages: 1234,
      unreadMessages: 42,
    },
  })
  stats?: {
    totalMessages: number;
    unreadMessages: number;
  };
}
