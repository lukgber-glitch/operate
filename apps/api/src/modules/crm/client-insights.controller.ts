import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ClientInsightsService } from './client-insights.service';
import {
  ClientInsightsDto,
  RevenueBreakdownDto,
  PaymentAnalyticsDto,
  RiskAssessmentDto,
  TopPerformersDto,
  AtRiskClientsDto,
  ClientTrendsDto,
  InsightsQueryDto,
  TopPerformersQueryDto,
  AtRiskQueryDto,
} from './dto/client-insights.dto';

@ApiTags('Client Insights')
@ApiBearerAuth()
@Controller('clients')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class ClientInsightsController {
  constructor(
    private readonly clientInsightsService: ClientInsightsService,
  ) {}

  // ============================================================================
  // INDIVIDUAL CLIENT INSIGHTS
  // ============================================================================

  @Get(':id/insights')
  @ApiOperation({
    summary: 'Get full insights for a client',
    description:
      'Returns comprehensive analytics including revenue, payments, invoices, lifetime value, risk assessment, and seasonal patterns',
  })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'Client insights retrieved successfully',
    type: ClientInsightsDto,
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClientInsights(
    @Param('id') clientId: string,
    @Query() query: InsightsQueryDto,
    @Request() req: any,
  ): Promise<ClientInsightsDto> {
    const orgId = req.user?.orgId || 'default-org-id'; // TODO: Get from JWT
    return this.clientInsightsService.getClientInsights(
      clientId,
      orgId,
      query.timeRange,
    );
  }

  @Get(':id/insights/revenue')
  @ApiOperation({
    summary: 'Get revenue breakdown for a client',
    description:
      'Returns detailed revenue analytics including monthly, yearly comparisons and growth rates',
  })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'Revenue breakdown retrieved successfully',
    type: RevenueBreakdownDto,
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getRevenueBreakdown(
    @Param('id') clientId: string,
    @Request() req: any,
  ): Promise<RevenueBreakdownDto> {
    const orgId = req.user?.orgId || 'default-org-id';
    return this.clientInsightsService.calculateRevenueBreakdown(
      clientId,
      orgId,
    );
  }

  @Get(':id/insights/payments')
  @ApiOperation({
    summary: 'Get payment analytics for a client',
    description:
      'Returns payment behavior metrics including average payment days, velocity trends, and reliability scores',
  })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment analytics retrieved successfully',
    type: PaymentAnalyticsDto,
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getPaymentAnalytics(
    @Param('id') clientId: string,
    @Request() req: any,
  ): Promise<PaymentAnalyticsDto> {
    const orgId = req.user?.orgId || 'default-org-id';
    return this.clientInsightsService.calculatePaymentAnalytics(
      clientId,
      orgId,
    );
  }

  @Get(':id/insights/risk')
  @ApiOperation({
    summary: 'Get risk assessment for a client',
    description:
      'Returns churn risk analysis with risk factors, positive indicators, and recommended actions',
  })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'Risk assessment retrieved successfully',
    type: RiskAssessmentDto,
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getRiskAssessment(
    @Param('id') clientId: string,
    @Request() req: any,
  ): Promise<RiskAssessmentDto> {
    const orgId = req.user?.orgId || 'default-org-id';
    return this.clientInsightsService.calculateRiskAssessment(clientId, orgId);
  }

  // ============================================================================
  // AGGREGATE INSIGHTS
  // ============================================================================

  @Get('insights/top-performers')
  @ApiOperation({
    summary: 'Get top performing clients',
    description:
      'Returns lists of top clients by revenue, growth rate, payment reliability, and lifetime value',
  })
  @ApiResponse({
    status: 200,
    description: 'Top performers retrieved successfully',
    type: TopPerformersDto,
  })
  async getTopPerformers(
    @Query() query: TopPerformersQueryDto,
    @Request() req: any,
  ): Promise<TopPerformersDto> {
    const orgId = req.user?.orgId || 'default-org-id';
    return this.clientInsightsService.getTopPerformers(orgId, query.limit);
  }

  @Get('insights/at-risk')
  @ApiOperation({
    summary: 'Get clients at risk of churning',
    description:
      'Returns clients with high churn risk scores, categorized by risk level with recommended actions',
  })
  @ApiResponse({
    status: 200,
    description: 'At-risk clients retrieved successfully',
    type: AtRiskClientsDto,
  })
  async getAtRiskClients(
    @Query() query: AtRiskQueryDto,
    @Request() req: any,
  ): Promise<AtRiskClientsDto> {
    const orgId = req.user?.orgId || 'default-org-id';
    return this.clientInsightsService.getAtRiskClients(
      orgId,
      query.limit,
      query.minRiskLevel,
    );
  }

  @Get('insights/trends')
  @ApiOperation({
    summary: 'Get overall client trends',
    description:
      'Returns organization-wide client metrics including revenue growth, payment trends, churn rate, and segment distribution',
  })
  @ApiResponse({
    status: 200,
    description: 'Client trends retrieved successfully',
    type: ClientTrendsDto,
  })
  async getClientTrends(@Request() req: any): Promise<ClientTrendsDto> {
    const orgId = req.user?.orgId || 'default-org-id';
    return this.clientInsightsService.getClientTrends(orgId);
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  @Get('insights/recalculate')
  @ApiOperation({
    summary: 'Recalculate insights for all clients',
    description:
      'Triggers batch recalculation of insights for all active clients in the organization. Use sparingly as this is resource-intensive.',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch recalculation completed',
    schema: {
      type: 'object',
      properties: {
        processed: { type: 'number', example: 150 },
      },
    },
  })
  async recalculateAllInsights(
    @Request() req: any,
  ): Promise<{ processed: number }> {
    const orgId = req.user?.orgId || 'default-org-id';
    return this.clientInsightsService.recalculateAllInsights(orgId);
  }
}
