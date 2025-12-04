/**
 * P&L Report Controller
 * RESTful API endpoints for Profit & Loss statement generation and analysis
 *
 * Endpoints:
 * - GET /reports/pnl - Generate standard P&L statement
 * - GET /reports/pnl/comparative - Multi-period comparative analysis
 * - GET /reports/pnl/department/:id - Department-level P&L
 * - GET /reports/pnl/project/:id - Project-level P&L
 * - GET /reports/pnl/budget-variance - Budget vs actual variance analysis
 * - GET /reports/pnl/trends - Historical trend analysis
 * - GET /reports/pnl/forecast - Financial forecasting
 *
 * @module PnlReportController
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PnlReportService } from './pnl-report.service';
import {
  PnlFilterDto,
  PnlOptionsDto,
  PnlReportDto,
  ComparativePnlDto,
  ComparativePnlReportDto,
  BudgetVarianceDto,
  BudgetVarianceReportDto,
  TrendAnalysisDto,
  ForecastDto,
  PnlPeriodType,
  PnlAnalysisType,
} from './dto/pnl-report.dto';

@ApiTags('P&L Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports/pnl')
export class PnlReportController {
  private readonly logger = new Logger(PnlReportController.name);

  constructor(private readonly pnlReportService: PnlReportService) {}

  /**
   * Generate standard P&L statement
   * GET /reports/pnl
   */
  @Get()
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate P&L Statement',
    description: 'Generate a comprehensive Profit & Loss statement with optional margin analysis, trends, and forecasting',
  })
  @ApiResponse({
    status: 200,
    description: 'P&L statement generated successfully',
    type: PnlReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'periodType',
    required: false,
    enum: PnlPeriodType,
    description: 'Quick period selection',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    type: String,
    description: 'Currency code',
    example: 'EUR',
  })
  @ApiQuery({
    name: 'analysisType',
    required: false,
    enum: PnlAnalysisType,
    description: 'Type of analysis to perform',
  })
  @ApiQuery({
    name: 'includeMargins',
    required: false,
    type: Boolean,
    description: 'Include margin analysis',
  })
  @ApiQuery({
    name: 'includeTrends',
    required: false,
    type: Boolean,
    description: 'Include trend analysis',
  })
  @ApiQuery({
    name: 'includeForecast',
    required: false,
    type: Boolean,
    description: 'Include financial forecast',
  })
  @ApiQuery({
    name: 'trendPeriods',
    required: false,
    type: Number,
    description: 'Number of periods for trend analysis (3-36)',
  })
  async generatePnl(
    @CurrentUser('organisationId') organisationId: string,
    @Query() filters: PnlFilterDto,
    @Query() options: PnlOptionsDto,
  ): Promise<PnlReportDto> {
    this.logger.log(`Generating P&L statement for org ${organisationId}`);

    return this.pnlReportService.generateFullPnlStatement(
      organisationId,
      filters,
      options,
    );
  }

  /**
   * Generate comparative P&L across multiple periods
   * POST /reports/pnl/comparative
   */
  @Post('comparative')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Comparative P&L',
    description: 'Compare P&L statements across multiple time periods with variance analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparative P&L generated successfully',
    type: ComparativePnlReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request - must provide 2-12 periods' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async generateComparativePnl(
    @CurrentUser('organisationId') organisationId: string,
    @Body() params: ComparativePnlDto,
  ): Promise<ComparativePnlReportDto> {
    this.logger.log(`Generating comparative P&L for org ${organisationId}`);

    return this.pnlReportService.generateComparativePnl(organisationId, params);
  }

  /**
   * Generate department-level P&L
   * GET /reports/pnl/department/:id
   */
  @Get('department/:departmentId')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Department P&L',
    description: 'Generate P&L statement for a specific department with allocated costs',
  })
  @ApiParam({
    name: 'departmentId',
    type: String,
    description: 'Department ID',
    example: 'dept_123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Department P&L generated successfully',
    type: PnlReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid department ID' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async generateDepartmentPnl(
    @CurrentUser('organisationId') organisationId: string,
    @Param('departmentId') departmentId: string,
    @Query() filters: PnlFilterDto,
    @Query() options: PnlOptionsDto,
  ): Promise<PnlReportDto> {
    this.logger.log(
      `Generating department P&L for dept ${departmentId}, org ${organisationId}`,
    );

    return this.pnlReportService.generateDepartmentPnl(
      organisationId,
      departmentId,
      filters,
      options,
    );
  }

  /**
   * Generate project-level P&L
   * GET /reports/pnl/project/:id
   */
  @Get('project/:projectId')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Project P&L',
    description: 'Generate P&L statement for a specific project to track project profitability',
  })
  @ApiParam({
    name: 'projectId',
    type: String,
    description: 'Project ID',
    example: 'proj_789012',
  })
  @ApiResponse({
    status: 200,
    description: 'Project P&L generated successfully',
    type: PnlReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid project ID' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async generateProjectPnl(
    @CurrentUser('organisationId') organisationId: string,
    @Param('projectId') projectId: string,
    @Query() filters: PnlFilterDto,
    @Query() options: PnlOptionsDto,
  ): Promise<PnlReportDto> {
    this.logger.log(
      `Generating project P&L for project ${projectId}, org ${organisationId}`,
    );

    return this.pnlReportService.generateProjectPnl(
      organisationId,
      projectId,
      filters,
      options,
    );
  }

  /**
   * Generate budget variance report
   * POST /reports/pnl/budget-variance
   */
  @Post('budget-variance')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Budget Variance Report',
    description: 'Compare actual P&L performance against budget with detailed variance analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Budget variance report generated successfully',
    type: BudgetVarianceReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid budget ID or date range' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async generateBudgetVariance(
    @CurrentUser('organisationId') organisationId: string,
    @Body() params: BudgetVarianceDto,
  ): Promise<BudgetVarianceReportDto> {
    this.logger.log(`Generating budget variance report for org ${organisationId}`);

    return this.pnlReportService.generateBudgetVariance(organisationId, params);
  }

  /**
   * Generate trend analysis
   * GET /reports/pnl/trends
   */
  @Get('trends')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Trend Analysis',
    description: 'Analyze historical P&L trends with seasonality detection and growth metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Trend analysis generated successfully',
    type: [TrendAnalysisDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for analysis period',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date for analysis period',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'periods',
    required: false,
    type: Number,
    description: 'Number of historical periods to analyze (default: 12)',
    example: 12,
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    type: String,
    description: 'Currency code',
    example: 'EUR',
  })
  async generateTrends(
    @CurrentUser('organisationId') organisationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('periods') periods?: number,
    @Query('currency') currency?: string,
  ): Promise<TrendAnalysisDto[]> {
    this.logger.log(`Generating trend analysis for org ${organisationId}`);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numPeriods = periods || 12;
    const curr = currency || 'EUR';

    return this.pnlReportService.identifyTrends(
      organisationId,
      start,
      end,
      numPeriods,
      curr,
    );
  }

  /**
   * Generate financial forecast
   * GET /reports/pnl/forecast
   */
  @Get('forecast')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Financial Forecast',
    description: 'Forecast next period P&L based on historical trends using linear regression',
  })
  @ApiResponse({
    status: 200,
    description: 'Forecast generated successfully',
    type: ForecastDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request - insufficient historical data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for historical analysis',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date for historical analysis',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'periods',
    required: false,
    type: Number,
    description: 'Number of historical periods to use (minimum: 6, default: 12)',
    example: 12,
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    type: String,
    description: 'Currency code',
    example: 'EUR',
  })
  async generateForecast(
    @CurrentUser('organisationId') organisationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('periods') periods?: number,
    @Query('currency') currency?: string,
  ): Promise<ForecastDto> {
    this.logger.log(`Generating forecast for org ${organisationId}`);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numPeriods = periods || 12;
    const curr = currency || 'EUR';

    // First get trends
    const trends = await this.pnlReportService.identifyTrends(
      organisationId,
      start,
      end,
      numPeriods,
      curr,
    );

    // Then generate forecast
    return this.pnlReportService.forecastNextPeriod(trends, curr);
  }

  /**
   * Get quick P&L summary (lightweight endpoint)
   * GET /reports/pnl/summary
   */
  @Get('summary')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER', 'USER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get P&L Summary',
    description: 'Get a lightweight P&L summary with key metrics only (no detailed line items)',
  })
  @ApiResponse({
    status: 200,
    description: 'P&L summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalRevenue: { type: 'number' },
        totalCogs: { type: 'number' },
        grossProfit: { type: 'number' },
        grossMargin: { type: 'number' },
        totalOpex: { type: 'number' },
        operatingIncome: { type: 'number' },
        operatingMargin: { type: 'number' },
        netIncome: { type: 'number' },
        netMargin: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (defaults to current month)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (defaults to today)',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'periodType',
    required: false,
    enum: PnlPeriodType,
    description: 'Quick period selection',
  })
  async getPnlSummary(
    @CurrentUser('organisationId') organisationId: string,
    @Query() filters: PnlFilterDto,
  ): Promise<any> {
    this.logger.log(`Getting P&L summary for org ${organisationId}`);

    const fullReport = await this.pnlReportService.generateFullPnlStatement(
      organisationId,
      filters,
      { includeDetails: false, includeMargins: true },
    );

    // Return only summary metrics
    return {
      totalRevenue: fullReport.summary.totalRevenue,
      totalCogs: fullReport.summary.totalCogs,
      grossProfit: fullReport.summary.grossProfit,
      grossMargin: fullReport.grossProfit.margin,
      totalOpex: fullReport.summary.totalOperatingExpenses,
      ebitda: fullReport.summary.ebitda,
      ebitdaMargin: fullReport.ebitda.margin,
      operatingIncome: fullReport.summary.operatingIncome,
      operatingMargin: fullReport.operatingIncome.margin,
      netIncome: fullReport.summary.netIncome,
      netMargin: fullReport.netIncome.margin,
      periodStart: fullReport.metadata.periodStart,
      periodEnd: fullReport.metadata.periodEnd,
      currency: fullReport.metadata.currency,
    };
  }

  /**
   * Export P&L statement
   * GET /reports/pnl/export
   */
  @Get('export')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export P&L Statement',
    description: 'Export P&L statement in various formats (PDF, Excel, CSV)',
  })
  @ApiResponse({
    status: 200,
    description: 'P&L exported successfully',
    schema: {
      type: 'object',
      properties: {
        fileUrl: { type: 'string' },
        fileName: { type: 'string' },
        format: { type: 'string' },
        expiresAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid export format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ['pdf', 'excel', 'csv'],
    description: 'Export format',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date',
  })
  async exportPnl(
    @CurrentUser('organisationId') organisationId: string,
    @Query('format') format: 'pdf' | 'excel' | 'csv',
    @Query() filters: PnlFilterDto,
    @Query() options: PnlOptionsDto,
  ): Promise<any> {
    this.logger.log(`Exporting P&L statement for org ${organisationId} in ${format} format`);

    // Generate the report
    const report = await this.pnlReportService.generateFullPnlStatement(
      organisationId,
      filters,
      options,
    );

    // In production, would generate file and upload to S3/storage
    // For now, return mock response
    return {
      fileUrl: `https://storage.example.com/reports/pnl-${organisationId}-${Date.now()}.${format}`,
      fileName: `PnL_Statement_${new Date().toISOString().split('T')[0]}.${format}`,
      format,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      message: 'Export functionality would be implemented here',
    };
  }
}
