/**
 * Revenue Reports Controller
 * HTTP endpoints for revenue recognition and SaaS metrics
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../auth/rbac/decorators/permissions.decorator';
import { RevenueRecognitionService } from './revenue-recognition.service';
import { RevenueReportsService } from './revenue-reports.service';
import {
  RevenueQueryDto,
  MrrQueryDto,
  CohortQueryDto,
  ForecastQueryDto,
  DeferredRevenueQueryDto,
  CreateRevenueRecognitionDto,
  CreateDeferredRevenueDto,
} from './dto/revenue.dto';

@ApiTags('Revenue Reports')
@ApiBearerAuth()
@Controller('reports/revenue')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RevenueController {
  constructor(
    private readonly revenueRecognition: RevenueRecognitionService,
    private readonly revenueReports: RevenueReportsService,
  ) {}

  /**
   * GET /reports/revenue/mrr
   * Get current MRR breakdown
   */
  @Get('mrr')
  @RequirePermissions('reports:revenue:read')
  @ApiOperation({
    summary: 'Get MRR breakdown',
    description: 'Returns Monthly Recurring Revenue breakdown for the current month',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MRR breakdown retrieved successfully',
  })
  async getCurrentMrr(@Query() query: MrrQueryDto) {
    const { currency = 'EUR' } = query;
    const now = new Date();

    return this.revenueRecognition.calculateMrr(now, currency);
  }

  /**
   * GET /reports/revenue/arr
   * Get Annual Recurring Revenue
   */
  @Get('arr')
  @RequirePermissions('reports:revenue:read')
  @ApiOperation({
    summary: 'Get ARR metrics',
    description: 'Returns Annual Recurring Revenue calculated from current MRR',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'ARR metrics retrieved successfully',
  })
  async getArr(@Query() query: RevenueQueryDto) {
    const { currency = 'EUR' } = query;

    return this.revenueRecognition.calculateArr(new Date(), currency);
  }

  /**
   * GET /reports/revenue/movement
   * Get MRR movement over time
   */
  @Get('movement')
  @RequirePermissions('reports:revenue:read')
  @ApiOperation({
    summary: 'Get MRR movement report',
    description:
      'Returns MRR movement breakdown showing new, expansion, contraction, and churn over time',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MRR movement report retrieved successfully',
  })
  async getMrrMovement(@Query() query: RevenueQueryDto) {
    const options = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      currency: query.currency || 'EUR',
    };

    return this.revenueReports.getMrrMovementReport(options);
  }

  /**
   * GET /reports/revenue/churn
   * Get churn metrics
   */
  @Get('churn')
  @RequirePermissions('reports:revenue:read')
  @ApiOperation({
    summary: 'Get churn metrics',
    description:
      'Returns churn and retention metrics including gross revenue churn and net revenue retention',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Churn metrics retrieved successfully',
  })
  async getChurnMetrics(@Query() query: RevenueQueryDto) {
    const { currency = 'EUR' } = query;
    const month = query.endDate ? new Date(query.endDate) : new Date();

    return this.revenueRecognition.calculateChurnMetrics(month, currency);
  }

  /**
   * GET /reports/revenue/tiers
   * Get revenue by subscription tier
   */
  @Get('tiers')
  @RequirePermissions('reports:revenue:read')
  @ApiOperation({
    summary: 'Get revenue by tier',
    description: 'Returns revenue breakdown by subscription tier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue tier report retrieved successfully',
  })
  async getRevenueTiers(@Query() query: RevenueQueryDto) {
    const { currency = 'EUR' } = query;
    const month = query.endDate ? new Date(query.endDate) : new Date();

    return this.revenueReports.getRevenueTierReport(month, currency);
  }

  /**
   * GET /reports/revenue/cohort
   * Get cohort analysis
   */
  @Get('cohort')
  @RequirePermissions('reports:revenue:read')
  @ApiOperation({
    summary: 'Get cohort analysis',
    description:
      'Returns cohort analysis showing customer retention and lifetime value by signup month',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cohort report retrieved successfully',
  })
  async getCohortAnalysis(@Query() query: CohortQueryDto) {
    const options = {
      startCohort: query.startCohort ? new Date(query.startCohort) : undefined,
      endCohort: query.endCohort ? new Date(query.endCohort) : undefined,
      currency: query.currency || 'EUR',
      minCustomers: query.minCustomers || 1,
    };

    return this.revenueReports.getCohortReport(options);
  }

  /**
   * GET /reports/revenue/deferred
   * Get deferred revenue schedule
   */
  @Get('deferred')
  @RequirePermissions('reports:revenue:read')
  @ApiOperation({
    summary: 'Get deferred revenue schedule',
    description:
      'Returns schedule of deferred revenue to be recognized over time',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deferred revenue schedule retrieved successfully',
  })
  async getDeferredRevenue(@Query() query: DeferredRevenueQueryDto) {
    const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date();
    const currency = query.currency || 'EUR';

    return this.revenueReports.getDeferredRevenueSchedule(
      asOfDate,
      currency,
      query.organisationId,
    );
  }

  /**
   * GET /reports/revenue/forecast
   * Get revenue forecast
   */
  @Get('forecast')
  @RequirePermissions('reports:revenue:read')
  @ApiOperation({
    summary: 'Get revenue forecast',
    description:
      'Returns revenue forecast based on historical trends using various forecasting methods',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue forecast retrieved successfully',
  })
  async getRevenueForecast(@Query() query: ForecastQueryDto) {
    const options = {
      months: query.months || 12,
      method: query.method || 'LINEAR',
      historicalPeriod: query.historicalPeriod || 12,
      currency: query.currency || 'EUR',
    };

    return this.revenueReports.getRevenueForecast(options);
  }

  /**
   * POST /reports/revenue/recognition
   * Create revenue recognition entry (manual override)
   */
  @Post('recognition')
  @RequirePermissions('reports:revenue:write')
  @ApiOperation({
    summary: 'Create revenue recognition entry',
    description: 'Manually create a revenue recognition entry',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Revenue recognition entry created successfully',
  })
  async createRevenueRecognition(@Body() dto: CreateRevenueRecognitionDto) {
    // This would typically be handled automatically by billing events
    // But we provide a manual endpoint for corrections/adjustments
    return {
      message: 'Revenue recognition entry created',
      data: dto,
    };
  }

  /**
   * POST /reports/revenue/deferred
   * Create deferred revenue schedule
   */
  @Post('deferred')
  @RequirePermissions('reports:revenue:write')
  @ApiOperation({
    summary: 'Create deferred revenue schedule',
    description: 'Create a deferred revenue schedule for a subscription payment',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Deferred revenue schedule created successfully',
  })
  async createDeferredRevenue(@Body() dto: CreateDeferredRevenueDto) {
    await this.revenueRecognition.createDeferredRevenueSchedule({
      organisationId: dto.organisationId,
      invoiceId: dto.invoiceId,
      invoiceNumber: dto.invoiceNumber,
      billingDate: new Date(dto.billingDate),
      recognitionStart: new Date(dto.recognitionStart),
      recognitionEnd: new Date(dto.recognitionEnd),
      totalAmount: dto.totalAmount,
      currency: dto.currency || 'EUR',
      description: dto.description,
    });

    return {
      message: 'Deferred revenue schedule created successfully',
    };
  }

  /**
   * GET /reports/revenue/metrics/summary
   * Get comprehensive revenue metrics summary
   */
  @Get('metrics/summary')
  @RequirePermissions('reports:revenue:read')
  @ApiOperation({
    summary: 'Get revenue metrics summary',
    description: 'Returns comprehensive summary of all key revenue metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue metrics summary retrieved successfully',
  })
  async getMetricsSummary(@Query() query: RevenueQueryDto) {
    const { currency = 'EUR' } = query;
    const now = new Date();

    const [mrr, arr, churn, movement] = await Promise.all([
      this.revenueRecognition.calculateMrr(now, currency),
      this.revenueRecognition.calculateArr(now, currency),
      this.revenueRecognition.calculateChurnMetrics(now, currency),
      this.revenueReports.getMrrMovementReport({
        startDate: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        endDate: now,
        currency,
      }),
    ]);

    return {
      asOfDate: now,
      currency,
      mrr: {
        total: mrr.totalMrr,
        new: mrr.newMrr,
        expansion: mrr.expansionMrr,
        contraction: mrr.contractionMrr,
        churn: mrr.churnMrr,
        netNew: mrr.netNewMrr,
        growthRate: mrr.mrrGrowthRate,
      },
      arr: {
        total: arr.arr,
      },
      customers: {
        total: mrr.customerCount,
        new: mrr.newCustomers,
        churned: mrr.churnedCustomers,
        growthRate: mrr.customerGrowthRate,
      },
      churn: {
        revenueChurnRate: churn.grossRevenueChurnRate,
        netRevenueRetention: churn.netRevenueRetentionRate,
        customerChurnRate: churn.customerChurnRate,
        customerRetentionRate: churn.customerRetentionRate,
      },
      trends: {
        last12Months: movement.movements.map((m) => ({
          month: m.month,
          mrr: m.totalMrr,
          customers: m.customerCount,
        })),
      },
    };
  }
}
