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
  BadRequestException,
  UnauthorizedException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PlaidService } from './plaid.service';
import { CreateLinkTokenDto, ExchangePublicTokenDto, PlaidWebhookDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * Plaid Integration Controller
 * Handles bank account connections via Plaid Link
 */
@ApiTags('Plaid Integration')
@Controller('plaid')
export class PlaidController {
  private readonly logger = new Logger(PlaidController.name);

  constructor(private readonly plaidService: PlaidService) {}

  /**
   * Create Link Token
   * Generates a link token for initializing Plaid Link
   */
  @Post('create-link-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Create Plaid Link token',
    description: 'Generates a link token for initializing Plaid Link to connect bank accounts',
  })
  @ApiResponse({
    status: 201,
    description: 'Link token created successfully',
    schema: {
      type: 'object',
      properties: {
        linkToken: { type: 'string', example: 'link-sandbox-abc123' },
        expiration: { type: 'string', example: '2024-12-02T18:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createLinkToken(
    @Body() createLinkTokenDto: CreateLinkTokenDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Creating link token for user ${user.id}`);

    try {
      const result = await this.plaidService.createLinkToken({
        userId: createLinkTokenDto.userId || user.id,
        clientName: createLinkTokenDto.clientName,
        language: createLinkTokenDto.language,
        countryCodes: createLinkTokenDto.countryCodes,
        products: createLinkTokenDto.products,
        webhookUrl: createLinkTokenDto.webhookUrl,
        redirectUri: createLinkTokenDto.redirectUri,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create link token', error);
      throw error;
    }
  }

  /**
   * Exchange Public Token
   * Exchanges a public token from Plaid Link for an access token
   */
  @Post('exchange-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Exchange public token for access token',
    description: 'Exchanges a public token received from Plaid Link for a permanent access token',
  })
  @ApiResponse({
    status: 201,
    description: 'Token exchanged successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'Encrypted access token (for reference only)' },
        itemId: { type: 'string', example: 'eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6' },
        requestId: { type: 'string', example: 'xyz123' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async exchangePublicToken(
    @Body() exchangeTokenDto: ExchangePublicTokenDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Exchanging public token for user ${user.id}`);

    try {
      const result = await this.plaidService.exchangePublicToken({
        publicToken: exchangeTokenDto.publicToken,
        userId: exchangeTokenDto.userId || user.id,
        institutionId: exchangeTokenDto.institutionId,
        institutionName: exchangeTokenDto.institutionName,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to exchange public token', error);
      throw error;
    }
  }

  /**
   * Get Accounts
   * Retrieves all accounts for a connected Plaid item
   */
  @Get('accounts/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({
    summary: 'Get accounts for a Plaid item',
    description: 'Retrieves all bank accounts associated with a connected Plaid item',
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
          name: { type: 'string' },
          official_name: { type: 'string' },
          type: { type: 'string' },
          subtype: { type: 'string' },
          balances: {
            type: 'object',
            properties: {
              current: { type: 'number' },
              available: { type: 'number' },
              limit: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async getAccounts(@Param('itemId') itemId: string, @CurrentUser() user: any) {
    this.logger.log(`Fetching accounts for item ${itemId}, user ${user.id}`);

    try {
      const accounts = await this.plaidService.getAccounts(user.id, itemId);
      return accounts;
    } catch (error) {
      this.logger.error('Failed to fetch accounts', error);
      throw error;
    }
  }

  /**
   * Sync Transactions
   * Syncs transactions for a connected Plaid item
   */
  @Get('transactions/:itemId/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Sync transactions for a Plaid item',
    description: 'Syncs transactions from a connected bank account using Plaid Transactions Sync API',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions synced successfully',
    schema: {
      type: 'object',
      properties: {
        transactions: { type: 'array', items: { type: 'object' } },
        nextCursor: { type: 'string' },
        hasMore: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async syncTransactions(
    @Param('itemId') itemId: string,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: any,
  ) {
    this.logger.log(`Syncing transactions for item ${itemId}, user ${user.id}`);

    try {
      const result = await this.plaidService.syncTransactions(user.id, itemId, cursor);
      return result;
    } catch (error) {
      this.logger.error('Failed to sync transactions', error);
      throw error;
    }
  }

  /**
   * Webhook Handler
   * Receives and processes webhook notifications from Plaid
   */
  @Public()
  @Post('webhook')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @ApiOperation({
    summary: 'Plaid webhook endpoint',
    description: 'Receives webhook notifications from Plaid for various events (transactions updates, item errors, etc.)',
  })
  @ApiBody({ type: PlaidWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid signature' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() webhookDto: PlaidWebhookDto,
    @Headers('plaid-verification') signature?: string,
  ) {
    this.logger.log(`Received Plaid webhook: ${webhookDto.webhook_type} - ${webhookDto.webhook_code} for item ${webhookDto.item_id}`);

    try {
      // Verify webhook signature in production
      if (signature) {
        const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(webhookDto);
        const isValid = this.plaidService.verifyWebhookSignature(rawBody, signature);

        if (!isValid) {
          this.logger.warn('Invalid webhook signature');
          throw new UnauthorizedException('Invalid webhook signature');
        }
      } else {
        this.logger.warn('Webhook received without signature header');
      }

      // Process webhook based on type
      switch (webhookDto.webhook_type) {
        case 'TRANSACTIONS':
          await this.handleTransactionWebhook(webhookDto);
          break;

        case 'ITEM':
          await this.handleItemWebhook(webhookDto);
          break;

        case 'AUTH':
          await this.handleAuthWebhook(webhookDto);
          break;

        default:
          this.logger.log(`Unhandled webhook type: ${webhookDto.webhook_type}`);
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      this.logger.error('Failed to process webhook', error);
      throw error;
    }
  }

  /**
   * Handle TRANSACTIONS webhook events
   */
  private async handleTransactionWebhook(webhookDto: PlaidWebhookDto): Promise<void> {
    const { webhook_code, item_id, new_transactions } = webhookDto;

    switch (webhook_code) {
      case 'SYNC_UPDATES_AVAILABLE':
        this.logger.log(`SYNC_UPDATES_AVAILABLE for item ${item_id}: ${new_transactions} new transactions`);
        // TODO: Trigger background job to sync transactions
        // await this.plaidSyncJob.syncItemTransactions(item_id);
        break;

      case 'INITIAL_UPDATE':
        this.logger.log(`INITIAL_UPDATE for item ${item_id}: Initial data available`);
        // TODO: Trigger initial sync
        break;

      case 'HISTORICAL_UPDATE':
        this.logger.log(`HISTORICAL_UPDATE for item ${item_id}: Historical data available`);
        // TODO: Trigger historical sync
        break;

      case 'DEFAULT_UPDATE':
        this.logger.log(`DEFAULT_UPDATE for item ${item_id}: Update available`);
        // TODO: Trigger sync
        break;

      case 'TRANSACTIONS_REMOVED':
        this.logger.log(`TRANSACTIONS_REMOVED for item ${item_id}: ${webhookDto.removed_transactions?.length || 0} transactions removed`);
        // TODO: Mark transactions as removed in database
        break;

      default:
        this.logger.warn(`Unhandled TRANSACTIONS webhook code: ${webhook_code}`);
    }
  }

  /**
   * Handle ITEM webhook events
   */
  private async handleItemWebhook(webhookDto: PlaidWebhookDto): Promise<void> {
    const { webhook_code, item_id, error } = webhookDto;

    switch (webhook_code) {
      case 'ERROR':
        this.logger.error(`ITEM ERROR for ${item_id}: ${error?.error_code} - ${error?.error_message}`);

        // Mark connection as needing re-authentication
        if (error?.error_code === 'ITEM_LOGIN_REQUIRED') {
          await this.plaidService.markConnectionNeedsReauth(item_id);
          // TODO: Send notification to user to re-authenticate
          this.logger.log(`Marked item ${item_id} as needing re-authentication`);
        } else {
          await this.plaidService.markConnectionNeedsReauth(item_id);
        }
        break;

      case 'PENDING_EXPIRATION':
        this.logger.warn(`PENDING_EXPIRATION for item ${item_id}: Connection will expire soon`);
        // TODO: Notify user to re-authenticate before expiration
        break;

      case 'USER_PERMISSION_REVOKED':
        this.logger.warn(`USER_PERMISSION_REVOKED for item ${item_id}: User revoked access`);
        await this.plaidService.markConnectionNeedsReauth(item_id);
        // TODO: Disable connection and notify user
        break;

      case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
        this.logger.log(`WEBHOOK_UPDATE_ACKNOWLEDGED for item ${item_id}`);
        break;

      default:
        this.logger.warn(`Unhandled ITEM webhook code: ${webhook_code}`);
    }
  }

  /**
   * Handle AUTH webhook events
   */
  private async handleAuthWebhook(webhookDto: PlaidWebhookDto): Promise<void> {
    const { webhook_code, item_id } = webhookDto;

    switch (webhook_code) {
      case 'AUTOMATICALLY_VERIFIED':
        this.logger.log(`AUTH AUTOMATICALLY_VERIFIED for item ${item_id}`);
        // Auth verification successful
        break;

      case 'VERIFICATION_EXPIRED':
        this.logger.warn(`AUTH VERIFICATION_EXPIRED for item ${item_id}`);
        // TODO: Notify user to re-verify
        break;

      default:
        this.logger.warn(`Unhandled AUTH webhook code: ${webhook_code}`);
    }
  }

  /**
   * Check connection health
   */
  @Get('connections/:itemId/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check Plaid connection health',
    description: 'Checks the health status of a Plaid connection',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection health retrieved',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        lastSync: { type: 'string', format: 'date-time' },
        error: { type: 'string' },
        errorCode: { type: 'string' },
        needsReauth: { type: 'boolean' },
      },
    },
  })
  async checkConnectionHealth(
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Checking connection health for item ${itemId}`);

    try {
      const health = await this.plaidService.checkConnectionHealth(user.id, itemId);
      return health;
    } catch (error) {
      this.logger.error('Failed to check connection health', error);
      throw error;
    }
  }

  /**
   * Create update mode link token for re-authentication
   */
  @Post('connections/:itemId/reauth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create re-authentication link token',
    description: 'Creates a link token for re-authenticating an existing Plaid connection',
  })
  @ApiResponse({
    status: 201,
    description: 'Update link token created',
    schema: {
      type: 'object',
      properties: {
        linkToken: { type: 'string' },
        expiration: { type: 'string' },
      },
    },
  })
  async createReauthToken(
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Creating re-auth link token for item ${itemId}`);

    try {
      const result = await this.plaidService.createUpdateLinkToken(user.id, itemId);
      return result;
    } catch (error) {
      this.logger.error('Failed to create re-auth link token', error);
      throw error;
    }
  }
}
