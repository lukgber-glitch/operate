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
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
  AccountsGetRequest,
  TransactionsSyncRequest,
} from 'plaid';
import {
  PlaidConfig,
  PlaidLinkTokenRequest,
  PlaidLinkTokenResponse,
  PlaidExchangeTokenRequest,
  PlaidExchangeTokenResponse,
  PlaidAccount,
  PlaidTransactionExtended,
  PlaidItemStatus,
  PLAID_US_COUNTRY_CODES,
  PLAID_US_PRODUCTS,
} from './plaid.types';
import { PlaidEncryptionUtil } from './utils/plaid-encryption.util';
import { validatePlaidConfig, getPlaidEnvironmentName } from './plaid.config';

/**
 * Plaid Integration Service
 * Provides secure bank account connection for US market
 *
 * Security Features:
 * - OAuth2-compliant authorization flow
 * - AES-256-GCM encrypted access token storage
 * - Webhook signature verification
 * - Comprehensive audit logging
 * - Rate limit awareness
 */
@Injectable()
export class PlaidService {
  private readonly logger = new Logger(PlaidService.name);
  private readonly config: PlaidConfig;
  private readonly plaidClient: PlaidApi;
  private readonly encryptionKey: string;
  private isConfigured: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration
    this.config = {
      clientId: this.configService.get<string>('PLAID_CLIENT_ID') || '',
      secret: this.configService.get<string>('PLAID_SECRET') || '',
      environment: this.getPlaidEnvironment(),
      webhookUrl: this.configService.get<string>('PLAID_WEBHOOK_URL') || '',
      redirectUri: this.configService.get<string>('PLAID_REDIRECT_URI') || 'http://localhost:3000/integrations/plaid/callback',
      mockMode: this.configService.get<string>('PLAID_MOCK_MODE') === 'true',
    };

    // Get encryption key (use PLAID_ENCRYPTION_KEY or fall back to JWT_SECRET)
    this.encryptionKey = this.configService.get<string>('PLAID_ENCRYPTION_KEY') || this.configService.get<string>('JWT_SECRET') || '';

    // Validate configuration (skip in mock mode)
    if (!this.config.mockMode) {
      try {
        validatePlaidConfig(this.config);
        if (!PlaidEncryptionUtil.validateMasterKey(this.encryptionKey)) {
          this.logger.warn('Plaid service is disabled - PLAID_ENCRYPTION_KEY not configured');
          return;
        }
      } catch (error) {
        this.logger.warn(`Plaid service is disabled - ${error.message}`);
        return;
      }
    }

    // Initialize Plaid client
    const configuration = new Configuration({
      basePath: this.getBasePath(this.config.environment),
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': this.config.clientId,
          'PLAID-SECRET': this.config.secret,
        },
      },
    });

    this.plaidClient = new PlaidApi(configuration);

    // Mark as configured
    this.isConfigured = true;
    this.logger.log(
      `Plaid Service initialized (${getPlaidEnvironmentName(this.config.environment)} mode, Mock: ${this.config.mockMode})`,
    );
  }

  /**
   * Get Plaid environment from config
   */
  private getPlaidEnvironment(): typeof PlaidEnvironments[keyof typeof PlaidEnvironments] {
    const envString = (this.configService.get<string>('PLAID_ENV') || 'sandbox').toLowerCase();

    switch (envString) {
      case 'production':
        return PlaidEnvironments.production;
      case 'development':
        return PlaidEnvironments.development;
      case 'sandbox':
      default:
        return PlaidEnvironments.sandbox;
    }
  }

  /**
   * Get Plaid API base path for environment
   */
  private getBasePath(environment: typeof PlaidEnvironments[keyof typeof PlaidEnvironments]): string {
    switch (environment) {
      case PlaidEnvironments.production:
        return 'https://production.plaid.com';
      case PlaidEnvironments.development:
        return 'https://development.plaid.com';
      case PlaidEnvironments.sandbox:
      default:
        return 'https://sandbox.plaid.com';
    }
  }

  /**
   * Create Plaid Link token for OAuth flow
   */
  async createLinkToken(request: PlaidLinkTokenRequest): Promise<PlaidLinkTokenResponse> {
    if (!this.isConfigured) {
      throw new BadRequestException('Plaid service is not configured. Please configure PLAID_CLIENT_ID and PLAID_SECRET environment variables.');
    }

    const startTime = Date.now();

    try {
      this.logger.log(`Creating link token for user ${request.userId}`);

      // Determine products based on environment
      const products = request.products || (
        this.config.environment === PlaidEnvironments.production
          ? [Products.Transactions, Products.Auth] // Production: use only approved products
          : PLAID_US_PRODUCTS // Sandbox: use all products
      );

      const linkTokenRequest: LinkTokenCreateRequest = {
        user: {
          client_user_id: request.userId,
        },
        client_name: request.clientName,
        products,
        country_codes: request.countryCodes || PLAID_US_COUNTRY_CODES,
        language: request.language || 'en',
        webhook: request.webhookUrl || this.config.webhookUrl,
        redirect_uri: request.redirectUri || this.config.redirectUri,
      };

      // Production requires webhook URL
      if (this.config.environment === PlaidEnvironments.production && !linkTokenRequest.webhook) {
        throw new BadRequestException('Webhook URL is required in production environment');
      }

      const response = await this.plaidClient.linkTokenCreate(linkTokenRequest);

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        action: 'LINK_TOKEN_CREATED',
        metadata: {
          environment: this.config.environment,
          products: linkTokenRequest.products,
          countryCodes: linkTokenRequest.country_codes,
          duration: Date.now() - startTime,
        },
      });

      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
      };
    } catch (error) {
      this.logger.error('Failed to create link token', error);
      await this.logAuditEvent({
        userId: request.userId,
        action: 'LINK_TOKEN_FAILED',
        metadata: {
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      this.handlePlaidError(error);
    }
  }

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(request: PlaidExchangeTokenRequest): Promise<PlaidExchangeTokenResponse> {
    if (!this.isConfigured) {
      throw new BadRequestException('Plaid service is not configured. Please configure PLAID_CLIENT_ID and PLAID_SECRET environment variables.');
    }

    const startTime = Date.now();

    try {
      this.logger.log(`Exchanging public token for user ${request.userId}`);

      const exchangeRequest: ItemPublicTokenExchangeRequest = {
        public_token: request.publicToken,
      };

      const response = await this.plaidClient.itemPublicTokenExchange(exchangeRequest);

      const accessToken = response.data.access_token;
      const itemId = response.data.item_id;

      // Encrypt access token before storage
      const encryptedAccessToken = PlaidEncryptionUtil.encrypt(accessToken, this.encryptionKey);

      // Store encrypted access token in database
      await this.prisma.$executeRaw`
        INSERT INTO plaid_connections
        (user_id, item_id, access_token, institution_id, institution_name, status, created_at, updated_at)
        VALUES
        (${request.userId}, ${itemId}, ${encryptedAccessToken}, ${request.institutionId || null}, ${request.institutionName || null}, ${PlaidItemStatus.ACTIVE}, NOW(), NOW())
        ON CONFLICT (item_id)
        DO UPDATE SET
          access_token = ${encryptedAccessToken},
          status = ${PlaidItemStatus.ACTIVE},
          updated_at = NOW()
      `;

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        action: 'TOKEN_EXCHANGED',
        metadata: {
          itemId,
          institutionId: request.institutionId,
          duration: Date.now() - startTime,
        },
      });

      return {
        accessToken: encryptedAccessToken, // Return encrypted for client (they won't use it directly)
        itemId,
        requestId: response.data.request_id,
      };
    } catch (error) {
      this.logger.error('Failed to exchange public token', error);
      await this.logAuditEvent({
        userId: request.userId,
        action: 'TOKEN_EXCHANGE_FAILED',
        metadata: {
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw new UnauthorizedException('Failed to exchange public token');
    }
  }

  /**
   * Get accounts for a Plaid item
   */
  async getAccounts(userId: string, itemId: string): Promise<PlaidAccount[]> {
    if (!this.isConfigured) {
      throw new BadRequestException('Plaid service is not configured. Please configure PLAID_CLIENT_ID and PLAID_SECRET environment variables.');
    }

    const startTime = Date.now();

    try {
      this.logger.log(`Fetching accounts for item ${itemId}`);

      // Get encrypted access token from database
      const connection = await this.prisma.$queryRaw<Array<{ access_token: string }>>`
        SELECT access_token
        FROM plaid_connections
        WHERE user_id = ${userId} AND item_id = ${itemId} AND status = ${PlaidItemStatus.ACTIVE}
        LIMIT 1
      `;

      if (!connection || connection.length === 0) {
        throw new UnauthorizedException('Plaid connection not found or inactive');
      }

      // Decrypt access token
      const accessToken = PlaidEncryptionUtil.decrypt(connection[0].access_token, this.encryptionKey);

      const accountsRequest: AccountsGetRequest = {
        access_token: accessToken,
      };

      const response = await this.plaidClient.accountsGet(accountsRequest);

      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'ACCOUNTS_FETCHED',
        metadata: {
          itemId,
          accountCount: response.data.accounts.length,
          duration: Date.now() - startTime,
        },
      });

      return response.data.accounts as PlaidAccount[];
    } catch (error) {
      this.logger.error('Failed to fetch accounts', error);
      await this.logAuditEvent({
        userId,
        action: 'ACCOUNTS_FETCH_FAILED',
        metadata: {
          itemId,
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw new ServiceUnavailableException('Failed to fetch accounts from Plaid');
    }
  }

  /**
   * Sync transactions for a Plaid item
   */
  async syncTransactions(
    userId: string,
    itemId: string,
    cursor?: string,
  ): Promise<{ transactions: PlaidTransactionExtended[]; nextCursor?: string; hasMore: boolean }> {
    if (!this.isConfigured) {
      throw new BadRequestException('Plaid service is not configured. Please configure PLAID_CLIENT_ID and PLAID_SECRET environment variables.');
    }

    const startTime = Date.now();

    try {
      this.logger.log(`Syncing transactions for item ${itemId}`);

      // Get encrypted access token from database
      const connection = await this.prisma.$queryRaw<Array<{ access_token: string }>>`
        SELECT access_token
        FROM plaid_connections
        WHERE user_id = ${userId} AND item_id = ${itemId} AND status = ${PlaidItemStatus.ACTIVE}
        LIMIT 1
      `;

      if (!connection || connection.length === 0) {
        throw new UnauthorizedException('Plaid connection not found or inactive');
      }

      // Decrypt access token
      const accessToken = PlaidEncryptionUtil.decrypt(connection[0].access_token, this.encryptionKey);

      const syncRequest: TransactionsSyncRequest = {
        access_token: accessToken,
        cursor: cursor,
      };

      const response = await this.plaidClient.transactionsSync(syncRequest);

      // Update last synced timestamp
      await this.prisma.$executeRaw`
        UPDATE plaid_connections
        SET last_synced = NOW(), updated_at = NOW()
        WHERE user_id = ${userId} AND item_id = ${itemId}
      `;

      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'TRANSACTIONS_SYNCED',
        metadata: {
          itemId,
          transactionCount: response.data.added.length,
          hasMore: response.data.has_more,
          duration: Date.now() - startTime,
        },
      });

      return {
        transactions: response.data.added as PlaidTransactionExtended[],
        nextCursor: response.data.next_cursor,
        hasMore: response.data.has_more,
      };
    } catch (error) {
      this.logger.error('Failed to sync transactions', error);
      await this.logAuditEvent({
        userId,
        action: 'TRANSACTIONS_SYNC_FAILED',
        metadata: {
          itemId,
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw new ServiceUnavailableException('Failed to sync transactions from Plaid');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = this.configService.get<string>('PLAID_WEBHOOK_SECRET') || this.config.secret;
    return PlaidEncryptionUtil.verifyWebhookSignature(payload, signature, webhookSecret);
  }

  /**
   * Handle Plaid errors with user-friendly messages
   */
  private handlePlaidError(error: any): never {
    const plaidError = error.response?.data;

    if (plaidError) {
      this.logger.error(`Plaid Error: ${plaidError.error_code} - ${plaidError.error_message}`);

      // Map Plaid error codes to user-friendly messages
      const errorMap: Record<string, string> = {
        'ITEM_LOGIN_REQUIRED': 'Bank connection needs to be re-authenticated. Please reconnect your account.',
        'INVALID_CREDENTIALS': 'Invalid bank credentials provided.',
        'INSTITUTION_NOT_RESPONDING': 'Bank is temporarily unavailable. Please try again later.',
        'INSTITUTION_DOWN': 'Bank is currently down for maintenance.',
        'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again in a few minutes.',
        'INVALID_REQUEST': 'Invalid request. Please check your input.',
        'INVALID_INPUT': 'Invalid input provided.',
        'INVALID_API_KEYS': 'Plaid API configuration error. Please contact support.',
        'ITEM_NOT_FOUND': 'Bank connection not found.',
        'PRODUCT_NOT_READY': 'Bank data is still being processed. Please try again in a few minutes.',
        'ITEM_LOCKED': 'Account is locked. Please contact your bank.',
        'INVALID_MFA': 'Invalid multi-factor authentication code.',
        'RECAPTCHA_REQUIRED': 'ReCAPTCHA verification required.',
        'INSUFFICIENT_CREDENTIALS': 'Additional authentication required by your bank.',
      };

      const message = errorMap[plaidError.error_code] || plaidError.error_message || 'An error occurred with the bank connection';

      // Map to appropriate HTTP status
      if (plaidError.error_code === 'ITEM_LOGIN_REQUIRED' || plaidError.error_code === 'INVALID_CREDENTIALS') {
        throw new UnauthorizedException(message);
      } else if (plaidError.error_code === 'INSTITUTION_NOT_RESPONDING' || plaidError.error_code === 'INSTITUTION_DOWN') {
        throw new ServiceUnavailableException(message);
      } else if (plaidError.error_code === 'RATE_LIMIT_EXCEEDED') {
        throw new ServiceUnavailableException(message);
      } else {
        throw new BadRequestException(message);
      }
    }

    // If not a Plaid error, throw generic error
    throw new InternalServerErrorException('An unexpected error occurred with Plaid integration');
  }

  /**
   * Check connection health for a Plaid item
   */
  async checkConnectionHealth(userId: string, itemId: string): Promise<{
    healthy: boolean;
    lastSync?: Date;
    error?: string;
    needsReauth: boolean;
    errorCode?: string;
  }> {
    try {
      // Get encrypted access token from database
      const connection = await this.prisma.$queryRaw<Array<{ access_token: string; last_synced: Date; status: string }>>`
        SELECT access_token, last_synced, status
        FROM plaid_connections
        WHERE user_id = ${userId} AND item_id = ${itemId}
        LIMIT 1
      `;

      if (!connection || connection.length === 0) {
        return {
          healthy: false,
          error: 'Connection not found',
          needsReauth: true,
        };
      }

      // If status is already ERROR, return unhealthy
      if (connection[0].status === 'ERROR') {
        return {
          healthy: false,
          error: 'Connection is in error state',
          needsReauth: true,
          lastSync: connection[0].last_synced,
        };
      }

      // Decrypt access token
      const accessToken = PlaidEncryptionUtil.decrypt(connection[0].access_token, this.encryptionKey);

      // Check item status with Plaid
      const response = await this.plaidClient.itemGet({
        access_token: accessToken,
      });

      const itemStatus = response.data.item;
      const hasError = !!itemStatus.error;

      return {
        healthy: !hasError,
        lastSync: connection[0].last_synced,
        error: itemStatus.error?.error_message,
        errorCode: itemStatus.error?.error_code,
        needsReauth: itemStatus.error?.error_code === 'ITEM_LOGIN_REQUIRED',
      };
    } catch (error) {
      this.logger.error('Failed to check connection health', error);
      return {
        healthy: false,
        error: error.message,
        needsReauth: true,
      };
    }
  }

  /**
   * Create update mode link token for re-authentication
   */
  async createUpdateLinkToken(userId: string, itemId: string): Promise<PlaidLinkTokenResponse> {
    if (!this.isConfigured) {
      throw new BadRequestException('Plaid service is not configured.');
    }

    try {
      // Get encrypted access token
      const connection = await this.prisma.$queryRaw<Array<{ access_token: string }>>`
        SELECT access_token
        FROM plaid_connections
        WHERE user_id = ${userId} AND item_id = ${itemId}
        LIMIT 1
      `;

      if (!connection || connection.length === 0) {
        throw new BadRequestException('Connection not found');
      }

      const accessToken = PlaidEncryptionUtil.decrypt(connection[0].access_token, this.encryptionKey);

      const response = await this.plaidClient.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: 'Operate',
        access_token: accessToken, // Update mode
        country_codes: PLAID_US_COUNTRY_CODES,
        language: 'en',
        webhook: this.config.webhookUrl,
      });

      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
      };
    } catch (error) {
      this.logger.error('Failed to create update link token', error);
      this.handlePlaidError(error);
    }
  }

  /**
   * Mark connection as needing re-authentication
   */
  async markConnectionNeedsReauth(itemId: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE plaid_connections
        SET status = 'ERROR', updated_at = NOW()
        WHERE item_id = ${itemId}
      `;
      this.logger.log(`Marked connection ${itemId} as needing re-authentication`);
    } catch (error) {
      this.logger.error('Failed to mark connection as needing reauth', error);
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(event: {
    userId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO plaid_audit_logs
        (user_id, action, metadata, created_at)
        VALUES
        (${event.userId}, ${event.action}, ${JSON.stringify(event.metadata)}::jsonb, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
      // Don't throw - audit logging failure shouldn't break the main flow
    }
  }
}
