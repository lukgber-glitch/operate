import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { HmrcAuthService } from './hmrc-auth.service';
import { HmrcVatService } from './services/hmrc-vat.service';
import {
  HmrcAuthUrlRequestDto,
  HmrcAuthUrlResponseDto,
  HmrcCallbackQueryDto,
  HmrcConnectionInfoDto,
  HmrcDisconnectDto,
  HmrcDisconnectResponseDto,
} from './dto/hmrc.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * HMRC MTD Controller
 * Handles HTTP endpoints for UK HMRC Making Tax Digital integration
 *
 * Endpoints:
 * - POST /integrations/hmrc/auth - Generate OAuth authorization URL
 * - GET /integrations/hmrc/callback - Handle OAuth callback
 * - GET /integrations/hmrc/connection - Get connection status
 * - DELETE /integrations/hmrc/connection - Disconnect HMRC
 */
@ApiTags('HMRC Integration')
@Controller('integrations/hmrc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HmrcController {
  private readonly logger = new Logger(HmrcController.name);

  constructor(
    private readonly hmrcAuthService: HmrcAuthService,
    private readonly hmrcVatService: HmrcVatService,
  ) {}

  /**
   * Generate HMRC OAuth authorization URL
   */
  @Post('auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate HMRC OAuth authorization URL',
    description:
      'Generate OAuth2 authorization URL with PKCE for HMRC MTD connection',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    type: HmrcAuthUrlResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to generate authorization URL',
  })
  async generateAuthUrl(
    @Body() dto: HmrcAuthUrlRequestDto,
  ): Promise<HmrcAuthUrlResponseDto> {
    this.logger.log(`Generating HMRC auth URL for org ${dto.orgId}`);

    const result = await this.hmrcAuthService.generateAuthUrl(dto.orgId);

    return result;
  }

  /**
   * Handle HMRC OAuth callback
   * This endpoint receives the authorization code from HMRC after user consent
   */
  @Get('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle HMRC OAuth callback',
    description:
      'Handle OAuth2 callback from HMRC and exchange code for access tokens',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Authorization code from HMRC',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'State parameter for CSRF validation',
  })
  @ApiQuery({
    name: 'vrn',
    required: true,
    description: 'VAT Registration Number',
  })
  @ApiQuery({
    name: 'error',
    required: false,
    description: 'OAuth error code',
  })
  @ApiQuery({
    name: 'error_description',
    required: false,
    description: 'OAuth error description',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'HMRC connection established successfully',
    type: HmrcConnectionInfoDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid callback parameters',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired state parameter',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to complete OAuth flow',
  })
  async handleCallback(
    @Query() query: HmrcCallbackQueryDto & { vrn: string },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log('Handling HMRC OAuth callback');

    try {
      const connection = await this.hmrcAuthService.handleCallback(
        query,
        query.vrn,
      );

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const redirectUrl = `${frontendUrl}/settings/integrations/hmrc?status=success&vrn=${connection.vrn}`;

      res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('OAuth callback failed', error);

      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorMessage = error.message || 'Unknown error';
      const redirectUrl = `${frontendUrl}/settings/integrations/hmrc?status=error&message=${encodeURIComponent(errorMessage)}`;

      res.redirect(redirectUrl);
    }
  }

  /**
   * Get HMRC connection status
   */
  @Get('connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get HMRC connection status',
    description: 'Retrieve current HMRC MTD connection status for organization',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection status retrieved successfully',
    type: HmrcConnectionInfoDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No HMRC connection found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve connection status',
  })
  async getConnectionStatus(
    @Query('orgId') orgId: string,
  ): Promise<HmrcConnectionInfoDto | null> {
    this.logger.log(`Getting HMRC connection status for org ${orgId}`);

    const connection = await this.hmrcAuthService.getConnectionStatus(orgId);

    return connection;
  }

  /**
   * Refresh HMRC access tokens
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh HMRC access tokens',
    description: 'Manually refresh HMRC access tokens (usually done automatically)',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No HMRC connection found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token expired or invalid',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to refresh tokens',
  })
  async refreshTokens(@Query('orgId') orgId: string): Promise<any> {
    this.logger.log(`Refreshing HMRC tokens for org ${orgId}`);

    const result = await this.hmrcAuthService.refreshTokens(orgId);

    return {
      success: result.success,
      message: result.success
        ? 'Tokens refreshed successfully'
        : result.error || 'Failed to refresh tokens',
      tokenExpiresAt: result.tokenExpiresAt,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    };
  }

  /**
   * Disconnect HMRC
   */
  @Delete('connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disconnect HMRC',
    description: 'Disconnect HMRC MTD integration for organization',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'HMRC disconnected successfully',
    type: HmrcDisconnectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No HMRC connection found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to disconnect HMRC',
  })
  async disconnect(
    @Body() dto: HmrcDisconnectDto,
  ): Promise<HmrcDisconnectResponseDto> {
    this.logger.log(`Disconnecting HMRC for org ${dto.orgId}`);

    const result = await this.hmrcAuthService.disconnect(dto.orgId);

    return result;
  }

  /**
   * Get VAT obligations
   */
  @Get('vat/obligations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get VAT obligations',
    description: 'Retrieve VAT return obligations for a specific period',
  })
  @ApiQuery({ name: 'orgId', required: true })
  @ApiQuery({ name: 'vrn', required: true })
  @ApiQuery({ name: 'from', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['O', 'F'],
    description: 'Filter by status (O=Open, F=Fulfilled)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'VAT obligations retrieved' })
  async getVatObligations(
    @Query('orgId') orgId: string,
    @Query('vrn') vrn: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('status') status?: 'O' | 'F',
  ): Promise<any> {
    return this.hmrcVatService.getVatObligations(orgId, vrn, from, to, status);
  }

  /**
   * Get VAT liabilities
   */
  @Get('vat/liabilities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get VAT liabilities',
    description: 'Retrieve outstanding VAT liabilities',
  })
  @ApiQuery({ name: 'orgId', required: true })
  @ApiQuery({ name: 'vrn', required: true })
  @ApiQuery({ name: 'from', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'VAT liabilities retrieved' })
  async getVatLiabilities(
    @Query('orgId') orgId: string,
    @Query('vrn') vrn: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<any> {
    return this.hmrcVatService.getVatLiabilities(orgId, vrn, from, to);
  }

  /**
   * Get VAT payments
   */
  @Get('vat/payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get VAT payments',
    description: 'Retrieve VAT payment history',
  })
  @ApiQuery({ name: 'orgId', required: true })
  @ApiQuery({ name: 'vrn', required: true })
  @ApiQuery({ name: 'from', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'VAT payments retrieved' })
  async getVatPayments(
    @Query('orgId') orgId: string,
    @Query('vrn') vrn: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<any> {
    return this.hmrcVatService.getVatPayments(orgId, vrn, from, to);
  }

  /**
   * Calculate VAT return
   */
  @Post('vat/calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate VAT return',
    description: 'Calculate VAT return from invoices and expenses',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'VAT return calculated' })
  async calculateVatReturn(@Body() input: any): Promise<any> {
    return this.hmrcVatService.calculateVatReturn({
      ...input,
      periodFrom: new Date(input.periodFrom),
      periodTo: new Date(input.periodTo),
    });
  }

  /**
   * Save draft VAT return
   */
  @Post('vat/draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save draft VAT return',
    description: 'Save a draft VAT return without submitting to HMRC',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Draft VAT return saved' })
  async saveDraftVatReturn(@Body() input: any): Promise<any> {
    const calculation = await this.hmrcVatService.calculateVatReturn({
      orgId: input.orgId,
      vrn: input.vrn,
      periodFrom: new Date(input.periodFrom),
      periodTo: new Date(input.periodTo),
    });

    return this.hmrcVatService.saveDraftVatReturn(
      input.orgId,
      input.vrn,
      input.periodKey,
      calculation,
    );
  }

  /**
   * Submit VAT return
   */
  @Post('vat/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit VAT return',
    description: 'Submit VAT return to HMRC (CANNOT BE UNDONE)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'VAT return submitted successfully' })
  async submitVatReturn(@Body() input: any): Promise<any> {
    return this.hmrcVatService.submitVatReturn(
      input.orgId,
      input.vrn,
      input.periodKey,
      input.vatReturn,
    );
  }

  /**
   * Health check endpoint for HMRC integration
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'HMRC integration health check',
    description: 'Check if HMRC integration is properly configured',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'HMRC integration is healthy',
  })
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      service: 'HMRC MTD Integration',
      timestamp: new Date().toISOString(),
      environment: process.env.HMRC_SANDBOX === 'true' ? 'sandbox' : 'production',
    };
  }
}
