import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { QuickBooksAuthService } from './quickbooks-auth.service';
import {
  QuickBooksCallbackDto,
  QuickBooksConnectionStatusDto,
  QuickBooksAuthUrlDto,
} from './dto';

/**
 * QuickBooks Online Integration Controller
 * Handles OAuth2 authorization flow and connection management
 *
 * Endpoints:
 * - GET /quickbooks/auth-url - Generate QuickBooks authorization URL
 * - GET /quickbooks/callback - Handle OAuth callback from QuickBooks
 * - GET /quickbooks/status - Get current connection status
 * - POST /quickbooks/refresh-token - Manually refresh access token
 * - DELETE /quickbooks/disconnect - Disconnect QuickBooks
 */
@ApiTags('QuickBooks Integration')
@Controller('quickbooks')
export class QuickBooksController {
  private readonly logger = new Logger(QuickBooksController.name);

  constructor(private readonly quickbooksAuthService: QuickBooksAuthService) {}

  /**
   * Generate QuickBooks OAuth2 authorization URL
   * Initiates the OAuth flow with PKCE
   */
  @Get('auth-url')
  @ApiOperation({
    summary: 'Generate QuickBooks authorization URL',
    description:
      'Generates an OAuth2 authorization URL with PKCE for connecting to QuickBooks Online. ' +
      'Users should be redirected to this URL to authorize the application.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated successfully',
    type: QuickBooksAuthUrlDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to generate authorization URL',
  })
  async getAuthUrl(@Query('orgId') orgId: string): Promise<QuickBooksAuthUrlDto> {
    this.logger.log(`Generating auth URL for org: ${orgId}`);
    return await this.quickbooksAuthService.generateAuthUrl(orgId);
  }

  /**
   * Handle OAuth callback from QuickBooks
   * Exchanges authorization code for access tokens
   */
  @Get('callback')
  @ApiOperation({
    summary: 'Handle QuickBooks OAuth callback',
    description:
      'Handles the OAuth callback from QuickBooks, exchanges the authorization code for tokens, ' +
      'and stores the encrypted tokens in the database.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend success/error page',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid callback parameters',
  })
  async handleCallback(
    @Query() query: QuickBooksCallbackDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Handling QuickBooks callback for realmId: ${query.realmId}`);

      const connection = await this.quickbooksAuthService.handleCallback(query);

      // Redirect to frontend success page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const successUrl = `${frontendUrl}/settings/integrations/quickbooks?status=connected&companyId=${connection.companyId}`;

      res.redirect(successUrl);
    } catch (error) {
      this.logger.error('QuickBooks callback error', error);

      // Redirect to frontend error page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorUrl = `${frontendUrl}/settings/integrations/quickbooks?status=error&message=${encodeURIComponent(error.message)}`;

      res.redirect(errorUrl);
    }
  }

  /**
   * Get QuickBooks connection status
   */
  @Get('status')
  @ApiOperation({
    summary: 'Get QuickBooks connection status',
    description:
      'Retrieves the current QuickBooks connection status for the organization, ' +
      'including token expiry times and last sync information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection status retrieved successfully',
    type: QuickBooksConnectionStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No QuickBooks connection found',
  })
  async getConnectionStatus(
    @Query('orgId') orgId: string,
  ): Promise<QuickBooksConnectionStatusDto | null> {
    this.logger.log(`Getting connection status for org: ${orgId}`);
    return await this.quickbooksAuthService.getConnectionStatus(orgId);
  }

  /**
   * Manually refresh QuickBooks access token
   */
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh QuickBooks access token',
    description:
      'Manually refreshes the QuickBooks access token using the refresh token. ' +
      'This is normally done automatically, but can be triggered manually if needed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active QuickBooks connection found',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token expired, reconnection required',
  })
  async refreshToken(@Query('orgId') orgId: string) {
    this.logger.log(`Manually refreshing token for org: ${orgId}`);
    const result = await this.quickbooksAuthService.refreshTokens(orgId);

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to refresh token',
      };
    }

    return {
      success: true,
      message: 'Token refreshed successfully',
      tokenExpiresAt: result.tokenExpiresAt,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    };
  }

  /**
   * Disconnect QuickBooks
   */
  @Delete('disconnect')
  @ApiOperation({
    summary: 'Disconnect QuickBooks',
    description:
      'Disconnects the QuickBooks integration by revoking tokens and updating the connection status. ' +
      'Users will need to reconnect to use QuickBooks features again.',
  })
  @ApiResponse({
    status: 200,
    description: 'QuickBooks disconnected successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active QuickBooks connection found',
  })
  async disconnect(@Query('orgId') orgId: string) {
    this.logger.log(`Disconnecting QuickBooks for org: ${orgId}`);
    return await this.quickbooksAuthService.disconnect(orgId);
  }
}
