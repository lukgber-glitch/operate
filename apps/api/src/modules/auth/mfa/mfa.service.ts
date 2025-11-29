import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../database/prisma.service';

/**
 * MFA Service
 * Handles TOTP-based Multi-Factor Authentication
 * Provides methods for setup, verification, and backup code management
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly appName: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.appName = this.configService.get<string>('app.name', 'Operate');

    // Configure otplib
    authenticator.options = {
      window: 1, // Allow 1 step before/after for time sync issues
    };
  }

  /**
   * Generate a new TOTP secret
   * @returns Base32 encoded secret
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate QR code for TOTP setup
   * @param email User email
   * @param secret TOTP secret
   * @returns Object with QR code data URL and OTP auth URL
   */
  async generateQRCode(
    email: string,
    secret: string,
  ): Promise<{ qrCode: string; otpAuthUrl: string }> {
    try {
      // Generate otpauth URL
      const otpAuthUrl = authenticator.keyuri(email, this.appName, secret);

      // Generate QR code as data URL
      const qrCode = await QRCode.toDataURL(otpAuthUrl);

      return { qrCode, otpAuthUrl };
    } catch (error) {
      this.logger.error('Failed to generate QR code', error);
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP token
   * @param secret TOTP secret
   * @param token 6-digit code from authenticator app
   * @returns True if token is valid
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      this.logger.error('Token verification failed', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   * @returns Array of 10 backup codes in format ABC12-DEF34
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < 10; i++) {
      // Generate random 5-character alphanumeric segments
      const segment1 = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 5);
      const segment2 = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 5);
      codes.push(`${segment1}-${segment2}`);
    }

    return codes;
  }

  /**
   * Hash backup codes for storage
   * @param codes Array of plain text backup codes
   * @returns Array of hashed backup codes
   */
  async hashBackupCodes(codes: string[]): Promise<string[]> {
    const saltRounds = 10;
    const hashedCodes = await Promise.all(
      codes.map(code => bcrypt.hash(code, saltRounds))
    );
    return hashedCodes;
  }

  /**
   * Setup MFA for a user
   * Generates secret and QR code
   * @param userId User ID
   * @param email User email
   * @returns Secret, QR code, and OTP auth URL
   */
  async setupMfa(userId: string, email: string): Promise<{
    secret: string;
    qrCode: string;
    otpAuthUrl: string;
  }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled. Disable it first to set up again.');
    }

    // Generate new secret
    const secret = this.generateSecret();

    // Generate QR code
    const { qrCode, otpAuthUrl } = await this.generateQRCode(email, secret);

    // Store the secret temporarily (will be confirmed when user verifies)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    this.logger.log(`MFA setup initiated for user: ${userId}`);

    return { secret, qrCode, otpAuthUrl };
  }

  /**
   * Verify TOTP and enable MFA
   * @param userId User ID
   * @param token 6-digit TOTP code
   * @returns Backup codes
   */
  async verifyAndEnableMfa(userId: string, token: string): Promise<string[]> {
    // Get user with MFA secret
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true, mfaEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated. Call /mfa/setup first.');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Verify TOTP token
    const isValid = this.verifyToken(user.mfaSecret, token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes);

    // Enable MFA and store backup codes
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        backupCodes: hashedBackupCodes,
      },
    });

    this.logger.log(`MFA enabled for user: ${userId}`);

    // Return plain text backup codes (only time they're shown)
    return backupCodes;
  }

  /**
   * Disable MFA for a user
   * Requires current TOTP code
   * @param userId User ID
   * @param token 6-digit TOTP code
   */
  async disableMfa(userId: string, token: string): Promise<void> {
    // Get user with MFA secret
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true, mfaEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA secret not found');
    }

    // Verify TOTP token
    const isValid = this.verifyToken(user.mfaSecret, token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Disable MFA and clear secret and backup codes
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        backupCodes: [],
      },
    });

    this.logger.log(`MFA disabled for user: ${userId}`);
  }

  /**
   * Generate new backup codes
   * Replaces all existing backup codes
   * @param userId User ID
   * @returns New backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes);

    // Replace backup codes
    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: hashedBackupCodes },
    });

    this.logger.log(`Backup codes regenerated for user: ${userId}`);

    return backupCodes;
  }

  /**
   * Verify backup code and consume it
   * @param userId User ID
   * @param backupCode Backup code to verify
   * @returns Number of remaining backup codes
   */
  async verifyBackupCode(userId: string, backupCode: string): Promise<number> {
    // Get user with backup codes
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaEnabled: true, backupCodes: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.backupCodes || user.backupCodes.length === 0) {
      throw new BadRequestException('No backup codes available');
    }

    // Check backup code against all stored hashes
    let matchIndex = -1;
    for (let i = 0; i < user.backupCodes.length; i++) {
      const isMatch = await bcrypt.compare(backupCode, user.backupCodes[i]);
      if (isMatch) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex === -1) {
      throw new UnauthorizedException('Invalid backup code');
    }

    // Remove the used backup code
    const updatedBackupCodes = [...user.backupCodes];
    updatedBackupCodes.splice(matchIndex, 1);

    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: updatedBackupCodes },
    });

    this.logger.log(`Backup code used for user: ${userId}, remaining: ${updatedBackupCodes.length}`);

    return updatedBackupCodes.length;
  }

  /**
   * Verify MFA during login
   * Accepts either TOTP token or backup code
   * @param userId User ID
   * @param token TOTP code or backup code
   * @returns True if verification succeeds
   */
  async verifyMfaForLogin(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mfaEnabled: true,
        mfaSecret: true,
        backupCodes: true
      },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    // First try TOTP verification
    if (token.length === 6 && /^\d{6}$/.test(token)) {
      const isValid = this.verifyToken(user.mfaSecret, token);
      if (isValid) {
        return true;
      }
    }

    // If TOTP fails, try backup code
    if (user.backupCodes && user.backupCodes.length > 0) {
      for (let i = 0; i < user.backupCodes.length; i++) {
        const isMatch = await bcrypt.compare(token, user.backupCodes[i]);
        if (isMatch) {
          // Remove the used backup code
          const updatedBackupCodes = [...user.backupCodes];
          updatedBackupCodes.splice(i, 1);

          await this.prisma.user.update({
            where: { id: userId },
            data: { backupCodes: updatedBackupCodes },
          });

          this.logger.log(`Backup code used for login: ${userId}`);
          return true;
        }
      }
    }

    return false;
  }
}
