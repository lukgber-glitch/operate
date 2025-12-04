import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * Xero OAuth Callback Query DTO
 */
export class XeroCallbackDto {
  @ApiProperty({
    description: 'Authorization code from Xero',
    example: 'abc123',
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'State parameter for verification',
    example: 'xyz789',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'Error code if authorization failed',
    example: 'access_denied',
    required: false,
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({
    description: 'Error description if authorization failed',
    example: 'The user denied the authorization request',
    required: false,
  })
  @IsOptional()
  @IsString()
  error_description?: string;
}
