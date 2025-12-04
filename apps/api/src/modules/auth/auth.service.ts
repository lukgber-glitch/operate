import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, JwtPayload } from './dto/auth-response.dto';
import { UserDto } from '../users/dto/user.dto';
import { plainToInstance } from 'class-transformer';
import { MfaService } from './mfa/mfa.service';

/**
 * Authentication Service
 * Handles user authentication, JWT token generation, and session management
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private usersRepository: UsersRepository,
    private usersService: UsersService,
    private prisma: PrismaService,
    private mfaService: MfaService,
  ) {}

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

    // Create user
    const user = await this.usersRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    this.logger.log(`User registered: ${user.id}`);

    // Generate tokens and create session
    return this.login(user);
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

    // Generate tokens
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    // Store refresh token in session table
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    this.logger.log(`User logged in: ${user.id}`);

    // Return tokens (NEVER log tokens)
    return new AuthResponseDto(
      accessToken,
      refreshToken,
      15 * 60, // 15 minutes in seconds
      false, // requiresMfa
      undefined,
      'Login successful',
    );
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Verify session exists and is not expired
      const session = await this.prisma.session.findUnique({
        where: { token: refreshToken },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
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

      this.logger.log(`Token refreshed for user: ${user.id}`);

      // Return new access token with same refresh token
      return new AuthResponseDto(
        accessToken,
        refreshToken,
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
    // Delete session
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token: refreshToken,
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

      // Generate tokens
      const accessToken = this.jwtService.sign(jwtPayload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
      });

      const refreshToken = this.jwtService.sign(jwtPayload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      });

      // Store refresh token in session table
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await this.prisma.session.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt,
        },
      });

      this.logger.log(`MFA login completed for user: ${user.id}`);

      return new AuthResponseDto(
        accessToken,
        refreshToken,
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
   */
  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Set access token cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
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
}
