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
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as https from 'https';
import {
  TinkConfig,
  TinkToken,
  TinkAccount,
  TinkTransaction,
  TinkProvider,
  TinkAuthorizationFlow,
  TinkConsentStatus,
  PKCEChallenge,
  TinkAuditLog,
  TinkAuditAction,
  TinkRateLimitInfo,
  TinkApiError,
} from './tink.types';
import { TinkEncryptionUtil } from './utils/tink-encryption.util';
import { TinkMockDataUtil } from './utils/tink-mock-data.util';
import { DEFAULT_TINK_SCOPE, validateTinkConfig } from './tink.config';

/**
 * Tink Open Banking Service
 * PSD2-compliant integration with Tink API
 *
 * Security Features:
 * - OAuth2 with PKCE flow
 * - AES-256-GCM encrypted token storage
 * - TLS 1.3 enforced
 * - Comprehensive audit logging
 * - Rate limit awareness
 */
@Injectable()
export class TinkService {
  private readonly logger = new Logger(TinkService.name);
  private readonly config: TinkConfig;
  private readonly httpClient: AxiosInstance;
  private readonly encryptionKey: string;
  private readonly rateLimitInfo: Map<string, TinkRateLimitInfo> = new Map();
  private readonly isConfigured: boolean = false;
  private clientAccessToken: string | null = null;
  private clientTokenExpiresAt: Date | null = null;

  // Caching layer with TTL
  private readonly cache = new Map<string, { data: unknown; expiresAt: number }>();
  private readonly CACHE_TTL = {
    providers: 60 * 60 * 1000, // 1 hour - providers rarely change
    accounts: 5 * 60 * 1000,   // 5 minutes
    transactions: 5 * 60 * 1000, // 5 minutes
  };

  // Request deduplication
  private readonly pendingRequests = new Map<string, Promise<unknown>>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration
    this.config = {
      clientId: this.configService.get<string>('TINK_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('TINK_CLIENT_SECRET') || '',
      apiUrl: this.configService.get<string>('TINK_API_URL') || 'https://api.tink.com',
      linkUrl: this.configService.get<string>('TINK_LINK_URL') || 'https://link.tink.com/1.0',
      redirectUri: this.configService.get<string>('TINK_REDIRECT_URI') || 'http://localhost:3000/integrations/tink/callback',
      environment: (this.configService.get<string>('TINK_ENVIRONMENT') || 'sandbox') as 'production' | 'sandbox',
      mockMode: this.configService.get<string>('TINK_MOCK_MODE') === 'true',
    };

    // Get encryption key
    this.encryptionKey = this.configService.get<string>('TINK_ENCRYPTION_KEY') || this.configService.get<string>('JWT_SECRET') || '';

    // Validate configuration (skip in mock mode)
    if (!this.config.mockMode) {
      try {
        validateTinkConfig(this.config);
        if (!TinkEncryptionUtil.validateMasterKey(this.encryptionKey)) {
          this.logger.warn('Tink service is disabled - TINK_ENCRYPTION_KEY not configured');
          return;
        }
      } catch (error) {
        this.logger.warn(`Tink service is disabled - ${error.message}`);
        return;
      }
    } else {
      // In mock mode, mark as configured immediately
      (this as any).isConfigured = true;
      this.logger.log('Tink Service initialized in MOCK MODE - using test data');
    }

    // Initialize HTTP client with TLS 1.3
    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Operate-CoachOS/1.0',
      },
      httpsAgent: new https.Agent({
        minVersion: 'TLSv1.3',
        rejectUnauthorized: true,
      }),
    });

    // Add request interceptor for logging and rate limiting
    this.httpClient.interceptors.request.use((config) => {
      const requestId = TinkEncryptionUtil.generateState();
      config.headers['X-Request-ID'] = requestId;
      this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, { requestId });
      return config;
    });

    // Add response interceptor for error handling and rate limiting
    this.httpClient.interceptors.response.use(
      (response) => {
        // Track rate limits
        this.updateRateLimitInfo(response.headers);
        return response;
      },
      async (error: AxiosError) => {
        this.handleAxiosError(error);
        return Promise.reject(error);
      },
    );

    // Mark as configured
    (this as Prisma.InputJsonValue).isConfigured = true;
    this.logger.log(`Tink Service initialized (${this.config.environment} mode, Mock: ${this.config.mockMode})`);
  }

  /**
   * Start OAuth2 PKCE authorization flow
   */
  async startAuthorization(
    organizationId: string,
    userId: string,
    market: string = 'DE',
    locale: string = 'en_US',
  ): Promise<{ authorizationUrl: string; state: string }> {
    if (!this.isConfigured) {
      throw new BadRequestException('Tink service is not configured. Please configure TINK_CLIENT_ID and TINK_CLIENT_SECRET environment variables.');
    }

    const startTime = Date.now();

    try {
      // Mock mode
      if (this.config.mockMode) {
        const state = TinkEncryptionUtil.generateState();
        return {
          authorizationUrl: TinkMockDataUtil.generateMockAuthorizationUrl(
            this.config.clientId,
            this.config.redirectUri,
            state,
          ),
          state,
        };
      }

      // Generate PKCE challenge
      const pkce = this.generatePKCEChallenge();
      const state = TinkEncryptionUtil.generateState();

      // Store authorization flow state
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await this.prisma.$executeRaw`
        INSERT INTO tink_authorization_flows
        (state, code_verifier, code_challenge, organization_id, user_id, redirect_uri, scope, expires_at)
        VALUES
        (${state}, ${pkce.codeVerifier}, ${pkce.codeChallenge}, ${organizationId}, ${userId}, ${this.config.redirectUri}, ${DEFAULT_TINK_SCOPE}, ${expiresAt})
      `;

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        scope: DEFAULT_TINK_SCOPE,
        state: state,
        code_challenge: pkce.codeChallenge,
        code_challenge_method: 'S256',
        market: market,
        locale: locale,
        response_type: 'code',
      });

      if (this.config.environment === 'sandbox') {
        params.append('test', 'true');
      }

      const authorizationUrl = `${this.config.linkUrl}/authorize?${params.toString()}`;

      // Audit log
      await this.createAuditLog({
        organizationId,
        userId,
        action: TinkAuditAction.AUTHORIZATION_START,
        endpoint: '/authorize',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
      });

      return { authorizationUrl, state };
    } catch (error) {
      this.logger.error('Failed to start authorization', error);
      throw new InternalServerErrorException('Failed to start authorization flow');
    }
  }

  /**
   * Complete OAuth2 authorization and exchange code for tokens
   */
  async completeAuthorization(
    code: string,
    state: string,
  ): Promise<TinkToken> {
    if (!this.isConfigured) {
      throw new BadRequestException('Tink service is not configured. Please configure TINK_CLIENT_ID and TINK_CLIENT_SECRET environment variables.');
    }

    const startTime = Date.now();

    try {
      // Mock mode
      if (this.config.mockMode) {
        const mockToken = TinkMockDataUtil.generateMockToken();
        return mockToken;
      }

      // Retrieve authorization flow
      const flow = await this.prisma.$queryRaw<TinkAuthorizationFlow[]>`
        SELECT * FROM tink_authorization_flows
        WHERE state = ${state} AND expires_at > NOW()
        LIMIT 1
      `;

      if (!flow || flow.length === 0) {
        throw new BadRequestException('Invalid or expired authorization state');
      }

      const authFlow = flow[0];

      // Exchange code for tokens
      const response = await this.httpClient.post('/api/v1/oauth/token', {
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code_verifier: authFlow.codeVerifier,
      });

      const tokenData = response.data;
      const token: TinkToken = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      };

      // Store encrypted credentials
      await this.storeCredentials(
        authFlow.organizationId,
        authFlow.userId,
        token,
      );

      // Delete authorization flow
      await this.prisma.$executeRaw`
        DELETE FROM tink_authorization_flows WHERE state = ${state}
      `;

      // Audit log
      await this.createAuditLog({
        organizationId: authFlow.organizationId,
        userId: authFlow.userId,
        action: TinkAuditAction.AUTHORIZATION_COMPLETE,
        endpoint: '/api/v1/oauth/token',
        method: 'POST',
        statusCode: 200,
        duration: Date.now() - startTime,
      });

      return token;
    } catch (error) {
      this.logger.error('Failed to complete authorization', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to complete authorization');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(organizationId: string, userId: string): Promise<TinkToken> {
    if (!this.isConfigured) {
      throw new BadRequestException('Tink service is not configured. Please configure TINK_CLIENT_ID and TINK_CLIENT_SECRET environment variables.');
    }

    const startTime = Date.now();

    try {
      // Mock mode
      if (this.config.mockMode) {
        return TinkMockDataUtil.generateMockToken();
      }

      // Get stored credentials
      const credentials = await this.getCredentials(organizationId, userId);

      if (!credentials) {
        throw new UnauthorizedException('No credentials found');
      }

      // Decrypt refresh token
      const refreshToken = TinkEncryptionUtil.decrypt(
        credentials.refreshToken,
        this.encryptionKey,
      );

      // Request new tokens
      const response = await this.httpClient.post('/api/v1/oauth/token', {
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      });

      const tokenData = response.data;
      const token: TinkToken = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken, // Some providers don't return new refresh token
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      };

      // Update stored credentials
      await this.storeCredentials(organizationId, userId, token);

      // Audit log
      await this.createAuditLog({
        organizationId,
        userId,
        action: TinkAuditAction.TOKEN_REFRESH,
        endpoint: '/api/v1/oauth/token',
        method: 'POST',
        statusCode: 200,
        duration: Date.now() - startTime,
      });

      return token;
    } catch (error) {
      this.logger.error('Failed to refresh token', error);
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  /**
   * Get bank accounts
   */
  async getAccounts(organizationId: string, userId: string): Promise<TinkAccount[]> {
    if (!this.isConfigured) {
      throw new BadRequestException('Tink service is not configured. Please configure TINK_CLIENT_ID and TINK_CLIENT_SECRET environment variables.');
    }

    const startTime = Date.now();

    try {
      // Mock mode
      if (this.config.mockMode) {
        return TinkMockDataUtil.generateMockAccounts();
      }

      // Get access token
      const accessToken = await this.getValidAccessToken(organizationId, userId);

      // Fetch accounts
      const response = await this.httpClient.get('/data/v2/accounts', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const accounts: TinkAccount[] = response.data.accounts || [];

      // Audit log
      await this.createAuditLog({
        organizationId,
        userId,
        action: TinkAuditAction.ACCOUNTS_FETCH,
        endpoint: '/data/v2/accounts',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        metadata: { accountCount: accounts.length },
      });

      return accounts;
    } catch (error) {
      this.logger.error('Failed to fetch accounts', error);
      throw new ServiceUnavailableException('Failed to fetch bank accounts');
    }
  }

  /**
   * Get transactions for an account
   */
  async getTransactions(
    organizationId: string,
    userId: string,
    accountId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TinkTransaction[]> {
    if (!this.isConfigured) {
      throw new BadRequestException('Tink service is not configured. Please configure TINK_CLIENT_ID and TINK_CLIENT_SECRET environment variables.');
    }

    const startTime = Date.now();

    try {
      // Mock mode
      if (this.config.mockMode) {
        return TinkMockDataUtil.generateMockTransactions(accountId);
      }

      // Get access token
      const accessToken = await this.getValidAccessToken(organizationId, userId);

      // Build query parameters
      const params: any = {
        accountIdIn: accountId,
      };

      if (startDate) {
        params.bookedDateGte = startDate.toISOString().split('T')[0];
      }
      if (endDate) {
        params.bookedDateLte = endDate.toISOString().split('T')[0];
      }

      // Fetch transactions
      const response = await this.httpClient.get('/data/v2/transactions', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      });

      const transactions: TinkTransaction[] = response.data.transactions || [];

      // Audit log
      await this.createAuditLog({
        organizationId,
        userId,
        action: TinkAuditAction.TRANSACTIONS_FETCH,
        endpoint: '/data/v2/transactions',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        metadata: {
          accountId,
          transactionCount: transactions.length,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      });

      return transactions;
    } catch (error) {
      this.logger.error('Failed to fetch transactions', error);
      throw new ServiceUnavailableException('Failed to fetch transactions');
    }
  }

  /**
   * Delete credentials (revoke access)
   */
  async deleteCredentials(organizationId: string, userId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Delete from database
      await this.prisma.$executeRaw`
        DELETE FROM tink_credentials
        WHERE organization_id = ${organizationId} AND user_id = ${userId}
      `;

      // Audit log
      await this.createAuditLog({
        organizationId,
        userId,
        action: TinkAuditAction.CREDENTIALS_DELETE,
        endpoint: '/credentials',
        method: 'DELETE',
        statusCode: 200,
        duration: Date.now() - startTime,
      });

      this.logger.log(`Deleted Tink credentials for org ${organizationId}, user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to delete credentials', error);
      throw new InternalServerErrorException('Failed to delete credentials');
    }
  }

  /**
   * Get available providers (banks)
   * Cached for 1 hour as provider lists rarely change
   */
  async getProviders(market: string = 'DE'): Promise<TinkProvider[]> {
    if (!this.isConfigured) {
      throw new BadRequestException('Tink service is not configured. Please configure TINK_CLIENT_ID and TINK_CLIENT_SECRET environment variables.');
    }

    const cacheKey = `providers:${market}`;

    // Check cache first - providers rarely change
    const cached = this.getFromCache<TinkProvider[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Returning cached providers for market ${market} (${cached.length} providers)`);
      return cached;
    }

    // Use request deduplication
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        // Mock mode
        if (this.config.mockMode) {
          const mockProviders = TinkMockDataUtil.generateMockProviders(market);
          this.setCache(cacheKey, mockProviders, this.CACHE_TTL.providers);
          return mockProviders;
        }

        // Get client access token for server-to-server calls
        const accessToken = await this.getClientAccessToken();

        // Use /api/v1/providers/{market} endpoint which requires providers:read scope
        // Include test providers for sandbox mode
        const isSandbox = this.config.environment === 'sandbox';
        const response = await this.httpClient.get(`/api/v1/providers/${market}`, {
          params: isSandbox ? { includeTestProviders: true } : undefined,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const providers = response.data.providers || [];

        // Cache the result
        this.setCache(cacheKey, providers, this.CACHE_TTL.providers);

        this.logger.log(`Fetched ${providers.length} providers for market ${market}`);
        return providers;
      } catch (error) {
        this.logger.error('Failed to fetch providers', error);
        throw new ServiceUnavailableException('Failed to fetch bank providers');
      }
    }) as Promise<TinkProvider[]>;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Get client access token for server-to-server API calls
   * Uses OAuth2 client_credentials grant
   */
  private async getClientAccessToken(): Promise<string> {
    // Check if we have a valid cached token (with 5 minute buffer)
    if (
      this.clientAccessToken &&
      this.clientTokenExpiresAt &&
      this.clientTokenExpiresAt.getTime() - Date.now() > 5 * 60 * 1000
    ) {
      return this.clientAccessToken;
    }

    this.logger.debug('Fetching new client access token...');

    try {
      const response = await this.httpClient.post(
        '/api/v1/oauth/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'accounts:read,balances:read,transactions:read,credentials:read,providers:read,user:create,authorization:grant',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.clientAccessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.clientTokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      this.logger.debug(`Client access token obtained, expires in ${expiresIn}s`);

      return this.clientAccessToken;
    } catch (error: any) {
      this.logger.error('Failed to get client access token', {
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new ServiceUnavailableException('Failed to authenticate with Tink API');
    }
  }

  /**
   * Generate PKCE challenge
   */
  private generatePKCEChallenge(): PKCEChallenge {
    const codeVerifier = TinkEncryptionUtil.generateCodeVerifier();
    const codeChallenge = TinkEncryptionUtil.generateCodeChallenge(codeVerifier);

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
    };
  }

  /**
   * Store encrypted credentials
   */
  private async storeCredentials(
    organizationId: string,
    userId: string,
    token: TinkToken,
  ): Promise<void> {
    const encryptedAccessToken = TinkEncryptionUtil.encrypt(
      token.accessToken,
      this.encryptionKey,
    );
    const encryptedRefreshToken = TinkEncryptionUtil.encrypt(
      token.refreshToken,
      this.encryptionKey,
    );

    await this.prisma.$executeRaw`
      INSERT INTO tink_credentials
      (organization_id, user_id, access_token, refresh_token, expires_at, scope, updated_at)
      VALUES
      (${organizationId}, ${userId}, ${encryptedAccessToken}, ${encryptedRefreshToken}, ${token.expiresAt}, ${token.scope}, NOW())
      ON CONFLICT (organization_id, user_id)
      DO UPDATE SET
        access_token = ${encryptedAccessToken},
        refresh_token = ${encryptedRefreshToken},
        expires_at = ${token.expiresAt},
        scope = ${token.scope},
        updated_at = NOW()
    `;
  }

  /**
   * Get stored credentials
   */
  private async getCredentials(organizationId: string, userId: string): Promise<any> {
    const result = await this.prisma.$queryRaw`
      SELECT * FROM tink_credentials
      WHERE organization_id = ${organizationId} AND user_id = ${userId}
      LIMIT 1
    `;

    return result && (result as Prisma.InputJsonValue[]).length > 0 ? (result as Prisma.InputJsonValue[])[0] : null;
  }

  /**
   * Get valid access token (refresh if expired)
   */
  private async getValidAccessToken(organizationId: string, userId: string): Promise<string> {
    const credentials = await this.getCredentials(organizationId, userId);

    if (!credentials) {
      throw new UnauthorizedException('No Tink credentials found');
    }

    // Check if token is expired (with 5 minute buffer)
    const expiresAt = new Date(credentials.expires_at);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (expiresAt.getTime() - now.getTime() < bufferTime) {
      this.logger.debug('Access token expired, refreshing...');
      const newToken = await this.refreshToken(organizationId, userId);
      return newToken.accessToken;
    }

    // Decrypt and return access token
    return TinkEncryptionUtil.decrypt(credentials.access_token, this.encryptionKey);
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(log: Omit<TinkAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO tink_audit_logs
        (organization_id, user_id, action, endpoint, method, status_code, duration, metadata, timestamp)
        VALUES
        (${log.organizationId}, ${log.userId}, ${log.action}, ${log.endpoint}, ${log.method}, ${log.statusCode}, ${log.duration}, ${JSON.stringify(log.metadata || {})}, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging failure shouldn't break the request
    }
  }

  /**
   * Update rate limit information
   */
  private updateRateLimitInfo(headers: any): void {
    const limit = parseInt(headers['x-ratelimit-limit'] || '0');
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '0');
    const reset = parseInt(headers['x-ratelimit-reset'] || '0');

    if (limit && remaining && reset) {
      this.rateLimitInfo.set('global', {
        limit,
        remaining,
        reset: new Date(reset * 1000),
      });

      if (remaining < 10) {
        this.logger.warn(`Tink API rate limit low: ${remaining}/${limit} remaining`);
      }
    }
  }

  /**
   * Handle Axios errors
   */
  private handleAxiosError(error: AxiosError): void {
    if (error.response) {
      const apiError = error.response.data as TinkApiError;
      this.logger.error(
        `Tink API Error: ${error.response.status} - ${apiError.error}: ${apiError.errorDescription}`,
      );

      // Log rate limit headers
      this.updateRateLimitInfo(error.response.headers);
    } else if (error.request) {
      this.logger.error('Tink API: No response received', error.message);
    } else {
      this.logger.error('Tink API: Request setup error', error.message);
    }
  }

  // ==================== CACHING METHODS ====================

  /**
   * Get item from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Set item in cache with TTL
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Invalidate cache for a specific organization
   */
  invalidateOrgCache(organizationId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(organizationId)) {
        this.cache.delete(key);
      }
    }
    this.logger.debug(`Invalidated cache for org ${organizationId}`);
  }

  /**
   * Clear the entire providers cache
   */
  clearProvidersCache(): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith('providers:')) {
        this.cache.delete(key);
      }
    }
    this.logger.debug('Cleared providers cache');
  }

  // ==================== REQUEST DEDUPLICATION ====================

  /**
   * Deduplicate concurrent identical requests
   */
  private async deduplicateRequest<T>(
    key: string,
    request: () => Promise<T>,
  ): Promise<T> {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      this.logger.debug(`Deduplicating request for key: ${key}`);
      return pending as Promise<T>;
    }

    const promise = request().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}
