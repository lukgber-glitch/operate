import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SetupMfaResponseDto } from './dto/setup-mfa.dto';
import {
  VerifyMfaDto,
  VerifyMfaResponseDto,
} from './dto/verify-mfa.dto';
import {
  BackupCodesResponseDto,
  DisableMfaDto,
  DisableMfaResponseDto,
  VerifyBackupCodeDto,
  VerifyBackupCodeResponseDto,
} from './dto/backup-codes.dto';

/**
 * MFA Controller
 * Handles Multi-Factor Authentication operations
 * All endpoints require JWT authentication
 */
@ApiTags('MFA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/mfa')
export class MfaController {
  constructor(private mfaService: MfaService) {}

  /**
   * Setup MFA for the authenticated user
   * Returns secret and QR code for scanning with authenticator app
   */
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Setup MFA',
    description: 'Generate TOTP secret and QR code for MFA setup',
  })
  @ApiResponse({
    status: 200,
    description: 'MFA setup initiated successfully',
    type: SetupMfaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'MFA is already enabled',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async setupMfa(@Request() req: ExpressRequest): Promise<SetupMfaResponseDto> {
    const { userId, email } = req.user as any;
    const { secret, qrCode, otpAuthUrl } = await this.mfaService.setupMfa(
      userId,
      email,
    );

    return new SetupMfaResponseDto(secret, qrCode, otpAuthUrl);
  }

  /**
   * Verify TOTP code and enable MFA
   * Returns backup codes (only shown once)
   */
  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enable MFA',
    description: 'Verify TOTP code and enable MFA for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'MFA enabled successfully',
    type: VerifyMfaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'MFA setup not initiated or already enabled',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid TOTP code',
  })
  async enableMfa(
    @Request() req: ExpressRequest,
    @Body() verifyMfaDto: VerifyMfaDto,
  ): Promise<VerifyMfaResponseDto> {
    const { userId } = req.user as any;
    const backupCodes = await this.mfaService.verifyAndEnableMfa(
      userId,
      verifyMfaDto.token,
    );

    return new VerifyMfaResponseDto(
      true,
      'MFA enabled successfully. Save your backup codes securely.',
      backupCodes,
    );
  }

  /**
   * Disable MFA for the authenticated user
   * Requires valid TOTP code for security
   */
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disable MFA',
    description: 'Disable MFA for the user (requires current TOTP code)',
  })
  @ApiResponse({
    status: 200,
    description: 'MFA disabled successfully',
    type: DisableMfaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'MFA is not enabled',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid TOTP code',
  })
  async disableMfa(
    @Request() req: ExpressRequest,
    @Body() disableMfaDto: DisableMfaDto,
  ): Promise<DisableMfaResponseDto> {
    const { userId } = req.user as any;
    await this.mfaService.disableMfa(userId, disableMfaDto.token);

    return new DisableMfaResponseDto(true, 'MFA disabled successfully');
  }

  /**
   * Verify TOTP code during login
   * This endpoint is called after successful email/password authentication
   * when user has MFA enabled
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify MFA during login',
    description: 'Verify TOTP code or backup code during login flow',
  })
  @ApiResponse({
    status: 200,
    description: 'MFA verified successfully',
    type: VerifyMfaResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid TOTP code or backup code',
  })
  async verifyMfa(
    @Request() req: ExpressRequest,
    @Body() verifyMfaDto: VerifyMfaDto,
  ): Promise<VerifyMfaResponseDto> {
    const { userId } = req.user as any;
    const isValid = await this.mfaService.verifyMfaForLogin(
      userId,
      verifyMfaDto.token,
    );

    if (!isValid) {
      return new VerifyMfaResponseDto(
        false,
        'Invalid TOTP code or backup code',
      );
    }

    return new VerifyMfaResponseDto(true, 'MFA verified successfully');
  }

  /**
   * Regenerate backup codes
   * Replaces all existing backup codes with new ones
   */
  @Post('backup-codes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Regenerate backup codes',
    description: 'Generate new backup codes (replaces all existing codes)',
  })
  @ApiResponse({
    status: 200,
    description: 'Backup codes regenerated successfully',
    type: BackupCodesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'MFA is not enabled',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async regenerateBackupCodes(
    @Request() req: ExpressRequest,
  ): Promise<BackupCodesResponseDto> {
    const { userId } = req.user as any;
    const backupCodes = await this.mfaService.regenerateBackupCodes(userId);

    return new BackupCodesResponseDto(backupCodes);
  }

  /**
   * Recover access using backup code
   * Allows user to access account if they lost their MFA device
   */
  @Post('recover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recover account using backup code',
    description:
      'Use a backup code to verify identity when MFA device is lost or unavailable',
  })
  @ApiResponse({
    status: 200,
    description: 'Backup code verified successfully',
    type: VerifyBackupCodeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'MFA is not enabled or no backup codes available',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid backup code',
  })
  async recoverWithBackupCode(
    @Request() req: ExpressRequest,
    @Body() verifyBackupCodeDto: VerifyBackupCodeDto,
  ): Promise<VerifyBackupCodeResponseDto> {
    const { userId } = req.user as any;
    const remainingCodes = await this.mfaService.verifyBackupCode(
      userId,
      verifyBackupCodeDto.backupCode,
    );

    return new VerifyBackupCodeResponseDto(
      true,
      'Backup code verified successfully. Access granted.',
      remainingCodes,
    );
  }
}
