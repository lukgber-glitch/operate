import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { KycService } from './kyc.service';
import {
  StartVerificationDto,
  VerificationStatusDto,
  MakeDecisionDto,
  KycDecisionResponseDto,
  KycReportQueryDto,
  KycStatisticsDto,
  PendingReviewItemDto,
} from './dto';
import { CustomerType } from './types/kyc.types';

/**
 * KYC Controller
 * REST API endpoints for KYC verification management
 *
 * Endpoints:
 * - POST /kyc/start - Start KYC verification
 * - GET /kyc/status/:userId - Get verification status
 * - GET /kyc/requirements/:countryCode/:customerType - Get requirements
 * - POST /kyc/decision - Make manual decision
 * - GET /kyc/pending-review - Get pending reviews
 * - GET /kyc/reports/statistics - Get statistics
 */
@ApiTags('KYC')
@Controller('kyc')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is configured
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Start a new KYC verification process
   */
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start KYC verification',
    description: 'Initiates a new KYC verification process for a user',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification started successfully',
    type: VerificationStatusDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 409, description: 'Active verification already exists' })
  async startVerification(
    @Body() dto: StartVerificationDto,
    @Request() req: any,
  ): Promise<VerificationStatusDto> {
    const initiatedBy = req.user?.id || 'system'; // Get from JWT in production
    return this.kycService.verification.startVerification(dto, initiatedBy);
  }

  /**
   * Get KYC verification status for a user
   */
  @Get('status/:userId')
  @ApiOperation({
    summary: 'Get verification status',
    description: 'Retrieves the current KYC verification status for a user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification status retrieved',
    type: VerificationStatusDto,
  })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async getVerificationStatus(@Param('userId') userId: string): Promise<VerificationStatusDto> {
    return this.kycService.verification.getVerificationStatus(userId);
  }

  /**
   * Get KYC requirements for a country and customer type
   */
  @Get('requirements/:countryCode/:customerType')
  @ApiOperation({
    summary: 'Get KYC requirements',
    description: 'Retrieves KYC requirements for a specific country and customer type',
  })
  @ApiParam({
    name: 'countryCode',
    description: 'ISO country code',
    example: 'DE',
  })
  @ApiParam({
    name: 'customerType',
    description: 'Customer type',
    enum: CustomerType,
    example: CustomerType.INDIVIDUAL,
  })
  @ApiResponse({
    status: 200,
    description: 'Requirements retrieved',
    type: [Object],
  })
  async getRequirements(
    @Param('countryCode') countryCode: string,
    @Param('customerType') customerType: CustomerType,
  ) {
    return this.kycService.workflow.getRequirements(countryCode, customerType);
  }

  /**
   * Make a manual decision on a verification
   */
  @Post('decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Make KYC decision',
    description: 'Makes a manual decision (approve/reject/request info) on a KYC verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Decision recorded successfully',
    type: KycDecisionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid decision' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async makeDecision(
    @Body() dto: MakeDecisionDto,
    @Request() req: any,
  ): Promise<KycDecisionResponseDto> {
    const decidedBy = req.user?.id || 'system'; // Get from JWT in production
    return this.kycService.decision.makeDecision(dto, decidedBy);
  }

  /**
   * Get pending review queue
   */
  @Get('pending-review')
  @ApiOperation({
    summary: 'Get pending reviews',
    description: 'Retrieves list of KYC verifications pending manual review',
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filter by organization',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum results',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Pending reviews retrieved',
    type: [PendingReviewItemDto],
  })
  async getPendingReview(
    @Query('organisationId') organisationId?: string,
    @Query('limit') limit?: number,
  ): Promise<PendingReviewItemDto[]> {
    return this.kycService.reporting.getPendingReview(organisationId, limit || 50);
  }

  /**
   * Get KYC statistics
   */
  @Get('reports/statistics')
  @ApiOperation({
    summary: 'Get KYC statistics',
    description: 'Retrieves comprehensive statistics about KYC verifications',
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filter by organization',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved',
    type: KycStatisticsDto,
  })
  async getStatistics(
    @Query('organisationId') organisationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<KycStatisticsDto> {
    return this.kycService.reporting.getStatistics(
      organisationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get verification trend
   */
  @Get('reports/trend')
  @ApiOperation({
    summary: 'Get verification trend',
    description: 'Retrieves daily verification counts over time',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days',
    example: 30,
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filter by organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Trend data retrieved',
  })
  async getVerificationTrend(
    @Query('days') days?: number,
    @Query('organisationId') organisationId?: string,
  ) {
    return this.kycService.reporting.getVerificationTrend(days || 30, organisationId);
  }

  /**
   * Get risk distribution
   */
  @Get('reports/risk-distribution')
  @ApiOperation({
    summary: 'Get risk distribution',
    description: 'Retrieves distribution of verifications by risk score',
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filter by organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Risk distribution retrieved',
  })
  async getRiskDistribution(@Query('organisationId') organisationId?: string) {
    return this.kycService.reporting.getRiskDistribution(organisationId);
  }

  /**
   * Get decision history for a verification
   */
  @Get('decisions/:verificationId')
  @ApiOperation({
    summary: 'Get decision history',
    description: 'Retrieves all decisions made on a verification',
  })
  @ApiParam({
    name: 'verificationId',
    description: 'Verification ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Decision history retrieved',
    type: [KycDecisionResponseDto],
  })
  async getDecisionHistory(
    @Param('verificationId') verificationId: string,
  ): Promise<KycDecisionResponseDto[]> {
    return this.kycService.decision.getDecisionHistory(verificationId);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Checks health status of KYC service',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return this.kycService.healthCheck();
  }
}
