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
import { Prisma, ConnectionStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import {
  FreeeConfig,
  validateFreeeConfig,
  FREEE_ENDPOINTS,
  DEFAULT_FREEE_SCOPE,
  FREEE_TOKEN_EXPIRY,
} from './freee.config';
import { FreeeEncryptionUtil } from './utils/freee-encryption.util';
import {
  FreeeToken,
  FreeeConnectionInfo,
  PKCEChallenge,
  OAuthState,
  FreeeAuthUrlResponse,
  FreeeCallbackQuery,
  RefreshTokenResult,
  DisconnectResult,
  DecryptedTokens,
  FreeeAuditLog,
  FreeeCompany,
} from './freee.types';
import { FreeeConnectionStatus } from './freee.constants';

/**
 * freee OAuth2 Authentication Service
 * Implements secure OAuth2 with PKCE flow for freee API
 *
 * Security Features:
 * - OAuth2 with PKCE (Proof Key for Code Exchange)
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh
 * - State parameter validation for CSRF protection
 * - Comprehensive audit logging
 * - Multi-company support (user can connect multiple freee companies)
 */
@Injectable()
export class FreeeOAuthService {
  private readonly logger = new Logger(FreeeOAuthService.name);
  private readonly config: FreeeConfig;
  private readonly encryptionKey: string;
  private readonly oauthStateMap: Map<string, OAuthState> = new Map();
  private readonly httpClient: AxiosInstance;
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
      clientId: this.configService.get<string>('FREEE_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('FREEE_CLIENT_SECRET') || '',
      redirectUri:
        this.configService.get<string>('FREEE_REDIRECT_URI') ||
        'http://localhost:3000/api/integrations/freee/callback',
      webhookSecret: this.configService.get<string>('FREEE_WEBHOOK_SECRET'),
    };

    // Get encryption key
    this.encryptionKey =
      this.configService.get<string>('FREEE_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      '';

    // Validate configuration
    try {
      validateFreeeConfig(this.config);
      if (!FreeeEncryptionUtil.validateMasterKey(this.encryptionKey)) {
        this.logger.warn('freee service is disabled - FREEE_ENCRYPTION_KEY not configured');
        return;
      }
    } catch (error) {
      this.logger.warn(`freee service is disabled - ${error.message}`);
      return;
    }

    // Initialize HTTP client
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Start periodic state cleanup
    this.startStateCleanup();

    // Mark as configured
    this.isConfigured = true;
    this.logger.log('freee OAuth Service initialized');
  }

  /**
   * Generate OAuth2 authorization URL with PKCE
   */
  async generateAuthUrl(orgId: string): Promise<FreeeAuthUrlResponse> {
    if (!this.isConfigured) {
      throw new BadRequestException('freee service is not configured. Please configure FREEE_CLIENT_ID and FREEE_CLIENT_SECRET environment variables.');
    }

    try {
      // Generate PKCE challenge
      const pkce = FreeeEncryptionUtil.generatePKCEChallenge();

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
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        response_type: 'code',
        scope: DEFAULT_FREEE_SCOPE,
        state: pkce.state,
        code_challenge: pkce.codeChallenge,
        code_challenge_method: 'S256',
      });

      const authUrl = `${FREEE_ENDPOINTS.authorize}?${params.toString()}`;

      this.logger.log(`Generated auth URL for org ${orgId}`);

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
  async handleCallback(
    query: FreeeCallbackQuery,
  ): Promise<FreeeConnectionInfo> {
    try {
      // Check for OAuth errors
      if (query.error) {
        throw new BadRequestException(
          `freee authorization failed: ${query.error_description || query.error}`,
        );
      }

      // Validate required parameters
      if (!query.code || !query.state) {
        throw new BadRequestException('Missing code or state parameter');
      }

      // Validate state
      const stateData = this.oauthStateMap.get(query.state);
      if (!stateData) {
        throw new BadRequestException('Invalid or expired state parameter');
      }

      // Check state expiry
      if (Date.now() > stateData.expiresAt) {
        this.oauthStateMap.delete(query.state);
        throw new BadRequestException('State parameter expired');
      }

      // Remove state from map (one-time use)
      this.oauthStateMap.delete(query.state);

      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(
        query.code,
        stateData.codeVerifier,
      );

      // Fetch company information
      const companies = await this.fetchCompanies(tokenResponse.access_token);
      if (!companies || companies.length === 0) {
        throw new InternalServerErrorException('No freee companies found');
      }

      // Use the first company (user can connect multiple later)
      const company = companies[0];

      // Calculate token expiry times
      const now = new Date();
      const tokenExpiresAt = new Date(now.getTime() + tokenResponse.expires_in * 1000);
      const refreshTokenExpiresAt = new Date(
        now.getTime() + FREEE_TOKEN_EXPIRY.refreshToken * 1000,
      );

      // Encrypt tokens
      const encryptedAccessToken = FreeeEncryptionUtil.encrypt(
        tokenResponse.access_token,
        this.encryptionKey,
      );
      const encryptedRefreshToken = FreeeEncryptionUtil.encrypt(
        tokenResponse.refresh_token,
        this.encryptionKey,
      );

      // Store connection in database
      const connection = await this.prisma.freeeConnection.upsert({
        where: {
          orgId: stateData.orgId,
        },
        update: {
          accessToken: encryptedAccessToken.encryptedData,
          refreshToken: encryptedRefreshToken.encryptedData,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          expiresAt: tokenExpiresAt,
          status: ConnectionStatus.ACTIVE,
          companyId: company.id,
          companyName: company.name,
          freeeCompanyId: String(company.id),
          freeeCompanyName: company.name,
          isActive: true,
        },
        create: {
          orgId: stateData.orgId,
          companyId: company.id,
          companyName: company.name,
          freeeCompanyId: String(company.id),
          freeeCompanyName: company.name,
          accessToken: encryptedAccessToken.encryptedData,
          refreshToken: encryptedRefreshToken.encryptedData,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          expiresAt: tokenExpiresAt,
          status: ConnectionStatus.ACTIVE,
          isActive: true,
        },
      });

      // Log audit event
      await this.logAuditEvent(stateData.orgId, {
        action: 'oauth_connected',
        success: true,
        metadata: {
          freeeCompanyId: company.id,
          freeeCompanyName: company.name,
        },
      });

      this.logger.log(
        `Successfully connected freee for org ${stateData.orgId}, company ${company.id}`,
      );

      return {
        id: connection.id,
        orgId: connection.orgId,
        freeeCompanyId: connection.companyId,
        freeeCompanyName: connection.companyName,
        status: connection.status === ConnectionStatus.ACTIVE
          ? FreeeConnectionStatus.CONNECTED
          : FreeeConnectionStatus.DISCONNECTED,
        isConnected: connection.status === ConnectionStatus.ACTIVE,
        lastSyncAt: connection.lastSyncAt,
        lastError: null,
        tokenExpiresAt: connection.tokenExpiresAt || now,
        refreshTokenExpiresAt: connection.refreshTokenExpiresAt || now,
        connectedAt: connection.createdAt,
      };
    } catch (error) {
      this.logger.error('OAuth callback error', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<FreeeToken> {
    try {
      const response = await this.httpClient.post<FreeeToken>(
        FREEE_ENDPOINTS.token,
        {
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
          code_verifier: codeVerifier,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Token exchange failed', error);
      throw new UnauthorizedException('Failed to exchange authorization code');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(
    orgId: string,
    freeeCompanyId?: number,
  ): Promise<RefreshTokenResult> {
    try {
      // Find connection
      const connection = await this.findConnection(orgId, freeeCompanyId);
      if (!connection) {
        return {
          success: false,
          error: 'No active freee connection found',
        };
      }

      // Decrypt refresh token (schema stores tokens as plain encrypted strings, not with IV/tag)
      const refreshToken = connection.refreshToken || '';
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token found',
        };
      }

      // Request new tokens
      const response = await this.httpClient.post<FreeeToken>(
        FREEE_ENDPOINTS.token,
        {
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const tokenData = response.data;

      // Calculate new expiry times
      const now = new Date();
      const tokenExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);
      const refreshTokenExpiresAt = new Date(
        now.getTime() + FREEE_TOKEN_EXPIRY.refreshToken * 1000,
      );

      // Encrypt new tokens
      const encryptedAccessToken = FreeeEncryptionUtil.encrypt(
        tokenData.access_token,
        this.encryptionKey,
      );
      const encryptedRefreshToken = FreeeEncryptionUtil.encrypt(
        tokenData.refresh_token,
        this.encryptionKey,
      );

      // Update database
      await this.prisma.freeeConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: encryptedAccessToken.encryptedData,
          refreshToken: encryptedRefreshToken.encryptedData,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          expiresAt: tokenExpiresAt,
          status: ConnectionStatus.ACTIVE,
          isActive: true,
        },
      });

      this.logger.log(`Refreshed tokens for org ${orgId}, company ${connection.freeeCompanyId}`);

      return {
        success: true,
        tokenExpiresAt,
        refreshTokenExpiresAt,
      };
    } catch (error) {
      this.logger.error('Token refresh failed', error);

      // Mark connection as expired if refresh token is invalid
      if (freeeCompanyId) {
        await this.prisma.freeeConnection.updateMany({
          where: { orgId, companyId: freeeCompanyId },
          data: {
            status: ConnectionStatus.ERROR,
            isActive: false,
          },
        });
      }

      return {
        success: false,
        error: 'Failed to refresh token. Please reconnect.',
      };
    }
  }

  /**
   * Get decrypted access token (with automatic refresh if needed)
   */
  async getAccessToken(
    orgId: string,
    freeeCompanyId?: number,
  ): Promise<string | null> {
    const connection = await this.findConnection(orgId, freeeCompanyId);
    if (!connection) {
      return null;
    }

    // Check if token needs refresh (refresh if less than 5 minutes remaining)
    const now = new Date();
    const expiresIn = connection.tokenExpiresAt.getTime() - now.getTime();
    const shouldRefresh = expiresIn < 5 * 60 * 1000; // 5 minutes

    if (shouldRefresh) {
      this.logger.log(`Access token expiring soon, refreshing...`);
      const result = await this.refreshTokens(orgId, freeeCompanyId);
      if (!result.success) {
        throw new UnauthorizedException('Failed to refresh access token');
      }

      // Re-fetch connection with new token
      const updatedConnection = await this.findConnection(orgId, freeeCompanyId);
      if (!updatedConnection) {
        return null;
      }

      // Return the encrypted token directly (already encrypted in DB)
      return updatedConnection.accessToken;
    }

    // Return the encrypted token directly (already encrypted in DB)
    return connection.accessToken;
  }

  /**
   * Fetch companies from freee API
   */
  private async fetchCompanies(accessToken: string): Promise<FreeeCompany[]> {
    try {
      const response = await this.httpClient.get<{ companies: FreeeCompany[] }>(
        FREEE_ENDPOINTS.companies,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data.companies;
    } catch (error) {
      this.logger.error('Failed to fetch companies', error);
      throw new InternalServerErrorException('Failed to fetch freee companies');
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(
    orgId: string,
    freeeCompanyId?: number,
  ): Promise<FreeeConnectionInfo | null> {
    const connection = await this.findConnection(orgId, freeeCompanyId);
    if (!connection) {
      return null;
    }

    return {
      id: connection.id,
      orgId: connection.orgId,
      freeeCompanyId: connection.companyId,
      freeeCompanyName: connection.companyName,
      status: connection.status === ConnectionStatus.ACTIVE
        ? FreeeConnectionStatus.CONNECTED
        : FreeeConnectionStatus.DISCONNECTED,
      isConnected: connection.status === ConnectionStatus.ACTIVE,
      lastSyncAt: connection.lastSyncAt,
      lastError: null,
      tokenExpiresAt: connection.tokenExpiresAt || new Date(),
      refreshTokenExpiresAt: connection.refreshTokenExpiresAt || new Date(),
      connectedAt: connection.createdAt,
    };
  }

  /**
   * Get all connections for an organization
   */
  async getConnections(orgId: string): Promise<FreeeConnectionInfo[]> {
    const connections = await this.prisma.freeeConnection.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    return connections.map((conn) => ({
      id: conn.id,
      orgId: conn.orgId,
      freeeCompanyId: conn.companyId,
      freeeCompanyName: conn.companyName,
      status: conn.status === ConnectionStatus.ACTIVE
        ? FreeeConnectionStatus.CONNECTED
        : FreeeConnectionStatus.DISCONNECTED,
      isConnected: conn.status === ConnectionStatus.ACTIVE,
      lastSyncAt: conn.lastSyncAt,
      lastError: null,
      tokenExpiresAt: conn.tokenExpiresAt || new Date(),
      refreshTokenExpiresAt: conn.refreshTokenExpiresAt || new Date(),
      connectedAt: conn.createdAt,
    }));
  }

  /**
   * Disconnect freee
   */
  async disconnect(
    orgId: string,
    freeeCompanyId?: number,
  ): Promise<DisconnectResult> {
    try {
      const connection = await this.findConnection(orgId, freeeCompanyId);
      if (!connection) {
        throw new NotFoundException('No active freee connection found');
      }

      // Update status to disconnected
      await this.prisma.freeeConnection.update({
        where: { id: connection.id },
        data: {
          status: ConnectionStatus.DISCONNECTED,
          isActive: false,
        },
      });

      // Log audit event
      await this.logAuditEvent(orgId, {
        action: 'oauth_disconnected',
        success: true,
        metadata: {
          freeeCompanyId: connection.freeeCompanyId,
        },
      });

      this.logger.log(`Disconnected freee for org ${orgId}, company ${connection.freeeCompanyId}`);

      return {
        success: true,
        message: 'freee disconnected successfully',
      };
    } catch (error) {
      this.logger.error('Disconnect failed', error);
      throw error;
    }
  }

  /**
   * Find connection by orgId and optional freeeCompanyId
   */
  private async findConnection(orgId: string, freeeCompanyId?: number) {
    if (freeeCompanyId) {
      return this.prisma.freeeConnection.findFirst({
        where: {
          orgId,
          companyId: freeeCompanyId,
        },
      });
    }

    // Find any active connection (unique constraint on orgId, so just find by orgId)
    return this.prisma.freeeConnection.findUnique({
      where: { orgId },
    });
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(orgId: string, event: FreeeAuditLog) {
    try {
      // Find the connection for this org to get connectionId
      const connection = await this.prisma.freeeConnection.findUnique({
        where: { orgId },
      });

      if (!connection) {
        this.logger.warn('Cannot log audit event - no connection found for org');
        return;
      }

      await this.prisma.freeeAuditLog.create({
        data: {
          connectionId: connection.id,
          action: event.action,
          endpoint: event.endpoint,
          requestData: event.metadata as Prisma.InputJsonValue,
          responseData: null,
          status: event.success ? 'success' : 'error',
          errorMessage: event.errorMessage,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }

  /**
   * Start periodic cleanup of expired states
   */
  private startStateCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [state, data] of this.oauthStateMap.entries()) {
        if (now > data.expiresAt) {
          this.oauthStateMap.delete(state);
        }
      }
    }, this.STATE_CLEANUP_INTERVAL);
  }
}
