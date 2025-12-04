/**
 * DTOs for AI-powered report generation via natural language chat
 */

import { IsString, IsOptional, IsObject, IsEnum, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Intent types that the AI can identify from user messages
 */
export enum ReportIntent {
  GENERATE_REPORT = 'generate_report',
  COMPARE_PERIODS = 'compare_periods',
  ANALYZE_TRENDS = 'analyze_trends',
  GET_METRICS = 'get_metrics',
  EXPLAIN_VARIANCE = 'explain_variance',
  FORECAST = 'forecast',
  BENCHMARK = 'benchmark',
  DRILL_DOWN = 'drill_down',
  SUMMARIZE = 'summarize',
  CLARIFICATION_NEEDED = 'clarification_needed',
}

/**
 * Conversation context to maintain chat history
 */
export class ConversationContextDto {
  @ApiPropertyOptional({ description: 'Previous messages in the conversation' })
  @IsOptional()
  @IsArray()
  previousMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;

  @ApiPropertyOptional({ description: 'Last generated report ID for follow-up questions' })
  @IsOptional()
  @IsString()
  lastReportId?: string;

  @ApiPropertyOptional({ description: 'User preferences from history' })
  @IsOptional()
  @IsObject()
  userPreferences?: {
    preferredCurrency?: string;
    preferredDateFormat?: string;
    favoriteReportTypes?: string[];
    commonFilters?: Record<string, any>;
  };

  @ApiPropertyOptional({ description: 'Business context for better understanding' })
  @IsOptional()
  @IsObject()
  businessContext?: {
    industry?: string;
    fiscalYearStart?: string;
    mainRevenueSources?: string[];
    keyExpenseCategories?: string[];
  };
}

/**
 * Request to generate a report from natural language
 */
export class ChatReportRequestDto {
  @ApiProperty({
    description: 'Natural language request from user',
    example: 'Show me my profit and loss for last quarter'
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Conversation context for multi-turn chat' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConversationContextDto)
  context?: ConversationContextDto;

  @ApiPropertyOptional({ description: 'Organisation ID (auto-filled from auth if not provided)' })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiPropertyOptional({ description: 'User ID (auto-filled from auth if not provided)' })
  @IsOptional()
  @IsString()
  userId?: string;
}

/**
 * Extracted parameters from user message
 */
export class ExtractedParametersDto {
  @ApiPropertyOptional({ description: 'Report type identified' })
  @IsOptional()
  @IsString()
  reportType?: string;

  @ApiPropertyOptional({ description: 'Start date extracted' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date extracted' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Comparison period (YoY, MoM, etc.)' })
  @IsOptional()
  @IsString()
  comparisonPeriod?: string;

  @ApiPropertyOptional({ description: 'Filters to apply' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Grouping dimensions' })
  @IsOptional()
  @IsArray()
  groupBy?: string[];

  @ApiPropertyOptional({ description: 'Metrics to include' })
  @IsOptional()
  @IsArray()
  metrics?: string[];

  @ApiPropertyOptional({ description: 'Currency preference' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Additional options extracted' })
  @IsOptional()
  @IsObject()
  additionalOptions?: Record<string, any>;
}

/**
 * Clarifying question when intent is ambiguous
 */
export class ClarificationQuestionDto {
  @ApiProperty({ description: 'Question to ask the user' })
  question: string;

  @ApiProperty({ description: 'Suggested options if applicable' })
  options?: string[];

  @ApiProperty({ description: 'Parameter being clarified' })
  parameter: string;

  @ApiProperty({ description: 'Why clarification is needed' })
  reason: string;
}

/**
 * Response to a chat report request
 */
export class ChatResponseDto {
  @ApiProperty({ description: 'Identified intent from the message' })
  intent: ReportIntent;

  @ApiProperty({ description: 'Confidence score of intent classification' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiPropertyOptional({ description: 'Natural language response' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Generated report data if applicable' })
  @IsOptional()
  @IsObject()
  reportData?: any;

  @ApiPropertyOptional({ description: 'Parameters extracted from the message' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedParametersDto)
  extractedParameters?: ExtractedParametersDto;

  @ApiPropertyOptional({ description: 'Clarifying questions if intent unclear' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClarificationQuestionDto)
  clarifyingQuestions?: ClarificationQuestionDto[];

  @ApiPropertyOptional({ description: 'AI-generated insights about the data' })
  @IsOptional()
  @IsArray()
  insights?: string[];

  @ApiPropertyOptional({ description: 'Suggested follow-up questions' })
  @IsOptional()
  @IsArray()
  suggestedFollowUps?: string[];

  @ApiProperty({ description: 'Report ID for reference in follow-up questions' })
  @IsOptional()
  @IsString()
  reportId?: string;

  @ApiProperty({ description: 'Timestamp of response' })
  timestamp: Date;
}

/**
 * Request to get AI insights on a report
 */
export class GetInsightsDto {
  @ApiProperty({ description: 'Report data to analyze' })
  @IsObject()
  reportData: any;

  @ApiPropertyOptional({ description: 'Specific areas to focus on' })
  @IsOptional()
  @IsArray()
  focusAreas?: string[];

  @ApiPropertyOptional({ description: 'Business context for better insights' })
  @IsOptional()
  @IsObject()
  businessContext?: {
    industry?: string;
    businessGoals?: string[];
    concerns?: string[];
  };
}

/**
 * AI-generated insight
 */
export class InsightDto {
  @ApiProperty({ description: 'Insight category' })
  @IsEnum(['opportunity', 'risk', 'trend', 'anomaly', 'recommendation'])
  category: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';

  @ApiProperty({ description: 'Severity or importance level' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Insight title' })
  title: string;

  @ApiProperty({ description: 'Detailed description' })
  description: string;

  @ApiPropertyOptional({ description: 'Specific metrics supporting this insight' })
  @IsOptional()
  @IsObject()
  supportingMetrics?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Recommended actions' })
  @IsOptional()
  @IsArray()
  recommendedActions?: string[];

  @ApiPropertyOptional({ description: 'Expected impact if action taken' })
  @IsOptional()
  @IsString()
  expectedImpact?: string;

  @ApiProperty({ description: 'Confidence score of this insight' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;
}

/**
 * Response containing AI insights
 */
export class InsightsResponseDto {
  @ApiProperty({ description: 'List of AI-generated insights' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InsightDto)
  insights: InsightDto[];

  @ApiProperty({ description: 'Executive summary' })
  summary: string;

  @ApiProperty({ description: 'Key highlights' })
  @IsArray()
  keyHighlights: string[];

  @ApiProperty({ description: 'Overall health score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  healthScore: number;

  @ApiProperty({ description: 'Timestamp of analysis' })
  timestamp: Date;
}

/**
 * Request to detect anomalies in report data
 */
export class DetectAnomaliesDto {
  @ApiProperty({ description: 'Report data to analyze for anomalies' })
  @IsObject()
  reportData: any;

  @ApiPropertyOptional({ description: 'Historical data for comparison' })
  @IsOptional()
  @IsArray()
  historicalData?: any[];

  @ApiPropertyOptional({ description: 'Sensitivity level for anomaly detection' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  sensitivity?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ description: 'Types of anomalies to detect' })
  @IsOptional()
  @IsArray()
  anomalyTypes?: string[];
}

/**
 * Detected anomaly
 */
export class AnomalyDto {
  @ApiProperty({ description: 'Anomaly type' })
  @IsEnum(['spike', 'drop', 'outlier', 'pattern_break', 'missing_data', 'duplicate', 'fraud_indicator'])
  type: 'spike' | 'drop' | 'outlier' | 'pattern_break' | 'missing_data' | 'duplicate' | 'fraud_indicator';

  @ApiProperty({ description: 'Severity of anomaly' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Where the anomaly was detected' })
  location: {
    metric: string;
    category?: string;
    period?: string;
  };

  @ApiProperty({ description: 'Anomaly description' })
  description: string;

  @ApiProperty({ description: 'Expected value or range' })
  expected: number | { min: number; max: number };

  @ApiProperty({ description: 'Actual observed value' })
  actual: number;

  @ApiProperty({ description: 'Deviation from expected (percentage)' })
  deviation: number;

  @ApiPropertyOptional({ description: 'Possible explanations' })
  @IsOptional()
  @IsArray()
  possibleCauses?: string[];

  @ApiPropertyOptional({ description: 'Recommended actions' })
  @IsOptional()
  @IsArray()
  recommendedActions?: string[];

  @ApiProperty({ description: 'Confidence score' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;
}

/**
 * Request to predict trends
 */
export class PredictTrendsDto {
  @ApiProperty({ description: 'Historical data for prediction' })
  @IsArray()
  historicalData: any[];

  @ApiPropertyOptional({ description: 'Metrics to predict' })
  @IsOptional()
  @IsArray()
  metrics?: string[];

  @ApiPropertyOptional({ description: 'Number of periods to forecast' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  forecastPeriods?: number;

  @ApiPropertyOptional({ description: 'Confidence interval level' })
  @IsOptional()
  @IsEnum([90, 95, 99])
  confidenceLevel?: 90 | 95 | 99;
}

/**
 * Trend prediction
 */
export class TrendPredictionDto {
  @ApiProperty({ description: 'Metric being predicted' })
  metric: string;

  @ApiProperty({ description: 'Predicted values by period' })
  predictions: Array<{
    period: string;
    value: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;

  @ApiProperty({ description: 'Trend direction' })
  @IsEnum(['increasing', 'decreasing', 'stable', 'volatile'])
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';

  @ApiProperty({ description: 'Expected growth rate (%)' })
  growthRate: number;

  @ApiPropertyOptional({ description: 'Factors influencing the trend' })
  @IsOptional()
  @IsArray()
  influencingFactors?: string[];

  @ApiProperty({ description: 'Prediction accuracy score' })
  @IsNumber()
  @Min(0)
  @Max(1)
  accuracy: number;
}

/**
 * Request to compare with industry benchmarks
 */
export class BenchmarkComparisonDto {
  @ApiProperty({ description: 'Company data to compare' })
  @IsObject()
  companyData: any;

  @ApiProperty({ description: 'Industry sector' })
  @IsString()
  industry: string;

  @ApiPropertyOptional({ description: 'Company size category' })
  @IsOptional()
  @IsEnum(['small', 'medium', 'large'])
  companySize?: 'small' | 'medium' | 'large';

  @ApiPropertyOptional({ description: 'Geographic region' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Metrics to compare' })
  @IsOptional()
  @IsArray()
  metrics?: string[];
}

/**
 * Benchmark comparison result
 */
export class BenchmarkResultDto {
  @ApiProperty({ description: 'Metric being compared' })
  metric: string;

  @ApiProperty({ description: 'Company value' })
  companyValue: number;

  @ApiProperty({ description: 'Industry benchmark value' })
  benchmarkValue: number;

  @ApiProperty({ description: 'Percentile ranking (0-100)' })
  percentile: number;

  @ApiProperty({ description: 'Difference from benchmark' })
  difference: {
    absolute: number;
    percentage: number;
  };

  @ApiProperty({ description: 'Performance assessment' })
  @IsEnum(['below', 'at', 'above'])
  performance: 'below' | 'at' | 'above';

  @ApiPropertyOptional({ description: 'Interpretation and context' })
  @IsOptional()
  @IsString()
  interpretation?: string;
}

/**
 * Request to generate executive summary
 */
export class GenerateExecutiveSummaryDto {
  @ApiProperty({ description: 'Full report data to summarize' })
  @IsObject()
  reportData: any;

  @ApiPropertyOptional({ description: 'Target audience level' })
  @IsOptional()
  @IsEnum(['executive', 'management', 'technical'])
  audienceLevel?: 'executive' | 'management' | 'technical';

  @ApiPropertyOptional({ description: 'Maximum length in words' })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(500)
  maxLength?: number;

  @ApiPropertyOptional({ description: 'Focus areas to emphasize' })
  @IsOptional()
  @IsArray()
  focusAreas?: string[];
}

/**
 * Request to handle follow-up question
 */
export class FollowUpQuestionDto {
  @ApiProperty({ description: 'Follow-up question from user' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Original report ID or context' })
  @IsString()
  reportId: string;

  @ApiPropertyOptional({ description: 'Additional context' })
  @IsOptional()
  @IsObject()
  context?: any;
}

/**
 * Request to get proactive suggestions
 */
export class GetSuggestionsDto {
  @ApiPropertyOptional({ description: 'User interaction history' })
  @IsOptional()
  @IsArray()
  userHistory?: any[];

  @ApiPropertyOptional({ description: 'Business context' })
  @IsOptional()
  @IsObject()
  businessContext?: {
    currentGoals?: string[];
    recentChallenges?: string[];
    upcomingEvents?: string[];
  };

  @ApiPropertyOptional({ description: 'Time period for suggestions' })
  @IsOptional()
  @IsString()
  timePeriod?: string;
}

/**
 * Proactive report suggestion
 */
export class ReportSuggestionDto {
  @ApiProperty({ description: 'Suggestion title' })
  title: string;

  @ApiProperty({ description: 'Suggestion description' })
  description: string;

  @ApiProperty({ description: 'Suggested report type' })
  reportType: string;

  @ApiProperty({ description: 'Why this report is suggested' })
  reasoning: string;

  @ApiPropertyOptional({ description: 'Expected insights from this report' })
  @IsOptional()
  @IsArray()
  expectedInsights?: string[];

  @ApiProperty({ description: 'Suggested parameters for the report' })
  suggestedParameters: ExtractedParametersDto;

  @ApiProperty({ description: 'Priority of this suggestion' })
  @IsEnum(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';

  @ApiProperty({ description: 'Relevance score' })
  @IsNumber()
  @Min(0)
  @Max(1)
  relevance: number;
}
