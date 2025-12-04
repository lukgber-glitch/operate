import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance } from 'axios';
import {
  TrueLayerConfig,
  TrueLayerAuthRequest,
  TrueLayerAuthResponse,
  TrueLayerTokenExchangeRequest,
  TrueLayerTokenExchangeResponse,
  TrueLayerAccount,
  TrueLayerBalance,
  TrueLayerTransaction,
  TrueLayerConnectionStatus,
  TRUELAYER_DEFAULT_SCOPES,
  TrueLayerScope,
} from './truelayer.types';
import { TrueLayerEncryptionUtil } from './utils/truelayer-encryption.util';
import {
  validateTrueLayerConfig,
  getTrueLayerApiUrl,
  getTrueLayerAuthUrl,
  getTrueLayerEnvironmentName,
} from './truelayer.config';

/**
 * TrueLayer Integration Service
 * Provides secure bank account connection for UK market via Open Banking
 *
 * Security Features:
 * - OAuth2 PKCE flow for authorization
 * - AES-256-GCM encrypted token storage
 * - Webhook signature verification
 * - Comprehensive audit logging
 * - Automatic token refresh
 */
@Injectable()
export class TrueLayerService {
  private readonly logger = new Logger(TrueLayerService.name);
  private readonly config: TrueLayerConfig;
  private readonly apiClient: AxiosInstance;
  private readonly authClient: AxiosInstance;
  private readonly encryptionKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration
    this.config = {
      clientId: this.configService.get<string>('TRUELAYER_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('TRUELAYER_CLIENT_SECRET') || '',
      environment: this.configService.get<string>('TRUELAYER_SANDBOX') === 'true'
        ? 'sandbox' as any
        : 'production' as any,
      redirectUri: this.configService.get<string>('TRUELAYER_REDIRECT_URI') ||
        'http://localhost:3000/integrations/truelayer/callback',
      webhookUrl: this.configService.get<string>('TRUELAYER_WEBHOOK_URL') || '',
      sandbox: this.configService.get<string>('TRUELAYER_SANDBOX') === 'true',
    };

    // Get encryption key (use TRUELAYER_ENCRYPTION_KEY or fall back to JWT_SECRET)
    this.encryptionKey =
      this.configService.get<string>('TRUELAYER_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') || '';

    // Validate configuration
    validateTrueLayerConfig(this.config);
    if (!TrueLayerEncryptionUtil.validateMasterKey(this.encryptionKey)) {
      throw new Error('Invalid or missing TRUELAYER_ENCRYPTION_KEY');
    }

    // Initialize API clients
    const apiBaseUrl = getTrueLayerApiUrl(this.config.environment);
    const authBaseUrl = getTrueLayerAuthUrl(this.config.environment);

    this.apiClient = axios.create({
      baseURL: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.authClient = axios.create({
      baseURL: authBaseUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000,
    });

    this.logger.log(
      `TrueLayer Service initialized (${getTrueLayerEnvironmentName(this.config.environment)} mode)`,
    );
  }

  /**
   * Create authorization URL for OAuth2 PKCE flow
   */
  async createAuthLink(request: TrueLayerAuthRequest): Promise<TrueLayerAuthResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(`Creating auth link for user ${request.userId}`);

      // Generate state for CSRF protection
      const state = request.state || TrueLayerEncryptionUtil.generateState();

      // Generate PKCE code verifier and challenge
      const codeVerifier = TrueLayerEncryptionUtil.generateCodeVerifier();
      const codeChallenge = TrueLayerEncryptionUtil.generateCodeChallenge(codeVerifier);

      // Store state and code verifier in database for verification
      await this.storeOAuthState(request.userId, state, codeVerifier);

      // Build scopes
      const scopes = request.scopes || TRUELAYER_DEFAULT_SCOPES;
      const scopeString = scopes.join(' ');

      // Build authorization URL parameters
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.config.clientId,
        redirect_uri: request.redirectUri || this.config.redirectUri,
        scope: scopeString,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        ...(request.providerId && { provider_id: request.providerId }),
        ...(request.enableMockProviders && this.config.sandbox && { enable_mock: 'true' }),
      });

      const authUrl = `${getTrueLayerAuthUrl(this.config.environment)}?${params.toString()}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        action: 'AUTH_LINK_CREATED',
        metadata: {
          scopes: scopeString,
          providerId: request.providerId,
          duration: Date.now() - startTime,
        },
      });

      return {
        authUrl,
        state,
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to create auth link', error);
      await this.logAuditEvent({
        userId: request.userId,
        action: 'AUTH_LINK_FAILED',
        metadata: {
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw new InternalServerErrorException('Failed to create TrueLayer auth link');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeToken(request: TrueLayerTokenExchangeRequest): Promise<TrueLayerTokenExchangeResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(`Exchanging authorization code for user ${request.userId}`);

      // Verify state and get code verifier
      const oauthState = await this.getOAuthState(request.userId, request.state);
      if (!oauthState) {
        throw new UnauthorizedException('Invalid or expired OAuth state');
      }

      // Exchange code for tokens
      const tokenResponse = await this.authClient.post('/connect/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: request.redirectUri || this.config.redirectUri,
          code: request.code,
          code_verifier: oauthState.codeVerifier,
        }).toString(),
      );

      const { access_token, refresh_token, expires_in, token_type, scope } = tokenResponse.data;

      // Encrypt tokens before storage
      const encryptedAccessToken = TrueLayerEncryptionUtil.encrypt(access_token, this.encryptionKey);
      const encryptedRefreshToken = TrueLayerEncryptionUtil.encrypt(refresh_token, this.encryptionKey);

      // Get provider info (optional)
      const providerInfo = await this.getProviderInfo(access_token).catch(() => null);

      // Store connection in database
      await this.createConnection(
        request.userId,
        encryptedAccessToken,
        encryptedRefreshToken,
        expires_in,
        scope.split(' '),
        providerInfo,
      );

      // Clean up OAuth state
      await this.deleteOAuthState(request.userId, request.state);

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        action: 'TOKEN_EXCHANGED',
        metadata: {
          providerId: providerInfo?.provider_id,
          scopes: scope,
          duration: Date.now() - startTime,
        },
      });

      return {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresIn: expires_in,
        tokenType: token_type,
        scope,
      };
    } catch (error) {
      this.logger.error('Failed to exchange authorization code', error);
      await this.logAuditEvent({
        userId: request.userId,
        action: 'TOKEN_EXCHANGE_FAILED',
        metadata: {
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw new UnauthorizedException('Failed to exchange authorization code');
    }
  }

  /**
   * Get accounts for a connection
   */
  async getAccounts(userId: string, connectionId: string): Promise<TrueLayerAccount[]> {
    const startTime = Date.now();

    try {
      this.logger.log(`Fetching accounts for connection ${connectionId}`);

      const accessToken = await this.getAccessToken(userId, connectionId);

      const response = await this.apiClient.get('/data/v1/accounts', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const accounts: TrueLayerAccount[] = response.data.results || [];

      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'ACCOUNTS_FETCHED',
        metadata: {
          connectionId,
          accountCount: accounts.length,
          duration: Date.now() - startTime,
        },
      });

      return accounts;
    } catch (error) {
      this.logger.error('Failed to fetch accounts', error);
      await this.logAuditEvent({
        userId,
        action: 'ACCOUNTS_FETCH_FAILED',
        metadata: {
          connectionId,
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw new ServiceUnavailableException('Failed to fetch accounts from TrueLayer');
    }
  }

  /**
   * Get account balance
   */
  async getBalance(userId: string, connectionId: string, accountId: string): Promise<TrueLayerBalance> {
    const startTime = Date.now();

    try {
      this.logger.log(`Fetching balance for account ${accountId}`);

      const accessToken = await this.getAccessToken(userId, connectionId);

      const response = await this.apiClient.get(`/data/v1/accounts/${accountId}/balance`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const balance: TrueLayerBalance = response.data.results[0];

      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'BALANCE_FETCHED',
        metadata: {
          connectionId,
          accountId,
          duration: Date.now() - startTime,
        },
      });

      return balance;
    } catch (error) {
      this.logger.error('Failed to fetch balance', error);
      throw new ServiceUnavailableException('Failed to fetch balance from TrueLayer');
    }
  }

  /**
   * Get account transactions
   */
  async getTransactions(
    userId: string,
    connectionId: string,
    accountId: string,
    from?: Date,
    to?: Date,
  ): Promise<TrueLayerTransaction[]> {
    const startTime = Date.now();

    try {
      this.logger.log(`Fetching transactions for account ${accountId}`);

      const accessToken = await this.getAccessToken(userId, connectionId);

      const params: any = {};
      if (from) params.from = from.toISOString().split('T')[0];
      if (to) params.to = to.toISOString().split('T')[0];

      const response = await this.apiClient.get(`/data/v1/accounts/${accountId}/transactions`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      });

      const transactions: TrueLayerTransaction[] = response.data.results || [];

      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'TRANSACTIONS_FETCHED',
        metadata: {
          connectionId,
          accountId,
          transactionCount: transactions.length,
          duration: Date.now() - startTime,
        },
      });

      return transactions;
    } catch (error) {
      this.logger.error('Failed to fetch transactions', error);
      throw new ServiceUnavailableException('Failed to fetch transactions from TrueLayer');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(userId: string, connectionId: string): Promise<void> {
    try {
      this.logger.log(`Refreshing access token for connection ${connectionId}`);

      const connection = await this.getConnection(userId, connectionId);
      if (!connection) {
        throw new UnauthorizedException('Connection not found');
      }

      const refreshToken = TrueLayerEncryptionUtil.decrypt(
        connection.refreshToken,
        this.encryptionKey,
      );

      const tokenResponse = await this.authClient.post('/connect/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
        }).toString(),
      );

      const { access_token, refresh_token: new_refresh_token, expires_in } = tokenResponse.data;

      // Encrypt new tokens
      const encryptedAccessToken = TrueLayerEncryptionUtil.encrypt(access_token, this.encryptionKey);
      const encryptedRefreshToken = TrueLayerEncryptionUtil.encrypt(
        new_refresh_token || refreshToken,
        this.encryptionKey,
      );

      // Update connection in database
      await this.updateConnection(connectionId, {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      });

      this.logger.log(`Access token refreshed for connection ${connectionId}`);
    } catch (error) {
      this.logger.error('Failed to refresh access token', error);
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = this.configService.get<string>('TRUELAYER_WEBHOOK_SECRET') || '';
    return TrueLayerEncryptionUtil.verifyWebhookSignature(payload, signature, webhookSecret);
  }

  // Private helper methods

  private async getAccessToken(userId: string, connectionId: string): Promise<string> {
    const connection = await this.getConnection(userId, connectionId);
    if (!connection) {
      throw new UnauthorizedException('Connection not found');
    }

    // Check if token is expired
    if (new Date() >= connection.expiresAt) {
      await this.refreshAccessToken(userId, connectionId);
      // Fetch updated connection
      const updatedConnection = await this.getConnection(userId, connectionId);
      return TrueLayerEncryptionUtil.decrypt(updatedConnection.accessToken, this.encryptionKey);
    }

    return TrueLayerEncryptionUtil.decrypt(connection.accessToken, this.encryptionKey);
  }

  private async storeOAuthState(userId: string, state: string, codeVerifier: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO truelayer_oauth_states (user_id, state, code_verifier, expires_at, created_at)
      VALUES (${userId}, ${state}, ${codeVerifier}, ${new Date(Date.now() + 10 * 60 * 1000)}, NOW())
    `;
  }

  private async getOAuthState(userId: string, state: string): Promise<any> {
    const result = await this.prisma.$queryRaw<Array<any>>`
      SELECT code_verifier
      FROM truelayer_oauth_states
      WHERE user_id = ${userId} AND state = ${state} AND expires_at > NOW()
      LIMIT 1
    `;
    return result.length > 0 ? { codeVerifier: result[0].code_verifier } : null;
  }

  private async deleteOAuthState(userId: string, state: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM truelayer_oauth_states
      WHERE user_id = ${userId} AND state = ${state}
    `;
  }

  private async createConnection(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    scopes: string[],
    providerInfo: any = null,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO truelayer_connections
      (user_id, access_token, refresh_token, expires_at, provider_id, provider_name, scopes, status, created_at, updated_at)
      VALUES
      (${userId}, ${accessToken}, ${refreshToken}, ${new Date(Date.now() + expiresIn * 1000)},
       ${providerInfo?.provider_id || null}, ${providerInfo?.display_name || null},
       ${JSON.stringify(scopes)}, ${TrueLayerConnectionStatus.ACTIVE}, NOW(), NOW())
    `;
  }

  private async getConnection(userId: string, connectionId: string): Promise<any> {
    const result = await this.prisma.$queryRaw<Array<any>>`
      SELECT id, access_token, refresh_token, expires_at, provider_id, provider_name, status
      FROM truelayer_connections
      WHERE id = ${connectionId} AND user_id = ${userId}
      LIMIT 1
    `;
    return result.length > 0 ? result[0] : null;
  }

  private async updateConnection(connectionId: string, updates: any): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE truelayer_connections
      SET
        access_token = ${updates.accessToken},
        refresh_token = ${updates.refreshToken},
        expires_at = ${updates.expiresAt},
        updated_at = NOW()
      WHERE id = ${connectionId}
    `;
  }

  private async getProviderInfo(accessToken: string): Promise<any> {
    const response = await this.apiClient.get('/data/v1/info', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.results[0];
  }

  private async logAuditEvent(event: {
    userId: string;
    action: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO truelayer_audit_logs
        (user_id, action, metadata, created_at)
        VALUES
        (${event.userId}, ${event.action}, ${JSON.stringify(event.metadata)}::jsonb, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}
