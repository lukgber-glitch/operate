import { IsString, IsNotEmpty, IsOptional, Allow } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * OAuth callback query parameters
 * Allows extra parameters from Google/Microsoft OAuth callbacks
 */
export class OAuthCallbackDto {
  @ApiProperty({
    description: 'Authorization code from OAuth provider',
    example: '4/0AY0e-g7...',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'random-state-string',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Error code if OAuth flow failed',
    example: 'access_denied',
    required: false,
  })
  @IsString()
  @IsOptional()
  error?: string;

  @ApiProperty({
    description: 'Error description if OAuth flow failed',
    example: 'User denied access',
    required: false,
  })
  @IsString()
  @IsOptional()
  error_description?: string;

  // Google OAuth extra parameters
  @Allow()
  @IsOptional()
  scope?: string;

  @Allow()
  @IsOptional()
  authuser?: string;

  @Allow()
  @IsOptional()
  prompt?: string;

  @Allow()
  @IsOptional()
  hd?: string;

  // Microsoft OAuth extra parameters
  @Allow()
  @IsOptional()
  session_state?: string;
}

/**
 * OAuth profile data from provider
 */
export interface OAuthProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  locale?: string;
}

/**
 * OAuth user data returned by passport strategies
 */
export interface OAuthUser {
  provider: string;
  providerId: string;
  accessToken: string;
  refreshToken: string;
  profile: OAuthProfile;
}
