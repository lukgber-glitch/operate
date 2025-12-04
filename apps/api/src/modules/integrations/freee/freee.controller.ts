import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { FreeeOAuthService } from './freee-oauth.service';
import { FreeeCallbackQuery, FreeeAuthUrlResponse, FreeeConnectionInfo } from './freee.types';

/**
 * freee Integration Controller
 * Handles OAuth2 authorization flow and connection management
 *
 * Endpoints:
 * - GET /integrations/freee/auth - Generate freee authorization URL
 * - GET /integrations/freee/callback - Handle OAuth callback from freee
 * - GET /integrations/freee/connections - Get all freee connections
 * - GET /integrations/freee/status - Get connection status for a specific company
 * - POST /integrations/freee/refresh-token - Manually refresh access token
 * - DELETE /integrations/freee/disconnect - Disconnect freee
 */
@ApiTags('freee Integration')
@Controller('integrations/freee')
export class FreeeController {
  private readonly logger = new Logger(FreeeController.name);

  constructor(private readonly oauthService: FreeeOAuthService) {}

  /**
   * Generate freee OAuth2 authorization URL
   * Initiates the OAuth flow with PKCE
   */
  @Get('auth')
  @ApiOperation({
    summary: 'Generate freee authorization URL',
    description:
      'Generates an OAuth2 authorization URL with PKCE for connecting to freee. ' +
      'Users should be redirected to this URL to authorize the application.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to generate authorization URL',
  })
  async getAuthUrl(@Query('orgId') orgId: string): Promise<FreeeAuthUrlResponse> {
    this.logger.log(`Generating auth URL for org: ${orgId}`);
    return await this.oauthService.generateAuthUrl(orgId);
  }

  /**
   * Handle OAuth callback from freee
   * Exchanges authorization code for access tokens
   */
  @Get('callback')
  @ApiOperation({
    summary: 'Handle freee OAuth callback',
    description:
      'Handles the OAuth callback from freee, exchanges the authorization code for tokens, ' +
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
    @Query() query: FreeeCallbackQuery,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Handling freee callback`);

      const connection = await this.oauthService.handleCallback(query);

      // Redirect to frontend success page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const successUrl = `${frontendUrl}/settings/integrations/freee?status=connected&companyId=${connection.freeeCompanyId}&companyName=${encodeURIComponent(connection.freeeCompanyName || '')}`;

      res.redirect(successUrl);
    } catch (error) {
      this.logger.error('freee callback error', error);

      // Redirect to frontend error page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorUrl = `${frontendUrl}/settings/integrations/freee?status=error&message=${encodeURIComponent(error.message)}`;

      res.redirect(errorUrl);
    }
  }

  /**
   * Get all freee connections for an organization
   */
  @Get('connections')
  @ApiOperation({
    summary: 'Get all freee connections',
    description:
      'Retrieves all freee connections (companies) for the organization. ' +
      'Users can connect multiple freee companies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connections retrieved successfully',
  })
  async getConnections(
    @Query('orgId') orgId: string,
  ): Promise<FreeeConnectionInfo[]> {
    this.logger.log(`Getting all connections for org: ${orgId}`);
    return await this.oauthService.getConnections(orgId);
  }

  /**
   * Get freee connection status for a specific company
   */
  @Get('status')
  @ApiOperation({
    summary: 'Get freee connection status',
    description:
      'Retrieves the current freee connection status for the organization or a specific company, ' +
      'including token expiry times and last sync information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No freee connection found',
  })
  async getConnectionStatus(
    @Query('orgId') orgId: string,
    @Query('freeeCompanyId') freeeCompanyId?: string,
  ): Promise<FreeeConnectionInfo | null> {
    const companyId = freeeCompanyId ? parseInt(freeeCompanyId, 10) : undefined;
    this.logger.log(`Getting connection status for org: ${orgId}, company: ${companyId || 'any'}`);
    return await this.oauthService.getConnectionStatus(orgId, companyId);
  }

  /**
   * Manually refresh freee access token
   */
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh freee access token',
    description:
      'Manually refreshes the freee access token using the refresh token. ' +
      'This is normally done automatically, but can be triggered manually if needed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active freee connection found',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token expired, reconnection required',
  })
  async refreshToken(
    @Query('orgId') orgId: string,
    @Query('freeeCompanyId') freeeCompanyId?: string,
  ) {
    const companyId = freeeCompanyId ? parseInt(freeeCompanyId, 10) : undefined;
    this.logger.log(`Manually refreshing token for org: ${orgId}, company: ${companyId || 'any'}`);
    const result = await this.oauthService.refreshTokens(orgId, companyId);

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
   * Disconnect freee
   */
  @Delete('disconnect')
  @ApiOperation({
    summary: 'Disconnect freee',
    description:
      'Disconnects the freee integration by updating the connection status. ' +
      'Users will need to reconnect to use freee features again.',
  })
  @ApiResponse({
    status: 200,
    description: 'freee disconnected successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active freee connection found',
  })
  async disconnect(
    @Query('orgId') orgId: string,
    @Query('freeeCompanyId') freeeCompanyId?: string,
  ) {
    const companyId = freeeCompanyId ? parseInt(freeeCompanyId, 10) : undefined;
    this.logger.log(`Disconnecting freee for org: ${orgId}, company: ${companyId || 'any'}`);
    return await this.oauthService.disconnect(orgId, companyId);
  }
}
