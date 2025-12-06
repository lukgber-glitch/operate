import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

/**
 * DTO for setting password on OAuth-only accounts
 */
export class SetPasswordDto {
  @ApiProperty({
    description: 'New password',
    example: 'MySecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}
