/**
 * Cash Flow Report Controller
 * RESTful API endpoints for cash flow statement generation and analysis
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CashFlowReportService } from './cashflow-report.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { Roles } from '../../auth/rbac/roles.decorator';
import { Role } from '@prisma/client';
import {
  GenerateCashFlowStatementDto,
  CashFlowProjectionDto,
  CashFlowAnalysisDto,
  BurnRateAnalysisDto,
  CashFlowRatiosDto,
} from './dto/cashflow.dto';

@ApiTags('Reports - Cash Flow')
@ApiBearerAuth()
@Controller('reports/cashflow')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CashFlowReportController {
  constructor(private readonly cashFlowService: CashFlowReportService) {}

  /**
   * Generate comprehensive cash flow statement
   * GET /reports/cashflow/:orgId
   */
  @Get(':orgId')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Generate cash flow statement',
    description:
      'Generate a comprehensive cash flow statement using indirect or direct method. ' +
      'Compliant with IFRS (IAS 7) and US GAAP (ASC 230) standards.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cash flow statement generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organisation not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date range or parameters',
  })
  async generateCashFlowStatement(
    @Param('orgId') orgId: string,
    @Query() dto: GenerateCashFlowStatementDto,
  ) {
    return this.cashFlowService.generateCashFlowStatement(orgId, dto);
  }

  /**
   * Generate cash flow statement (Indirect Method)
   * GET /reports/cashflow/:orgId/indirect
   */
  @Get(':orgId/indirect')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Generate cash flow statement (Indirect Method)',
    description:
      'Generate cash flow statement using the indirect method. ' +
      'Starts with net income and adjusts for non-cash items and working capital changes. ' +
      'This is the most commonly used method in financial reporting.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Indirect method cash flow statement generated',
  })
  async generateIndirectMethod(
    @Param('orgId') orgId: string,
    @Query() dto: GenerateCashFlowStatementDto,
  ) {
    dto.method = 'INDIRECT' as any;
    return this.cashFlowService.generateCashFlowStatement(orgId, dto);
  }

  /**
   * Generate cash flow statement (Direct Method)
   * GET /reports/cashflow/:orgId/direct
   */
  @Get(':orgId/direct')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Generate cash flow statement (Direct Method)',
    description:
      'Generate cash flow statement using the direct method. ' +
      'Shows actual cash receipts and cash payments from operating activities. ' +
      'Provides more granular detail than the indirect method.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Direct method cash flow statement generated',
  })
  async generateDirectMethod(
    @Param('orgId') orgId: string,
    @Query() dto: GenerateCashFlowStatementDto,
  ) {
    dto.method = 'DIRECT' as any;
    return this.cashFlowService.generateCashFlowStatement(orgId, dto);
  }

  /**
   * Project future cash position
   * POST /reports/cashflow/:orgId/projection
   */
  @Post(':orgId/projection')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Project future cash position',
    description:
      'Generate cash flow projections based on historical data and trends. ' +
      'Supports multiple projection methods including linear, weighted average, seasonal, and trend analysis. ' +
      'Includes confidence intervals and scenario analysis.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cash flow projection generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Insufficient historical data for projection',
  })
  async projectCashPosition(
    @Param('orgId') orgId: string,
    @Body() dto: CashFlowProjectionDto,
  ) {
    return this.cashFlowService.projectCashPosition(orgId, dto);
  }

  /**
   * Analyze cash burn rate and runway
   * GET /reports/cashflow/:orgId/runway
   */
  @Get(':orgId/runway')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Analyze cash burn rate and runway',
    description:
      'Calculate cash burn rate, monthly burn, and months of runway remaining. ' +
      'Critical for startups and high-growth companies to monitor cash sustainability. ' +
      'Includes trend analysis and actionable alerts.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Burn rate analysis completed',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Number of months to analyze (3-12)',
  })
  @ApiQuery({
    name: 'includeRunway',
    required: false,
    type: Boolean,
    description: 'Include runway calculation',
  })
  @ApiQuery({
    name: 'includeGrowthAdjusted',
    required: false,
    type: Boolean,
    description: 'Include growth-adjusted burn rate',
  })
  async analyzeBurnRate(
    @Param('orgId') orgId: string,
    @Query() dto: BurnRateAnalysisDto,
  ) {
    return this.cashFlowService.analyzeCashBurnRate(orgId, dto);
  }

  /**
   * Calculate cash flow ratios
   * GET /reports/cashflow/:orgId/ratios
   */
  @Get(':orgId/ratios')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Calculate cash flow ratios and metrics',
    description:
      'Comprehensive cash flow ratio analysis including: ' +
      '- Operating ratios (OCF ratio, cash flow margin, cash ROA) ' +
      '- Coverage ratios (debt service, interest, dividend coverage) ' +
      '- Efficiency ratios (cash conversion cycle, DSO, DPO) ' +
      '- Quality metrics (quality of earnings, accrual ratio) ' +
      '- Free cash flow metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cash flow ratios calculated successfully',
  })
  async calculateRatios(
    @Param('orgId') orgId: string,
    @Query() dto: CashFlowRatiosDto,
  ) {
    return this.cashFlowService.calculateCashFlowRatios(orgId, dto);
  }

  /**
   * Calculate free cash flow
   * GET /reports/cashflow/:orgId/free-cash-flow
   */
  @Get(':orgId/free-cash-flow')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Calculate free cash flow',
    description:
      'Free Cash Flow (FCF) = Operating Cash Flow - Capital Expenditures. ' +
      'Includes unlevered FCF, levered FCF, FCF margin, quality assessment, and sustainability score. ' +
      'Critical metric for valuation and financial health.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Free cash flow calculated successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  async calculateFreeCashFlow(
    @Param('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dto: any = { startDate, endDate };
    const period = await (this.cashFlowService as any).parseReportingPeriod(dto);
    return this.cashFlowService.calculateFreeCashFlow(orgId, period);
  }

  /**
   * Identify liquidity risks
   * GET /reports/cashflow/:orgId/liquidity-risks
   */
  @Get(':orgId/liquidity-risks')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Identify liquidity risks',
    description:
      'Comprehensive liquidity risk assessment including: ' +
      '- Liquidity ratios (current, quick, cash ratios) ' +
      '- Working capital analysis ' +
      '- Operating cash flow adequacy ' +
      '- Risk scoring and severity assessment ' +
      '- Actionable recommendations',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liquidity risk analysis completed',
  })
  async identifyLiquidityRisks(
    @Param('orgId') orgId: string,
    @Query() dto: CashFlowAnalysisDto,
  ) {
    return this.cashFlowService.identifyLiquidityRisks(orgId, dto);
  }

  /**
   * Calculate cash conversion cycle
   * GET /reports/cashflow/:orgId/conversion-cycle
   */
  @Get(':orgId/conversion-cycle')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Calculate cash conversion cycle',
    description:
      'Cash Conversion Cycle (CCC) = DSO + DIO - DPO. ' +
      'Measures how long it takes to convert inventory and receivables into cash. ' +
      'Includes historical trends, industry benchmarks, and optimization opportunities.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cash conversion cycle calculated',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  async calculateCashConversionCycle(
    @Param('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dto: any = { startDate, endDate };
    const period = await (this.cashFlowService as any).parseReportingPeriod(dto);
    return this.cashFlowService.calculateCashConversionCycle(orgId, period);
  }

  /**
   * Get cash flow analysis
   * POST /reports/cashflow/:orgId/analysis
   */
  @Post(':orgId/analysis')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get comprehensive cash flow analysis',
    description:
      'All-in-one cash flow analysis including: ' +
      '- Cash conversion cycle ' +
      '- Quality of earnings ' +
      '- Liquidity risk assessment ' +
      '- Free cash flow analysis ' +
      'Perfect for board meetings and financial reviews.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cash flow analysis completed',
  })
  async getComprehensiveAnalysis(
    @Param('orgId') orgId: string,
    @Body() dto: CashFlowAnalysisDto,
  ) {
    const results: any = {};

    // Get period
    const period = await (this.cashFlowService as any).parseReportingPeriod(dto);

    // Cash conversion cycle
    if (dto.includeCashConversionCycle) {
      results.cashConversionCycle =
        await this.cashFlowService.calculateCashConversionCycle(orgId, period);
    }

    // Free cash flow
    if (dto.includeFreeCashFlow) {
      results.freeCashFlow = await this.cashFlowService.calculateFreeCashFlow(
        orgId,
        period,
      );
    }

    // Quality of earnings (part of ratios)
    if (dto.includeQualityOfEarnings) {
      const ratios = await this.cashFlowService.calculateCashFlowRatios(
        orgId,
        dto as any,
      );
      results.qualityOfEarnings = {
        ratio: ratios.qualityOfEarnings,
        accrualRatio: ratios.accrualRatio,
      };
    }

    // Liquidity risks
    if (dto.includeLiquidityRisks) {
      results.liquidityRisks =
        await this.cashFlowService.identifyLiquidityRisks(orgId, dto);
    }

    return results;
  }

  /**
   * Export cash flow statement
   * GET /reports/cashflow/:orgId/export
   */
  @Get(':orgId/export')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Export cash flow statement',
    description:
      'Export cash flow statement in various formats (PDF, Excel, CSV). ' +
      'Includes all sections with optional comparison periods, ratios, and projections.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statement exported successfully',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['PDF', 'EXCEL', 'CSV', 'JSON'],
    description: 'Export format',
  })
  async exportStatement(
    @Param('orgId') orgId: string,
    @Query() dto: GenerateCashFlowStatementDto,
    @Query('format') format?: string,
  ) {
    // Generate statement
    const statement = await this.cashFlowService.generateCashFlowStatement(
      orgId,
      dto,
    );

    // TODO: Implement export formatting based on format parameter
    // For now, return JSON
    return {
      statement,
      format: format || 'JSON',
      exportedAt: new Date(),
    };
  }

  /**
   * Get operating activities detail
   * GET /reports/cashflow/:orgId/operating
   */
  @Get(':orgId/operating')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Get operating activities detail',
    description:
      'Detailed breakdown of operating activities including net income, ' +
      'non-cash adjustments, and working capital changes.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Operating activities retrieved',
  })
  async getOperatingActivities(
    @Param('orgId') orgId: string,
    @Query() dto: GenerateCashFlowStatementDto,
  ) {
    const statement = await this.cashFlowService.generateCashFlowStatement(
      orgId,
      dto,
    );
    return {
      period: statement.period,
      operatingActivities: statement.operatingActivities,
    };
  }

  /**
   * Get investing activities detail
   * GET /reports/cashflow/:orgId/investing
   */
  @Get(':orgId/investing')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Get investing activities detail',
    description:
      'Detailed breakdown of investing activities including capital expenditures, ' +
      'asset sales, investments, and business combinations.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Investing activities retrieved',
  })
  async getInvestingActivities(
    @Param('orgId') orgId: string,
    @Query() dto: GenerateCashFlowStatementDto,
  ) {
    const statement = await this.cashFlowService.generateCashFlowStatement(
      orgId,
      dto,
    );
    return {
      period: statement.period,
      investingActivities: statement.investingActivities,
    };
  }

  /**
   * Get financing activities detail
   * GET /reports/cashflow/:orgId/financing
   */
  @Get(':orgId/financing')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Get financing activities detail',
    description:
      'Detailed breakdown of financing activities including debt, equity, ' +
      'dividends, and lease payments.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financing activities retrieved',
  })
  async getFinancingActivities(
    @Param('orgId') orgId: string,
    @Query() dto: GenerateCashFlowStatementDto,
  ) {
    const statement = await this.cashFlowService.generateCashFlowStatement(
      orgId,
      dto,
    );
    return {
      period: statement.period,
      financingActivities: statement.financingActivities,
    };
  }

  /**
   * Health check endpoint
   * GET /reports/cashflow/health
   */
  @Get('health')
  @ApiOperation({
    summary: 'Cash flow module health check',
    description: 'Verify cash flow reporting module is operational',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Module is healthy',
  })
  healthCheck() {
    return {
      status: 'healthy',
      module: 'cashflow-report',
      version: '1.0.0',
      timestamp: new Date(),
      features: [
        'Indirect method cash flow statements',
        'Direct method cash flow statements',
        'Cash flow projections',
        'Burn rate analysis',
        'Free cash flow calculations',
        'Liquidity risk assessment',
        'Cash conversion cycle',
        'Comprehensive cash flow ratios',
      ],
    };
  }
}
