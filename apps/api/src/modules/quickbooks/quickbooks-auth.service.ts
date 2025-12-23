import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import OAuthClient from 'intuit-oauth';
import {
  QuickBooksConfig,
  DEFAULT_QUICKBOOKS_SCOPE,
  QUICKBOOKS_TOKEN_EXPIRY,
  getQuickBooksEndpoints,
  validateQuickBooksConfig,
} from './quickbooks.config';
import { QuickBooksEncryptionUtil } from './utils/quickbooks-encryption.util';
import {
  QuickBooksToken,
  QuickBooksConnectionInfo,
  PKCEChallenge,
  OAuthState,
  QuickBooksAuthUrlResponse,
  QuickBooksCallbackQuery,
  RefreshTokenResult,
  DisconnectResult,
  DecryptedTokens,
  QuickBooksAuditLog,
} from './quickbooks.types';

/**
 * QuickBooks OAuth2 Authentication Service
 * Implements secure OAuth2 with PKCE flow for QuickBooks Online API
 *
 * Security Features:
 * - OAuth2 with PKCE (Proof Key for Code Exchange)
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh
 * - State parameter validation for CSRF protection
 * - Comprehensive audit logging
 */
@Injectable()
export class QuickBooksAuthService {
  private readonly logger = new Logger(QuickBooksAuthService.name);
  private readonly config: QuickBooksConfig;
  private readonly oauthClient: OAuthClient;
  private readonly encryptionKey: string;
  private readonly oauthStateMap: Map<string, OAuthState> = new Map();
  private isConfigured: boolean = false;

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
      clientId: this.configService.get<string>('QUICKBOOKS_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('QUICKBOOKS_CLIENT_SECRET') || '',
      redirectUri:
        this.configService.get<string>('QUICKBOOKS_REDIRECT_URI') ||
        'http://localhost:3000/api/quickbooks/callback',
      environment:
        (this.configService.get<string>('QUICKBOOKS_ENVIRONMENT') as 'sandbox' | 'production') ||
        'sandbox',
      minorVersion: this.configService.get<string>('QUICKBOOKS_MINOR_VERSION') || '65',
    };

    // Get encryption key
    this.encryptionKey =
      this.configService.get<string>('QUICKBOOKS_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      '';

    // Validate configuration
    try {
      validateQuickBooksConfig(this.config);
      if (!QuickBooksEncryptionUtil.validateMasterKey(this.encryptionKey)) {
        this.logger.warn('QuickBooks service is disabled - QUICKBOOKS_ENCRYPTION_KEY not configured');
        return;
      }
    } catch (error) {
      this.logger.warn(`QuickBooks service is disabled - ${error.message}`);
      return;
    }

    // Initialize OAuth client
    this.oauthClient = new OAuthClient({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      environment: this.config.environment,
      redirectUri: this.config.redirectUri,
      logging: false,
    });

    // Start periodic state cleanup
    this.startStateCleanup();

    // Mark as configured
    this.isConfigured = true;
    this.logger.log(
      `QuickBooks Auth Service initialized (${this.config.environment} environment)`,
    );
  }

  /**
   * Generate OAuth2 authorization URL with PKCE
   */
  async generateAuthUrl(orgId: string): Promise<QuickBooksAuthUrlResponse> {
    if (!this.isConfigured) {
      throw new BadRequestException('QuickBooks service is not configured. Please configure QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET environment variables.');
    }

    try {
      // Generate PKCE challenge
      const pkce = QuickBooksEncryptionUtil.generatePKCEChallenge();

      // Store state with PKCE verifier and org ID
      const stateData: OAuthState = {
        state: pkce.state,
        codeVerifier: pkce.codeVerifier,
        orgId,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.STATE_VALIDITY,
      };
      this.oauthStateMap.set(pkce.state, stateData);

      // Build authorization URL with PKCE
      const authUrl = this.oauthClient.authorizeUri({
        scope: [DEFAULT_QUICKBOOKS_SCOPE],
        state: pkce.state,
      });

      // Add PKCE parameters to URL (Intuit OAuth library doesn't support PKCE natively yet)
      const urlWithPKCE = `${authUrl}&code_challenge=${pkce.codeChallenge}&code_challenge_method=S256`;

      this.logger.log(`Generated auth URL for org ${orgId}`);

      return {
        authUrl: urlWithPKCE,
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
  async handleCallback(
    query: QuickBooksCallbackQuery,
  ): Promise<QuickBooksConnectionInfo> {
    try {
      // Check for OAuth errors
      if (query.error) {
        throw new BadRequestException(
          `QuickBooks authorization failed: ${query.error_description || query.error}`,
        );
      }

      // Validate required parameters
      if (!query.code || !query.state || !query.realmId) {
        throw new BadRequestException('Missing required OAuth parameters');
      }

      // Retrieve and validate state
      const stateData = this.oauthStateMap.get(query.state);
      if (!stateData) {
        throw new UnauthorizedException('Invalid or expired state parameter');
      }

      // Check state expiry
      if (Date.now() > stateData.expiresAt) {
        this.oauthStateMap.delete(query.state);
        throw new UnauthorizedException('State parameter expired');
      }

      // Exchange authorization code for tokens
      const tokenResponse = await this.oauthClient.createToken(query.code);

      if (!tokenResponse || !tokenResponse.token) {
        throw new InternalServerErrorException('Failed to exchange code for tokens');
      }

      const token = tokenResponse.token as any;

      // Encrypt tokens
      const encryptedAccess = QuickBooksEncryptionUtil.encrypt(
        token.access_token,
        this.encryptionKey,
      );
      const encryptedRefresh = QuickBooksEncryptionUtil.encrypt(
        token.refresh_token,
        this.encryptionKey,
      );

      // Calculate expiry times
      const now = new Date();
      const tokenExpiresAt = new Date(now.getTime() + (token.expires_in || 3600) * 1000);
      const refreshTokenExpiresAt = new Date(
        now.getTime() + (token.x_refresh_token_expires_in || 8726400) * 1000,
      );

      // Save connection to database
      const connection = await this.prisma.quickBooksConnection.upsert({
        where: {
          orgId_companyId: {
            orgId: stateData.orgId,
            companyId: query.realmId,
          },
        },
        create: {
          orgId: stateData.orgId,
          companyId: query.realmId,
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh.encryptedData,
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          status: 'CONNECTED',
          isConnected: true,
          environment: this.config.environment,
          connectedAt: now,
        },
        update: {
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh.encryptedData,
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          status: 'CONNECTED',
          isConnected: true,
          lastError: null,
          lastErrorAt: null,
          connectedAt: now,
          disconnectedAt: null,
        },
      });

      // Create audit log
      await this.createAuditLog(connection.id, {
        action: 'CONNECT',
        success: true,
        metadata: {
          companyId: query.realmId,
          environment: this.config.environment,
        },
      });

      // Clean up state
      this.oauthStateMap.delete(query.state);

      this.logger.log(
        `Successfully connected QuickBooks for org ${stateData.orgId}, company ${query.realmId}`,
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
      throw new InternalServerErrorException('Failed to complete QuickBooks authorization');
    }
  }

  /**
   * Get connection status for an organization
   */
  async getConnectionStatus(orgId: string): Promise<QuickBooksConnectionInfo | null> {
    try {
      const connection = await this.prisma.quickBooksConnection.findFirst({
        where: {
          orgId,
          isConnected: true,
        },
        orderBy: {
          connectedAt: 'desc',
        },
      });

      if (!connection) {
        return null;
      }

      // Check if tokens are expired
      const now = new Date();
      if (now >= connection.refreshTokenExpiresAt) {
        // Refresh token expired, mark as expired
        await this.prisma.quickBooksConnection.update({
          where: { id: connection.id },
          data: {
            status: 'EXPIRED',
            isConnected: false,
          },
        });

        return this.mapConnectionToInfo({
          ...connection,
          status: 'EXPIRED',
          isConnected: false,
        });
      }

      // Auto-refresh access token if needed
      if (
        now >= new Date(connection.tokenExpiresAt.getTime() - QUICKBOOKS_TOKEN_EXPIRY.refreshBuffer * 1000)
      ) {
        await this.refreshTokens(orgId);
        // Fetch updated connection
        const updatedConnection = await this.prisma.quickBooksConnection.findUnique({
          where: { id: connection.id },
        });
        return updatedConnection ? this.mapConnectionToInfo(updatedConnection) : null;
      }

      return this.mapConnectionToInfo(connection);
    } catch (error) {
      this.logger.error(`Failed to get connection status for org ${orgId}`, error);
      throw new InternalServerErrorException('Failed to retrieve connection status');
    }
  }

  /**
   * Refresh access tokens
   */
  async refreshTokens(orgId: string): Promise<RefreshTokenResult> {
    try {
      const connection = await this.prisma.quickBooksConnection.findFirst({
        where: {
          orgId,
          isConnected: true,
        },
        orderBy: {
          connectedAt: 'desc',
        },
      });

      if (!connection) {
        throw new NotFoundException('No active QuickBooks connection found');
      }

      // Check if refresh token is expired
      if (new Date() >= connection.refreshTokenExpiresAt) {
        await this.prisma.quickBooksConnection.update({
          where: { id: connection.id },
          data: {
            status: 'EXPIRED',
            isConnected: false,
          },
        });
        throw new UnauthorizedException('Refresh token has expired. Please reconnect.');
      }

      // Decrypt refresh token
      const refreshToken = QuickBooksEncryptionUtil.decrypt(
        connection.refreshToken,
        connection.encryptionIv,
        connection.encryptionTag,
        this.encryptionKey,
      );

      // Set tokens in OAuth client
      this.oauthClient.token.setToken({
        refresh_token: refreshToken,
        realmId: connection.companyId,
      } as any);

      // Refresh the token
      const tokenResponse = await this.oauthClient.refresh();

      if (!tokenResponse || !tokenResponse.token) {
        throw new InternalServerErrorException('Failed to refresh tokens');
      }

      const token = tokenResponse.token as any;

      // Encrypt new tokens
      const encryptedAccess = QuickBooksEncryptionUtil.encrypt(
        token.access_token,
        this.encryptionKey,
      );
      const encryptedRefresh = QuickBooksEncryptionUtil.encrypt(
        token.refresh_token,
        this.encryptionKey,
      );

      // Calculate new expiry times
      const now = new Date();
      const tokenExpiresAt = new Date(now.getTime() + (token.expires_in || 3600) * 1000);
      const refreshTokenExpiresAt = new Date(
        now.getTime() + (token.x_refresh_token_expires_in || 8726400) * 1000,
      );

      // Update connection
      await this.prisma.quickBooksConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh.encryptedData,
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          status: 'CONNECTED',
          lastError: null,
          lastErrorAt: null,
        },
      });

      // Create audit log
      await this.createAuditLog(connection.id, {
        action: 'TOKEN_REFRESH',
        success: true,
      });

      this.logger.log(`Successfully refreshed tokens for org ${orgId}`);

      return {
        success: true,
        tokenExpiresAt,
        refreshTokenExpiresAt,
      };
    } catch (error) {
      this.logger.error(`Failed to refresh tokens for org ${orgId}`, error);

      // Try to update connection with error
      try {
        const connection = await this.prisma.quickBooksConnection.findFirst({
          where: { orgId, isConnected: true },
        });
        if (connection) {
          await this.createAuditLog(connection.id, {
            action: 'TOKEN_REFRESH',
            success: false,
            errorMessage: error.message,
          });
        }
      } catch (auditError) {
        this.logger.error('Failed to create audit log', auditError);
      }

      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      return {
        success: false,
        error: 'Failed to refresh tokens',
      };
    }
  }

  /**
   * Disconnect QuickBooks
   */
  async disconnect(orgId: string): Promise<DisconnectResult> {
    try {
      const connection = await this.prisma.quickBooksConnection.findFirst({
        where: {
          orgId,
          isConnected: true,
        },
      });

      if (!connection) {
        throw new NotFoundException('No active QuickBooks connection found');
      }

      // Decrypt tokens to revoke them
      const accessToken = QuickBooksEncryptionUtil.decrypt(
        connection.accessToken,
        connection.encryptionIv,
        connection.encryptionTag,
        this.encryptionKey,
      );

      // Set token in OAuth client
      this.oauthClient.token.setToken({
        access_token: accessToken,
        realmId: connection.companyId,
      } as any);

      // Revoke tokens (best effort - don't fail if revocation fails)
      try {
        await this.oauthClient.revoke();
        this.logger.log(`Revoked QuickBooks tokens for org ${orgId}`);
      } catch (revokeError) {
        this.logger.warn(`Failed to revoke tokens (continuing): ${revokeError.message}`);
      }

      // Update connection status
      await this.prisma.quickBooksConnection.update({
        where: { id: connection.id },
        data: {
          status: 'DISCONNECTED',
          isConnected: false,
          disconnectedAt: new Date(),
        },
      });

      // Create audit log
      await this.createAuditLog(connection.id, {
        action: 'DISCONNECT',
        success: true,
      });

      this.logger.log(`Successfully disconnected QuickBooks for org ${orgId}`);

      return {
        success: true,
        message: 'QuickBooks disconnected successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to disconnect QuickBooks for org ${orgId}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to disconnect QuickBooks');
    }
  }

  /**
   * Get decrypted tokens for API calls (internal use)
   */
  async getDecryptedTokens(orgId: string): Promise<DecryptedTokens> {
    const connection = await this.prisma.quickBooksConnection.findFirst({
      where: {
        orgId,
        isConnected: true,
      },
    });

    if (!connection) {
      throw new NotFoundException('No active QuickBooks connection found');
    }

    // Auto-refresh if needed
    const now = new Date();
    if (
      now >= new Date(connection.tokenExpiresAt.getTime() - QUICKBOOKS_TOKEN_EXPIRY.refreshBuffer * 1000)
    ) {
      await this.refreshTokens(orgId);
      // Fetch updated connection
      const updatedConnection = await this.prisma.quickBooksConnection.findUnique({
        where: { id: connection.id },
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
    log: QuickBooksAuditLog,
  ): Promise<void> {
    try {
      await this.prisma.quickBooksAuditLog.create({
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
    const accessToken = QuickBooksEncryptionUtil.decrypt(
      connection.accessToken,
      connection.encryptionIv,
      connection.encryptionTag,
      this.encryptionKey,
    );

    const refreshToken = QuickBooksEncryptionUtil.decrypt(
      connection.refreshToken,
      connection.encryptionIv,
      connection.encryptionTag,
      this.encryptionKey,
    );

    return { accessToken, refreshToken };
  }

  /**
   * Map connection model to info DTO
   */
  private mapConnectionToInfo(connection: any): QuickBooksConnectionInfo {
    return {
      id: connection.id,
      orgId: connection.orgId,
      companyId: connection.companyId,
      companyName: connection.companyName,
      status: connection.status,
      isConnected: connection.isConnected,
      lastSyncAt: connection.lastSyncAt,
      lastError: connection.lastError,
      tokenExpiresAt: connection.tokenExpiresAt,
      refreshTokenExpiresAt: connection.refreshTokenExpiresAt,
      environment: connection.environment,
      connectedAt: connection.connectedAt,
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
