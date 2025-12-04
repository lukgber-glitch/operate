import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Exchange Public Token DTO
 */
export class ExchangePublicTokenDto {
  @ApiProperty({
    description: 'Public token from Plaid Link',
    example: 'public-sandbox-abc123',
  })
  @IsString()
  publicToken: string;

  @ApiProperty({
    description: 'User ID who initiated the connection',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Institution ID (if known)',
    example: 'ins_109508',
  })
  @IsString()
  @IsOptional()
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'Institution name for display',
    example: 'Chase',
  })
  @IsString()
  @IsOptional()
  institutionName?: string;
}
