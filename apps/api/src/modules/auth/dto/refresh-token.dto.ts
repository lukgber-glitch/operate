import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Refresh token request DTO
 * Used to obtain a new access token using a valid refresh token
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Valid refresh token',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
