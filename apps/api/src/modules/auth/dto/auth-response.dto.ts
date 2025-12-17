import { ApiProperty } from '@nestjs/swagger';

/**
 * JWT payload structure
 * Contains user identification and authorization data
 */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  orgId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication response DTO
 * Returned after successful login or token refresh
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token (15 minutes expiry)',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  accessToken?: string;

  @ApiProperty({
    description: 'JWT refresh token (7 days expiry)',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  refreshToken?: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
    required: false,
  })
  expiresIn?: number;

  @ApiProperty({
    description: 'Whether MFA verification is required',
    example: false,
  })
  requiresMfa: boolean;

  @ApiProperty({
    description: 'Temporary token for MFA verification (only if requiresMfa is true)',
    example: 'temp-token-for-mfa-verification',
    required: false,
  })
  mfaToken?: string;

  @ApiProperty({
    description: 'Message to display to user',
    example: 'Login successful',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'User ID (for internal use)',
    example: 'ckl12345678901234567890',
    required: false,
  })
  userId?: string;

  constructor(
    accessToken: string | undefined,
    refreshToken: string | undefined,
    expiresIn: number | undefined,
    requiresMfa: boolean = false,
    mfaToken?: string,
    message?: string,
    userId?: string,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenType = 'Bearer';
    this.expiresIn = expiresIn;
    this.requiresMfa = requiresMfa;
    this.mfaToken = mfaToken;
    this.message = message;
    this.userId = userId;
  }
}
