import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Complete MFA Login DTO
 * Used to complete MFA verification during login flow
 */
export class CompleteMfaLoginDto {
  @ApiProperty({
    description: 'Temporary MFA token received from initial login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: 'MFA token is required' })
  mfaToken!: string;

  @ApiProperty({
    description: '6-digit TOTP code from authenticator app or backup code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'MFA code is required' })
  mfaCode!: string;
}
