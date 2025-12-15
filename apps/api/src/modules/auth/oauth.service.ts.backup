import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { UsersRepository } from '../users/users.repository';
import { OAuthProfile } from './dto/oauth-callback.dto';
import { AuthResponseDto, JwtPayload } from './dto/auth-response.dto';

/**
 * OAuth Service
 * Handles OAuth provider authentication and user linking
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private usersRepository: UsersRepository,
  ) {}

  /**
   * Handle OAuth callback
   * Find or create user, link OAuth account, generate JWT tokens
   */
  async handleOAuthCallback(
    provider: string,
    providerId: string,
    accessToken: string,
    refreshToken: string | null,
    profile: OAuthProfile,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Processing OAuth callback for ${provider}:${providerId}`);

    // Check if OAuth account already exists
    const existingOAuthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        user: true,
      },
    });

    let user;

    if (existingOAuthAccount) {
      // OAuth account exists - use linked user
      this.logger.log(`Found existing OAuth account for ${provider}:${providerId}`);
      user = existingOAuthAccount.user;

      // Update OAuth tokens
      await this.prisma.oAuthAccount.update({
        where: { id: existingOAuthAccount.id },
        data: {
          accessToken,
          refreshToken,
          expiresAt: this.calculateTokenExpiry(),
          updatedAt: new Date(),
        },
      });

      // Sync profile data from OAuth provider (update user profile if changed)
      await this.syncProfileData(user.id, profile);
    } else {
      // Check if user with this email exists
      const existingUser = await this.usersRepository.findByEmail(profile.email);

      if (existingUser && existingUser.deletedAt) {
        throw new UnauthorizedException('Account has been deleted');
      }

      if (existingUser) {
        // User exists - link OAuth account to existing user
        this.logger.log(`Linking ${provider} OAuth to existing user: ${existingUser.id}`);
        user = existingUser;

        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider,
            providerId,
            accessToken,
            refreshToken,
            expiresAt: this.calculateTokenExpiry(),
          },
        });
      } else {
        // Create new user with OAuth account
        this.logger.log(`Creating new user from ${provider} OAuth`);

        user = await this.usersRepository.create({
          email: profile.email,
          passwordHash: null, // OAuth users don't have password
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
          locale: profile.locale || 'en',
        });

        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider,
            providerId,
            accessToken,
            refreshToken,
            expiresAt: this.calculateTokenExpiry(),
          },
        });

        this.logger.log(`User created via ${provider} OAuth: ${user.id}`);
      }
    }

    // Update last login timestamp
    await this.usersRepository.updateLastLogin(user.id);

    // Get user's primary organization and role (if any)
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.id,
        acceptedAt: { not: null },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Create JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: membership?.orgId || undefined,
      role: membership?.role || undefined,
    };

    // Generate tokens
    const jwtAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    });

    const jwtRefreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    // Store refresh token in session table
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: jwtRefreshToken,
        expiresAt,
      },
    });

    this.logger.log(`OAuth login successful for user: ${user.id}`);

    // Return JWT tokens (NEVER log tokens)
    return new AuthResponseDto(
      jwtAccessToken,
      jwtRefreshToken,
      15 * 60, // 15 minutes in seconds
    );
  }

  /**
   * Unlink OAuth provider from user account
   */
  async unlinkOAuthProvider(
    userId: string,
    provider: string,
  ): Promise<void> {
    const oauthAccount = await this.prisma.oAuthAccount.findFirst({
      where: {
        userId,
        provider,
      },
    });

    if (!oauthAccount) {
      throw new UnauthorizedException('OAuth account not found');
    }

    // Check if user has a password (prevent locking out user)
    const user = await this.usersRepository.findById(userId);
    const hasPassword = user && user.passwordHash;

    const oauthAccounts = await this.prisma.oAuthAccount.count({
      where: { userId },
    });

    if (!hasPassword && oauthAccounts <= 1) {
      throw new ConflictException(
        'Cannot unlink last OAuth provider without setting a password first',
      );
    }

    await this.prisma.oAuthAccount.delete({
      where: { id: oauthAccount.id },
    });

    this.logger.log(`Unlinked ${provider} OAuth from user: ${userId}`);
  }

  /**
   * Calculate OAuth token expiry (1 hour from now)
   */
  private calculateTokenExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    return expiresAt;
  }

  /**
   * Sync profile data from OAuth provider
   * Updates user's name and avatar if they've changed in OAuth provider
   */
  private async syncProfileData(
    userId: string,
    profile: OAuthProfile,
  ): Promise<void> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      this.logger.warn(`Cannot sync profile - user not found: ${userId}`);
      return;
    }

    // Determine if profile data has changed
    const hasChanges =
      user.firstName !== profile.firstName ||
      user.lastName !== profile.lastName ||
      (profile.avatarUrl && user.avatarUrl !== profile.avatarUrl);

    if (hasChanges) {
      this.logger.log(`Syncing profile data for user: ${userId}`);

      await this.usersRepository.update(userId, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        ...(profile.avatarUrl && { avatarUrl: profile.avatarUrl }),
      });

      this.logger.log(`Profile data synced for user: ${userId}`);
    }
  }
}
