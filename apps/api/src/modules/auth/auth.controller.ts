import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CompleteMfaLoginDto } from './dto/complete-mfa-login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UserDto } from '../users/dto/user.dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and logout
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  /**
   * Register new user account
   */
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account and return access/refresh tokens',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(registerDto);

    // Set tokens as HTTP-only cookies if present
    if (result.accessToken && result.refreshToken) {
      this.authService.setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return result;
  }

  /**
   * Login with email and password
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticate user with email/password and return access/refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    // User is attached to request by LocalAuthGuard
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const result = await this.authService.login(req.user);

    // Set tokens as HTTP-only cookies if present (not for MFA-pending logins)
    if (result.accessToken && result.refreshToken) {
      this.authService.setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return result;
  }

  /**
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access token using valid refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    // Extract refresh token from cookie instead of request body
    const refreshToken = (req as any).cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refresh(refreshToken);

    // Update cookies with new tokens
    if (result.accessToken && result.refreshToken) {
      this.authService.setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return result;
  }

  /**
   * Logout current session
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidate current session and refresh token',
  })
  @ApiResponse({
    status: 204,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // Extract refresh token from cookie
    const refreshToken = (req as any).cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.logout((req.user as any).userId, refreshToken);
    }

    // Clear auth cookies
    this.authService.clearAuthCookies(res);
  }

  /**
   * Logout from all devices
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Invalidate all sessions for the current user',
  })
  @ApiResponse({
    status: 204,
    description: 'Logged out from all devices',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logoutAll((req.user as any).userId);

    // Clear auth cookies
    this.authService.clearAuthCookies(res);
  }

  /**
   * Complete MFA login
   * Verifies MFA code and issues final access/refresh tokens
   */
  @Public()
  @Post('mfa/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete MFA login',
    description:
      'Verify MFA code and complete login flow for MFA-enabled users',
  })
  @ApiResponse({
    status: 200,
    description: 'MFA verification successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid MFA token or code',
  })
  async completeMfaLogin(
    @Body() completeMfaDto: CompleteMfaLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.completeMfaLogin(
      completeMfaDto.mfaToken,
      completeMfaDto.mfaCode,
    );

    // Set tokens as HTTP-only cookies
    if (result.accessToken && result.refreshToken) {
      this.authService.setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return result;
  }

  /**
   * Set password for OAuth-only accounts
   */
  @UseGuards(JwtAuthGuard)
  @Post('password/set')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set password for OAuth account',
    description:
      'Allows users who signed up with OAuth (Google, Microsoft) to set a password for traditional login',
  })
  @ApiResponse({
    status: 204,
    description: 'Password set successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 409,
    description: 'Password already set',
  })
  async setPassword(
    @Req() req: Request,
    @Body() setPasswordDto: SetPasswordDto,
  ): Promise<void> {
    const userId = (req.user as any).userId;
    await this.authService.setPassword(userId, setPasswordDto.password);
  }

  /**
   * Change password for existing accounts
   */
  @UseGuards(JwtAuthGuard)
  @Post('password/change')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password',
    description: 'Change password for accounts that already have a password',
  })
  @ApiResponse({
    status: 204,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or current password incorrect',
  })
  @ApiResponse({
    status: 409,
    description: 'No password set',
  })
  async changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const userId = (req.user as any).userId;
    await this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  /**
   * Check if user has password set
   */
  @UseGuards(JwtAuthGuard)
  @Get('password/status')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check password status',
    description: 'Check if the current user has a password set',
  })
  @ApiResponse({
    status: 200,
    description: 'Password status retrieved',
    schema: {
      type: 'object',
      properties: {
        hasPassword: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPasswordStatus(@Req() req: Request): Promise<{ hasPassword: boolean }> {
    const userId = (req.user as any).userId;
    const hasPassword = await this.authService.hasPassword(userId);
    return { hasPassword };
  }

  /**
   * Get current authenticated user profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user\'s profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMe(@Req() req: Request): Promise<UserDto> {
    const userId = (req.user as any).userId;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
