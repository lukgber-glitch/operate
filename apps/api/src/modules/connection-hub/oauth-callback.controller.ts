import { Controller, Get, Query, Res, Logger, BadRequestException, Param } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ConnectionHubService } from './connection-hub.service';
import { GmailService } from './providers/gmail.service';
import { OutlookService } from './providers/outlook.service';
import { GoCardlessService } from './providers/gocardless.service';
import { Public } from '../../common/decorators/public.decorator';

export interface OAuthCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

@ApiTags('OAuth Callbacks')
@Controller('oauth/callback')
export class OAuthCallbackController {
  private readonly logger = new Logger(OAuthCallbackController.name);

  constructor(
    private readonly connectionHubService: ConnectionHubService,
    private readonly gmailService: GmailService,
    private readonly outlookService: OutlookService,
    private readonly goCardlessService: GoCardlessService,
  ) {}

  @Public()
  @Get(':provider')
  @ApiOperation({ summary: 'Handle OAuth callback from provider' })
  @ApiParam({ name: 'provider', enum: ['gmail', 'outlook', 'gocardless'] })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'error', required: false })
  async handleCallback(
    @Param('provider') provider: string,
    @Query() query: OAuthCallbackQuery,
    @Res() res: Response,
  ): Promise<void> {
    const { code, state, error, error_description } = query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Handle OAuth errors
    if (error) {
      this.logger.error(`OAuth error from ${provider}: ${error} - ${error_description}`);
      res.redirect(`${frontendUrl}/settings/connections?error=${encodeURIComponent(error_description || error)}`);
      return;
    }

    // Validate required params
    if (!code || !state) {
      this.logger.error(`Missing code or state for ${provider}`);
      res.redirect(`${frontendUrl}/settings/connections?error=missing_params`);
      return;
    }

    try {
      // Parse state (contains orgId and userId)
      const stateData = this.parseState(state);

      // Exchange code for tokens based on provider
      let tokens: { accessToken: string; refreshToken?: string; expiresIn?: number };
      let accountIdentifier: string;

      switch (provider.toLowerCase()) {
        case 'gmail':
          tokens = await this.gmailService.exchangeCodeForTokens(code);
          const gmailProfile = await this.gmailService.getProfile(tokens.accessToken);
          accountIdentifier = gmailProfile.email;
          break;

        case 'outlook':
          tokens = await this.outlookService.exchangeCodeForTokens(code);
          const outlookProfile = await this.outlookService.getProfile(tokens.accessToken);
          accountIdentifier = outlookProfile.mail || outlookProfile.userPrincipalName;
          break;

        case 'gocardless':
          tokens = await this.goCardlessService.exchangeCodeForTokens(code);
          accountIdentifier = stateData.institutionId || 'gocardless-account';
          break;

        default:
          throw new BadRequestException(`Unknown provider: ${provider}`);
      }

      // Save the connection
      await this.connectionHubService.completeOAuthFlow({
        orgId: stateData.orgId,
        userId: stateData.userId,
        provider: provider.toUpperCase() as any,
        accountIdentifier,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresIn
          ? new Date(Date.now() + tokens.expiresIn * 1000)
          : undefined,
      });

      this.logger.log(`OAuth flow completed for ${provider}, org: ${stateData.orgId}`);
      res.redirect(`${frontendUrl}/settings/connections?success=true&provider=${provider}`);

    } catch (err) {
      this.logger.error(`OAuth callback failed for ${provider}:`, err);
      res.redirect(`${frontendUrl}/settings/connections?error=${encodeURIComponent(err.message)}`);
    }
  }

  private parseState(state: string): { orgId: string; userId: string; institutionId?: string } {
    try {
      // State is base64 encoded JSON
      const decoded = Buffer.from(state, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      // Fallback: state might be plain orgId for simple flows
      return { orgId: state, userId: 'system' };
    }
  }
}
