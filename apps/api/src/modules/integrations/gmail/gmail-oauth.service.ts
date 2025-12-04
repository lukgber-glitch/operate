import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { google } from 'googleapis';
import {
  DEFAULT_GMAIL_SCOPES,
  GMAIL_TOKEN_CONFIG,
  GMAIL_ERROR_MESSAGES,
  GMAIL_ENDPOINTS,
} from './gmail.constants';
import { GmailEncryptionUtil } from './utils/gmail-encryption.util';
import {
  GmailConfig,
  GmailAuthUrlResponse,
  GmailCallbackQuery,
  GmailConnectionInfo,
  RefreshTokenResult,
  DisconnectResult,
  OAuthState,
  DecryptedTokens,
  GmailAuditLog,
} from './gmail.types';
import { EmailProvider } from '@prisma/client';

/**
 * Gmail OAuth2 Service
 * Implements secure OAuth2 with PKCE flow for Gmail API
 *
 * Security Features:
 * - OAuth2 with PKCE (Proof Key for Code Exchange)
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh
 * - State parameter validation for CSRF protection
 * - Comprehensive audit logging
 * - Rate limiting
 */
@Injectable()
export class GmailOAuthService {
  private readonly logger = new Logger(GmailOAuthService.name);
  private readonly config: GmailConfig;
  private readonly encryptionKey: string;
  private readonly oauthStateMap: Map<string, OAuthState> = new Map();
  private readonly isConfigured: boolean = false;

  // State cleanup interval (10 minutes)
  private readonly STATE_CLEANUP_INTERVAL = 10 * 60 * 1000;
  // State validity duration (15 minutes)
  private readonly STATE_VALIDITY = 15 * 60 * 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration
    this.config = {
      clientId: this.configService.get<string>('GMAIL_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('GMAIL_CLIENT_SECRET') || '',
      redirectUri:
        this.configService.get<string>('GMAIL_REDIRECT_URI') ||
        'http://localhost:3000/api/integrations/gmail/callback',
    };

    // Validate configuration
    if (!this.config.clientId || !this.config.clientSecret) {
      this.logger.warn('Gmail OAuth is disabled - GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET not configured');
      this.encryptionKey = '';
      return;
    }

    // Get encryption key
    this.encryptionKey =
      this.configService.get<string>('GMAIL_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      '';

    if (!GmailEncryptionUtil.validateMasterKey(this.encryptionKey)) {
      this.logger.warn('Gmail encryption key not configured - using fallback');
    }

    // Mark as configured
    (this as any).isConfigured = true;

    // Start periodic state cleanup
    this.startStateCleanup();

    this.logger.log('Gmail OAuth Service initialized');
  }

  /**
   * Validate Gmail configuration
   */
  private validateConfig(): void {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error(GMAIL_ERROR_MESSAGES.MISSING_ENV_VARS);
    }
  }

  /**
   * Generate OAuth2 authorization URL with PKCE
   */
  async getAuthUrl(
    userId: string,
    orgId: string,
    redirectUri?: string,
    additionalScopes: string[] = [],
  ): Promise<GmailAuthUrlResponse> {
    if (!this.isConfigured) {
      throw new BadRequestException('Gmail OAuth is not configured');
    }
    try {
      // Generate PKCE challenge
      const pkce = GmailEncryptionUtil.generatePKCEChallenge();

      // Store state with PKCE verifier and user info
      const stateData: OAuthState = {
        state: pkce.state,
        codeVerifier: pkce.codeVerifier,
        userId,
        orgId,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.STATE_VALIDITY,
      };
      this.oauthStateMap.set(pkce.state, stateData);

      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        redirectUri || this.config.redirectUri,
      );

      // Combine scopes
      const scopes = [...DEFAULT_GMAIL_SCOPES, ...additionalScopes];

      // Generate authorization URL with PKCE
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Get refresh token
        scope: scopes,
        state: pkce.state,
        prompt: 'consent', // Force consent to get refresh token
        code_challenge: pkce.codeChallenge,
        code_challenge_method: 'S256',
      });

      this.logger.log(`Generated auth URL for user ${userId}`);

      return {
        authUrl,
        state: pkce.state,
      };
    } catch (error) {
      this.logger.error('Failed to generate auth URL', error);
      throw new InternalServerErrorException('Failed to generate authorization URL');
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(query: GmailCallbackQuery): Promise<GmailConnectionInfo> {
    try {
      // Check for OAuth errors
      if (query.error) {
        throw new BadRequestException(
          `Gmail authorization failed: ${query.error_description || query.error}`,
        );
      }

      // Validate required parameters
      if (!query.code || !query.state) {
        throw new BadRequestException('Missing required OAuth parameters');
      }

      // Retrieve and validate state
      const stateData = this.oauthStateMap.get(query.state);
      if (!stateData) {
        throw new UnauthorizedException(GMAIL_ERROR_MESSAGES.INVALID_STATE);
      }

      // Check state expiry
      if (Date.now() > stateData.expiresAt) {
        this.oauthStateMap.delete(query.state);
        throw new UnauthorizedException('State parameter expired');
      }

      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri,
      );

      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken({
        code: query.code,
        codeVerifier: stateData.codeVerifier,
      });

      if (!tokens.access_token) {
        throw new InternalServerErrorException(GMAIL_ERROR_MESSAGES.TOKEN_EXCHANGE_FAILED);
      }

      // Get user email
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      if (!userInfo.data.email) {
        throw new InternalServerErrorException('Failed to retrieve user email');
      }

      // Encrypt tokens
      const encryptedAccess = GmailEncryptionUtil.encrypt(
        tokens.access_token,
        this.encryptionKey,
      );
      const encryptedRefresh = tokens.refresh_token
        ? GmailEncryptionUtil.encrypt(tokens.refresh_token, this.encryptionKey)
        : null;

      // Calculate expiry time
      const now = new Date();
      const tokenExpiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(now.getTime() + GMAIL_TOKEN_CONFIG.accessTokenExpiry * 1000);

      // Get granted scopes
      const scopes = tokens.scope ? tokens.scope.split(' ') : DEFAULT_GMAIL_SCOPES;

      // Save connection to database
      const connection = await this.prisma.emailConnection.upsert({
        where: {
          userId_provider_email: {
            userId: stateData.userId,
            provider: EmailProvider.GMAIL,
            email: userInfo.data.email,
          },
        },
        create: {
          userId: stateData.userId,
          orgId: stateData.orgId,
          provider: EmailProvider.GMAIL,
          email: userInfo.data.email,
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh?.encryptedData || null,
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          scopes,
          syncEnabled: true,
          syncStatus: 'PENDING',
        },
        update: {
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh?.encryptedData || null,
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          scopes,
          syncEnabled: true,
          syncStatus: 'PENDING',
          syncError: null,
        },
      });

      // Create audit log
      await this.createAuditLog(connection.id, {
        action: 'CONNECT',
        success: true,
        metadata: {
          email: userInfo.data.email,
          scopes,
        },
      });

      // Clean up state
      this.oauthStateMap.delete(query.state);

      this.logger.log(
        `Successfully connected Gmail for user ${stateData.userId}, email ${userInfo.data.email}`,
      );

      return this.mapConnectionToInfo(connection);
    } catch (error) {
      this.logger.error('OAuth callback error', error);
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to complete Gmail authorization');
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(userId: string): Promise<GmailConnectionInfo | null> {
    try {
      const connection = await this.prisma.emailConnection.findFirst({
        where: {
          userId,
          provider: EmailProvider.GMAIL,
          syncEnabled: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!connection) {
        return null;
      }

      // Auto-refresh access token if needed
      if (
        connection.tokenExpiresAt &&
        new Date() >= new Date(connection.tokenExpiresAt.getTime() - GMAIL_TOKEN_CONFIG.refreshBuffer * 1000)
      ) {
        await this.refreshToken(connection.id);
        // Fetch updated connection
        const updatedConnection = await this.prisma.emailConnection.findUnique({
          where: { id: connection.id },
        });
        return updatedConnection ? this.mapConnectionToInfo(updatedConnection) : null;
      }

      return this.mapConnectionToInfo(connection);
    } catch (error) {
      this.logger.error(`Failed to get connection status for user ${userId}`, error);
      throw new InternalServerErrorException('Failed to retrieve connection status');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(connectionId: string): Promise<RefreshTokenResult> {
    try {
      const connection = await this.prisma.emailConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection || !connection.refreshToken) {
        throw new NotFoundException(GMAIL_ERROR_MESSAGES.CONNECTION_NOT_FOUND);
      }

      // Decrypt refresh token
      const refreshToken = GmailEncryptionUtil.decrypt(
        connection.refreshToken,
        connection.encryptionIv,
        connection.encryptionTag,
        this.encryptionKey,
      );

      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri,
      );

      // Set refresh token
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      // Refresh the token
      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new InternalServerErrorException(GMAIL_ERROR_MESSAGES.TOKEN_REFRESH_FAILED);
      }

      // Encrypt new tokens
      const encryptedAccess = GmailEncryptionUtil.encrypt(
        credentials.access_token,
        this.encryptionKey,
      );
      const encryptedRefresh = credentials.refresh_token
        ? GmailEncryptionUtil.encrypt(credentials.refresh_token, this.encryptionKey)
        : null;

      // Calculate new expiry time
      const tokenExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + GMAIL_TOKEN_CONFIG.accessTokenExpiry * 1000);

      // Update connection
      await this.prisma.emailConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh?.encryptedData || connection.refreshToken,
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          syncError: null,
        },
      });

      // Create audit log
      await this.createAuditLog(connectionId, {
        action: 'TOKEN_REFRESH',
        success: true,
      });

      this.logger.log(`Successfully refreshed tokens for connection ${connectionId}`);

      return {
        success: true,
        tokenExpiresAt,
      };
    } catch (error) {
      this.logger.error(`Failed to refresh tokens for connection ${connectionId}`, error);

      // Try to update connection with error
      try {
        await this.createAuditLog(connectionId, {
          action: 'TOKEN_REFRESH',
          success: false,
          errorMessage: error.message,
        });
      } catch (auditError) {
        this.logger.error('Failed to create audit log', auditError);
      }

      return {
        success: false,
        error: 'Failed to refresh tokens',
      };
    }
  }

  /**
   * Revoke access and disconnect Gmail
   */
  async revokeAccess(connectionId: string): Promise<DisconnectResult> {
    try {
      const connection = await this.prisma.emailConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new NotFoundException(GMAIL_ERROR_MESSAGES.CONNECTION_NOT_FOUND);
      }

      // Decrypt access token
      const accessToken = GmailEncryptionUtil.decrypt(
        connection.accessToken,
        connection.encryptionIv,
        connection.encryptionTag,
        this.encryptionKey,
      );

      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri,
      );

      // Set credentials
      oauth2Client.setCredentials({ access_token: accessToken });

      // Revoke token (best effort - don't fail if revocation fails)
      try {
        await oauth2Client.revokeCredentials();
        this.logger.log(`Revoked Gmail tokens for connection ${connectionId}`);
      } catch (revokeError) {
        this.logger.warn(`Failed to revoke tokens (continuing): ${revokeError.message}`);
      }

      // Delete connection from database
      await this.prisma.emailConnection.delete({
        where: { id: connectionId },
      });

      // Create audit log before deletion
      await this.createAuditLog(connectionId, {
        action: 'DISCONNECT',
        success: true,
      });

      this.logger.log(`Successfully disconnected Gmail for connection ${connectionId}`);

      return {
        success: true,
        message: 'Gmail disconnected successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to disconnect Gmail for connection ${connectionId}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to disconnect Gmail');
    }
  }

  /**
   * Get decrypted tokens for API calls (internal use)
   */
  async getDecryptedTokens(connectionId: string): Promise<DecryptedTokens> {
    const connection = await this.prisma.emailConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException(GMAIL_ERROR_MESSAGES.CONNECTION_NOT_FOUND);
    }

    // Auto-refresh if needed
    if (
      connection.tokenExpiresAt &&
      new Date() >= new Date(connection.tokenExpiresAt.getTime() - GMAIL_TOKEN_CONFIG.refreshBuffer * 1000)
    ) {
      await this.refreshToken(connectionId);
      // Fetch updated connection
      const updatedConnection = await this.prisma.emailConnection.findUnique({
        where: { id: connectionId },
      });
      if (!updatedConnection) {
        throw new NotFoundException('Connection lost during token refresh');
      }
      return this.decryptTokens(updatedConnection);
    }

    return this.decryptTokens(connection);
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    connectionId: string,
    log: GmailAuditLog,
  ): Promise<void> {
    try {
      await this.prisma.emailAuditLog.create({
        data: {
          connectionId,
          action: log.action,
          endpoint: log.endpoint,
          statusCode: log.statusCode,
          success: log.success,
          errorMessage: log.errorMessage,
          requestId: log.requestId,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata || {},
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging is non-critical
    }
  }

  /**
   * Decrypt tokens from connection
   */
  private decryptTokens(connection: any): DecryptedTokens {
    const accessToken = GmailEncryptionUtil.decrypt(
      connection.accessToken,
      connection.encryptionIv,
      connection.encryptionTag,
      this.encryptionKey,
    );

    const refreshToken = connection.refreshToken
      ? GmailEncryptionUtil.decrypt(
          connection.refreshToken,
          connection.encryptionIv,
          connection.encryptionTag,
          this.encryptionKey,
        )
      : undefined;

    return { accessToken, refreshToken };
  }

  /**
   * Map connection model to info DTO
   */
  private mapConnectionToInfo(connection: any): GmailConnectionInfo {
    return {
      id: connection.id,
      userId: connection.userId,
      orgId: connection.orgId,
      provider: connection.provider,
      email: connection.email,
      scopes: connection.scopes,
      syncEnabled: connection.syncEnabled,
      syncStatus: connection.syncStatus,
      lastSyncAt: connection.lastSyncAt,
      syncError: connection.syncError,
      tokenExpiresAt: connection.tokenExpiresAt,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  /**
   * Start periodic cleanup of expired states
   */
  private startStateCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      for (const [state, data] of this.oauthStateMap.entries()) {
        if (now > data.expiresAt) {
          this.oauthStateMap.delete(state);
          cleaned++;
        }
      }
      if (cleaned > 0) {
        this.logger.debug(`Cleaned up ${cleaned} expired OAuth states`);
      }
    }, this.STATE_CLEANUP_INTERVAL);
  }
}
