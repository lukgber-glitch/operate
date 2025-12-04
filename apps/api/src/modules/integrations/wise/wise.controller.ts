import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WiseService } from './wise.service';
import { WiseTransferService } from './services/wise-transfer.service';
import { WiseBalanceService } from './services/wise-balance.service';
import {
  CreateQuoteDto,
  CreateRecipientDto,
  CreateTransferDto,
} from './dto';
import {
  WiseQuote,
  WiseRecipient,
  WiseTransfer,
  WiseBalance,
  WiseStatement,
  WiseCurrency,
  WiseTransferStatus,
} from './wise.types';

/**
 * Wise Integration Controller
 * REST API endpoints for Wise Business integration
 *
 * Endpoints:
 * - Quotes (exchange rates)
 * - Recipients (beneficiaries)
 * - Transfers (international payments)
 * - Balances (multi-currency accounts)
 * - Statements (transaction history)
 *
 * @see https://api-docs.wise.com/
 */
@ApiTags('Integrations - Wise')
@Controller('integrations/wise')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
@ApiBearerAuth()
export class WiseController {
  constructor(
    private readonly wiseService: WiseService,
    private readonly transferService: WiseTransferService,
    private readonly balanceService: WiseBalanceService,
  ) {}

  // ============================================
  // Profile Endpoints
  // ============================================

  @Get('profiles')
  @ApiOperation({ summary: 'Get all Wise profiles (personal and business)' })
  @ApiResponse({ status: 200, description: 'Profiles retrieved successfully' })
  async getProfiles() {
    return this.wiseService.getProfiles();
  }

  @Get('profiles/business')
  @ApiOperation({ summary: 'Get business profile ID' })
  @ApiResponse({ status: 200, description: 'Business profile ID retrieved' })
  async getBusinessProfileId() {
    const profileId = await this.wiseService.getBusinessProfileId();
    return { profileId };
  }

  // ============================================
  // Quote Endpoints
  // ============================================

  @Post('quotes')
  @ApiOperation({ summary: 'Create exchange rate quote' })
  @ApiResponse({ status: 201, description: 'Quote created successfully' })
  async createQuote(@Body() dto: CreateQuoteDto): Promise<WiseQuote> {
    return this.transferService.createQuote(dto);
  }

  @Get('quotes/:quoteId')
  @ApiOperation({ summary: 'Get quote by ID' })
  @ApiResponse({ status: 200, description: 'Quote retrieved successfully' })
  async getQuote(@Param('quoteId') quoteId: string): Promise<WiseQuote> {
    return this.transferService.getQuote(quoteId);
  }

  // ============================================
  // Recipient Endpoints
  // ============================================

  @Post('recipients')
  @ApiOperation({ summary: 'Create recipient account (beneficiary)' })
  @ApiResponse({ status: 201, description: 'Recipient created successfully' })
  async createRecipient(@Body() dto: CreateRecipientDto): Promise<WiseRecipient> {
    return this.transferService.createRecipient(dto);
  }

  @Get('recipients')
  @ApiOperation({ summary: 'Get all recipients' })
  @ApiResponse({ status: 200, description: 'Recipients retrieved successfully' })
  async getRecipients(
    @Query('currency') currency?: WiseCurrency,
  ): Promise<WiseRecipient[]> {
    return this.transferService.getRecipients(currency);
  }

  @Get('recipients/:recipientId')
  @ApiOperation({ summary: 'Get recipient by ID' })
  @ApiResponse({ status: 200, description: 'Recipient retrieved successfully' })
  async getRecipient(
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<WiseRecipient> {
    return this.transferService.getRecipient(recipientId);
  }

  @Delete('recipients/:recipientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete recipient' })
  @ApiResponse({ status: 204, description: 'Recipient deleted successfully' })
  async deleteRecipient(
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<void> {
    return this.transferService.deleteRecipient(recipientId);
  }

  // ============================================
  // Transfer Endpoints
  // ============================================

  @Post('transfers')
  @ApiOperation({ summary: 'Create transfer (does not fund it)' })
  @ApiResponse({ status: 201, description: 'Transfer created successfully' })
  async createTransfer(@Body() dto: CreateTransferDto): Promise<WiseTransfer> {
    return this.transferService.createTransfer(dto);
  }

  @Post('transfers/:transferId/fund')
  @ApiOperation({ summary: 'Fund transfer from Wise balance (executes payment)' })
  @ApiResponse({ status: 200, description: 'Transfer funded successfully' })
  async fundTransfer(
    @Param('transferId', ParseIntPipe) transferId: number,
  ): Promise<WiseTransfer> {
    return this.transferService.fundTransfer(transferId);
  }

  @Post('transfers/execute')
  @ApiOperation({
    summary: 'Execute complete transfer workflow (quote + create + fund)',
    description: 'Convenience endpoint that creates quote, transfer, and funds it in one call',
  })
  @ApiResponse({ status: 201, description: 'Transfer executed successfully' })
  async executeTransfer(
    @Body() dto: CreateTransferDto & CreateQuoteDto,
  ): Promise<{ quote: WiseQuote; transfer: WiseTransfer }> {
    return this.transferService.executeTransfer(dto);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Get all transfers' })
  @ApiResponse({ status: 200, description: 'Transfers retrieved successfully' })
  async getTransfers(
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
    @Query('status') status?: WiseTransferStatus,
  ): Promise<WiseTransfer[]> {
    return this.transferService.getTransfers(limit, offset, status);
  }

  @Get('transfers/:transferId')
  @ApiOperation({ summary: 'Get transfer by ID' })
  @ApiResponse({ status: 200, description: 'Transfer retrieved successfully' })
  async getTransfer(
    @Param('transferId', ParseIntPipe) transferId: number,
  ): Promise<WiseTransfer> {
    return this.transferService.getTransfer(transferId);
  }

  @Post('transfers/:transferId/cancel')
  @ApiOperation({ summary: 'Cancel transfer' })
  @ApiResponse({ status: 200, description: 'Transfer cancelled successfully' })
  async cancelTransfer(
    @Param('transferId', ParseIntPipe) transferId: number,
  ): Promise<WiseTransfer> {
    return this.transferService.cancelTransfer(transferId);
  }

  @Get('transfers/:transferId/delivery-estimate')
  @ApiOperation({ summary: 'Get transfer delivery estimate' })
  @ApiResponse({ status: 200, description: 'Delivery estimate retrieved successfully' })
  async getDeliveryEstimate(
    @Param('transferId', ParseIntPipe) transferId: number,
  ): Promise<{ estimatedDelivery: string }> {
    const estimate = await this.transferService.getDeliveryEstimate(transferId);
    return { estimatedDelivery: estimate };
  }

  // ============================================
  // Balance Endpoints
  // ============================================

  @Get('balances')
  @ApiOperation({ summary: 'Get all multi-currency balances' })
  @ApiResponse({ status: 200, description: 'Balances retrieved successfully' })
  async getBalances(): Promise<WiseBalance[]> {
    return this.balanceService.getBalances();
  }

  @Get('balances/:currency')
  @ApiOperation({ summary: 'Get balance for specific currency' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalanceByCurrency(
    @Param('currency') currency: WiseCurrency,
  ): Promise<WiseBalance | null> {
    return this.balanceService.getBalanceByCurrency(currency);
  }

  @Get('balances/:currency/available')
  @ApiOperation({ summary: 'Get available balance amount for currency' })
  @ApiResponse({ status: 200, description: 'Available balance retrieved successfully' })
  async getAvailableBalance(
    @Param('currency') currency: WiseCurrency,
  ): Promise<{ currency: WiseCurrency; amount: number }> {
    const amount = await this.balanceService.getAvailableBalance(currency);
    return { currency, amount };
  }

  @Get('balances/:currency/account-details')
  @ApiOperation({ summary: 'Get bank account details for receiving funds in currency' })
  @ApiResponse({ status: 200, description: 'Account details retrieved successfully' })
  async getAccountDetails(@Param('currency') currency: WiseCurrency) {
    return this.balanceService.getAccountDetails(currency);
  }

  @Post('balances/convert')
  @ApiOperation({ summary: 'Convert between currencies (borderless account)' })
  @ApiResponse({ status: 201, description: 'Currency conversion executed successfully' })
  async convertCurrency(
    @Body()
    dto: {
      sourceCurrency: WiseCurrency;
      targetCurrency: WiseCurrency;
      sourceAmount: number;
    },
  ) {
    return this.balanceService.convertCurrency(
      dto.sourceCurrency,
      dto.targetCurrency,
      dto.sourceAmount,
    );
  }

  @Get('balances/:currency/movements')
  @ApiOperation({ summary: 'Get balance movements (deposits, withdrawals, conversions)' })
  @ApiResponse({ status: 200, description: 'Balance movements retrieved successfully' })
  async getBalanceMovements(
    @Param('currency') currency: WiseCurrency,
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
  ) {
    return this.balanceService.getBalanceMovements(currency, limit, offset);
  }

  // ============================================
  // Statement Endpoints
  // ============================================

  @Get('statements/:currency')
  @ApiOperation({ summary: 'Get balance statement (transactions)' })
  @ApiResponse({ status: 200, description: 'Statement retrieved successfully' })
  async getStatement(
    @Param('currency') currency: WiseCurrency,
    @Query('intervalStart') intervalStart: string,
    @Query('intervalEnd') intervalEnd: string,
  ): Promise<WiseStatement> {
    if (!intervalStart || !intervalEnd) {
      throw new BadRequestException('intervalStart and intervalEnd are required');
    }

    const start = new Date(intervalStart);
    const end = new Date(intervalEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
    }

    return this.balanceService.getStatement(currency, start, end);
  }

  // ============================================
  // Utility Endpoints
  // ============================================

  @Get('health')
  @ApiOperation({ summary: 'Health check for Wise integration' })
  @ApiResponse({ status: 200, description: 'Integration is healthy' })
  async healthCheck() {
    try {
      await this.wiseService.getProfiles();
      return {
        status: 'healthy',
        environment: this.wiseService.getConfig().environment,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
