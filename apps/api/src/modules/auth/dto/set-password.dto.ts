import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

/**
 * DTO for setting password on OAuth-only accounts
 */
export class SetPasswordDto {
  @ApiProperty({
    description: 'New password (min 8 chars, must include uppercase, lowercase, number, special character)',
    example: 'MySecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{}|;:',.<>\/\\])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#^()_+=-[]{}|;:\',.<>/\\)',
  })
  password!: string;
}
