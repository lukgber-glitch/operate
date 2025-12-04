import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Exchange Authorization Code for Access Token DTO
 */
export class ExchangeTokenDto {
  @ApiProperty({
    description: 'Authorization code received from OAuth callback',
    example: 'abc123def456',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'User ID for token exchange',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'State parameter for CSRF protection (should match the one from auth link)',
    example: 'xyz789',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Redirect URI used in authorization request',
    example: 'https://app.operate.com/integrations/truelayer/callback',
  })
  @IsString()
  @IsOptional()
  redirectUri?: string;
}
