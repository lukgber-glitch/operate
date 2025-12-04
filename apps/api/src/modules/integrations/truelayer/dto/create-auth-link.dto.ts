import { IsString, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrueLayerScope } from '../truelayer.types';

/**
 * Create TrueLayer Authorization Link DTO
 */
export class CreateAuthLinkDto {
  @ApiProperty({
    description: 'User ID for the authorization link',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'OAuth2 scopes to request',
    type: [String],
    enum: TrueLayerScope,
    example: ['info', 'accounts', 'balance', 'transactions', 'offline_access'],
    default: ['info', 'accounts', 'balance', 'transactions', 'offline_access'],
  })
  @IsArray()
  @IsEnum(TrueLayerScope, { each: true })
  @IsOptional()
  scopes?: TrueLayerScope[];

  @ApiPropertyOptional({
    description: 'Redirect URI after OAuth flow completion',
    example: 'https://app.operate.com/integrations/truelayer/callback',
  })
  @IsString()
  @IsOptional()
  redirectUri?: string;

  @ApiPropertyOptional({
    description: 'Specific provider ID to connect (e.g., "ob-lloyds", "ob-hsbc")',
    example: 'ob-lloyds',
  })
  @IsString()
  @IsOptional()
  providerId?: string;

  @ApiPropertyOptional({
    description: 'Enable mock/test providers in sandbox mode',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  enableMockProviders?: boolean;
}
