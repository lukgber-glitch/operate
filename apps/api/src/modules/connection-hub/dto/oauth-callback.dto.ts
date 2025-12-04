import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OAuthCallbackDto {
  @ApiProperty({
    description: 'Authorization code from OAuth provider',
    example: '4/0AY0e-g7...',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'abc123xyz',
  })
  @IsString()
  state: string;

  @ApiPropertyOptional({
    description: 'Error code if OAuth failed',
    example: 'access_denied',
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({
    description: 'Error description if OAuth failed',
    example: 'The user denied access to the application',
  })
  @IsOptional()
  @IsString()
  error_description?: string;
}

export class InitiateOAuthDto {
  @ApiProperty({
    description: 'Integration ID to connect',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  integrationId: string;

  @ApiPropertyOptional({
    description: 'Redirect URL after OAuth completion',
    example: 'https://app.example.com/settings/connections',
  })
  @IsOptional()
  @IsString()
  redirectUrl?: string;
}

export class OAuthStateData {
  integrationId: string;
  orgId: string;
  userId: string;
  redirectUrl?: string;
  timestamp: number;
}
