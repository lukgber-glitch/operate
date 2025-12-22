import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { MicrosoftAuthGuard } from './guards/microsoft-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import * as crypto from 'crypto';

// Temporary storage for OAuth auth codes (expires in 60 seconds)
// In production, this should use Redis, but for simplicity we use in-memory
const authCodeStore = new Map<string, { authResponse: AuthResponseDto; expiresAt: number }>();

// Clean up expired codes every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of authCodeStore.entries()) {
    if (data.expiresAt < now) {
      authCodeStore.delete(code);
    }
  }
}, 30000);

/**
 * OAuth Controller
 * Handles OAuth2 authentication flows for Google and Microsoft
 * Uses code exchange pattern for reliable cookie setting
 */
@ApiTags('auth')
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private oauthService: OAuthService) {}

  /**
   * Redirect to Google OAuth
   * Initiates Google OAuth flow
   */
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login with Google',
    description: 'Redirects to Google OAuth consent screen',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth',
  })
  async googleLogin() {
    // Guard redirects to Google
  }

  /**
   * Google OAuth callback
   * Handles callback from Google OAuth flow
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handles callback from Google OAuth flow',
  })
  @ApiQuery({ name: 'code', description: 'Authorization code', required: true })
  @ApiQuery({ name: 'state', description: 'State parameter', required: false })
  @ApiResponse({
    status: 200,
    description: 'OAuth login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'OAuth authentication failed',
  })
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: OAuthCallbackDto,
  ) {
    try {
      // Check for OAuth error
      if (query.error) {
        this.logger.warn(`Google OAuth error: ${query.error}`);
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?error=${query.error}`,
        );
      }

      // Extract OAuth data from request user (populated by strategy)
      const oauthData = req.user as any;

      // Process OAuth callback
      const authResponse = await this.oauthService.handleOAuthCallback(
        oauthData.provider,
        oauthData.providerId,
        oauthData.accessToken,
        oauthData.refreshToken,
        oauthData.profile,
      );

      // Generate a short-lived code for the frontend to exchange
      // This avoids setting cookies during redirects which is unreliable
      const authCode = crypto.randomBytes(32).toString('hex');
      authCodeStore.set(authCode, {
        authResponse,
        expiresAt: Date.now() + 60000, // 60 seconds
      });

      this.logger.log(`OAuth login successful, redirecting with auth code for user: ${authResponse.userId}`);

      // Redirect to frontend with auth code (not tokens!)
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?code=${authCode}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback failed', error.message);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?error=oauth_failed`,
      );
    }
  }

  /**
   * Redirect to Microsoft OAuth
   * Initiates Microsoft OAuth flow
   */
  @Public()
  @Get('microsoft')
  @UseGuards(MicrosoftAuthGuard)
  @ApiOperation({
    summary: 'Login with Microsoft',
    description: 'Redirects to Microsoft OAuth consent screen',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Microsoft OAuth',
  })
  async microsoftLogin() {
    // Guard redirects to Microsoft
  }

  /**
   * Microsoft OAuth callback
   * Handles callback from Microsoft OAuth flow
   */
  @Public()
  @Get('microsoft/callback')
  @UseGuards(MicrosoftAuthGuard)
  @ApiOperation({
    summary: 'Microsoft OAuth callback',
    description: 'Handles callback from Microsoft OAuth flow',
  })
  @ApiQuery({ name: 'code', description: 'Authorization code', required: true })
  @ApiQuery({ name: 'state', description: 'State parameter', required: false })
  @ApiResponse({
    status: 200,
    description: 'OAuth login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'OAuth authentication failed',
  })
  async microsoftCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: OAuthCallbackDto,
  ) {
    try {
      // Check for OAuth error
      if (query.error) {
        this.logger.warn(`Microsoft OAuth error: ${query.error}`);
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?error=${query.error}`,
        );
      }

      // Extract OAuth data from request user (populated by strategy)
      const oauthData = req.user as any;

      // Process OAuth callback
      const authResponse = await this.oauthService.handleOAuthCallback(
        oauthData.provider,
        oauthData.providerId,
        oauthData.accessToken,
        oauthData.refreshToken,
        oauthData.profile,
      );

      // Generate a short-lived code for the frontend to exchange
      const authCode = crypto.randomBytes(32).toString('hex');
      authCodeStore.set(authCode, {
        authResponse,
        expiresAt: Date.now() + 60000, // 60 seconds
      });

      this.logger.log(`OAuth login successful, redirecting with auth code for user: ${authResponse.userId}`);

      // Redirect to frontend with auth code
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?code=${authCode}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Microsoft OAuth callback failed', error.message);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?error=oauth_failed`,
      );
    }
  }

  /**
   * Exchange auth code for tokens
   * Frontend calls this after receiving the auth code from OAuth redirect
   */
  @Public()
  @Post('exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange OAuth auth code for tokens',
    description: 'Exchanges a short-lived auth code for access and refresh tokens. Sets httpOnly cookie.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Auth code from OAuth callback' },
      },
      required: ['code'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens exchanged and cookie set',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired auth code',
  })
  async exchangeCode(
    @Body('code') code: string,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Auth code is required');
    }

    const storedData = authCodeStore.get(code);
    if (!storedData) {
      this.logger.warn('Invalid or expired auth code attempted');
      throw new BadRequestException('Invalid or expired auth code');
    }

    // Delete the code immediately (one-time use)
    authCodeStore.delete(code);

    // Check if expired
    if (storedData.expiresAt < Date.now()) {
      this.logger.warn('Expired auth code attempted');
      throw new BadRequestException('Auth code has expired');
    }

    const { authResponse } = storedData;

    // Set httpOnly cookie with tokens
    const authData = JSON.stringify({
      a: authResponse.accessToken,
      r: authResponse.refreshToken,
    });

    res.cookie('op_auth', authData, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax', // Must use lax for OAuth - Google redirects are cross-origin
      maxAge: 604800 * 1000, // 7 days
      path: '/',
    });

    // Check and set onboarding cookie
    if (authResponse.userId) {
      await this.oauthService.checkAndSetOnboardingCookie({ id: authResponse.userId }, res);
    }

    this.logger.log(`Auth code exchanged successfully for user: ${authResponse.userId}`);

    // Return success (cookie is already set)
    return res.json({
      success: true,
      userId: authResponse.userId,
    });
  }

  /**
   * Link OAuth provider to existing account
   * Requires authenticated user
   */
  @Post('link/:provider')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link OAuth provider to account',
    description: 'Connect an OAuth provider (Google/Microsoft) to an existing authenticated user account',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth provider linked successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid provider or OAuth flow failed',
  })
  async linkProvider(
    @Param('provider') provider: string,
    @Req() req: Request,
  ) {
    // Validate provider
    if (provider !== 'google' && provider !== 'microsoft') {
      this.logger.warn(`Invalid OAuth provider requested: ${provider}`);
      throw new Error('Invalid OAuth provider. Must be "google" or "microsoft"');
    }

    // This endpoint initiates the OAuth flow but preserves the user context
    // The actual linking happens in the callback when we detect an authenticated user
    const userId = (req.user as any).userId;

    this.logger.log(`User ${userId} initiating OAuth link for ${provider}`);

    // Return instructions for client to handle OAuth flow
    return {
      message: 'OAuth linking flow initiated',
      provider,
      redirectUrl: `/api/auth/${provider}?link=true&userId=${userId}`,
    };
  }

  /**
   * Unlink OAuth provider from account
   * Requires authenticated user
   */
  @Post('unlink/:provider')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unlink OAuth provider from account',
    description: 'Disconnect an OAuth provider from the authenticated user account',
  })
  @ApiResponse({
    status: 204,
    description: 'OAuth provider unlinked successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot unlink last authentication method',
  })
  async unlinkProvider(
    @Param('provider') provider: string,
    @Req() req: Request,
  ): Promise<void> {
    const userId = (req.user as any).userId;

    this.logger.log(`User ${userId} unlinking OAuth provider: ${provider}`);

    await this.oauthService.unlinkOAuthProvider(userId, provider);
  }
}
