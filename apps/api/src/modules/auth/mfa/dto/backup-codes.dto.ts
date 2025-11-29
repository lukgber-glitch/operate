import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Backup Codes Response DTO
 * Returns newly generated backup codes
 */
export class BackupCodesResponseDto {
  @ApiProperty({
    description: 'Array of 10 backup codes',
    example: ['ABC12-DEF34', 'GHI56-JKL78', 'MNO90-PQR12', 'STU34-VWX56', 'YZA78-BCD90', 'EFG12-HIJ34', 'KLM56-NOP78', 'QRS90-TUV12', 'WXY34-ZAB56', 'CDE78-FGH90'],
  })
  backupCodes: string[];

  @ApiProperty({
    description: 'Warning message about backup codes',
    example: 'Store these backup codes securely. They can only be used once and will not be shown again.',
  })
  message: string;

  constructor(backupCodes: string[]) {
    this.backupCodes = backupCodes;
    this.message = 'Store these backup codes securely. They can only be used once and will not be shown again.';
  }
}

/**
 * Verify Backup Code Request DTO
 * Validates a backup code for authentication
 */
export class VerifyBackupCodeDto {
  @ApiProperty({
    description: 'Backup code in format ABC12-DEF34',
    example: 'ABC12-DEF34',
  })
  @IsString()
  @IsNotEmpty({ message: 'Backup code is required' })
  backupCode: string;
}

/**
 * Verify Backup Code Response DTO
 * Returns success status after backup code verification
 */
export class VerifyBackupCodeResponseDto {
  @ApiProperty({
    description: 'Backup code verification status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message about the verification result',
    example: 'Backup code verified successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Number of remaining backup codes',
    example: 9,
  })
  remainingCodes: number;

  constructor(success: boolean, message: string, remainingCodes: number) {
    this.success = success;
    this.message = message;
    this.remainingCodes = remainingCodes;
  }
}

/**
 * Disable MFA Request DTO
 * Requires current TOTP code to disable MFA
 */
export class DisableMfaDto {
  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'TOTP code is required' })
  token: string;
}

/**
 * Disable MFA Response DTO
 * Returns success status after disabling MFA
 */
export class DisableMfaResponseDto {
  @ApiProperty({
    description: 'MFA disable status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message about the operation result',
    example: 'MFA disabled successfully',
  })
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}
