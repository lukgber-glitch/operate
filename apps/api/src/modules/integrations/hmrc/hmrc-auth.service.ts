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
import axios, { AxiosInstance } from 'axios';
import {
  HmrcConfig,
  HmrcToken,
  HmrcConnectionInfo,
  PKCEChallenge,
  OAuthState,
  HmrcAuthUrlResponse,
  HmrcCallbackQuery,
  RefreshTokenResult,
  DisconnectResult,
  DecryptedTokens,
  HmrcAuditLog,
  HmrcConnectionStatus,
} from './interfaces/hmrc.interface';
import {
  DEFAULT_HMRC_SCOPE,
  HMRC_TOKEN_EXPIRY,
  getHmrcEndpoints,
  validateHmrcConfig,
} from './hmrc.config';
import { HmrcEncryptionUtil } from './utils/hmrc-encryption.util';
import { HmrcFraudPreventionUtil } from './utils/hmrc-fraud-prevention.util';

/**
 * HMRC MTD OAuth2 Authentication Service
 *
 * Implements secure OAuth2 with PKCE flow for HMRC Making Tax Digital API
 *
 * Security Features:
 * - OAuth2 with PKCE (Proof Key for Code Exchange) - RFC 7636
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh before expiry
 * - State parameter validation for CSRF protection
 * - Comprehensive audit logging
 * - Fraud prevention headers (HMRC requirement)
 *
 * @see https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation
 */
@Injectable()
export class HmrcAuthService {
  private readonly logger = new Logger(HmrcAuthService.name);
  private readonly config: HmrcConfig;
  private readonly endpoints: ReturnType<typeof getHmrcEndpoints>;
  private readonly encryptionKey: string;
  private readonly httpClient: AxiosInstance;
  private readonly oauthStateMap: Map<string, OAuthState> = new Map();

  // State cleanup interval (10 minutes)
  private readonly STATE_CLEANUP_INTERVAL = 10 * 60 * 1000;
  // State validity duration (15 minutes)
  private readonly STATE_VALIDITY = 15 * 60 * 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration from environment
    this.config = {
      clientId: this.configService.get<string>('HMRC_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('HMRC_CLIENT_SECRET') || '',
      redirectUri:
        this.configService.get<string>('HMRC_REDIRECT_URI') ||
        'http://localhost:3000/api/integrations/hmrc/callback',
      environment:
        (this.configService.get<string>('HMRC_SANDBOX') === 'true' ? 'sandbox' : 'production'),
    };

    // Validate configuration
    validateHmrcConfig(this.config);

    // Get endpoints based on environment
    this.endpoints = getHmrcEndpoints(this.config.environment);

    // Get encryption key (use JWT secret as fallback)
    this.encryptionKey =
      this.configService.get<string>('HMRC_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      '';

    if (!HmrcEncryptionUtil.validateMasterKey(this.encryptionKey)) {
      throw new Error('Invalid or missing HMRC_ENCRYPTION_KEY');
    }

    // Initialize HTTP client
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.hmrc.1.0+json',
      },
    });

    // Start periodic state cleanup
    this.startStateCleanup();

    this.logger.log(
      `HMRC Auth Service initialized (${this.config.environment} environment)`,
    );
  }

  /**
   * Generate OAuth2 authorization URL with PKCE
   */
  async generateAuthUrl(orgId: string): Promise<HmrcAuthUrlResponse> {
    try {
      // Generate PKCE challenge
      const pkce = HmrcEncryptionUtil.generatePKCEChallenge();

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
        response_type: 'code',
        scope: DEFAULT_HMRC_SCOPE,
        redirect_uri: this.config.redirectUri,
        state: pkce.state,
        code_challenge: pkce.codeChallenge,
        code_challenge_method: 'S256',
      });

      const authUrl = `${this.endpoints.authorizationUrl}?${params.toString()}`;

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
    query: HmrcCallbackQuery,
    vrn: string,
  ): Promise<HmrcConnectionInfo> {
    try {
      // Check for OAuth errors
      if (query.error) {
        throw new BadRequestException(
          `HMRC authorization failed: ${query.error_description || query.error}`,
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
      const tokenResponse = await this.exchangeCodeForTokens(
        query.code,
        stateData.codeVerifier,
      );

      // Encrypt tokens
      const encryptedAccess = HmrcEncryptionUtil.encrypt(
        tokenResponse.access_token,
        this.encryptionKey,
      );
      const encryptedRefresh = HmrcEncryptionUtil.encrypt(
        tokenResponse.refresh_token,
        this.encryptionKey,
      );

      // Calculate expiry times
      const now = new Date();
      const tokenExpiresAt = new Date(now.getTime() + tokenResponse.expires_in * 1000);
      const refreshTokenExpiresAt = new Date(
        now.getTime() + HMRC_TOKEN_EXPIRY.refreshTokenTtl * 1000,
      );

      // Save connection to database
      const connection = await this.prisma.hmrcConnection.upsert({
        where: {
          orgId_vrn: {
            orgId: stateData.orgId,
            vrn,
          },
        },
        create: {
          orgId: stateData.orgId,
          vrn,
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh.encryptedData,
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          status: HmrcConnectionStatus.CONNECTED,
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
          status: HmrcConnectionStatus.CONNECTED,
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
          vrn,
          environment: this.config.environment,
        },
      });

      // Clean up state
      this.oauthStateMap.delete(query.state);

      this.logger.log(
        `Successfully connected HMRC for org ${stateData.orgId}, VRN ${vrn}`,
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
      throw new InternalServerErrorException('Failed to complete HMRC authorization');
    }
  }

  /**
   * Get connection status for an organization
   */
  async getConnectionStatus(orgId: string): Promise<HmrcConnectionInfo | null> {
    try {
      const connection = await this.prisma.hmrcConnection.findFirst({
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
        await this.prisma.hmrcConnection.update({
          where: { id: connection.id },
          data: {
            status: HmrcConnectionStatus.EXPIRED,
            isConnected: false,
          },
        });

        return this.mapConnectionToInfo({
          ...connection,
          status: HmrcConnectionStatus.EXPIRED,
          isConnected: false,
        });
      }

      // Auto-refresh access token if needed
      if (
        now >= new Date(connection.tokenExpiresAt.getTime() - HMRC_TOKEN_EXPIRY.refreshBuffer * 1000)
      ) {
        await this.refreshTokens(orgId);
        // Fetch updated connection
        const updatedConnection = await this.prisma.hmrcConnection.findUnique({
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
      const connection = await this.prisma.hmrcConnection.findFirst({
        where: {
          orgId,
          isConnected: true,
        },
        orderBy: {
          connectedAt: 'desc',
        },
      });

      if (!connection) {
        throw new NotFoundException('No active HMRC connection found');
      }

      // Check if refresh token is expired
      if (new Date() >= connection.refreshTokenExpiresAt) {
        await this.prisma.hmrcConnection.update({
          where: { id: connection.id },
          data: {
            status: HmrcConnectionStatus.EXPIRED,
            isConnected: false,
          },
        });
        throw new UnauthorizedException('Refresh token has expired. Please reconnect.');
      }

      // Decrypt refresh token
      const refreshToken = HmrcEncryptionUtil.decrypt(
        connection.refreshToken,
        connection.encryptionIv,
        connection.encryptionTag,
        this.encryptionKey,
      );

      // Refresh the token
      const tokenResponse = await this.refreshAccessToken(refreshToken);

      // Encrypt new tokens
      const encryptedAccess = HmrcEncryptionUtil.encrypt(
        tokenResponse.access_token,
        this.encryptionKey,
      );
      const encryptedRefresh = HmrcEncryptionUtil.encrypt(
        tokenResponse.refresh_token,
        this.encryptionKey,
      );

      // Calculate new expiry times
      const now = new Date();
      const tokenExpiresAt = new Date(now.getTime() + tokenResponse.expires_in * 1000);
      const refreshTokenExpiresAt = new Date(
        now.getTime() + HMRC_TOKEN_EXPIRY.refreshTokenTtl * 1000,
      );

      // Update connection
      await this.prisma.hmrcConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh.encryptedData,
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          status: HmrcConnectionStatus.CONNECTED,
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
        const connection = await this.prisma.hmrcConnection.findFirst({
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
   * Disconnect HMRC
   */
  async disconnect(orgId: string): Promise<DisconnectResult> {
    try {
      const connection = await this.prisma.hmrcConnection.findFirst({
        where: {
          orgId,
          isConnected: true,
        },
      });

      if (!connection) {
        throw new NotFoundException('No active HMRC connection found');
      }

      // Update connection status
      await this.prisma.hmrcConnection.update({
        where: { id: connection.id },
        data: {
          status: HmrcConnectionStatus.DISCONNECTED,
          isConnected: false,
          disconnectedAt: new Date(),
        },
      });

      // Create audit log
      await this.createAuditLog(connection.id, {
        action: 'DISCONNECT',
        success: true,
      });

      this.logger.log(`Successfully disconnected HMRC for org ${orgId}`);

      return {
        success: true,
        message: 'HMRC connection disconnected successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to disconnect HMRC for org ${orgId}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to disconnect HMRC');
    }
  }

  /**
   * Get decrypted tokens for API calls (internal use)
   */
  async getDecryptedTokens(orgId: string): Promise<DecryptedTokens> {
    const connection = await this.prisma.hmrcConnection.findFirst({
      where: {
        orgId,
        isConnected: true,
      },
    });

    if (!connection) {
      throw new NotFoundException('No active HMRC connection found');
    }

    // Auto-refresh if needed
    const now = new Date();
    if (
      now >= new Date(connection.tokenExpiresAt.getTime() - HMRC_TOKEN_EXPIRY.refreshBuffer * 1000)
    ) {
      await this.refreshTokens(orgId);
      // Fetch updated connection
      const updatedConnection = await this.prisma.hmrcConnection.findUnique({
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
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<HmrcToken> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier,
      });

      const response = await this.httpClient.post<HmrcToken>(
        this.endpoints.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for tokens', error);
      throw new InternalServerErrorException('Failed to exchange authorization code');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<HmrcToken> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await this.httpClient.post<HmrcToken>(
        this.endpoints.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh access token', error);
      throw new InternalServerErrorException('Failed to refresh access token');
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    connectionId: string,
    log: HmrcAuditLog,
  ): Promise<void> {
    try {
      await this.prisma.hmrcAuditLog.create({
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
    const accessToken = HmrcEncryptionUtil.decrypt(
      connection.accessToken,
      connection.encryptionIv,
      connection.encryptionTag,
      this.encryptionKey,
    );

    const refreshToken = HmrcEncryptionUtil.decrypt(
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
  private mapConnectionToInfo(connection: any): HmrcConnectionInfo {
    return {
      id: connection.id,
      orgId: connection.orgId,
      vrn: connection.vrn,
      status: connection.status,
      isConnected: connection.isConnected,
      lastSyncAt: connection.lastSyncAt,
      lastError: connection.lastError,
      tokenExpiresAt: connection.tokenExpiresAt,
      refreshTokenExpiresAt: connection.refreshTokenExpiresAt,
      environment: connection.environment,
      connectedAt: connection.connectedAt,
      disconnectedAt: connection.disconnectedAt,
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
