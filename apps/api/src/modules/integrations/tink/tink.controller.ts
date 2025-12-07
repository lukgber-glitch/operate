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
  Request,
} from '@nestjs/common';
import { TinkService } from './tink.service';
import {
  StartAuthorizationDto,
  CompleteAuthorizationDto,
  GetTransactionsDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * Tink Controller
 * Handles Tink banking integration with proper authentication and tenant isolation
 */
@Controller('integrations/tink')
@UseGuards(JwtAuthGuard)
export class TinkController {
  constructor(private readonly tinkService: TinkService) {}

  /**
   * Start OAuth2 authorization flow
   * GET /integrations/tink/authorize
   */
  @Get('authorize')
  async startAuthorization(
    @Request() req,
    @Query('market') market?: string,
    @Query('locale') locale?: string,
  ) {
    const { authorizationUrl, state } = await this.tinkService.startAuthorization(
      req.orgId, // Use TenantGuard-validated orgId
      req.user.userId,
      market || 'DE',
      locale || 'en_US',
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
   * This endpoint is public as it receives callbacks from Tink
   */
  @Public()
  @Get('callback')
  async completeAuthorization(@Query() dto: CompleteAuthorizationDto) {
    // State parameter is validated by TinkService to prevent CSRF
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
  async getAccounts(@Request() req) {
    const accounts = await this.tinkService.getAccounts(
      req.orgId, // Use TenantGuard-validated orgId
      req.user.userId,
    );

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
  async getTransactions(
    @Request() req,
    @Query('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const transactions = await this.tinkService.getTransactions(
      req.orgId, // Use TenantGuard-validated orgId
      req.user.userId,
      accountId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      transactions,
      count: transactions.length,
      accountId,
    };
  }

  /**
   * Refresh access token
   * POST /integrations/tink/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Request() req) {
    const token = await this.tinkService.refreshToken(
      req.orgId, // Use TenantGuard-validated orgId
      req.user.userId,
    );

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
  async deleteCredentials(@Request() req) {
    await this.tinkService.deleteCredentials(
      req.orgId, // Use TenantGuard-validated orgId
      req.user.userId,
    );
  }

  /**
   * Get available bank providers
   * GET /integrations/tink/providers
   * This endpoint doesn't require organization context
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
