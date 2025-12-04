/**
 * AI Report Controller
 * Endpoints for natural language report generation and AI insights
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AIReportService } from './ai-report.service';
import {
  ChatReportRequestDto,
  ChatResponseDto,
  GetInsightsDto,
  InsightsResponseDto,
  DetectAnomaliesDto,
  AnomalyDto,
  PredictTrendsDto,
  TrendPredictionDto,
  BenchmarkComparisonDto,
  BenchmarkResultDto,
  GenerateExecutiveSummaryDto,
  FollowUpQuestionDto,
  GetSuggestionsDto,
  ReportSuggestionDto,
} from './dto/chat-report.dto';

@ApiTags('AI Reports')
@Controller('reports/ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIReportController {
  private readonly logger = new Logger(AIReportController.name);

  constructor(private readonly aiReportService: AIReportService) {}

  /**
   * Generate report from natural language chat
   *
   * Examples:
   * - "Show me my P&L for last quarter"
   * - "Compare expenses this year vs last year"
   * - "What's my cash runway?"
   * - "Generate a tax summary for 2024"
   * - "Show revenue by client for Q3"
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate report from natural language',
    description: 'Use AI to understand your request and generate the appropriate financial report',
  })
  @ApiBody({ type: ChatReportRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or ambiguous parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Report generation failed',
  })
  async generateReport(
    @Body() request: ChatReportRequestDto,
    @Req() req: any,
  ): Promise<ChatResponseDto> {
    this.logger.log(`Generating AI report from chat: "${request.message}"`);

    const organisationId = req.user.organisationId || request.organisationId;
    const userId = req.user.userId || req.user.sub || request.userId;

    return await this.aiReportService.generateReportFromChat(
      organisationId,
      userId,
      request,
    );
  }

  /**
   * Get AI-powered insights on report data
   *
   * Analyzes report data and provides:
   * - Key opportunities
   * - Risk identification
   * - Trend analysis
   * - Actionable recommendations
   */
  @Post('insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get AI insights on report data',
    description: 'Analyze report data and generate intelligent insights and recommendations',
  })
  @ApiBody({ type: GetInsightsDto })
  @ApiResponse({
    status: 200,
    description: 'Insights generated successfully',
    type: InsightsResponseDto,
  })
  async getInsights(
    @Body() request: GetInsightsDto,
    @Req() req: any,
  ): Promise<InsightsResponseDto> {
    this.logger.log('Generating AI insights for report data');

    const insights = await this.aiReportService.generateInsights(
      request.reportData,
      request,
    );

    // Calculate health score based on insights
    const criticalCount = insights.filter(i => i.severity === 'critical').length;
    const highCount = insights.filter(i => i.severity === 'high').length;
    const riskCount = insights.filter(i => i.category === 'risk').length;

    let healthScore = 100;
    healthScore -= criticalCount * 20;
    healthScore -= highCount * 10;
    healthScore -= riskCount * 5;
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Generate summary
    const summary = insights.length > 0
      ? `Analysis complete. Found ${insights.length} key insights requiring attention.`
      : 'No significant issues detected. Business metrics appear healthy.';

    const keyHighlights = insights
      .filter(i => i.severity === 'high' || i.severity === 'critical')
      .map(i => i.title)
      .slice(0, 3);

    return {
      insights,
      summary,
      keyHighlights,
      healthScore,
      timestamp: new Date(),
    };
  }

  /**
   * Explain a report in natural language
   *
   * Generates a human-friendly explanation of report data
   * suitable for non-financial users
   */
  @Post('explain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Explain report in natural language',
    description: 'Get a clear, jargon-free explanation of report data',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reportData: {
          type: 'object',
          description: 'Report data to explain',
        },
      },
      required: ['reportData'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Explanation generated',
    schema: {
      type: 'object',
      properties: {
        explanation: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async explainReport(
    @Body() body: { reportData: any },
    @Req() req: any,
  ): Promise<{ explanation: string; timestamp: Date }> {
    this.logger.log('Generating natural language explanation for report');

    const userId = req.user.userId || req.user.sub;
    const explanation = await this.aiReportService.explainReport(
      body.reportData,
      userId,
    );

    return {
      explanation,
      timestamp: new Date(),
    };
  }

  /**
   * Handle follow-up question about a report
   *
   * Allows users to ask questions about previously generated reports
   * Maintains conversation context
   */
  @Post('followup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Answer follow-up question',
    description: 'Ask questions about a previously generated report',
  })
  @ApiBody({ type: FollowUpQuestionDto })
  @ApiResponse({
    status: 200,
    description: 'Follow-up answered',
    schema: {
      type: 'object',
      properties: {
        answer: { type: 'string' },
        reportId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async handleFollowUp(
    @Body() request: FollowUpQuestionDto,
    @Req() req: any,
  ): Promise<{ answer: string; reportId: string; timestamp: Date }> {
    this.logger.log(`Handling follow-up question: "${request.question}"`);

    const userId = req.user.userId || req.user.sub;
    const answer = await this.aiReportService.answerFollowUp(
      request.question,
      request.context || { reportId: request.reportId },
      userId,
    );

    return {
      answer,
      reportId: request.reportId,
      timestamp: new Date(),
    };
  }

  /**
   * Get proactive report suggestions
   *
   * AI suggests relevant reports based on:
   * - User history
   * - Business context
   * - Time period (month-end, quarter-end, etc.)
   * - Upcoming events
   */
  @Get('suggestions')
  @ApiOperation({
    summary: 'Get proactive report suggestions',
    description: 'AI-powered suggestions for relevant reports to generate',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestions retrieved',
    type: [ReportSuggestionDto],
  })
  async getSuggestions(
    @Query() query: GetSuggestionsDto,
    @Req() req: any,
  ): Promise<ReportSuggestionDto[]> {
    this.logger.log('Generating proactive report suggestions');

    const organisationId = req.user.organisationId;
    const userId = req.user.userId || req.user.sub;

    return await this.aiReportService.suggestReports(
      organisationId,
      userId,
      query,
    );
  }

  /**
   * Detect anomalies in report data
   *
   * Uses statistical analysis and ML to identify:
   * - Unusual spikes or drops
   * - Pattern breaks
   * - Outliers
   * - Missing data
   * - Potential fraud indicators
   */
  @Post('anomalies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detect anomalies in report data',
    description: 'Use AI to identify unusual patterns and outliers in financial data',
  })
  @ApiBody({ type: DetectAnomaliesDto })
  @ApiResponse({
    status: 200,
    description: 'Anomalies detected',
    type: [AnomalyDto],
  })
  async detectAnomalies(
    @Body() request: DetectAnomaliesDto,
  ): Promise<AnomalyDto[]> {
    this.logger.log('Detecting anomalies in report data');

    return await this.aiReportService.detectAnomalies(
      request.reportData,
      request,
    );
  }

  /**
   * Predict future trends
   *
   * Uses historical data to forecast:
   * - Revenue trends
   * - Expense patterns
   * - Cash flow projections
   * - With confidence intervals
   */
  @Post('predict')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Predict trends from historical data',
    description: 'Forecast future values based on historical patterns',
  })
  @ApiBody({ type: PredictTrendsDto })
  @ApiResponse({
    status: 200,
    description: 'Predictions generated',
    type: [TrendPredictionDto],
  })
  async predictTrends(
    @Body() request: PredictTrendsDto,
  ): Promise<TrendPredictionDto[]> {
    this.logger.log('Predicting trends from historical data');

    return await this.aiReportService.predictTrends(
      request.historicalData,
      request,
    );
  }

  /**
   * Compare with industry benchmarks
   *
   * Compares company metrics against industry standards:
   * - Profit margins
   * - Financial ratios
   * - Operating metrics
   * - Provides percentile ranking
   */
  @Post('benchmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compare with industry benchmarks',
    description: 'See how your metrics stack up against industry standards',
  })
  @ApiBody({ type: BenchmarkComparisonDto })
  @ApiResponse({
    status: 200,
    description: 'Benchmark comparison complete',
    type: [BenchmarkResultDto],
  })
  async compareWithBenchmarks(
    @Body() request: BenchmarkComparisonDto,
  ): Promise<BenchmarkResultDto[]> {
    this.logger.log(`Comparing with ${request.industry} industry benchmarks`);

    return await this.aiReportService.compareWithBenchmarks(
      request.companyData,
      request,
    );
  }

  /**
   * Generate executive summary
   *
   * Creates a concise, high-level summary suitable for:
   * - Executive leadership
   * - Board presentations
   * - Stakeholder updates
   */
  @Post('summarize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate executive summary',
    description: 'Create a concise summary for executive-level audience',
  })
  @ApiBody({ type: GenerateExecutiveSummaryDto })
  @ApiResponse({
    status: 200,
    description: 'Executive summary generated',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async generateExecutiveSummary(
    @Body() request: GenerateExecutiveSummaryDto,
  ): Promise<{ summary: string; timestamp: Date }> {
    this.logger.log('Generating executive summary');

    const summary = await this.aiReportService.summarizeForExecutive(
      request.reportData,
      request,
    );

    return {
      summary,
      timestamp: new Date(),
    };
  }

  /**
   * Health check for AI service
   */
  @Get('health')
  @ApiOperation({
    summary: 'Check AI service health',
    description: 'Verify that AI services (OpenAI) are configured and available',
  })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unavailable'] },
        openaiConfigured: { type: 'boolean' },
        message: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  getHealth(): any {
    // Simple health check - in production would ping OpenAI API
    const openaiConfigured = !!process.env.OPENAI_API_KEY;

    return {
      status: openaiConfigured ? 'healthy' : 'unavailable',
      openaiConfigured,
      message: openaiConfigured
        ? 'AI report service is operational'
        : 'OpenAI API key not configured',
      timestamp: new Date(),
    };
  }
}
