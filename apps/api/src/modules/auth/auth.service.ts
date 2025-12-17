import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, JwtPayload } from './dto/auth-response.dto';
import { UserDto } from '../users/dto/user.dto';
import { plainToInstance } from 'class-transformer';
import { MfaService } from './mfa/mfa.service';
import {
  extractFingerprintData,
  generateFingerprint,
  validateSessionFingerprint,
} from '../../common/utils/device-fingerprint.util';

/**
 * Authentication Service (Enhanced with SEC-005, SEC-006, SEC-017)
 * Handles user authentication, JWT token generation, and session management
 *
 * SECURITY FEATURES:
 * - SEC-005: Refresh token rotation - tokens are invalidated after use
 * - SEC-006: Session limits - max 5 concurrent sessions per user
 * - SEC-007: Strong password policy with special characters
 * - SEC-017: Device fingerprinting for session hijacking detection
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_SESSIONS_PER_USER = 5; // SEC-006

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private usersRepository: UsersRepository,
    private usersService: UsersService,
    private prisma: PrismaService,
    private mfaService: MfaService,
  ) {}

  /**
   * Hash a refresh token using SHA-256
   * SECURITY: Tokens are hashed before storing to prevent token theft from database
   * @param token - The plaintext refresh token
   * @returns The SHA-256 hash (64 hex characters)
   */
  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a unique refresh token with retry logic
   * Adds random bytes to ensure uniqueness even if tokens are generated in rapid succession
   * @param payload - JWT payload for the refresh token
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Object containing the plaintext token and its hash
   */
  private async generateUniqueRefreshToken(
    payload: JwtPayload,
    maxRetries: number = 3,
  ): Promise<{ token: string; hash: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Add random bytes to ensure uniqueness
      const randomSuffix = crypto.randomBytes(16).toString('hex');
      const tokenPayload = {
        ...payload,
        jti: randomSuffix, // JWT ID - ensures uniqueness
      };

      const token = this.jwtService.sign(tokenPayload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      });

      const hash = this.hashRefreshToken(token);

      // Check if this hash already exists
      const existingSession = await this.prisma.session.findUnique({
        where: { token: hash },
        select: { id: true },
      });

      if (!existingSession) {
        return { token, hash };
      }

      this.logger.warn(
        `Token hash collision detected (attempt ${attempt + 1}/${maxRetries}) - generating new token`,
      );

      // Wait before retry with exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    // This should be extremely rare - log as critical
    this.logger.error(
      `Failed to generate unique refresh token after ${maxRetries} attempts`,
    );
    throw new Error('Failed to generate unique session token');
  }

  /**
   * SEC-017: Generate device fingerprint from request
   */
  generateDeviceFingerprint(req: Request): string {
    const headers = req.headers as Record<string, string | string[] | undefined>;
    const ip = req.ip || req.socket?.remoteAddress;
    const fingerprintData = extractFingerprintData(headers, ip);
    return generateFingerprint(fingerprintData);
  }

  /**
   * SEC-006: Enforce session limit per user (max 5 concurrent sessions)
   * When user reaches limit, delete oldest session to make room for new one
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    // Count active sessions for user
    const sessionCount = await this.prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // Only count non-expired sessions
      },
    });

    // If at or over limit, delete oldest session(s)
    if (sessionCount >= this.MAX_SESSIONS_PER_USER) {
      // Get oldest sessions to delete (delete enough to get below limit)
      const sessionsToDelete = await this.prisma.session.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        orderBy: {
          createdAt: 'asc', // Oldest first
        },
        take: sessionCount - this.MAX_SESSIONS_PER_USER + 1, // Delete enough to make room
        select: { id: true },
      });

      // Delete oldest sessions
      await this.prisma.session.deleteMany({
        where: {
          id: { in: sessionsToDelete.map((s) => s.id) },
        },
      });

      this.logger.warn(
        `Session limit enforced for user ${userId}: deleted ${sessionsToDelete.length} old session(s)`,
      );
    }
  }

  /**
   * Validate user credentials
   * Used by LocalStrategy during login
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      // Don't reveal whether email exists or password is wrong
      return null;
    }

    // Verify password (NEVER log password or hash)
    if (!user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    // Return user without sensitive fields
    const { passwordHash, mfaSecret, ...result } = user;
    return result;
  }

  /**
   * Register new user
   * Creates user, organization, and membership in a transaction
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if email already exists
    const emailExists = await this.usersService.isEmailTaken(email);
    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    // Hash password (NEVER log the password)
    const saltRounds = this.configService.get<number>('security.bcryptRounds') || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user, organization, and membership in a transaction
    // This ensures the user always has an organization context
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
        },
      });

      // 2. Create organization for the user
      // Generate a unique slug from the user's name
      const baseSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/[^a-z0-9-]/g, '-');
      const uniqueSlug = `${baseSlug}-${user.id.slice(0, 8)}`;

      const organisation = await tx.organisation.create({
        data: {
          name: `${firstName} ${lastName}'s Organisation`,
          slug: uniqueSlug,
          country: 'DE', // Default to Germany, can be updated later
          currency: 'EUR', // Default currency
          timezone: 'Europe/Berlin', // Default timezone
          subscriptionTier: 'free', // Start with free tier
        },
      });

      // 3. Create membership linking user to organization as OWNER
      await tx.membership.create({
        data: {
          userId: user.id,
          orgId: organisation.id,
          role: 'OWNER', // User owns their own organization
          acceptedAt: new Date(), // Auto-accept for registration
        },
      });

      return { user, organisation };
    });

    this.logger.log(`User registered: ${result.user.id} with organisation: ${result.organisation.id}`);

    // Generate tokens and create session
    return this.login(result.user);
  }

  /**
   * Login user and generate tokens
   * Checks if MFA is enabled and returns appropriate response
   */
  async login(user: any): Promise<AuthResponseDto> {
    // Check if user has MFA enabled
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
      },
    });

    // If MFA is enabled, return a response requiring MFA verification
    if (dbUser?.mfaEnabled) {
      // Generate temporary token for MFA verification
      const mfaPayload = {
        sub: user.id,
        email: user.email,
        mfaVerification: true,
      };

      const mfaToken = this.jwtService.sign(mfaPayload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: '5m', // Short-lived token for MFA verification
      });

      this.logger.log(`MFA required for user: ${user.id}`);

      return new AuthResponseDto(
        undefined,
        undefined,
        undefined,
        true, // requiresMfa
        mfaToken,
        'Please provide your MFA code to complete login',
      );
    }

    // Update last login timestamp
    await this.usersService.updateLastLogin(user.id);

    // Get user's primary organization and role (if any)
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.id,
        acceptedAt: { not: null },
      },
      orderBy: {
        createdAt: 'asc', // First membership
      },
    });

    // Create JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: membership?.orgId || undefined,
      role: membership?.role || undefined,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    });

    // Generate unique refresh token with collision prevention
    const { token: refreshToken, hash: hashedRefreshToken } =
      await this.generateUniqueRefreshToken(payload);

    // Store HASHED refresh token in session table
    // SECURITY: Hash prevents token theft from database compromise
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // SEC-006: Enforce session limit per user (max 5 concurrent sessions)
    await this.enforceSessionLimit(user.id);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken, // Store hash, not plaintext
        expiresAt,
      },
    });

    this.logger.log(`User logged in: ${user.id}`);

    // Return plaintext tokens to user (NEVER log tokens)
    return new AuthResponseDto(
      accessToken,
      refreshToken, // User needs plaintext to refresh
      15 * 60, // 15 minutes in seconds
      false, // requiresMfa
      undefined,
      'Login successful',
    );
  }

  /**
   * SEC-005: Refresh access token using refresh token with token rotation
   * SEC-017: Validates device fingerprint to detect session hijacking
   * Old refresh token is invalidated and a new one is issued
   */
  async refresh(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
    deviceFingerprint?: string,
  ): Promise<AuthResponseDto> {
    try {
      // Verify refresh token signature and expiration
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Hash the incoming token to compare with stored hash
      // SECURITY: Database stores hashes, not plaintext tokens
      const hashedRefreshToken = this.hashRefreshToken(refreshToken);

      // Verify session exists and is not expired or already used
      const session = await this.prisma.session.findUnique({
        where: { token: hashedRefreshToken }, // Compare hashes
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // SEC-005: Check if token has already been used (rotation security)
      if (session.isUsed) {
        // Token reuse detected - possible security breach
        // Invalidate all sessions for this user as a security measure
        this.logger.warn(
          `Refresh token reuse detected for user ${payload.sub} - invalidating all sessions`,
        );
        await this.logoutAll(payload.sub);
        throw new UnauthorizedException(
          'Refresh token already used - all sessions invalidated for security',
        );
      }

      // SEC-017: Validate device fingerprint (if stored with session)
      if (session.deviceFingerprint && deviceFingerprint) {
        if (!validateSessionFingerprint(session.deviceFingerprint, deviceFingerprint, 'low')) {
          this.logger.warn(
            `SEC-017: Device fingerprint mismatch for user ${payload.sub} - potential session hijacking`,
          );
          // Don't invalidate all sessions, but reject this refresh
          // Log for security monitoring
          await this.prisma.session.update({
            where: { token: hashedRefreshToken },
            data: { isUsed: true }, // Mark as used to prevent further attempts
          });
          throw new UnauthorizedException(
            'Session verification failed - please login again',
          );
        }
      }

      // Verify user still exists
      const user = await this.usersRepository.findById(payload.sub);
      if (!user || user.deletedAt) {
        throw new UnauthorizedException('User not found');
      }

      // Get updated membership info
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId: user.id,
          acceptedAt: { not: null },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Create new JWT payload with updated data
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        orgId: membership?.orgId || undefined,
        role: membership?.role || undefined,
      };

      // Generate new access token
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
      });

      // Generate unique refresh token with collision prevention
      const { token: newRefreshToken, hash: newHashedRefreshToken } =
        await this.generateUniqueRefreshToken(newPayload);

      // SEC-005: Mark old token as used
      await this.prisma.session.update({
        where: { token: hashedRefreshToken },
        data: { isUsed: true },
      });

      // SEC-005: Create new session with new refresh token
      // SEC-017: Store device fingerprint with session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await this.prisma.session.create({
        data: {
          userId: user.id,
          token: newHashedRefreshToken,
          expiresAt,
          ipAddress,
          userAgent,
          deviceFingerprint, // SEC-017: Store fingerprint for hijacking detection
        },
      });

      // SEC-005: Record token refresh in audit trail
      await this.prisma.tokenRefreshHistory.create({
        data: {
          userId: user.id,
          oldTokenHash: hashedRefreshToken,
          newTokenHash: newHashedRefreshToken,
          ipAddress,
          userAgent,
        },
      });

      this.logger.log(`Token refreshed for user: ${user.id}`);

      // Return new access token with NEW refresh token
      return new AuthResponseDto(
        accessToken,
        newRefreshToken, // Return new refresh token (rotation)
        15 * 60, // 15 minutes in seconds
      );
    } catch (error) {
      this.logger.error('Token refresh failed', error.message);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user by invalidating session
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    // Hash the token to find matching session
    // SECURITY: Database stores hashes, not plaintext tokens
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);

    // Delete session
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token: hashedRefreshToken, // Compare hashes
      },
    });

    this.logger.log(`User logged out: ${userId}`);
  }

  /**
   * Logout user from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    // Delete all user sessions
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    this.logger.log(`User logged out from all devices: ${userId}`);
  }

  /**
   * Complete MFA verification and issue final tokens
   * Called after user provides valid MFA code during login
   */
  async completeMfaLogin(
    mfaToken: string,
    mfaCode: string,
  ): Promise<AuthResponseDto> {
    try {
      // Verify MFA token
      const payload = this.jwtService.verify(mfaToken, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      // Ensure this is an MFA verification token
      if (!payload.mfaVerification) {
        throw new UnauthorizedException('Invalid MFA token');
      }

      const userId = payload.sub;

      // Verify the MFA code
      const isValid = await this.mfaService.verifyMfaForLogin(userId, mfaCode);

      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }

      // Update last login timestamp
      await this.usersService.updateLastLogin(userId);

      // Get user info
      const user = await this.usersRepository.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

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
      const jwtPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        orgId: membership?.orgId || undefined,
        role: membership?.role || undefined,
      };

      // Generate access token
      const accessToken = this.jwtService.sign(jwtPayload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
      });

      // Generate unique refresh token with collision prevention
      const { token: refreshToken, hash: hashedRefreshToken } =
        await this.generateUniqueRefreshToken(jwtPayload);

      // Store HASHED refresh token in session table
      // SECURITY: Hash prevents token theft from database compromise
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // SEC-006: Enforce session limit per user (max 5 concurrent sessions)
      await this.enforceSessionLimit(user.id);

      await this.prisma.session.create({
        data: {
          userId: user.id,
          token: hashedRefreshToken, // Store hash, not plaintext
          expiresAt,
        },
      });

      this.logger.log(`MFA login completed for user: ${user.id}`);

      return new AuthResponseDto(
        accessToken,
        refreshToken, // User needs plaintext to refresh
        15 * 60, // 15 minutes in seconds
        false,
        undefined,
        'Login successful',
      );
    } catch (error) {
      this.logger.error('MFA login failed', error.message);
      throw new UnauthorizedException('Invalid MFA token or code');
    }
  }

  /**
   * Set authentication tokens as HTTP-only cookies
   *
   * SECURITY:
   * - httpOnly: Prevents XSS attacks from stealing tokens
   * - secure: Requires HTTPS in production
   * - sameSite: 'strict' in production, 'lax' in dev - Prevents CSRF attacks
   * - domain: 'localhost' in dev (allows cookies across ports 3000/3001)
   * - path: '/' - Available to all routes
   */
  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // In development, set domain to 'localhost' to allow cookies to work across ports (3000/3001)
    // In production, omit domain to use default (exact domain match only)
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('strict' as const) : ('lax' as const),
      path: '/',
      ...(isProduction ? {} : { domain: 'localhost' }), // Cross-port support in dev
    };

    // Set access token cookie
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Set onboarding complete cookie
   * This allows the frontend middleware to grant access to protected routes
   */
  setOnboardingCompleteCookie(res: Response): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('onboarding_complete', 'true', {
      httpOnly: false, // Needs to be readable by frontend middleware
      secure: isProduction, // true in production, false in dev (sameSite varies accordingly)
      sameSite: isProduction ? 'none' : 'lax', // 'none' in production for cross-site, 'lax' in dev
      path: '/',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      ...(isProduction ? {} : { domain: 'localhost' }), // Cross-port support in dev
    });
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
        this.setOnboardingCompleteCookie(res);
        this.logger.log(`Onboarding cookie set for user ${user.id} on login`);
      }
    } catch (error) {
      // Don't fail login if onboarding check fails
      this.logger.error(`Failed to check onboarding status for user ${user.id}`, error.message);
    }
  }

  /**
   * Clear authentication cookies
   */
  clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }

  /**
   * Set password for OAuth-only accounts
   * Allows users who signed up with OAuth to add a password for traditional login
   */
  async setPassword(userId: string, newPassword: string): Promise<void> {
    // Get user and verify they don't already have a password
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.passwordHash) {
      throw new ConflictException(
        'Password already set. Use change password instead.',
      );
    }

    // Hash the new password
    const saltRounds = this.configService.get<number>('security.bcryptRounds') || 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user with password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`Password set for OAuth user: ${userId}`);
  }

  /**
   * Change password for existing accounts
   * Verifies current password before setting new one
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.passwordHash) {
      throw new ConflictException(
        'No password set. Use set password instead.',
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash the new password
    const saltRounds = this.configService.get<number>('security.bcryptRounds') || 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user with new password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`Password changed for user: ${userId}`);
  }

  /**
   * Check if user has a password set
   * Useful for frontend to determine which password management UI to show
   */
  async hasPassword(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    return user ? user.passwordHash !== null : false;
  }

  /**
   * TEST-ONLY: Create test session for automated testing
   * SECURITY:
   * - Only works in development/test environments (NOT production)
   * - Requires TEST_AUTH_SECRET environment variable
   * - Logs all test auth attempts for security monitoring
   *
   * @param email - Test user email
   * @param testSecret - Must match TEST_AUTH_SECRET env var
   * @returns Auth tokens and session
   */
  async createTestSession(email: string, testSecret: string): Promise<AuthResponseDto> {
    // CRITICAL: Only allow in non-production environments
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'production') {
      this.logger.error('TEST AUTH ATTEMPTED IN PRODUCTION - BLOCKED');
      throw new UnauthorizedException('Test authentication not available in production');
    }

    // Validate test secret
    const expectedSecret = this.configService.get<string>('TEST_AUTH_SECRET');
    if (!expectedSecret) {
      this.logger.error('TEST_AUTH_SECRET not configured - test auth disabled');
      throw new UnauthorizedException('Test authentication not configured');
    }

    if (testSecret !== expectedSecret) {
      this.logger.warn(`Test auth failed: Invalid secret for email ${email}`);
      throw new UnauthorizedException('Invalid test secret');
    }

    // Log test auth attempt for security monitoring
    this.logger.warn(`TEST AUTH: Creating test session for ${email} in ${nodeEnv} environment`);

    // Find or create test user
    let user = await this.usersRepository.findByEmail(email);

    if (!user || user.deletedAt) {
      // Create test user with minimal data
      this.logger.log(`Creating test user: ${email}`);

      // Create user, organization, and membership in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create user
        const newUser = await tx.user.create({
          data: {
            email,
            firstName: 'Test',
            lastName: 'User',
            // No password hash - OAuth-only test user
          },
        });

        // 2. Create organization for the user
        const uniqueSlug = `test-user-${newUser.id.slice(0, 8)}`;

        const organisation = await tx.organisation.create({
          data: {
            name: `${email}'s Test Organisation`,
            slug: uniqueSlug,
            country: 'DE', // Default to Germany
            currency: 'EUR',
            timezone: 'Europe/Berlin',
            subscriptionTier: 'free',
            onboardingCompleted: true, // Auto-complete onboarding for tests
          },
        });

        // 3. Create membership linking user to organization as OWNER
        await tx.membership.create({
          data: {
            userId: newUser.id,
            orgId: organisation.id,
            role: 'OWNER',
            acceptedAt: new Date(),
          },
        });

        return { user: newUser, organisation };
      });

      user = result.user;
      this.logger.log(`Test user created: ${user.id} with organisation: ${result.organisation.id}`);
    } else {
      this.logger.log(`Using existing test user: ${user.id}`);
    }

    // Update last login timestamp
    await this.usersService.updateLastLogin(user.id);

    // Get user's primary organization and role
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

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    });

    // Generate unique refresh token with collision prevention
    const { token: refreshToken, hash: hashedRefreshToken } =
      await this.generateUniqueRefreshToken(payload);

    // Store HASHED refresh token in session table
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // SEC-006: Enforce session limit per user
    await this.enforceSessionLimit(user.id);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt,
        ipAddress: '127.0.0.1', // Test environment
        userAgent: 'TEST-AUTH',
      },
    });

    this.logger.log(`Test session created for user: ${user.id}`);

    // Return tokens
    return new AuthResponseDto(
      accessToken,
      refreshToken,
      15 * 60, // 15 minutes in seconds
      false,
      undefined,
      'Test login successful',
    );
  }
}
