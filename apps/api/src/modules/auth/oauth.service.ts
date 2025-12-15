import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as crypto from 'crypto';
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
  private readonly MAX_SESSIONS_PER_USER = 5; // SEC-006: Session limit

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private usersRepository: UsersRepository,
  ) {}

  /**
   * Hash a refresh token using SHA-256
   * SECURITY: Tokens are hashed before storing to prevent token theft from database
   */
  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * SEC-006: Enforce session limit per user (max 5 concurrent sessions)
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessionCount = await this.prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (sessionCount >= this.MAX_SESSIONS_PER_USER) {
      const sessionsToDelete = await this.prisma.session.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'asc' },
        take: sessionCount - this.MAX_SESSIONS_PER_USER + 1,
        select: { id: true },
      });

      await this.prisma.session.deleteMany({
        where: { id: { in: sessionsToDelete.map((s) => s.id) } },
      });

      this.logger.warn(
        `Session limit enforced for OAuth user ${userId}: deleted ${sessionsToDelete.length} old session(s)`,
      );
    }
  }

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

        // Create user, organization, membership, and OAuth account in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
          // 1. Create user
          const newUser = await tx.user.create({
            data: {
              email: profile.email,
              passwordHash: null, // OAuth users don't have password
              firstName: profile.firstName,
              lastName: profile.lastName,
              avatarUrl: profile.avatarUrl,
              locale: profile.locale || 'en',
            },
          });

          // 2. Create organization for the user
          const baseSlug = `${profile.firstName.toLowerCase()}-${profile.lastName.toLowerCase()}`.replace(/[^a-z0-9-]/g, '-');
          const uniqueSlug = `${baseSlug}-${newUser.id.slice(0, 8)}`;

          const organisation = await tx.organisation.create({
            data: {
              name: `${profile.firstName} ${profile.lastName}'s Organisation`,
              slug: uniqueSlug,
              country: 'DE',
              currency: 'EUR',
              timezone: 'Europe/Berlin',
              subscriptionTier: 'free',
            },
          });

          // 3. Create membership
          await tx.membership.create({
            data: {
              userId: newUser.id,
              orgId: organisation.id,
              role: 'OWNER',
              acceptedAt: new Date(),
            },
          });

          // 4. Create OAuth account
          await tx.oAuthAccount.create({
            data: {
              userId: newUser.id,
              provider,
              providerId,
              accessToken,
              refreshToken,
              expiresAt: this.calculateTokenExpiry(),
            },
          });

          return { user: newUser, organisation };
        });

        user = result.user;
        this.logger.log(`User created via ${provider} OAuth: ${user.id} with organisation: ${result.organisation.id}`);
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

    // SEC-005: Hash refresh token before storing (same as auth.service.ts)
    // SECURITY: Prevents token theft from database compromise
    const hashedRefreshToken = this.hashRefreshToken(jwtRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // SEC-006: Enforce session limit per user
    await this.enforceSessionLimit(user.id);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken, // Store hash, not plaintext
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

  /**
   * Check if user has completed onboarding and set cookie if true
   * This prevents the redirect loop when onboarding is complete in DB but cookie is missing
   */
  async checkAndSetOnboardingCookie(user: any, res: Response): Promise<void> {
    try {
      // Get user's organization membership
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId: user.id,
          acceptedAt: { not: null },
        },
        include: {
          organisation: {
            select: {
              onboardingCompleted: true,
            },
          },
        },
      });

      // If onboarding is complete, set the cookie
      if (membership?.organisation?.onboardingCompleted) {
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        res.cookie('onboarding_complete', 'true', {
          httpOnly: false, // Needs to be readable by frontend middleware
          secure: isProduction,
          sameSite: 'lax', // Allow cross-site for OAuth flows
          path: '/',
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        });

        this.logger.log(`Onboarding cookie set for user ${user.id} on OAuth login`);
      }
    } catch (error) {
      // Don't fail OAuth login if onboarding check fails
      this.logger.error(`Failed to check onboarding status for user ${user.id}`, error.message);
    }
  }
}
