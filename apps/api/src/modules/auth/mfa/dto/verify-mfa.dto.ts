import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Verify MFA Request DTO
 * Validates the 6-digit TOTP code
 */
export class VerifyMfaDto {
  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'TOTP code is required' })
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'TOTP code must contain only digits' })
  token: string;
}

/**
 * Verify MFA Response DTO
 * Returns success status and backup codes after successful verification
 */
export class VerifyMfaResponseDto {
  @ApiProperty({
    description: 'MFA verification status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message about the verification result',
    example: 'MFA enabled successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Array of 10 backup codes (only returned on initial setup)',
    example: ['ABC12-DEF34', 'GHI56-JKL78', 'MNO90-PQR12', 'STU34-VWX56', 'YZA78-BCD90', 'EFG12-HIJ34', 'KLM56-NOP78', 'QRS90-TUV12', 'WXY34-ZAB56', 'CDE78-FGH90'],
    nullable: true,
  })
  backupCodes?: string[];

  constructor(success: boolean, message: string, backupCodes?: string[]) {
    this.success = success;
    this.message = message;
    this.backupCodes = backupCodes;
  }
}
