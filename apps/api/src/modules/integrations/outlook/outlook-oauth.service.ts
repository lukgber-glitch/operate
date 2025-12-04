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
import * as crypto from 'crypto';
import axios from 'axios';
import {
  MICROSOFT_OAUTH_ENDPOINTS,
  OUTLOOK_SCOPES,
  OUTLOOK_TOKEN_EXPIRY,
  OUTLOOK_PKCE_CONFIG,
  OUTLOOK_ENCRYPTION_CONFIG,
} from './outlook.constants';
import {
  OutlookAuthUrlResponseDto,
  OutlookCallbackDto,
  OutlookConnectionStatusDto,
} from './dto';

/**
 * Outlook OAuth2 Service
 * Handles OAuth2 with PKCE flow for Microsoft Graph API
 *
 * Security Features:
 * - OAuth2 with PKCE (Proof Key for Code Exchange)
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh
 * - State parameter validation for CSRF protection
 * - Comprehensive audit logging
 */
@Injectable()
export class OutlookOAuthService {
  private readonly logger = new Logger(OutlookOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly tenant: string;
  private readonly encryptionKey: string;
  private readonly isConfigured: boolean = false;

  // In-memory state store for OAuth flow (use Redis in production)
  private readonly oauthStateMap: Map<
    string,
    {
      state: string;
      codeVerifier: string;
      userId: string;
      orgId: string;
      createdAt: number;
      expiresAt: number;
    }
  > = new Map();

  // State cleanup interval (10 minutes)
  private readonly STATE_CLEANUP_INTERVAL = 10 * 60 * 1000;
  // State validity duration (15 minutes)
  private readonly STATE_VALIDITY = 15 * 60 * 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration
    this.clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('MICROSOFT_CLIENT_SECRET') || '';
    this.redirectUri =
      this.configService.get<string>('MICROSOFT_REDIRECT_URI') ||
      'http://localhost:3000/api/integrations/outlook/callback';
    this.tenant =
      this.configService.get<string>('MICROSOFT_TENANT_ID') || 'common';

    // Get encryption key
    this.encryptionKey =
      this.configService.get<string>('OUTLOOK_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      '';

    if (!this.validateConfig()) {
      this.logger.warn(
        'Outlook OAuth is disabled - MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, or MICROSOFT_REDIRECT_URI not configured',
      );
      return;
    }

    if (!this.validateEncryptionKey()) {
      this.logger.warn('Outlook encryption key not configured - using fallback');
    }

    // Mark as configured
    (this as any).isConfigured = true;

    // Start periodic state cleanup
    this.startStateCleanup();

    this.logger.log('Outlook OAuth Service initialized');
  }

  /**
   * Generate OAuth2 authorization URL with PKCE
   */
  async getAuthUrl(
    userId: string,
    orgId: string,
    customRedirectUri?: string,
  ): Promise<OutlookAuthUrlResponseDto> {
    if (!this.isConfigured) {
      throw new BadRequestException('Outlook OAuth is not configured');
    }
    try {
      // Generate PKCE challenge
      const pkce = this.generatePKCEChallenge();

      // Store state with PKCE verifier and user info
      const stateData = {
        state: pkce.state,
        codeVerifier: pkce.codeVerifier,
        userId,
        orgId,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.STATE_VALIDITY,
      };
      this.oauthStateMap.set(pkce.state, stateData);

      // Build authorization URL
      const redirectUri = customRedirectUri || this.redirectUri;
      const params = new URLSearchParams({
        client_id: this.clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        response_mode: 'query',
        scope: OUTLOOK_SCOPES.join(' '),
        state: pkce.state,
        code_challenge: pkce.codeChallenge,
        code_challenge_method: OUTLOOK_PKCE_CONFIG.challengeMethod,
      });

      const authUrl = `${MICROSOFT_OAUTH_ENDPOINTS.authorize(this.tenant)}?${params.toString()}`;

      this.logger.log(`Generated auth URL for user ${userId}`);

      return {
        authUrl,
        state: pkce.state,
      };
    } catch (error) {
      this.logger.error('Failed to generate auth URL', error);
      throw new InternalServerErrorException(
        'Failed to generate authorization URL',
      );
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(
    query: OutlookCallbackDto,
  ): Promise<OutlookConnectionStatusDto> {
    try {
      // Check for OAuth errors
      if (query.error) {
        throw new BadRequestException(
          `Microsoft authorization failed: ${query.error_description || query.error}`,
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
      const tokenResponse = await axios.post(
        MICROSOFT_OAUTH_ENDPOINTS.token(this.tenant),
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: query.code,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
          code_verifier: stateData.codeVerifier,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token, refresh_token, expires_in, scope } =
        tokenResponse.data;

      if (!access_token) {
        throw new InternalServerErrorException(
          'Failed to exchange code for tokens',
        );
      }

      // Get user profile to retrieve email
      const userProfile = await this.getUserProfile(access_token);

      // Encrypt tokens
      const encryptedAccess = this.encryptToken(access_token);
      const encryptedRefresh = refresh_token
        ? this.encryptToken(refresh_token)
        : null;

      // Calculate expiry times
      const now = new Date();
      const tokenExpiresAt = new Date(
        now.getTime() + (expires_in || OUTLOOK_TOKEN_EXPIRY.accessToken) * 1000,
      );

      // Save connection to database
      const connection = await this.prisma.emailConnection.upsert({
        where: {
          userId_provider_email: {
            userId: stateData.userId,
            provider: 'OUTLOOK',
            email: userProfile.email,
          },
        },
        create: {
          userId: stateData.userId,
          orgId: stateData.orgId,
          provider: 'OUTLOOK',
          email: userProfile.email,
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh?.encryptedData || '',
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          scopes: scope ? scope.split(' ') : OUTLOOK_SCOPES,
          syncEnabled: true,
          syncStatus: 'PENDING',
        },
        update: {
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh?.encryptedData || '',
          encryptionIv: encryptedAccess.iv,
          encryptionTag: encryptedAccess.tag,
          tokenExpiresAt,
          scopes: scope ? scope.split(' ') : OUTLOOK_SCOPES,
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
          email: userProfile.email,
          scopes: scope ? scope.split(' ') : OUTLOOK_SCOPES,
        },
      });

      // Clean up state
      this.oauthStateMap.delete(query.state);

      this.logger.log(
        `Successfully connected Outlook for user ${stateData.userId}, email ${userProfile.email}`,
      );

      return this.mapConnectionToDto(connection);
    } catch (error) {
      this.logger.error('OAuth callback error', error);
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to complete Outlook authorization',
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(connectionId: string): Promise<boolean> {
    try {
      const connection = await this.prisma.emailConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection || connection.provider !== 'OUTLOOK') {
        throw new NotFoundException('Outlook connection not found');
      }

      if (!connection.refreshToken) {
        throw new UnauthorizedException(
          'No refresh token available. Please reconnect.',
        );
      }

      // Decrypt refresh token
      const refreshToken = this.decryptToken(
        connection.refreshToken,
        connection.encryptionIv,
        connection.encryptionTag,
      );

      // Request new access token
      const tokenResponse = await axios.post(
        MICROSOFT_OAUTH_ENDPOINTS.token(this.tenant),
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: OUTLOOK_SCOPES.join(' '),
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      if (!access_token) {
        throw new InternalServerErrorException('Failed to refresh tokens');
      }

      // Encrypt new tokens
      const encryptedAccess = this.encryptToken(access_token);
      const encryptedRefresh = refresh_token
        ? this.encryptToken(refresh_token)
        : this.encryptToken(refreshToken); // Use old refresh token if new one not provided

      // Calculate new expiry time
      const now = new Date();
      const tokenExpiresAt = new Date(
        now.getTime() + (expires_in || OUTLOOK_TOKEN_EXPIRY.accessToken) * 1000,
      );

      // Update connection
      await this.prisma.emailConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: encryptedAccess.encryptedData,
          refreshToken: encryptedRefresh.encryptedData,
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

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to refresh tokens for connection ${connectionId}`,
        error,
      );

      // Update connection with error
      try {
        await this.prisma.emailConnection.update({
          where: { id: connectionId },
          data: {
            syncStatus: 'ERROR',
            syncError: error.message,
          },
        });

        await this.createAuditLog(connectionId, {
          action: 'TOKEN_REFRESH',
          success: false,
          errorMessage: error.message,
        });
      } catch (updateError) {
        this.logger.error('Failed to update connection with error', updateError);
      }

      return false;
    }
  }

  /**
   * Revoke access and disconnect Outlook
   */
  async revokeAccess(userId: string, orgId: string): Promise<void> {
    try {
      const connection = await this.prisma.emailConnection.findFirst({
        where: {
          userId,
          orgId,
          provider: 'OUTLOOK',
        },
      });

      if (!connection) {
        throw new NotFoundException('Outlook connection not found');
      }

      // Microsoft doesn't provide a revoke endpoint in OAuth2 v2.0
      // Tokens will expire naturally, but we delete from our database

      // Delete connection
      await this.prisma.emailConnection.delete({
        where: { id: connection.id },
      });

      // Create audit log
      await this.createAuditLog(connection.id, {
        action: 'DISCONNECT',
        success: true,
      });

      this.logger.log(
        `Successfully revoked Outlook access for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to revoke Outlook access for user ${userId}`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to disconnect Outlook',
      );
    }
  }

  /**
   * Get decrypted access token for API calls
   */
  async getAccessToken(userId: string, orgId: string): Promise<string> {
    const connection = await this.prisma.emailConnection.findFirst({
      where: {
        userId,
        orgId,
        provider: 'OUTLOOK',
        syncEnabled: true,
      },
    });

    if (!connection) {
      throw new NotFoundException('No active Outlook connection found');
    }

    // Check if token needs refresh
    const now = new Date();
    if (
      connection.tokenExpiresAt &&
      now >=
        new Date(
          connection.tokenExpiresAt.getTime() -
            OUTLOOK_TOKEN_EXPIRY.refreshBuffer * 1000,
        )
    ) {
      const refreshed = await this.refreshToken(connection.id);
      if (!refreshed) {
        throw new UnauthorizedException(
          'Failed to refresh expired token. Please reconnect.',
        );
      }

      // Fetch updated connection
      const updatedConnection = await this.prisma.emailConnection.findUnique({
        where: { id: connection.id },
      });

      if (!updatedConnection) {
        throw new NotFoundException('Connection lost during token refresh');
      }

      return this.decryptToken(
        updatedConnection.accessToken,
        updatedConnection.encryptionIv,
        updatedConnection.encryptionTag,
      );
    }

    return this.decryptToken(
      connection.accessToken,
      connection.encryptionIv,
      connection.encryptionTag,
    );
  }

  /**
   * Get user profile from Microsoft Graph
   */
  private async getUserProfile(
    accessToken: string,
  ): Promise<{ email: string; displayName: string }> {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        email: response.data.mail || response.data.userPrincipalName,
        displayName: response.data.displayName,
      };
    } catch (error) {
      this.logger.error('Failed to get user profile', error);
      throw new InternalServerErrorException('Failed to retrieve user profile');
    }
  }

  /**
   * Generate PKCE challenge (SHA256)
   */
  private generatePKCEChallenge(): {
    codeVerifier: string;
    codeChallenge: string;
    state: string;
  } {
    // Generate code verifier
    const codeVerifier = crypto
      .randomBytes(OUTLOOK_PKCE_CONFIG.codeVerifierLength)
      .toString('base64url');

    // Generate code challenge (SHA256 of verifier)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Generate state
    const state = crypto
      .randomBytes(OUTLOOK_PKCE_CONFIG.stateLength)
      .toString('base64url');

    return {
      codeVerifier,
      codeChallenge,
      state,
    };
  }

  /**
   * Encrypt token using AES-256-GCM
   */
  private encryptToken(
    token: string,
  ): { encryptedData: string; iv: Buffer; tag: Buffer } {
    // Generate random IV
    const iv = crypto.randomBytes(OUTLOOK_ENCRYPTION_CONFIG.ivLength);

    // Derive encryption key from master key
    const key = crypto
      .createHash('sha256')
      .update(this.encryptionKey)
      .digest()
      .slice(0, OUTLOOK_ENCRYPTION_CONFIG.keyLength);

    // Create cipher
    const cipher = crypto.createCipheriv(
      OUTLOOK_ENCRYPTION_CONFIG.algorithm,
      key,
      iv,
    );

    // Encrypt
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const tag = cipher.getAuthTag();

    return {
      encryptedData: encrypted,
      iv,
      tag,
    };
  }

  /**
   * Decrypt token using AES-256-GCM
   */
  private decryptToken(
    encryptedData: string,
    iv: Buffer,
    tag: Buffer,
  ): string {
    // Derive encryption key from master key
    const key = crypto
      .createHash('sha256')
      .update(this.encryptionKey)
      .digest()
      .slice(0, OUTLOOK_ENCRYPTION_CONFIG.keyLength);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      OUTLOOK_ENCRYPTION_CONFIG.algorithm,
      key,
      iv,
    );

    // Set auth tag
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Validate configuration
   */
  private validateConfig(): boolean {
    return !!(this.clientId && this.clientSecret && this.redirectUri);
  }

  /**
   * Validate encryption key
   */
  private validateEncryptionKey(): boolean {
    return this.encryptionKey && this.encryptionKey.length >= 32;
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    connectionId: string,
    log: {
      action: string;
      success: boolean;
      endpoint?: string;
      statusCode?: number;
      errorMessage?: string;
      metadata?: any;
    },
  ): Promise<void> {
    try {
      await this.prisma.emailAuditLog.create({
        data: {
          connectionId,
          action: log.action as any,
          endpoint: log.endpoint,
          statusCode: log.statusCode,
          success: log.success,
          errorMessage: log.errorMessage,
          metadata: log.metadata || {},
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging is non-critical
    }
  }

  /**
   * Map connection to DTO
   */
  private mapConnectionToDto(connection: any): OutlookConnectionStatusDto {
    return {
      id: connection.id,
      userId: connection.userId,
      orgId: connection.orgId,
      provider: connection.provider,
      email: connection.email,
      scopes: connection.scopes,
      syncEnabled: connection.syncEnabled,
      lastSyncAt: connection.lastSyncAt,
      syncStatus: connection.syncStatus,
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
