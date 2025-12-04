import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsageMeteringService } from './services/usage-metering.service';
import { UsageStripeService } from './services/usage-stripe.service';
import {
  TrackUsageDto,
  GetUsageSummaryDto,
  UsageSummaryResponseDto,
  UsageHistoryQueryDto,
  UsageHistoryResponseDto,
  UsageEstimateDto,
  ConfigureUsageQuotaDto,
  BulkTrackUsageDto,
} from './dto/usage.dto';
import { PrismaService } from '../../database/prisma.service';

/**
 * Usage Controller
 * Manages usage-based billing and metering
 *
 * Endpoints:
 * - POST /usage/track - Track a usage event
 * - POST /usage/bulk-track - Track multiple usage events
 * - GET /usage/:orgId - Get current usage summary
 * - GET /usage/:orgId/history - Get usage history
 * - GET /usage/:orgId/estimate - Get estimated costs
 * - POST /usage/:orgId/quota - Configure usage quota
 */
@ApiTags('Usage & Metering')
@ApiBearerAuth()
@Controller('usage')
@UseGuards(JwtAuthGuard)
export class UsageController {
  constructor(
    private readonly usageMeteringService: UsageMeteringService,
    private readonly usageStripeService: UsageStripeService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Track a usage event
   */
  @Post('track')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track a usage event' })
  @ApiResponse({
    status: 204,
    description: 'Usage event tracked successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async trackUsage(@Body() dto: TrackUsageDto): Promise<void> {
    await this.usageMeteringService.trackUsage(dto);
  }

  /**
   * Track multiple usage events in bulk
   */
  @Post('bulk-track')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track multiple usage events in bulk' })
  @ApiResponse({
    status: 204,
    description: 'Usage events tracked successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async trackBulkUsage(@Body() dto: BulkTrackUsageDto): Promise<void> {
    await this.usageMeteringService.trackBulkUsage(
      dto.organizationId,
      dto.events,
    );
  }

  /**
   * Get current usage summary
   */
  @Get(':orgId')
  @ApiOperation({ summary: 'Get current usage summary for an organization' })
  @ApiResponse({
    status: 200,
    description: 'Usage summary retrieved successfully',
    type: UsageSummaryResponseDto,
  })
  async getUsageSummary(
    @Param('orgId') orgId: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
    @Query('features') features?: string,
  ): Promise<UsageSummaryResponseDto> {
    const dto: GetUsageSummaryDto = {
      organizationId: orgId,
      periodStart,
      periodEnd,
      features: features?.split(',') as any,
    };

    const summary = await this.usageMeteringService.getCurrentUsage(dto);

    return {
      organizationId: summary.organizationId,
      periodStart: summary.periodStart,
      periodEnd: summary.periodEnd,
      features: summary.features,
      totalOverageAmount: summary.totalOverageAmount,
      currency: summary.currency,
    };
  }

  /**
   * Get usage history
   */
  @Get(':orgId/history')
  @ApiOperation({ summary: 'Get usage history for an organization' })
  @ApiResponse({
    status: 200,
    description: 'Usage history retrieved successfully',
    type: UsageHistoryResponseDto,
  })
  async getUsageHistory(
    @Param('orgId') orgId: string,
    @Query() query: Omit<UsageHistoryQueryDto, 'organizationId'>,
  ): Promise<UsageHistoryResponseDto> {
    const dto: UsageHistoryQueryDto = {
      organizationId: orgId,
      ...query,
    };

    const history = await this.usageMeteringService.getUsageHistory(dto);

    return {
      organizationId: orgId,
      periods: history.map((period) => ({
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        features: period.features,
        totalAmount: period.totalAmount,
        currency: period.currency,
      })),
    };
  }

  /**
   * Get estimated usage costs
   */
  @Get(':orgId/estimate')
  @ApiOperation({
    summary: 'Get estimated usage costs for current billing period',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage estimate retrieved successfully',
    type: UsageEstimateDto,
  })
  async getUsageEstimate(@Param('orgId') orgId: string): Promise<UsageEstimateDto> {
    const estimate = await this.usageMeteringService.estimateUsageCosts(orgId);

    return {
      organizationId: orgId,
      estimatedDate: new Date(),
      features: estimate.features.map((f) => ({
        feature: f.feature,
        projectedQuantity: f.projectedQuantity,
        projectedOverage: f.projectedOverage,
        estimatedAmount: f.estimatedAmount,
      })),
      estimatedTotalAmount: estimate.estimatedAmount,
      currency: estimate.currency,
    };
  }

  /**
   * Configure usage quota
   */
  @Post(':orgId/quota')
  @ApiOperation({ summary: 'Configure usage quota for a feature' })
  @ApiResponse({
    status: 201,
    description: 'Usage quota configured successfully',
  })
  async configureQuota(
    @Param('orgId') orgId: string,
    @Body() dto: Omit<ConfigureUsageQuotaDto, 'organizationId'>,
  ): Promise<void> {
    const quotaDto: ConfigureUsageQuotaDto = {
      organizationId: orgId,
      ...dto,
    };

    await this.prisma.usageQuota.upsert({
      where: {
        organisationId_feature: {
          organisationId: quotaDto.organizationId,
          feature: quotaDto.feature,
        },
      },
      create: {
        organisationId: quotaDto.organizationId,
        feature: quotaDto.feature,
        includedQuantity: quotaDto.includedQuantity,
        pricePerUnit: quotaDto.pricePerUnit,
        currency: quotaDto.currency || 'EUR',
        resetPeriod: quotaDto.resetPeriod || 'MONTHLY',
        isActive: quotaDto.isActive ?? true,
      },
      update: {
        includedQuantity: quotaDto.includedQuantity,
        pricePerUnit: quotaDto.pricePerUnit,
        currency: quotaDto.currency,
        resetPeriod: quotaDto.resetPeriod,
        isActive: quotaDto.isActive,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get quota status for a feature
   */
  @Get(':orgId/quota/:feature')
  @ApiOperation({ summary: 'Get quota status for a specific feature' })
  @ApiResponse({
    status: 200,
    description: 'Quota status retrieved successfully',
  })
  async getQuotaStatus(
    @Param('orgId') orgId: string,
    @Param('feature') feature: string,
  ): Promise<{
    hasQuota: boolean;
    totalUsed: number;
    limit: number;
    remaining: number;
  }> {
    return this.usageMeteringService.checkQuota(orgId, feature as any);
  }
}
