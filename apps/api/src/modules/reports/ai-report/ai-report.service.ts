/**
 * AI Report Service
 * Natural language report generation using OpenAI GPT-4
 *
 * Features:
 * - Natural language understanding for report requests
 * - Intent classification and parameter extraction
 * - Multi-turn conversation support
 * - AI-generated insights and recommendations
 * - Anomaly detection with ML
 * - Trend prediction and forecasting
 * - Industry benchmark comparison
 * - Executive summary generation
 * - Proactive report suggestions
 *
 * @module ai-report
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { ReportGeneratorService } from '../report-generator/report-generator.service';
import OpenAI from 'openai';
import {
  ChatReportRequestDto,
  ChatResponseDto,
  ReportIntent,
  ExtractedParametersDto,
  GetInsightsDto,
  InsightsResponseDto,
  InsightDto,
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
  ClarificationQuestionDto,
} from './dto/chat-report.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Statistical analysis utilities
 */
interface StatisticalAnalysis {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  quartiles: { q1: number; q2: number; q3: number };
  outliers: number[];
}

/**
 * Time series data point
 */
interface TimeSeriesPoint {
  period: string;
  value: number;
  timestamp?: Date;
}

@Injectable()
export class AIReportService {
  private readonly logger = new Logger(AIReportService.name);
  private openai: OpenAI;
  private readonly CONVERSATION_CACHE_TTL = 3600; // 1 hour
  private readonly MAX_CONVERSATION_HISTORY = 10;

  // Industry benchmark data (simplified - would use external data source in production)
  private readonly INDUSTRY_BENCHMARKS: Record<string, Record<string, number>> = {
    'technology': {
      grossMargin: 0.70,
      operatingMargin: 0.25,
      netMargin: 0.20,
      currentRatio: 2.0,
      quickRatio: 1.5,
      debtToEquity: 0.5,
      roe: 0.15,
    },
    'retail': {
      grossMargin: 0.35,
      operatingMargin: 0.08,
      netMargin: 0.05,
      currentRatio: 1.5,
      quickRatio: 0.8,
      debtToEquity: 1.0,
      roe: 0.12,
    },
    'manufacturing': {
      grossMargin: 0.40,
      operatingMargin: 0.12,
      netMargin: 0.08,
      currentRatio: 1.8,
      quickRatio: 1.0,
      debtToEquity: 0.8,
      roe: 0.14,
    },
    'services': {
      grossMargin: 0.60,
      operatingMargin: 0.18,
      netMargin: 0.12,
      currentRatio: 1.6,
      quickRatio: 1.2,
      debtToEquity: 0.6,
      roe: 0.16,
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly reportGenerator: ReportGeneratorService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured - AI report service disabled');
    } else {
      this.openai = new OpenAI({
        apiKey,
      });
      this.logger.log('OpenAI client initialized for AI report service');
    }
  }

  /**
   * Main entry point: Generate report from natural language chat
   *
   * Workflow:
   * 1. Parse user message to identify intent
   * 2. Extract parameters (dates, filters, options)
   * 3. Validate and clarify ambiguous requests
   * 4. Generate appropriate report
   * 5. Add AI insights and recommendations
   * 6. Cache conversation context
   */
  async generateReportFromChat(
    organisationId: string,
    userId: string,
    request: ChatReportRequestDto,
  ): Promise<ChatResponseDto> {
    this.ensureOpenAIConfigured();

    const correlationId = uuidv4();
    this.logger.log(`[${correlationId}] Processing chat request: "${request.message}"`);

    try {
      // Step 1: Parse intent
      const intent = await this.parseReportRequest(request.message, request.context);

      // Step 2: Extract parameters
      const extractedParams = await this.extractParameters(request.message, intent, request.context);

      // Step 3: Check if clarification needed
      if (intent === ReportIntent.CLARIFICATION_NEEDED || !extractedParams.reportType) {
        const clarifications = await this.generateClarifyingQuestions(
          request.message,
          extractedParams,
          request.context,
        );

        return {
          intent: ReportIntent.CLARIFICATION_NEEDED,
          confidence: 0.5,
          message: 'I need some clarification to generate the report you want.',
          clarifyingQuestions: clarifications,
          timestamp: new Date(),
        };
      }

      // Step 4: Generate the report
      const reportData = await this.executeReportGeneration(
        organisationId,
        userId,
        intent,
        extractedParams,
      );

      // Step 5: Generate insights
      const insights = await this.generateInsights(reportData);

      // Step 6: Generate natural language response
      const naturalLanguageResponse = await this.generateNaturalLanguageResponse(
        request.message,
        reportData,
        insights,
      );

      // Step 7: Suggest follow-ups
      const suggestedFollowUps = await this.suggestFollowUpQuestions(reportData, intent);

      // Step 8: Cache conversation
      const reportId = uuidv4();
      await this.cacheConversationContext(userId, {
        reportId,
        message: request.message,
        intent,
        extractedParams,
        reportData,
        timestamp: new Date(),
      });

      return {
        intent,
        confidence: 0.9,
        message: naturalLanguageResponse,
        reportData,
        extractedParameters: extractedParams,
        insights: insights.map(i => i.description),
        suggestedFollowUps,
        reportId,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`[${correlationId}] Error processing chat request: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to process request: ${error.message}`);
    }
  }

  /**
   * Parse user message to identify report intent
   * Uses GPT-4 for natural language understanding
   */
  async parseReportRequest(
    userMessage: string,
    context?: any,
  ): Promise<ReportIntent> {
    this.ensureOpenAIConfigured();

    const systemPrompt = `You are an expert financial analyst assistant. Your job is to understand user requests for financial reports.

Classify the user's intent into one of these categories:
- GENERATE_REPORT: User wants to generate a new report
- COMPARE_PERIODS: User wants to compare different time periods
- ANALYZE_TRENDS: User wants to see trends over time
- GET_METRICS: User wants specific metrics or KPIs
- EXPLAIN_VARIANCE: User wants to understand differences or changes
- FORECAST: User wants future predictions
- BENCHMARK: User wants to compare against industry standards
- DRILL_DOWN: User wants more detail on specific data
- SUMMARIZE: User wants a high-level summary
- CLARIFICATION_NEEDED: Request is too vague or ambiguous

Respond with just the intent category in uppercase.`;

    const userPrompt = `User request: "${userMessage}"

${context?.previousMessages ? `Previous conversation:
${context.previousMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}` : ''}

What is the user's intent?`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 50,
      });

      const intentString = response.choices[0].message.content?.trim().toUpperCase() || 'CLARIFICATION_NEEDED';

      // Map to enum
      const intentMap: Record<string, ReportIntent> = {
        'GENERATE_REPORT': ReportIntent.GENERATE_REPORT,
        'COMPARE_PERIODS': ReportIntent.COMPARE_PERIODS,
        'ANALYZE_TRENDS': ReportIntent.ANALYZE_TRENDS,
        'GET_METRICS': ReportIntent.GET_METRICS,
        'EXPLAIN_VARIANCE': ReportIntent.EXPLAIN_VARIANCE,
        'FORECAST': ReportIntent.FORECAST,
        'BENCHMARK': ReportIntent.BENCHMARK,
        'DRILL_DOWN': ReportIntent.DRILL_DOWN,
        'SUMMARIZE': ReportIntent.SUMMARIZE,
        'CLARIFICATION_NEEDED': ReportIntent.CLARIFICATION_NEEDED,
      };

      return intentMap[intentString] || ReportIntent.CLARIFICATION_NEEDED;
    } catch (error) {
      this.logger.error(`Error parsing intent: ${error.message}`);
      return ReportIntent.CLARIFICATION_NEEDED;
    }
  }

  /**
   * Extract structured parameters from natural language
   * Identifies report type, dates, filters, and options
   */
  async extractParameters(
    userMessage: string,
    intent: ReportIntent,
    context?: any,
  ): Promise<ExtractedParametersDto> {
    this.ensureOpenAIConfigured();

    const systemPrompt = `You are a parameter extraction expert for financial reports.

Extract the following information from the user's message:
1. Report type (P&L, Cash Flow, Balance Sheet, Tax Summary, VAT Report, Expense Report, Revenue Report, AR Aging, AP Aging)
2. Date range (start date, end date, or relative like "last quarter", "this year", "Q3 2024")
3. Comparison period (if comparing: YoY, MoM, QoQ, or custom)
4. Filters (categories, departments, clients, vendors, etc.)
5. Grouping dimensions (by category, by client, by department, etc.)
6. Currency preference
7. Any additional options

Respond in JSON format with these fields:
{
  "reportType": "string or null",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "comparisonPeriod": "string or null",
  "filters": {},
  "groupBy": [],
  "currency": "string or null",
  "metrics": [],
  "additionalOptions": {}
}

Today's date is ${new Date().toISOString().split('T')[0]}.`;

    const userPrompt = `User request: "${userMessage}"
Intent: ${intent}

${context?.userPreferences ? `User preferences:
- Preferred currency: ${context.userPreferences.preferredCurrency || 'EUR'}
- Favorite reports: ${context.userPreferences.favoriteReportTypes?.join(', ') || 'None'}
` : ''}

Extract the parameters as JSON:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      const extracted = content ? JSON.parse(content) : {};

      // Apply defaults and normalize
      return {
        reportType: this.normalizeReportType(extracted.reportType),
        startDate: extracted.startDate || this.inferStartDate(userMessage),
        endDate: extracted.endDate || this.inferEndDate(userMessage),
        comparisonPeriod: extracted.comparisonPeriod,
        filters: extracted.filters || {},
        groupBy: extracted.groupBy || [],
        metrics: extracted.metrics || [],
        currency: extracted.currency || context?.userPreferences?.preferredCurrency || 'EUR',
        additionalOptions: extracted.additionalOptions || {},
      };
    } catch (error) {
      this.logger.error(`Error extracting parameters: ${error.message}`);
      // Return minimal parameters
      return {
        reportType: null,
        currency: 'EUR',
      };
    }
  }

  /**
   * Identify the report type from user message
   * Maps natural language to system report types
   */
  private async identifyReportType(userMessage: string): Promise<string | null> {
    const lowerMessage = userMessage.toLowerCase();

    // Direct mappings
    const typeMapping: Record<string, string> = {
      'p&l': 'PL_STATEMENT',
      'profit and loss': 'PL_STATEMENT',
      'profit & loss': 'PL_STATEMENT',
      'income statement': 'PL_STATEMENT',
      'cash flow': 'CASH_FLOW',
      'cash': 'CASH_FLOW',
      'balance sheet': 'BALANCE_SHEET',
      'balance': 'BALANCE_SHEET',
      'tax': 'TAX_SUMMARY',
      'vat': 'VAT_REPORT',
      'expense': 'EXPENSE_REPORT',
      'expenses': 'EXPENSE_REPORT',
      'revenue': 'REVENUE_REPORT',
      'sales': 'REVENUE_REPORT',
      'ar aging': 'AR_AGING',
      'receivables': 'AR_AGING',
      'ap aging': 'AP_AGING',
      'payables': 'AP_AGING',
    };

    for (const [keyword, reportType] of Object.entries(typeMapping)) {
      if (lowerMessage.includes(keyword)) {
        return reportType;
      }
    }

    return null;
  }

  /**
   * Generate clarifying questions for ambiguous requests
   */
  private async generateClarifyingQuestions(
    userMessage: string,
    partialParams: ExtractedParametersDto,
    context?: any,
  ): Promise<ClarificationQuestionDto[]> {
    const questions: ClarificationQuestionDto[] = [];

    // Report type unclear
    if (!partialParams.reportType) {
      questions.push({
        question: 'Which type of report would you like to generate?',
        options: [
          'Profit & Loss Statement',
          'Cash Flow Statement',
          'Balance Sheet',
          'Tax Summary',
          'VAT Report',
          'Expense Report',
          'Revenue Report',
        ],
        parameter: 'reportType',
        reason: 'The report type was not clearly specified in your request.',
      });
    }

    // Date range unclear
    if (!partialParams.startDate || !partialParams.endDate) {
      questions.push({
        question: 'What time period should the report cover?',
        options: [
          'This month',
          'Last month',
          'This quarter',
          'Last quarter',
          'This year',
          'Last year',
          'Custom date range',
        ],
        parameter: 'dateRange',
        reason: 'I need to know the time period for the report.',
      });
    }

    return questions;
  }

  /**
   * Execute report generation based on extracted parameters
   */
  private async executeReportGeneration(
    organisationId: string,
    userId: string,
    intent: ReportIntent,
    params: ExtractedParametersDto,
  ): Promise<any> {
    if (!params.reportType) {
      throw new BadRequestException('Report type not specified');
    }

    // Map to ReportGeneratorService format
    const reportParams = {
      reportType: params.reportType,
      dateRange: {
        startDate: params.startDate || this.getDefaultStartDate(),
        endDate: params.endDate || this.getDefaultEndDate(),
        type: 'CUSTOM',
      },
      options: {
        currency: params.currency || 'EUR',
        groupBy: params.groupBy,
        filters: params.filters,
        comparison: params.comparisonPeriod ? this.mapComparisonPeriod(params.comparisonPeriod) : undefined,
        cache: { enabled: true },
      },
    };

    return await this.reportGenerator.generateReport(organisationId, userId, reportParams as Prisma.InputJsonValue);
  }

  /**
   * Generate AI insights from report data
   * Analyzes patterns, identifies opportunities, and provides recommendations
   */
  async generateInsights(reportData: any, options?: GetInsightsDto): Promise<InsightDto[]> {
    this.ensureOpenAIConfigured();

    const insights: InsightDto[] = [];

    try {
      // Build context for AI
      const reportSummary = this.buildReportSummary(reportData);

      const systemPrompt = `You are an expert financial analyst providing actionable insights from business reports.

Analyze the report data and identify:
1. Key opportunities for improvement
2. Potential risks or concerns
3. Significant trends
4. Anomalies that need attention
5. Specific, actionable recommendations

Provide 3-5 high-quality insights with:
- Category (opportunity, risk, trend, anomaly, recommendation)
- Severity (low, medium, high, critical)
- Title (concise)
- Description (detailed but clear)
- Recommended actions (specific steps)
- Expected impact (what will happen if action is taken)

Focus on insights that are:
- Actionable (user can do something about it)
- Specific (backed by actual numbers)
- Impactful (materially affects the business)

Respond in JSON format as an array of insights.`;

      const userPrompt = `Report Summary:
${JSON.stringify(reportSummary, null, 2)}

${options?.focusAreas ? `Focus on these areas: ${options.focusAreas.join(', ')}` : ''}
${options?.businessContext ? `Business context: ${JSON.stringify(options.businessContext)}` : ''}

Provide insights:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.insights && Array.isArray(parsed.insights)) {
          insights.push(...parsed.insights.map((i: any) => ({
            category: i.category || 'recommendation',
            severity: i.severity || 'medium',
            title: i.title || 'Insight',
            description: i.description || '',
            supportingMetrics: i.supportingMetrics,
            recommendedActions: i.recommendedActions || [],
            expectedImpact: i.expectedImpact,
            confidence: i.confidence || 0.8,
          })));
        }
      }
    } catch (error) {
      this.logger.error(`Error generating insights: ${error.message}`);
    }

    // Add rule-based insights if AI didn't generate enough
    if (insights.length < 3) {
      insights.push(...this.generateRuleBasedInsights(reportData));
    }

    return insights.slice(0, 5); // Return top 5
  }

  /**
   * Generate rule-based insights as fallback or supplement
   */
  private generateRuleBasedInsights(reportData: any): InsightDto[] {
    const insights: InsightDto[] = [];

    if (reportData.summary) {
      // Check profitability
      if (reportData.summary.netIncome !== undefined && reportData.summary.netIncome < 0) {
        insights.push({
          category: 'risk',
          severity: 'high',
          title: 'Negative Net Income',
          description: `The company is currently operating at a loss with a net income of ${this.formatCurrency(reportData.summary.netIncome, reportData.metadata?.currency || 'EUR')}. This requires immediate attention.`,
          supportingMetrics: {
            netIncome: reportData.summary.netIncome,
            netProfitMargin: reportData.summary.netProfitMargin || 0,
          },
          recommendedActions: [
            'Review and reduce operating expenses',
            'Analyze revenue streams for improvement opportunities',
            'Consider pricing adjustments',
            'Evaluate cost of goods sold for optimization',
          ],
          expectedImpact: 'Reversing the negative trend could improve cash flow and business sustainability.',
          confidence: 0.95,
        });
      }

      // Check profit margin
      if (reportData.summary.grossProfitMargin !== undefined && reportData.summary.grossProfitMargin < 30) {
        insights.push({
          category: 'opportunity',
          severity: 'medium',
          title: 'Low Gross Profit Margin',
          description: `Gross profit margin is ${reportData.summary.grossProfitMargin.toFixed(1)}%, which is below the healthy threshold of 30%. There may be opportunities to improve pricing or reduce costs.`,
          supportingMetrics: {
            grossProfitMargin: reportData.summary.grossProfitMargin,
            targetMargin: 30,
          },
          recommendedActions: [
            'Review pricing strategy',
            'Negotiate better supplier terms',
            'Optimize production/service delivery costs',
            'Focus on higher-margin products/services',
          ],
          expectedImpact: 'Improving margin by 5-10% could significantly increase profitability.',
          confidence: 0.85,
        });
      }

      // Check cash flow
      if (reportData.summary.netCashFlow !== undefined && reportData.summary.netCashFlow < 0) {
        insights.push({
          category: 'risk',
          severity: 'critical',
          title: 'Negative Cash Flow',
          description: `Net cash flow is negative at ${this.formatCurrency(reportData.summary.netCashFlow, reportData.metadata?.currency || 'EUR')}. This could lead to liquidity issues.`,
          supportingMetrics: {
            netCashFlow: reportData.summary.netCashFlow,
          },
          recommendedActions: [
            'Improve accounts receivable collection',
            'Delay non-critical capital expenditures',
            'Review payment terms with suppliers',
            'Consider short-term financing options',
          ],
          expectedImpact: 'Improving cash flow is critical for business operations and growth.',
          confidence: 0.9,
        });
      }

      // Check AR aging
      if (reportData.summary.overdue !== undefined && reportData.summary.total !== undefined) {
        const overduePercentage = (reportData.summary.overdue / reportData.summary.total) * 100;
        if (overduePercentage > 20) {
          insights.push({
            category: 'risk',
            severity: 'high',
            title: 'High Overdue Receivables',
            description: `${overduePercentage.toFixed(1)}% of receivables are overdue, which is above the acceptable threshold of 20%. This affects cash flow and working capital.`,
            supportingMetrics: {
              overdueAmount: reportData.summary.overdue,
              overduePercentage,
            },
            recommendedActions: [
              'Implement stricter credit policies',
              'Send payment reminders earlier',
              'Offer early payment discounts',
              'Review client creditworthiness',
            ],
            expectedImpact: 'Reducing overdue receivables will improve cash flow and reduce bad debt risk.',
            confidence: 0.88,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Explain a report in natural language
   * Generates human-friendly explanation of report data
   */
  async explainReport(reportData: any, userId: string): Promise<string> {
    this.ensureOpenAIConfigured();

    const systemPrompt = `You are a financial advisor explaining a business report to a client.

Provide a clear, jargon-free explanation of the report that:
1. Summarizes the key findings
2. Explains what the numbers mean for the business
3. Highlights the most important takeaways
4. Uses simple language accessible to non-financial users

Keep it concise but informative (200-300 words).`;

    const userPrompt = `Explain this report:

${JSON.stringify(this.buildReportSummary(reportData), null, 2)}

Provide a natural language explanation:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      return response.choices[0].message.content || 'Unable to generate explanation.';
    } catch (error) {
      this.logger.error(`Error explaining report: ${error.message}`);
      return this.generateBasicExplanation(reportData);
    }
  }

  /**
   * Answer follow-up questions about a report
   */
  async answerFollowUp(
    question: string,
    reportContext: any,
    userId: string,
  ): Promise<string> {
    this.ensureOpenAIConfigured();

    const systemPrompt = `You are a financial analyst answering questions about a specific report.

Provide accurate, helpful answers based on the report data.
If the data doesn't contain the information needed, say so clearly.
Keep answers concise but complete.`;

    const userPrompt = `Report Data:
${JSON.stringify(reportContext, null, 2)}

User Question: ${question}

Answer:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      return response.choices[0].message.content || 'I cannot answer that question based on the available data.';
    } catch (error) {
      this.logger.error(`Error answering follow-up: ${error.message}`);
      throw new InternalServerErrorException('Failed to process follow-up question');
    }
  }

  /**
   * Detect anomalies in report data using statistical analysis
   * Combines ML-based detection with rule-based checks
   */
  async detectAnomalies(
    reportData: any,
    options?: DetectAnomaliesDto,
  ): Promise<AnomalyDto[]> {
    const anomalies: AnomalyDto[] = [];
    const sensitivity = options?.sensitivity || 'medium';

    // Configure thresholds based on sensitivity
    const thresholds = {
      low: { stdDevMultiplier: 3, percentageThreshold: 50 },
      medium: { stdDevMultiplier: 2, percentageThreshold: 30 },
      high: { stdDevMultiplier: 1.5, percentageThreshold: 20 },
    };

    const config = thresholds[sensitivity];

    try {
      // Extract time series data if available
      if (reportData.sections && Array.isArray(reportData.sections)) {
        for (const section of reportData.sections) {
          if (section.data && Array.isArray(section.data)) {
            const values = section.data.map((d: any) => d.value).filter((v: number) => !isNaN(v));

            if (values.length >= 3) {
              const stats = this.calculateStatistics(values);
              const outliers = this.detectOutliers(values, stats, config.stdDevMultiplier);

              outliers.forEach((outlier, index) => {
                const deviation = Math.abs((outlier - stats.mean) / stats.mean * 100);

                if (deviation > config.percentageThreshold) {
                  anomalies.push({
                    type: outlier > stats.mean ? 'spike' : 'drop',
                    severity: deviation > 50 ? 'high' : deviation > 30 ? 'medium' : 'low',
                    location: {
                      metric: section.title,
                      category: section.id,
                    },
                    description: `Unusual ${outlier > stats.mean ? 'increase' : 'decrease'} detected in ${section.title}`,
                    expected: { min: stats.mean - stats.stdDev, max: stats.mean + stats.stdDev },
                    actual: outlier,
                    deviation: Math.round(deviation * 10) / 10,
                    possibleCauses: this.generatePossibleCauses(section.title, outlier > stats.mean),
                    recommendedActions: this.generateRecommendedActions(section.title, outlier > stats.mean),
                    confidence: 0.8,
                  });
                }
              });
            }
          }
        }
      }

      // Check for specific anomaly patterns
      anomalies.push(...this.detectPatternAnomalies(reportData, config));

    } catch (error) {
      this.logger.error(`Error detecting anomalies: ${error.message}`);
    }

    return anomalies;
  }

  /**
   * Predict trends using simple linear regression
   * For production, would use more sophisticated ML models
   */
  async predictTrends(
    historicalData: TimeSeriesPoint[],
    options?: PredictTrendsDto,
  ): Promise<TrendPredictionDto[]> {
    const predictions: TrendPredictionDto[] = [];
    const forecastPeriods = options?.forecastPeriods || 3;
    const confidenceLevel = options?.confidenceLevel || 95;

    try {
      // Group by metric if multiple metrics present
      const metricGroups = this.groupByMetric(historicalData);

      for (const [metric, dataPoints] of Object.entries(metricGroups)) {
        const values = dataPoints.map(d => d.value);

        if (values.length < 3) {
          continue; // Need at least 3 points for prediction
        }

        // Calculate trend
        const trend = this.calculateLinearRegression(values);
        const stats = this.calculateStatistics(values);

        // Generate predictions
        const forecastPoints = [];
        for (let i = 1; i <= forecastPeriods; i++) {
          const predictedValue = trend.slope * (values.length + i) + trend.intercept;
          const margin = this.calculateConfidenceInterval(stats.stdDev, confidenceLevel);

          forecastPoints.push({
            period: `Period +${i}`,
            value: Math.round(predictedValue * 100) / 100,
            confidenceInterval: {
              lower: Math.round((predictedValue - margin) * 100) / 100,
              upper: Math.round((predictedValue + margin) * 100) / 100,
            },
          });
        }

        // Determine direction
        const direction = this.determineTrendDirection(trend.slope, stats.stdDev);
        const growthRate = values[0] !== 0 ? ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0;

        predictions.push({
          metric,
          predictions: forecastPoints,
          direction,
          growthRate: Math.round(growthRate * 10) / 10,
          influencingFactors: this.identifyInfluencingFactors(metric, direction),
          accuracy: trend.rSquared,
        });
      }
    } catch (error) {
      this.logger.error(`Error predicting trends: ${error.message}`);
    }

    return predictions;
  }

  /**
   * Compare company metrics with industry benchmarks
   */
  async compareWithBenchmarks(
    companyData: any,
    options: BenchmarkComparisonDto,
  ): Promise<BenchmarkResultDto[]> {
    const results: BenchmarkResultDto[] = [];

    const industry = options.industry.toLowerCase();
    const benchmarks = this.INDUSTRY_BENCHMARKS[industry] || this.INDUSTRY_BENCHMARKS['services'];

    try {
      // Extract company metrics
      const companyMetrics = this.extractMetricsForBenchmarking(companyData);

      // Compare each metric
      for (const [metricKey, benchmarkValue] of Object.entries(benchmarks)) {
        const companyValue = companyMetrics[metricKey];

        if (companyValue !== undefined && companyValue !== null) {
          const difference = companyValue - benchmarkValue;
          const percentageDiff = (difference / benchmarkValue) * 100;

          // Calculate percentile (simplified)
          const percentile = this.calculatePercentile(companyValue, benchmarkValue);

          let performance: 'below' | 'at' | 'above';
          if (Math.abs(percentageDiff) < 5) {
            performance = 'at';
          } else if (companyValue > benchmarkValue) {
            performance = 'above';
          } else {
            performance = 'below';
          }

          results.push({
            metric: this.formatMetricName(metricKey),
            companyValue,
            benchmarkValue,
            percentile,
            difference: {
              absolute: Math.round(difference * 1000) / 1000,
              percentage: Math.round(percentageDiff * 10) / 10,
            },
            performance,
            interpretation: this.generateBenchmarkInterpretation(
              metricKey,
              performance,
              percentageDiff,
            ),
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error comparing with benchmarks: ${error.message}`);
    }

    return results;
  }

  /**
   * Generate executive summary from detailed report
   */
  async summarizeForExecutive(
    reportData: any,
    options?: GenerateExecutiveSummaryDto,
  ): Promise<string> {
    this.ensureOpenAIConfigured();

    const audienceLevel = options?.audienceLevel || 'executive';
    const maxLength = options?.maxLength || 200;

    const systemPrompt = `You are writing an executive summary for ${audienceLevel} level audience.

Create a concise summary that:
- Highlights only the most critical information
- Uses clear, direct language
- Focuses on business impact and decisions needed
- Avoids technical jargon
- Maximum ${maxLength} words

Format:
1. Overall Status (1-2 sentences)
2. Key Metrics (2-3 bullet points)
3. Critical Issues (if any)
4. Recommended Actions (1-2 items)`;

    const userPrompt = `Report Data:
${JSON.stringify(this.buildReportSummary(reportData), null, 2)}

${options?.focusAreas ? `Focus on: ${options.focusAreas.join(', ')}` : ''}

Generate executive summary:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: maxLength * 2, // Tokens ≈ words * 2
      });

      return response.choices[0].message.content || this.generateBasicSummary(reportData);
    } catch (error) {
      this.logger.error(`Error generating executive summary: ${error.message}`);
      return this.generateBasicSummary(reportData);
    }
  }

  /**
   * Suggest reports proactively based on user history and business context
   */
  async suggestReports(
    organisationId: string,
    userId: string,
    options?: GetSuggestionsDto,
  ): Promise<ReportSuggestionDto[]> {
    const suggestions: ReportSuggestionDto[] = [];

    try {
      // Get current date context
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();

      // Time-based suggestions
      // End of month - suggest monthly reports
      if (currentDay >= 25) {
        suggestions.push({
          title: 'End of Month Financial Review',
          description: 'Monthly financial reports are recommended at month-end to track performance',
          reportType: 'PL_STATEMENT',
          reasoning: 'It\'s near the end of the month, a good time to review monthly performance',
          expectedInsights: [
            'Month-to-date revenue and expenses',
            'Comparison with previous month',
            'Budget variance analysis',
          ],
          suggestedParameters: {
            reportType: 'PL_STATEMENT',
            startDate: new Date(now.getFullYear(), currentMonth, 1).toISOString().split('T')[0],
            endDate: new Date(now.getFullYear(), currentMonth + 1, 0).toISOString().split('T')[0],
            comparisonPeriod: 'MOM',
            currency: 'EUR',
          },
          priority: 'high',
          relevance: 0.9,
        });
      }

      // Quarter end - suggest quarterly reports
      if ([2, 5, 8, 11].includes(currentMonth) && currentDay >= 25) {
        suggestions.push({
          title: 'Quarterly Business Review',
          description: 'Comprehensive quarterly analysis to review performance and plan ahead',
          reportType: 'PL_STATEMENT',
          reasoning: 'Quarter is ending, time for strategic quarterly review',
          expectedInsights: [
            'Quarterly trends and patterns',
            'Year-over-year comparison',
            'Key performance indicators',
          ],
          suggestedParameters: {
            reportType: 'PL_STATEMENT',
            startDate: new Date(now.getFullYear(), Math.floor(currentMonth / 3) * 3, 1).toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0],
            comparisonPeriod: 'QOQ',
            currency: 'EUR',
          },
          priority: 'high',
          relevance: 0.95,
        });
      }

      // Tax season suggestions
      if ([2, 3].includes(currentMonth)) { // March-April
        suggestions.push({
          title: 'Annual Tax Preparation Report',
          description: 'Comprehensive tax summary for annual tax filing',
          reportType: 'TAX_SUMMARY',
          reasoning: 'Tax filing season - gather all tax-related information',
          expectedInsights: [
            'Total tax liability for the year',
            'Deduction opportunities',
            'VAT summary',
          ],
          suggestedParameters: {
            reportType: 'TAX_SUMMARY',
            startDate: new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0],
            endDate: new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0],
            currency: 'EUR',
          },
          priority: 'high',
          relevance: 0.85,
        });
      }

      // Cash flow monitoring
      suggestions.push({
        title: 'Cash Flow Health Check',
        description: 'Monitor your cash position and runway',
        reportType: 'CASH_FLOW',
        reasoning: 'Regular cash flow monitoring is critical for business sustainability',
        expectedInsights: [
          'Current cash position',
          'Cash runway estimation',
          'Working capital analysis',
        ],
        suggestedParameters: {
          reportType: 'CASH_FLOW',
          startDate: new Date(now.getFullYear(), currentMonth, 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
          currency: 'EUR',
        },
        priority: 'medium',
        relevance: 0.8,
      });

      // AR aging for receivables management
      suggestions.push({
        title: 'Receivables Collection Review',
        description: 'Check overdue invoices and improve cash collection',
        reportType: 'AR_AGING',
        reasoning: 'Regular AR aging review helps maintain healthy cash flow',
        expectedInsights: [
          'Outstanding receivables breakdown',
          'Overdue amounts requiring follow-up',
          'Average days to payment',
        ],
        suggestedParameters: {
          reportType: 'AR_AGING',
          endDate: now.toISOString().split('T')[0],
          currency: 'EUR',
        },
        priority: 'medium',
        relevance: 0.75,
      });

    } catch (error) {
      this.logger.error(`Error generating suggestions: ${error.message}`);
    }

    // Sort by relevance and priority
    return suggestions.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const scoreA = a.relevance * priorityWeight[a.priority];
      const scoreB = b.relevance * priorityWeight[b.priority];
      return scoreB - scoreA;
    }).slice(0, 5);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Ensure OpenAI is configured before using AI features
   */
  private ensureOpenAIConfigured(): void {
    if (!this.openai) {
      throw new InternalServerErrorException('OpenAI is not configured. Please set OPENAI_API_KEY environment variable.');
    }
  }

  /**
   * Normalize report type to standard enum values
   */
  private normalizeReportType(reportType: string | null): string | null {
    if (!reportType) return null;

    const normalized = reportType.toUpperCase().replace(/[^A-Z_]/g, '_');

    const validTypes = [
      'PL_STATEMENT',
      'CASH_FLOW',
      'BALANCE_SHEET',
      'TAX_SUMMARY',
      'VAT_REPORT',
      'EXPENSE_REPORT',
      'REVENUE_REPORT',
      'AR_AGING',
      'AP_AGING',
    ];

    return validTypes.includes(normalized) ? normalized : null;
  }

  /**
   * Infer start date from natural language
   */
  private inferStartDate(message: string): string | null {
    const now = new Date();
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('last month')) {
      return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    }
    if (lowerMessage.includes('this month')) {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
    if (lowerMessage.includes('last quarter')) {
      const quarter = Math.floor((now.getMonth() - 3) / 3);
      return new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
    }
    if (lowerMessage.includes('this quarter')) {
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
    }
    if (lowerMessage.includes('this year') || lowerMessage.includes('ytd')) {
      return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }
    if (lowerMessage.includes('last year')) {
      return new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
    }

    return null;
  }

  /**
   * Infer end date from natural language
   */
  private inferEndDate(message: string): string | null {
    const now = new Date();
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('last month')) {
      return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    }
    if (lowerMessage.includes('last quarter')) {
      const quarter = Math.floor((now.getMonth() - 3) / 3);
      return new Date(now.getFullYear(), (quarter + 1) * 3, 0).toISOString().split('T')[0];
    }
    if (lowerMessage.includes('last year')) {
      return new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
    }

    // Default to today
    return now.toISOString().split('T')[0];
  }

  /**
   * Get default start date (beginning of current year)
   */
  private getDefaultStartDate(): string {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  }

  /**
   * Get default end date (today)
   */
  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Map comparison period string to structured format
   */
  private mapComparisonPeriod(period: string): any {
    const periodMap: Record<string, string> = {
      'yoy': 'YOY',
      'year over year': 'YOY',
      'mom': 'MOM',
      'month over month': 'MOM',
      'qoq': 'QOQ',
      'quarter over quarter': 'QOQ',
    };

    const type = periodMap[period.toLowerCase()] || 'YOY';

    return {
      type,
      enabled: true,
    };
  }

  /**
   * Build concise report summary for AI processing
   */
  private buildReportSummary(reportData: any): any {
    return {
      reportType: reportData.metadata?.reportType,
      period: {
        from: reportData.metadata?.dateRange?.startDate,
        to: reportData.metadata?.dateRange?.endDate,
      },
      summary: reportData.summary,
      keyMetrics: this.extractKeyMetrics(reportData),
      sectionTotals: reportData.sections?.map((s: any) => ({
        section: s.title,
        subtotal: s.subtotal,
        itemCount: s.data?.length || 0,
      })) || [],
    };
  }

  /**
   * Extract key metrics from report
   */
  private extractKeyMetrics(reportData: any): Record<string, number> {
    const metrics: Record<string, number> = {};

    if (reportData.summary) {
      Object.entries(reportData.summary).forEach(([key, value]) => {
        if (typeof value === 'number') {
          metrics[key] = value;
        }
      });
    }

    return metrics;
  }

  /**
   * Generate natural language response for report
   */
  private async generateNaturalLanguageResponse(
    userMessage: string,
    reportData: any,
    insights: InsightDto[],
  ): Promise<string> {
    const summary = this.buildReportSummary(reportData);
    const topInsight = insights[0];

    let response = `I've generated your report for ${summary.period.from} to ${summary.period.to}. `;

    // Add key findings based on report type
    if (summary.summary?.netIncome !== undefined) {
      const income = summary.summary.netIncome;
      const margin = summary.summary.netProfitMargin;
      response += `Your net income is ${this.formatCurrency(income, reportData.metadata?.currency || 'EUR')} with a profit margin of ${margin?.toFixed(1)}%. `;
    } else if (summary.summary?.netCashFlow !== undefined) {
      const cashFlow = summary.summary.netCashFlow;
      response += `Your net cash flow is ${this.formatCurrency(cashFlow, reportData.metadata?.currency || 'EUR')}. `;
    }

    // Add top insight
    if (topInsight) {
      response += `Key insight: ${topInsight.description}`;
    }

    return response;
  }

  /**
   * Suggest relevant follow-up questions
   */
  private async suggestFollowUpQuestions(reportData: any, intent: ReportIntent): Promise<string[]> {
    const suggestions: string[] = [];

    if (intent === ReportIntent.GENERATE_REPORT) {
      suggestions.push(
        'How does this compare to last month?',
        'What are the main trends?',
        'Show me the biggest expenses',
        'Are there any unusual transactions?',
      );
    } else if (intent === ReportIntent.COMPARE_PERIODS) {
      suggestions.push(
        'What caused the biggest changes?',
        'Forecast next month based on this trend',
        'How do we compare to industry benchmarks?',
      );
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Cache conversation context for multi-turn chat
   */
  private async cacheConversationContext(userId: string, context: any): Promise<void> {
    const cacheKey = `conversation:${userId}`;

    try {
      // Get existing history
      const existingHistory = await this.cacheService.get<any[]>(cacheKey) || [];

      // Add new context
      existingHistory.push(context);

      // Keep only recent history
      const recentHistory = existingHistory.slice(-this.MAX_CONVERSATION_HISTORY);

      // Cache with TTL
      await this.cacheService.set(cacheKey, recentHistory, this.CONVERSATION_CACHE_TTL);
    } catch (error) {
      this.logger.warn(`Failed to cache conversation: ${error.message}`);
    }
  }

  /**
   * Calculate basic statistics for a dataset
   */
  private calculateStatistics(values: number[]): StatisticalAnalysis {
    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);

    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const median = n % 2 === 0
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2
      : sorted[Math.floor(n/2)];

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const q1 = sorted[Math.floor(n * 0.25)];
    const q2 = median;
    const q3 = sorted[Math.floor(n * 0.75)];

    const iqr = q3 - q1;
    const outliers = values.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);

    return {
      mean,
      median,
      stdDev,
      variance,
      quartiles: { q1, q2, q3 },
      outliers,
    };
  }

  /**
   * Detect outliers using standard deviation method
   */
  private detectOutliers(values: number[], stats: StatisticalAnalysis, multiplier: number = 2): number[] {
    const threshold = stats.stdDev * multiplier;
    return values.filter(v => Math.abs(v - stats.mean) > threshold);
  }

  /**
   * Calculate linear regression for trend analysis
   */
  private calculateLinearRegression(values: number[]): { slope: number; intercept: number; rSquared: number } {
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = values.reduce((sum, y) => sum + y * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = values.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return { slope, intercept, rSquared };
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(stdDev: number, level: number): number {
    const zScores: Record<number, number> = {
      90: 1.645,
      95: 1.96,
      99: 2.576,
    };
    const z = zScores[level] || 1.96;
    return z * stdDev;
  }

  /**
   * Determine trend direction from slope
   */
  private determineTrendDirection(slope: number, stdDev: number): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    const volatilityThreshold = stdDev * 0.5;

    if (Math.abs(slope) < 0.01) {
      return 'stable';
    } else if (slope > volatilityThreshold) {
      return 'volatile';
    } else if (slope > 0) {
      return 'increasing';
    } else {
      return 'decreasing';
    }
  }

  /**
   * Group time series data by metric
   */
  private groupByMetric(data: TimeSeriesPoint[]): Record<string, TimeSeriesPoint[]> {
    // Simplified - assumes single metric for now
    return { 'default': data };
  }

  /**
   * Detect pattern-based anomalies
   */
  private detectPatternAnomalies(reportData: any, config: any): AnomalyDto[] {
    const anomalies: AnomalyDto[] = [];

    // Check for missing data
    if (reportData.sections) {
      reportData.sections.forEach((section: any) => {
        if (!section.data || section.data.length === 0) {
          anomalies.push({
            type: 'missing_data',
            severity: 'medium',
            location: { metric: section.title },
            description: `No data available for ${section.title}`,
            expected: 0,
            actual: 0,
            deviation: 0,
            confidence: 0.9,
          });
        }
      });
    }

    return anomalies;
  }

  /**
   * Extract metrics for benchmarking
   */
  private extractMetricsForBenchmarking(reportData: any): Record<string, number> {
    const metrics: Record<string, number> = {};

    if (reportData.summary) {
      // Map report metrics to benchmark keys
      if (reportData.summary.grossProfitMargin !== undefined) {
        metrics.grossMargin = reportData.summary.grossProfitMargin / 100;
      }
      if (reportData.summary.operatingMargin !== undefined) {
        metrics.operatingMargin = reportData.summary.operatingMargin / 100;
      }
      if (reportData.summary.netProfitMargin !== undefined) {
        metrics.netMargin = reportData.summary.netProfitMargin / 100;
      }
      if (reportData.summary.currentRatio !== undefined) {
        metrics.currentRatio = reportData.summary.currentRatio;
      }
      if (reportData.summary.debtToEquityRatio !== undefined) {
        metrics.debtToEquity = reportData.summary.debtToEquityRatio;
      }
    }

    return metrics;
  }

  /**
   * Calculate percentile rank
   */
  private calculatePercentile(value: number, benchmark: number): number {
    // Simplified percentile calculation
    // In production, would use actual industry distribution
    const difference = (value - benchmark) / benchmark;

    if (difference > 0.2) return 90;
    if (difference > 0.1) return 75;
    if (difference > 0) return 60;
    if (difference > -0.1) return 40;
    if (difference > -0.2) return 25;
    return 10;
  }

  /**
   * Format metric name for display
   */
  private formatMetricName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Generate interpretation for benchmark comparison
   */
  private generateBenchmarkInterpretation(
    metric: string,
    performance: 'below' | 'at' | 'above',
    percentageDiff: number,
  ): string {
    const metricName = this.formatMetricName(metric);

    if (performance === 'at') {
      return `Your ${metricName} is in line with industry average.`;
    } else if (performance === 'above') {
      return `Your ${metricName} is ${Math.abs(percentageDiff).toFixed(1)}% above industry average, indicating strong performance.`;
    } else {
      return `Your ${metricName} is ${Math.abs(percentageDiff).toFixed(1)}% below industry average, suggesting room for improvement.`;
    }
  }

  /**
   * Generate possible causes for anomalies
   */
  private generatePossibleCauses(metric: string, isIncrease: boolean): string[] {
    const causes: string[] = [];

    if (isIncrease) {
      causes.push(
        'Seasonal variation',
        'New business or contract',
        'One-time transaction',
        'Pricing changes',
      );
    } else {
      causes.push(
        'Seasonal downturn',
        'Lost customer or contract',
        'Market conditions',
        'Operational issues',
      );
    }

    return causes;
  }

  /**
   * Generate recommended actions for anomalies
   */
  private generateRecommendedActions(metric: string, isIncrease: boolean): string[] {
    const actions: string[] = [];

    if (isIncrease) {
      actions.push(
        'Verify the transactions for accuracy',
        'Understand what drove the increase',
        'Assess sustainability of the increase',
      );
    } else {
      actions.push(
        'Investigate the cause of the decrease',
        'Review recent business changes',
        'Consider corrective actions if needed',
      );
    }

    return actions;
  }

  /**
   * Identify factors influencing a trend
   */
  private identifyInfluencingFactors(metric: string, direction: string): string[] {
    const factors: string[] = [];

    factors.push('Historical patterns');
    factors.push('Seasonal effects');

    if (direction === 'increasing') {
      factors.push('Business growth');
      factors.push('Market expansion');
    } else if (direction === 'decreasing') {
      factors.push('Market conditions');
      factors.push('Competitive pressures');
    }

    return factors;
  }

  /**
   * Generate basic explanation as fallback
   */
  private generateBasicExplanation(reportData: any): string {
    const type = reportData.metadata?.reportType || 'Financial';
    const period = reportData.metadata?.dateRange;

    let explanation = `This ${type} report covers the period from ${period?.startDate} to ${period?.endDate}. `;

    if (reportData.summary) {
      const metrics = Object.entries(reportData.summary)
        .filter(([_, value]) => typeof value === 'number')
        .slice(0, 3);

      if (metrics.length > 0) {
        explanation += 'Key metrics include: ';
        explanation += metrics.map(([key, value]) =>
          `${key}: ${typeof value === 'number' ? this.formatCurrency(value as number, 'EUR') : value}`
        ).join(', ');
      }
    }

    return explanation;
  }

  /**
   * Generate basic summary as fallback
   */
  private generateBasicSummary(reportData: any): string {
    const summary = reportData.summary || {};
    const currency = reportData.metadata?.currency || 'EUR';

    let text = 'Executive Summary:\n\n';

    if (summary.netIncome !== undefined) {
      text += `Net Income: ${this.formatCurrency(summary.netIncome, currency)} `;
      text += `(${summary.netProfitMargin?.toFixed(1)}% margin)\n`;
    }

    if (summary.totalRevenue !== undefined) {
      text += `Total Revenue: ${this.formatCurrency(summary.totalRevenue, currency)}\n`;
    }

    if (summary.totalExpenses !== undefined) {
      text += `Total Expenses: ${this.formatCurrency(summary.totalExpenses, currency)}\n`;
    }

    text += '\nRecommendation: Review detailed sections for specific areas requiring attention.';

    return text;
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
