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
    this.logger.log(`Received Plaid webhook: ${webhookDto.webhook_type} - ${webhookDto.webhook_code}`);

    try {
      // Verify webhook signature
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
          this.logger.log(`Transactions webhook for item ${webhookDto.item_id}: ${webhookDto.new_transactions} new transactions`);
          // TODO: Trigger background job to sync transactions
          break;

        case 'ITEM':
          this.logger.log(`Item webhook for ${webhookDto.item_id}: ${webhookDto.webhook_code}`);
          if (webhookDto.error) {
            this.logger.error(`Item error: ${webhookDto.error.error_code} - ${webhookDto.error.error_message}`);
            // TODO: Update item status to ERROR in database
          }
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
}
