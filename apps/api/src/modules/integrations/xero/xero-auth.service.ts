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
import { XeroClient } from 'xero-node';
import {
  XeroConfig,
  DEFAULT_XERO_SCOPE,
  XERO_TOKEN_EXPIRY,
  validateXeroConfig,
  XERO_ENDPOINTS,
} from './xero.config';
import { XeroEncryptionUtil } from './utils/xero-encryption.util';
import {
  XeroToken,
  XeroConnectionInfo,
  PKCEChallenge,
  OAuthState,
  XeroAuthUrlResponse,
  XeroCallbackQuery,
  RefreshTokenResult,
  DisconnectResult,
  DecryptedTokens,
  XeroAuditLog,
  XeroTenant,
} from './xero.types';

/**
 * Xero OAuth2 Authentication Service
 * Implements secure OAuth2 with PKCE flow for Xero API
 *
 * Security Features:
 * - OAuth2 with PKCE (Proof Key for Code Exchange)
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh
 * - State parameter validation for CSRF protection
 * - Comprehensive audit logging
 * - Multi-tenant support (user can connect multiple Xero organizations)
 */
@Injectable()
export class XeroAuthService {
  private readonly logger = new Logger(XeroAuthService.name);
  private readonly config: XeroConfig;
  private readonly xeroClient: XeroClient;
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
      clientId: this.configService.get<string>('XERO_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('XERO_CLIENT_SECRET') || '',
      redirectUri:
        this.configService.get<string>('XERO_REDIRECT_URI') ||
        'http://localhost:3000/api/integrations/xero/callback',
      webhookKey: this.configService.get<string>('XERO_WEBHOOK_KEY'),
    };

    // Get encryption key
    this.encryptionKey =
      this.configService.get<string>('XERO_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      '';

    // Validate configuration
    try {
      validateXeroConfig(this.config);
      if (!XeroEncryptionUtil.validateMasterKey(this.encryptionKey)) {
        this.logger.warn('Xero service is disabled - XERO_ENCRYPTION_KEY not configured');
        return;
      }
    } catch (error) {
      this.logger.warn(`Xero service is disabled - ${error.message}`);
      return;
    }

    // Initialize Xero client
    this.xeroClient = new XeroClient({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUris: [this.config.redirectUri],
      scopes: DEFAULT_XERO_SCOPE.split(' '),
    });

    // Start periodic state cleanup
    this.startStateCleanup();

    // Mark as configured
    (this as any).isConfigured = true;
    this.logger.log('Xero Auth Service initialized');
  }

  /**
   * Generate OAuth2 authorization URL with PKCE
   */
  async generateAuthUrl(orgId: string): Promise<XeroAuthUrlResponse> {
    if (!this.isConfigured) {
      throw new BadRequestException('Xero service is not configured. Please configure XERO_CLIENT_ID and XERO_CLIENT_SECRET environment variables.');
    }

    try {
      // Generate PKCE challenge
      const pkce = XeroEncryptionUtil.generatePKCEChallenge();

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
      const authUrl = await this.xeroClient.buildConsentUrl();

      // Add PKCE parameters and state to URL
      const urlWithPKCE = `${authUrl}&state=${pkce.state}&code_challenge=${pkce.codeChallenge}&code_challenge_method=S256`;

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
    query: XeroCallbackQuery,
  ): Promise<XeroConnectionInfo> {
    try {
      // Check for OAuth errors
      if (query.error) {
        throw new BadRequestException(
          `Xero authorization failed: ${query.error_description || query.error}`,
        );
      }

      // Validate required parameters
      if (!query.code || !query.state) {
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
      const tokenSet = await this.xeroClient.apiCallback(this.config.redirectUri + `?code=${query.code}&state=${query.state}`);

      if (!tokenSet || !tokenSet.access_token) {
        throw new InternalServerErrorException('Failed to exchange code for tokens');
      }

      // Get connected tenants (organizations)
      await this.xeroClient.updateTenants();
      const tenants = this.xeroClient.tenants;

      if (!tenants || tenants.length === 0) {
        throw new InternalServerErrorException('No Xero organizations found');
      }

      // For now, use the first tenant (user can connect multiple later)
      const tenant = tenants[0];

      // Encrypt tokens
      const encryptedAccess = XeroEncryptionUtil.encrypt(
        tokenSet.access_token,
        this.encryptionKey,
      );
      const encryptedRefresh = XeroEncryptionUtil.encrypt(
        tokenSet.refresh_token || '',
        this.encryptionKey,
      );

      // Calculate expiry times
      const now = new Date();
      const tokenExpiresAt = new Date(now.getTime() + (tokenSet.expires_in || XERO_TOKEN_EXPIRY.accessToken) * 1000);
      const refreshTokenExpiresAt = new Date(
        now.getTime() + XERO_TOKEN_EXPIRY.refreshToken * 1000,
      );

      // Save connection to database
      const connection = await this.prisma.xeroConnection.upsert({
        where: {
          orgId_xeroTenantId: {
            orgId: stateData.orgId,
            xeroTenantId: tenant.tenantId,
          },
        },
        create: {
          orgId: stateData.orgId,
          xeroTenantId: tenant.tenantId,
          xeroOrgName: tenant.tenantName,
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh.encryptedData,
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          status: 'CONNECTED',
          isConnected: true,
          connectedAt: now,
        },
        update: {
          xeroOrgName: tenant.tenantName,
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
          xeroTenantId: tenant.tenantId,
          xeroOrgName: tenant.tenantName,
        },
      });

      // Clean up state
      this.oauthStateMap.delete(query.state);

      this.logger.log(
        `Successfully connected Xero for org ${stateData.orgId}, tenant ${tenant.tenantId}`,
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
      throw new InternalServerErrorException('Failed to complete Xero authorization');
    }
  }

  /**
   * Get all connections for an organization
   */
  async getConnections(orgId: string): Promise<XeroConnectionInfo[]> {
    try {
      const connections = await this.prisma.xeroConnection.findMany({
        where: {
          orgId,
          isConnected: true,
        },
        orderBy: {
          connectedAt: 'desc',
        },
      });

      return connections.map((conn) => this.mapConnectionToInfo(conn));
    } catch (error) {
      this.logger.error(`Failed to get connections for org ${orgId}`, error);
      throw new InternalServerErrorException('Failed to retrieve connections');
    }
  }

  /**
   * Get connection status for a specific Xero tenant
   */
  async getConnectionStatus(
    orgId: string,
    xeroTenantId?: string,
  ): Promise<XeroConnectionInfo | null> {
    try {
      const where: any = {
        orgId,
        isConnected: true,
      };

      if (xeroTenantId) {
        where.xeroTenantId = xeroTenantId;
      }

      const connection = await this.prisma.xeroConnection.findFirst({
        where,
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
        await this.prisma.xeroConnection.update({
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
        now >= new Date(connection.tokenExpiresAt.getTime() - XERO_TOKEN_EXPIRY.refreshBuffer * 1000)
      ) {
        await this.refreshTokens(orgId, connection.xeroTenantId);
        // Fetch updated connection
        const updatedConnection = await this.prisma.xeroConnection.findUnique({
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
  async refreshTokens(orgId: string, xeroTenantId?: string): Promise<RefreshTokenResult> {
    try {
      const where: any = {
        orgId,
        isConnected: true,
      };

      if (xeroTenantId) {
        where.xeroTenantId = xeroTenantId;
      }

      const connection = await this.prisma.xeroConnection.findFirst({
        where,
        orderBy: {
          connectedAt: 'desc',
        },
      });

      if (!connection) {
        throw new NotFoundException('No active Xero connection found');
      }

      // Check if refresh token is expired
      if (new Date() >= connection.refreshTokenExpiresAt) {
        await this.prisma.xeroConnection.update({
          where: { id: connection.id },
          data: {
            status: 'EXPIRED',
            isConnected: false,
          },
        });
        throw new UnauthorizedException('Refresh token has expired. Please reconnect.');
      }

      // Decrypt refresh token
      const refreshToken = XeroEncryptionUtil.decrypt(
        connection.refreshToken,
        connection.encryptionIv,
        connection.encryptionTag,
        this.encryptionKey,
      );

      // Set refresh token and refresh
      this.xeroClient.setTokenSet({
        refresh_token: refreshToken,
      } as any);

      const tokenSet = await this.xeroClient.refreshToken();

      if (!tokenSet || !tokenSet.access_token) {
        throw new InternalServerErrorException('Failed to refresh tokens');
      }

      // Encrypt new tokens
      const encryptedAccess = XeroEncryptionUtil.encrypt(
        tokenSet.access_token,
        this.encryptionKey,
      );
      const encryptedRefresh = XeroEncryptionUtil.encrypt(
        tokenSet.refresh_token || refreshToken,
        this.encryptionKey,
      );

      // Calculate new expiry times
      const now = new Date();
      const tokenExpiresAt = new Date(now.getTime() + (tokenSet.expires_in || XERO_TOKEN_EXPIRY.accessToken) * 1000);
      const refreshTokenExpiresAt = new Date(
        now.getTime() + XERO_TOKEN_EXPIRY.refreshToken * 1000,
      );

      // Update connection
      await this.prisma.xeroConnection.update({
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
        const connection = await this.prisma.xeroConnection.findFirst({
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
   * Disconnect Xero for a specific tenant
   */
  async disconnect(orgId: string, xeroTenantId?: string): Promise<DisconnectResult> {
    try {
      const where: any = {
        orgId,
        isConnected: true,
      };

      if (xeroTenantId) {
        where.xeroTenantId = xeroTenantId;
      }

      const connection = await this.prisma.xeroConnection.findFirst({
        where,
      });

      if (!connection) {
        throw new NotFoundException('No active Xero connection found');
      }

      // Decrypt tokens to revoke them
      const accessToken = XeroEncryptionUtil.decrypt(
        connection.accessToken,
        connection.encryptionIv,
        connection.encryptionTag,
        this.encryptionKey,
      );

      // Set token in Xero client
      this.xeroClient.setTokenSet({
        access_token: accessToken,
      } as any);

      // Revoke tokens (best effort - don't fail if revocation fails)
      try {
        await this.xeroClient.revokeToken();
        this.logger.log(`Revoked Xero tokens for org ${orgId}`);
      } catch (revokeError) {
        this.logger.warn(`Failed to revoke tokens (continuing): ${revokeError.message}`);
      }

      // Update connection status
      await this.prisma.xeroConnection.update({
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

      this.logger.log(`Successfully disconnected Xero for org ${orgId}`);

      return {
        success: true,
        message: 'Xero disconnected successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to disconnect Xero for org ${orgId}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to disconnect Xero');
    }
  }

  /**
   * Get decrypted tokens for API calls (internal use)
   */
  async getDecryptedTokens(orgId: string, xeroTenantId?: string): Promise<DecryptedTokens & { tenantId: string }> {
    const where: any = {
      orgId,
      isConnected: true,
    };

    if (xeroTenantId) {
      where.xeroTenantId = xeroTenantId;
    }

    const connection = await this.prisma.xeroConnection.findFirst({
      where,
    });

    if (!connection) {
      throw new NotFoundException('No active Xero connection found');
    }

    // Auto-refresh if needed
    const now = new Date();
    if (
      now >= new Date(connection.tokenExpiresAt.getTime() - XERO_TOKEN_EXPIRY.refreshBuffer * 1000)
    ) {
      await this.refreshTokens(orgId, connection.xeroTenantId);
      // Fetch updated connection
      const updatedConnection = await this.prisma.xeroConnection.findUnique({
        where: { id: connection.id },
      });
      if (!updatedConnection) {
        throw new NotFoundException('Connection lost during token refresh');
      }
      return {
        ...this.decryptTokens(updatedConnection),
        tenantId: updatedConnection.xeroTenantId,
      };
    }

    return {
      ...this.decryptTokens(connection),
      tenantId: connection.xeroTenantId,
    };
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    connectionId: string,
    log: XeroAuditLog,
  ): Promise<void> {
    try {
      await this.prisma.xeroAuditLog.create({
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
    const accessToken = XeroEncryptionUtil.decrypt(
      connection.accessToken,
      connection.encryptionIv,
      connection.encryptionTag,
      this.encryptionKey,
    );

    const refreshToken = XeroEncryptionUtil.decrypt(
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
  private mapConnectionToInfo(connection: any): XeroConnectionInfo {
    return {
      id: connection.id,
      orgId: connection.orgId,
      xeroTenantId: connection.xeroTenantId,
      xeroOrgName: connection.xeroOrgName,
      status: connection.status,
      isConnected: connection.isConnected,
      lastSyncAt: connection.lastSyncAt,
      lastError: connection.lastError,
      tokenExpiresAt: connection.tokenExpiresAt,
      refreshTokenExpiresAt: connection.refreshTokenExpiresAt,
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
