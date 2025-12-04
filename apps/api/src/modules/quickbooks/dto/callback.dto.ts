import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuickBooksCallbackDto {
  @ApiProperty({
    description: 'Authorization code from QuickBooks',
    example: 'Q011234567890abcdefghijklmnop',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'QuickBooks company realm ID',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  realmId: string;

  @ApiPropertyOptional({
    description: 'Error code if authorization failed',
  })
  @IsString()
  @IsOptional()
  error?: string;

  @ApiPropertyOptional({
    description: 'Error description if authorization failed',
  })
  @IsString()
  @IsOptional()
  error_description?: string;
}
