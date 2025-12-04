import { ApiProperty } from '@nestjs/swagger';

/**
 * MFA Setup Response DTO
 * Returns the TOTP secret and QR code for setting up MFA
 */
export class SetupMfaResponseDto {
  @ApiProperty({
    description: 'TOTP secret for manual entry',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'QR code data URL for scanning with authenticator app',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCode: string;

  @ApiProperty({
    description: 'OTP Auth URL for QR code generation',
    example: 'otpauth://totp/Operate:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Operate',
  })
  otpAuthUrl: string;

  constructor(secret: string, qrCode: string, otpAuthUrl: string) {
    this.secret = secret;
    this.qrCode = qrCode;
    this.otpAuthUrl = otpAuthUrl;
  }
}
