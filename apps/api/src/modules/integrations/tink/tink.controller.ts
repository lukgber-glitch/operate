import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TinkService } from './tink.service';
import {
  StartAuthorizationDto,
  CompleteAuthorizationDto,
  GetTransactionsDto,
} from './dto';

/**
 * Example Tink Controller
 * Add authentication guards and organization/user context as needed
 */
@Controller('integrations/tink')
export class TinkController {
  constructor(private readonly tinkService: TinkService) {}

  /**
   * Start OAuth2 authorization flow
   * GET /integrations/tink/authorize
   */
  @Get('authorize')
  async startAuthorization(@Query() dto: StartAuthorizationDto) {
    const { authorizationUrl, state } = await this.tinkService.startAuthorization(
      dto.organizationId,
      dto.userId,
      dto.market || 'DE',
      dto.locale || 'en_US',
    );

    return {
      authorizationUrl,
      state,
      message: 'Redirect user to authorizationUrl to complete bank authorization',
    };
  }

  /**
   * Handle OAuth2 callback (complete authorization)
   * GET /integrations/tink/callback?code=...&state=...
   */
  @Get('callback')
  async completeAuthorization(@Query() dto: CompleteAuthorizationDto) {
    const token = await this.tinkService.completeAuthorization(
      dto.code,
      dto.state,
    );

    return {
      success: true,
      message: 'Bank account successfully connected',
      expiresAt: token.expiresAt,
    };
  }

  /**
   * Get connected bank accounts
   * GET /integrations/tink/accounts
   */
  @Get('accounts')
  async getAccounts(
    @Query('organizationId') organizationId: string,
    @Query('userId') userId: string,
  ) {
    const accounts = await this.tinkService.getAccounts(organizationId, userId);

    return {
      accounts,
      count: accounts.length,
    };
  }

  /**
   * Get transactions for an account
   * GET /integrations/tink/transactions
   */
  @Get('transactions')
  async getTransactions(@Query() dto: GetTransactionsDto) {
    const transactions = await this.tinkService.getTransactions(
      dto.organizationId,
      dto.userId,
      dto.accountId,
      dto.startDate ? new Date(dto.startDate) : undefined,
      dto.endDate ? new Date(dto.endDate) : undefined,
    );

    return {
      transactions,
      count: transactions.length,
      accountId: dto.accountId,
    };
  }

  /**
   * Refresh access token
   * POST /integrations/tink/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body('organizationId') organizationId: string,
    @Body('userId') userId: string,
  ) {
    const token = await this.tinkService.refreshToken(organizationId, userId);

    return {
      success: true,
      expiresAt: token.expiresAt,
    };
  }

  /**
   * Disconnect bank (revoke access)
   * DELETE /integrations/tink/credentials
   */
  @Delete('credentials')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCredentials(
    @Query('organizationId') organizationId: string,
    @Query('userId') userId: string,
  ) {
    await this.tinkService.deleteCredentials(organizationId, userId);
  }

  /**
   * Get available bank providers
   * GET /integrations/tink/providers
   */
  @Get('providers')
  async getProviders(@Query('market') market: string = 'DE') {
    const providers = await this.tinkService.getProviders(market);

    return {
      providers,
      count: providers.length,
      market,
    };
  }
}
