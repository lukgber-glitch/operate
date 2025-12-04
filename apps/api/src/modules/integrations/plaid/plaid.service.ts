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
  private readonly isConfigured: boolean = false;

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
    (this as any).isConfigured = true;
    this.logger.log(
      `Plaid Service initialized (${getPlaidEnvironmentName(this.config.environment)} mode, Mock: ${this.config.mockMode})`,
    );
  }

  /**
   * Get Plaid environment from config
   */
  private getPlaidEnvironment(): PlaidEnvironments {
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
  private getBasePath(environment: PlaidEnvironments): string {
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

      const linkTokenRequest: LinkTokenCreateRequest = {
        user: {
          client_user_id: request.userId,
        },
        client_name: request.clientName,
        products: request.products || PLAID_US_PRODUCTS,
        country_codes: request.countryCodes || PLAID_US_COUNTRY_CODES,
        language: request.language || 'en',
        webhook: request.webhookUrl || this.config.webhookUrl,
        redirect_uri: request.redirectUri || this.config.redirectUri,
      };

      const response = await this.plaidClient.linkTokenCreate(linkTokenRequest);

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        action: 'LINK_TOKEN_CREATED',
        metadata: {
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
      throw new InternalServerErrorException('Failed to create Plaid link token');
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
   * Log audit event
   */
  private async logAuditEvent(event: {
    userId: string;
    action: string;
    metadata: Record<string, any>;
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
