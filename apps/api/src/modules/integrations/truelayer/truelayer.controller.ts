import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Logger,
  UnauthorizedException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TrueLayerService } from './truelayer.service';
import { TrueLayerBankingService } from './services/truelayer-banking.service';
import { TrueLayerTransactionMatcherService } from './services/truelayer-transaction-matcher.service';
import { CreateAuthLinkDto, ExchangeTokenDto, TrueLayerWebhookDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * TrueLayer Integration Controller
 * Handles bank account connections via UK Open Banking (PSD2 compliant)
 */
@ApiTags('TrueLayer Integration')
@Controller('truelayer')
export class TrueLayerController {
  private readonly logger = new Logger(TrueLayerController.name);

  constructor(
    private readonly trueLayerService: TrueLayerService,
    private readonly trueLayerBankingService: TrueLayerBankingService,
    private readonly trueLayerTransactionMatcherService: TrueLayerTransactionMatcherService,
    @InjectQueue('truelayer-sync') private readonly syncQueue: Queue,
    @InjectQueue('truelayer-balance') private readonly balanceQueue: Queue,
  ) {}

  /**
   * Create Authorization Link
   * Generates an authorization URL for TrueLayer OAuth2 PKCE flow
   */
  @Post('auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Create TrueLayer authorization link',
    description: 'Generates an OAuth2 authorization URL for connecting UK bank accounts via Open Banking',
  })
  @ApiResponse({
    status: 201,
    description: 'Authorization link created successfully',
    schema: {
      type: 'object',
      properties: {
        authUrl: { type: 'string', example: 'https://auth.truelayer.com?...' },
        state: { type: 'string', example: 'xyz789' },
        expiresAt: { type: 'string', example: '2024-12-02T18:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createAuthLink(
    @Body() createAuthLinkDto: CreateAuthLinkDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Creating auth link for user ${user.id}`);

    try {
      const result = await this.trueLayerService.createAuthLink({
        userId: createAuthLinkDto.userId || user.id,
        scopes: createAuthLinkDto.scopes,
        redirectUri: createAuthLinkDto.redirectUri,
        providerId: createAuthLinkDto.providerId,
        enableMockProviders: createAuthLinkDto.enableMockProviders,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create auth link', error);
      throw error;
    }
  }

  /**
   * OAuth2 Callback Handler
   * Exchanges authorization code for access token
   */
  @Post('callback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Exchange authorization code for access token',
    description: 'Exchanges OAuth2 authorization code for access and refresh tokens',
  })
  @ApiResponse({
    status: 201,
    description: 'Token exchange successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'Encrypted access token (for reference only)' },
        refreshToken: { type: 'string', description: 'Encrypted refresh token (for reference only)' },
        expiresIn: { type: 'number', example: 3600 },
        tokenType: { type: 'string', example: 'Bearer' },
        scope: { type: 'string', example: 'info accounts balance transactions offline_access' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async exchangeToken(
    @Body() exchangeTokenDto: ExchangeTokenDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Exchanging authorization code for user ${user.id}`);

    try {
      const result = await this.trueLayerService.exchangeToken({
        code: exchangeTokenDto.code,
        userId: exchangeTokenDto.userId || user.id,
        state: exchangeTokenDto.state,
        redirectUri: exchangeTokenDto.redirectUri,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to exchange token', error);
      throw error;
    }
  }

  /**
   * Get Connections
   * Retrieves all TrueLayer connections for the authenticated user
   */
  @Get('connections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({
    summary: 'Get user TrueLayer connections',
    description: 'Retrieves all active TrueLayer bank connections for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Connections retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          providerId: { type: 'string' },
          providerName: { type: 'string' },
          status: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConnections(@CurrentUser() user: any) {
    this.logger.log(`Fetching connections for user ${user.id}`);

    try {
      // TODO: Implement getConnections in service
      return { message: 'Not implemented yet' };
    } catch (error) {
      this.logger.error('Failed to fetch connections', error);
      throw error;
    }
  }

  /**
   * Get Accounts (Database)
   * Retrieves stored bank accounts for an organization
   */
  @Get('accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get stored bank accounts',
    description: 'Retrieves all TrueLayer bank accounts stored in database for the organization',
  })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStoredAccounts(@CurrentUser() user: any, @Query('connectionId') connectionId?: string) {
    this.logger.log(`Fetching stored accounts for org ${user.orgId}`);

    try {
      const accounts = await this.trueLayerBankingService.getBankAccounts(
        user.orgId,
        connectionId,
      );
      return accounts;
    } catch (error) {
      this.logger.error('Failed to fetch stored accounts', error);
      throw error;
    }
  }

  /**
   * Get Accounts (Live from TrueLayer)
   * Retrieves all bank accounts for a TrueLayer connection
   */
  @Get('connections/:connectionId/accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({
    summary: 'Get accounts for a TrueLayer connection',
    description: 'Retrieves all bank accounts associated with a TrueLayer connection',
  })
  @ApiResponse({
    status: 200,
    description: 'Accounts retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          account_id: { type: 'string' },
          display_name: { type: 'string' },
          currency: { type: 'string' },
          account_type: { type: 'string' },
          account_number: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async getAccounts(@Param('connectionId') connectionId: string, @CurrentUser() user: any) {
    this.logger.log(`Fetching accounts for connection ${connectionId}, user ${user.id}`);

    try {
      const accounts = await this.trueLayerService.getAccounts(user.id, connectionId);
      return accounts;
    } catch (error) {
      this.logger.error('Failed to fetch accounts', error);
      throw error;
    }
  }

  /**
   * Get Account Balance
   * Retrieves balance for a specific account
   */
  @Get('connections/:connectionId/accounts/:accountId/balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({
    summary: 'Get account balance',
    description: 'Retrieves the current balance for a specific bank account',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        currency: { type: 'string', example: 'GBP' },
        available: { type: 'number', example: 1234.56 },
        current: { type: 'number', example: 1234.56 },
        overdraft: { type: 'number', example: 500.00 },
        update_timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async getBalance(
    @Param('connectionId') connectionId: string,
    @Param('accountId') accountId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Fetching balance for account ${accountId}, user ${user.id}`);

    try {
      const balance = await this.trueLayerService.getBalance(user.id, connectionId, accountId);
      return balance;
    } catch (error) {
      this.logger.error('Failed to fetch balance', error);
      throw error;
    }
  }

  /**
   * Get Account Transactions
   * Retrieves transactions for a specific account
   */
  @Get('connections/:connectionId/accounts/:accountId/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Get account transactions',
    description: 'Retrieves transactions for a specific bank account with optional date filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          transaction_id: { type: 'string' },
          timestamp: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
          transaction_type: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async getTransactions(
    @Param('connectionId') connectionId: string,
    @Param('accountId') accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentUser() user?: any,
  ) {
    this.logger.log(`Fetching transactions for account ${accountId}, user ${user.id}`);

    try {
      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;

      const transactions = await this.trueLayerService.getTransactions(
        user.id,
        connectionId,
        accountId,
        fromDate,
        toDate,
      );
      return transactions;
    } catch (error) {
      this.logger.error('Failed to fetch transactions', error);
      throw error;
    }
  }

  /**
   * Webhook Handler
   * Receives and processes webhook notifications from TrueLayer
   */
  @Post('webhook')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @ApiOperation({
    summary: 'TrueLayer webhook endpoint',
    description: 'Receives webhook notifications from TrueLayer for various events (account updates, transactions, etc.)',
  })
  @ApiBody({ type: TrueLayerWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid signature' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() webhookDto: TrueLayerWebhookDto,
    @Headers('tl-signature') signature?: string,
  ) {
    this.logger.log(`Received TrueLayer webhook: ${webhookDto.type} - ${webhookDto.event_id}`);

    try {
      // Verify webhook signature
      if (signature) {
        const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(webhookDto);
        const isValid = this.trueLayerService.verifyWebhookSignature(rawBody, signature);

        if (!isValid) {
          this.logger.warn('Invalid webhook signature');
          throw new UnauthorizedException('Invalid webhook signature');
        }
      } else {
        this.logger.warn('Webhook received without signature header');
      }

      // Process webhook based on type
      switch (webhookDto.type) {
        case 'transaction.created':
          this.logger.log(`New transaction webhook for resource ${webhookDto.resource_id}`);
          // TODO: Trigger background job to sync transactions
          break;

        case 'account.updated':
          this.logger.log(`Account updated webhook for resource ${webhookDto.resource_id}`);
          // TODO: Trigger background job to refresh account data
          break;

        case 'balance.updated':
          this.logger.log(`Balance updated webhook for resource ${webhookDto.resource_id}`);
          // TODO: Trigger background job to refresh balance
          break;

        case 'consent.revoked':
          this.logger.log(`Consent revoked webhook for resource ${webhookDto.resource_id}`);
          // TODO: Update connection status to REVOKED
          break;

        default:
          this.logger.log(`Unhandled webhook type: ${webhookDto.type}`);
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      this.logger.error('Failed to process webhook', error);
      throw error;
    }
  }

  /**
   * Get Account Transactions (Database)
   * Retrieves stored transactions for an account
   */
  @Get('accounts/:accountId/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get stored account transactions',
    description: 'Retrieves transactions for a specific bank account from database',
  })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStoredTransactions(
    @Param('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser() user?: any,
  ) {
    this.logger.log(`Fetching stored transactions for account ${accountId}`);

    try {
      const result = await this.trueLayerBankingService.getTransactions(
        user.orgId,
        accountId,
        {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          limit: limit ? parseInt(limit) : undefined,
          offset: offset ? parseInt(offset) : undefined,
        },
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch stored transactions', error);
      throw error;
    }
  }

  /**
   * Trigger Manual Sync
   * Manually trigger account and transaction synchronization
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Trigger manual sync',
    description: 'Manually trigger synchronization of accounts and transactions from TrueLayer',
  })
  @ApiResponse({ status: 201, description: 'Sync job queued successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async triggerSync(
    @Body() body: { connectionId: string; accountId?: string; syncType?: 'accounts' | 'transactions' | 'full' },
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Triggering manual sync for connection ${body.connectionId}`);

    try {
      const syncType = body.syncType || 'full';

      const job = await this.syncQueue.add('manual-sync', {
        orgId: user.orgId,
        userId: user.id,
        connectionId: body.connectionId,
        accountId: body.accountId,
        syncType,
      });

      return {
        success: true,
        jobId: job.id,
        syncType,
        message: 'Sync job queued successfully',
      };
    } catch (error) {
      this.logger.error('Failed to trigger sync', error);
      throw error;
    }
  }

  /**
   * Refresh Account Balances
   * Manually trigger balance refresh for a connection
   */
  @Post('connections/:connectionId/refresh-balances')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Refresh account balances',
    description: 'Manually trigger balance refresh for all accounts in a connection',
  })
  @ApiResponse({ status: 201, description: 'Balance refresh job queued successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refreshBalances(
    @Param('connectionId') connectionId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Triggering balance refresh for connection ${connectionId}`);

    try {
      const job = await this.balanceQueue.add('manual-refresh', {
        orgId: user.orgId,
        userId: user.id,
        connectionId,
      });

      return {
        success: true,
        jobId: job.id,
        message: 'Balance refresh job queued successfully',
      };
    } catch (error) {
      this.logger.error('Failed to trigger balance refresh', error);
      throw error;
    }
  }

  /**
   * Match Transactions
   * Trigger automatic matching of transactions to invoices/expenses
   */
  @Post('match-transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Match transactions',
    description: 'Automatically match bank transactions to invoices and expenses',
  })
  @ApiResponse({ status: 200, description: 'Matching completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async matchTransactions(
    @Body() body: { autoMatch?: boolean },
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Matching transactions for org ${user.orgId}`);

    try {
      const summary = await this.trueLayerTransactionMatcherService.matchAllTransactions(
        user.orgId,
        body.autoMatch || false,
      );

      return {
        success: true,
        summary,
      };
    } catch (error) {
      this.logger.error('Failed to match transactions', error);
      throw error;
    }
  }
}
