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
import { XeroAuthService } from './xero-auth.service';
import {
  XeroCallbackDto,
  XeroConnectionStatusDto,
  XeroAuthUrlDto,
} from './dto';

/**
 * Xero Integration Controller
 * Handles OAuth2 authorization flow and connection management
 *
 * Endpoints:
 * - GET /integrations/xero/auth - Generate Xero authorization URL
 * - GET /integrations/xero/callback - Handle OAuth callback from Xero
 * - GET /integrations/xero/connections - Get all Xero connections
 * - GET /integrations/xero/status - Get connection status for a specific tenant
 * - POST /integrations/xero/refresh-token - Manually refresh access token
 * - DELETE /integrations/xero/disconnect - Disconnect Xero
 */
@ApiTags('Xero Integration')
@Controller('integrations/xero')
export class XeroController {
  private readonly logger = new Logger(XeroController.name);

  constructor(private readonly xeroAuthService: XeroAuthService) {}

  /**
   * Generate Xero OAuth2 authorization URL
   * Initiates the OAuth flow with PKCE
   */
  @Get('auth')
  @ApiOperation({
    summary: 'Generate Xero authorization URL',
    description:
      'Generates an OAuth2 authorization URL with PKCE for connecting to Xero. ' +
      'Users should be redirected to this URL to authorize the application.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated successfully',
    type: XeroAuthUrlDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to generate authorization URL',
  })
  async getAuthUrl(@Query('orgId') orgId: string): Promise<XeroAuthUrlDto> {
    this.logger.log(`Generating auth URL for org: ${orgId}`);
    return await this.xeroAuthService.generateAuthUrl(orgId);
  }

  /**
   * Handle OAuth callback from Xero
   * Exchanges authorization code for access tokens
   */
  @Get('callback')
  @ApiOperation({
    summary: 'Handle Xero OAuth callback',
    description:
      'Handles the OAuth callback from Xero, exchanges the authorization code for tokens, ' +
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
    @Query() query: XeroCallbackDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Handling Xero callback`);

      const connection = await this.xeroAuthService.handleCallback(query);

      // Redirect to frontend success page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const successUrl = `${frontendUrl}/settings/integrations/xero?status=connected&tenantId=${connection.xeroTenantId}&orgName=${encodeURIComponent(connection.xeroOrgName || '')}`;

      res.redirect(successUrl);
    } catch (error) {
      this.logger.error('Xero callback error', error);

      // Redirect to frontend error page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorUrl = `${frontendUrl}/settings/integrations/xero?status=error&message=${encodeURIComponent(error.message)}`;

      res.redirect(errorUrl);
    }
  }

  /**
   * Get all Xero connections for an organization
   */
  @Get('connections')
  @ApiOperation({
    summary: 'Get all Xero connections',
    description:
      'Retrieves all Xero connections (tenants) for the organization. ' +
      'Users can connect multiple Xero organizations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connections retrieved successfully',
    type: [XeroConnectionStatusDto],
  })
  async getConnections(
    @Query('orgId') orgId: string,
  ): Promise<XeroConnectionStatusDto[]> {
    this.logger.log(`Getting all connections for org: ${orgId}`);
    return await this.xeroAuthService.getConnections(orgId);
  }

  /**
   * Get Xero connection status for a specific tenant
   */
  @Get('status')
  @ApiOperation({
    summary: 'Get Xero connection status',
    description:
      'Retrieves the current Xero connection status for the organization or a specific tenant, ' +
      'including token expiry times and last sync information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection status retrieved successfully',
    type: XeroConnectionStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No Xero connection found',
  })
  async getConnectionStatus(
    @Query('orgId') orgId: string,
    @Query('xeroTenantId') xeroTenantId?: string,
  ): Promise<XeroConnectionStatusDto | null> {
    this.logger.log(`Getting connection status for org: ${orgId}, tenant: ${xeroTenantId || 'any'}`);
    return await this.xeroAuthService.getConnectionStatus(orgId, xeroTenantId);
  }

  /**
   * Manually refresh Xero access token
   */
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh Xero access token',
    description:
      'Manually refreshes the Xero access token using the refresh token. ' +
      'This is normally done automatically, but can be triggered manually if needed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active Xero connection found',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token expired, reconnection required',
  })
  async refreshToken(
    @Query('orgId') orgId: string,
    @Query('xeroTenantId') xeroTenantId?: string,
  ) {
    this.logger.log(`Manually refreshing token for org: ${orgId}, tenant: ${xeroTenantId || 'any'}`);
    const result = await this.xeroAuthService.refreshTokens(orgId, xeroTenantId);

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
   * Disconnect Xero
   */
  @Delete('disconnect')
  @ApiOperation({
    summary: 'Disconnect Xero',
    description:
      'Disconnects the Xero integration by revoking tokens and updating the connection status. ' +
      'Users will need to reconnect to use Xero features again.',
  })
  @ApiResponse({
    status: 200,
    description: 'Xero disconnected successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active Xero connection found',
  })
  async disconnect(
    @Query('orgId') orgId: string,
    @Query('xeroTenantId') xeroTenantId?: string,
  ) {
    this.logger.log(`Disconnecting Xero for org: ${orgId}, tenant: ${xeroTenantId || 'any'}`);
    return await this.xeroAuthService.disconnect(orgId, xeroTenantId);
  }
}
