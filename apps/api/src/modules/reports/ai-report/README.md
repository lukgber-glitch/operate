# AI-Powered Report Generation Module

Natural language report generation with AI insights, anomaly detection, and predictive analytics.

## Overview

This module enables users to generate financial reports using natural language, similar to asking a financial analyst questions. It leverages OpenAI GPT-4 for:

- **Natural Language Understanding**: Parse user requests and extract parameters
- **Intelligent Report Generation**: Generate appropriate reports from chat
- **AI Insights**: Automated analysis with actionable recommendations
- **Anomaly Detection**: Statistical and ML-based outlier identification
- **Trend Prediction**: Forecast future metrics with confidence intervals
- **Benchmark Comparison**: Compare against industry standards
- **Executive Summaries**: Concise high-level summaries
- **Proactive Suggestions**: Context-aware report recommendations

## Features

### 1. Natural Language Report Generation

Ask for reports in plain English:

```
"Show me my P&L for last quarter"
"Compare expenses this year vs last year"
"What's my cash runway?"
"Generate a tax summary for 2024"
"Show revenue by client for Q3"
```

The AI will:
1. Understand your intent
2. Extract parameters (dates, filters, options)
3. Generate the appropriate report
4. Provide insights and recommendations
5. Suggest follow-up questions

### 2. Multi-Turn Conversations

The system maintains conversation context, allowing natural follow-ups:

```
User: "Show me my revenue for last month"
AI: [Generates revenue report]

User: "How does that compare to the month before?"
AI: [Generates comparison with previous month]

User: "What caused the biggest changes?"
AI: [Analyzes variance and explains drivers]
```

### 3. AI Insights

Automatically analyzes reports and provides:

- **Opportunities**: Areas for improvement or growth
- **Risks**: Potential issues requiring attention
- **Trends**: Significant patterns in the data
- **Anomalies**: Unusual transactions or outliers
- **Recommendations**: Specific, actionable next steps

Each insight includes:
- Severity level (low, medium, high, critical)
- Supporting metrics
- Recommended actions
- Expected impact
- Confidence score

### 4. Anomaly Detection

Uses statistical analysis to detect:

- **Spikes**: Unusual increases in metrics
- **Drops**: Unexpected decreases
- **Outliers**: Values outside normal range
- **Pattern Breaks**: Changes in regular patterns
- **Missing Data**: Gaps in expected data
- **Duplicates**: Potential duplicate transactions
- **Fraud Indicators**: Suspicious patterns

Configurable sensitivity levels: low, medium, high

### 5. Trend Prediction

Forecasts future values using linear regression:

- Predict revenue trends
- Forecast expenses
- Project cash flow
- Estimate growth rates
- Calculate confidence intervals (90%, 95%, 99%)

### 6. Industry Benchmarks

Compare your metrics against industry standards:

- Profit margins (gross, operating, net)
- Financial ratios (current, quick, debt-to-equity)
- Operating metrics
- Percentile rankings
- Performance assessments

Supported industries: Technology, Retail, Manufacturing, Services

### 7. Executive Summaries

Generate concise summaries for different audiences:

- **Executive**: High-level, strategic focus
- **Management**: Operational details
- **Technical**: Full metrics and analysis

Customizable length (50-500 words)

### 8. Proactive Suggestions

AI suggests relevant reports based on:

- **Time Context**: Month-end, quarter-end, tax season
- **User History**: Previously generated reports
- **Business Events**: Upcoming deadlines, milestones
- **Industry Best Practices**: Recommended reporting cycles

## API Endpoints

### POST /reports/ai/generate

Generate report from natural language.

**Request:**
```json
{
  "message": "Show me my P&L for last quarter",
  "context": {
    "previousMessages": [],
    "userPreferences": {
      "preferredCurrency": "EUR"
    }
  }
}
```

**Response:**
```json
{
  "intent": "GENERATE_REPORT",
  "confidence": 0.9,
  "message": "I've generated your P&L report for Q3 2024...",
  "reportData": { ... },
  "extractedParameters": {
    "reportType": "PL_STATEMENT",
    "startDate": "2024-07-01",
    "endDate": "2024-09-30"
  },
  "insights": [
    "Revenue increased 15% compared to Q2",
    "Operating expenses are higher than industry average"
  ],
  "suggestedFollowUps": [
    "How does this compare to last year?",
    "Show me the biggest expense categories"
  ],
  "reportId": "uuid",
  "timestamp": "2024-12-04T10:30:00Z"
}
```

### POST /reports/ai/insights

Get AI-generated insights on report data.

**Request:**
```json
{
  "reportData": { ... },
  "focusAreas": ["profitability", "cash_flow"],
  "businessContext": {
    "industry": "technology",
    "businessGoals": ["increase_margin", "reduce_costs"]
  }
}
```

**Response:**
```json
{
  "insights": [
    {
      "category": "opportunity",
      "severity": "high",
      "title": "Gross Margin Improvement Potential",
      "description": "Your gross margin is 45%, below the industry average of 70%...",
      "supportingMetrics": {
        "currentMargin": 0.45,
        "industryAverage": 0.70
      },
      "recommendedActions": [
        "Review pricing strategy",
        "Optimize cost structure",
        "Focus on higher-margin products"
      ],
      "expectedImpact": "Increasing margin by 10% could improve profitability by 25%",
      "confidence": 0.85
    }
  ],
  "summary": "Analysis found 4 key insights requiring attention",
  "keyHighlights": [
    "Gross Margin Improvement Potential",
    "High Operating Expenses"
  ],
  "healthScore": 72,
  "timestamp": "2024-12-04T10:30:00Z"
}
```

### POST /reports/ai/anomalies

Detect anomalies in report data.

**Request:**
```json
{
  "reportData": { ... },
  "historicalData": [ ... ],
  "sensitivity": "medium",
  "anomalyTypes": ["spike", "drop", "outlier"]
}
```

**Response:**
```json
[
  {
    "type": "spike",
    "severity": "high",
    "location": {
      "metric": "Operating Expenses",
      "category": "Marketing",
      "period": "October 2024"
    },
    "description": "Unusual increase detected in Marketing expenses",
    "expected": { "min": 5000, "max": 7000 },
    "actual": 12000,
    "deviation": 71.4,
    "possibleCauses": [
      "New marketing campaign",
      "One-time event cost",
      "Seasonal variation"
    ],
    "recommendedActions": [
      "Review marketing spend breakdown",
      "Verify all transactions are correct",
      "Assess ROI of new campaigns"
    ],
    "confidence": 0.88
  }
]
```

### POST /reports/ai/predict

Predict future trends from historical data.

**Request:**
```json
{
  "historicalData": [
    { "period": "Jan", "value": 10000 },
    { "period": "Feb", "value": 12000 },
    { "period": "Mar", "value": 11500 }
  ],
  "metrics": ["revenue"],
  "forecastPeriods": 3,
  "confidenceLevel": 95
}
```

**Response:**
```json
[
  {
    "metric": "revenue",
    "predictions": [
      {
        "period": "Period +1",
        "value": 12500,
        "confidenceInterval": {
          "lower": 11000,
          "upper": 14000
        }
      }
    ],
    "direction": "increasing",
    "growthRate": 15.0,
    "influencingFactors": [
      "Historical growth pattern",
      "Seasonal effects",
      "Business expansion"
    ],
    "accuracy": 0.87
  }
]
```

### POST /reports/ai/benchmark

Compare with industry benchmarks.

**Request:**
```json
{
  "companyData": { ... },
  "industry": "technology",
  "companySize": "medium",
  "region": "EU",
  "metrics": ["grossMargin", "operatingMargin"]
}
```

**Response:**
```json
[
  {
    "metric": "Gross Margin",
    "companyValue": 0.65,
    "benchmarkValue": 0.70,
    "percentile": 45,
    "difference": {
      "absolute": -0.05,
      "percentage": -7.1
    },
    "performance": "below",
    "interpretation": "Your Gross Margin is 7.1% below industry average, suggesting room for improvement."
  }
]
```

### POST /reports/ai/explain

Get natural language explanation of a report.

**Request:**
```json
{
  "reportData": { ... }
}
```

**Response:**
```json
{
  "explanation": "This P&L report covers Q3 2024. Your net income is €45,000 with a 15% profit margin. Revenue grew 20% compared to last quarter, primarily driven by new customer acquisition. Operating expenses increased slightly but remain under budget. Key recommendation: Focus on maintaining this growth trajectory while optimizing marketing spend efficiency.",
  "timestamp": "2024-12-04T10:30:00Z"
}
```

### POST /reports/ai/followup

Answer follow-up questions about a report.

**Request:**
```json
{
  "question": "What caused the revenue increase?",
  "reportId": "uuid"
}
```

**Response:**
```json
{
  "answer": "The revenue increase was primarily driven by three factors: 1) New customer acquisition added €15,000, 2) Expansion revenue from existing customers contributed €8,000, and 3) Price adjustments added €5,000. The largest impact came from the sales team's successful outbound campaign in August.",
  "reportId": "uuid",
  "timestamp": "2024-12-04T10:30:00Z"
}
```

### GET /reports/ai/suggestions

Get proactive report suggestions.

**Response:**
```json
[
  {
    "title": "End of Month Financial Review",
    "description": "Monthly financial reports are recommended at month-end",
    "reportType": "PL_STATEMENT",
    "reasoning": "It's near the end of the month, a good time to review performance",
    "expectedInsights": [
      "Month-to-date revenue and expenses",
      "Comparison with previous month",
      "Budget variance analysis"
    ],
    "suggestedParameters": {
      "reportType": "PL_STATEMENT",
      "startDate": "2024-12-01",
      "endDate": "2024-12-31",
      "comparisonPeriod": "MOM"
    },
    "priority": "high",
    "relevance": 0.9
  }
]
```

### POST /reports/ai/summarize

Generate executive summary.

**Request:**
```json
{
  "reportData": { ... },
  "audienceLevel": "executive",
  "maxLength": 200,
  "focusAreas": ["profitability", "growth"]
}
```

**Response:**
```json
{
  "summary": "Q3 Performance Overview:\n\n• Revenue: €250,000 (+20% QoQ)\n• Net Income: €45,000 (18% margin)\n• Key Achievement: Exceeded quarterly targets\n\nCritical Items:\n- Strong customer acquisition momentum\n- Operating efficiency improving\n\nRecommended Actions:\n1. Invest in scaling operations\n2. Optimize marketing spend",
  "timestamp": "2024-12-04T10:30:00Z"
}
```

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
CLASSIFICATION_CONFIDENCE_THRESHOLD=0.7
```

### Module Import

```typescript
import { AIReportModule } from './modules/reports/ai-report';

@Module({
  imports: [
    AIReportModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Usage Examples

### TypeScript Client

```typescript
import { AIReportService } from './ai-report.service';

// Generate report from chat
const response = await aiReportService.generateReportFromChat(
  organisationId,
  userId,
  {
    message: 'Show me my P&L for last quarter',
    context: {
      userPreferences: {
        preferredCurrency: 'EUR',
      },
    },
  },
);

// Get insights
const insights = await aiReportService.generateInsights(reportData, {
  focusAreas: ['profitability', 'cash_flow'],
  businessContext: {
    industry: 'technology',
    businessGoals: ['increase_margin'],
  },
});

// Detect anomalies
const anomalies = await aiReportService.detectAnomalies(reportData, {
  sensitivity: 'medium',
  anomalyTypes: ['spike', 'drop', 'outlier'],
});

// Predict trends
const predictions = await aiReportService.predictTrends(historicalData, {
  forecastPeriods: 3,
  confidenceLevel: 95,
});
```

### cURL Examples

```bash
# Generate report from chat
curl -X POST http://localhost:3000/api/reports/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my P&L for last quarter"
  }'

# Get insights
curl -X POST http://localhost:3000/api/reports/ai/insights \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @report-data.json

# Check health
curl http://localhost:3000/api/reports/ai/health
```

## Supported Report Types

The AI understands these report types:

- **P&L Statement** (Profit & Loss)
- **Cash Flow Statement**
- **Balance Sheet**
- **Tax Summary**
- **VAT Report**
- **Expense Report**
- **Revenue Report**
- **AR Aging** (Accounts Receivable)
- **AP Aging** (Accounts Payable)

## Supported Time Periods

The AI recognizes various time expressions:

- **Absolute**: "January 2024", "Q3 2024", "2023"
- **Relative**: "last month", "this quarter", "last year"
- **Ranges**: "January to March", "Q1 2024 to Q3 2024"
- **YTD**: "year to date", "YTD"
- **Custom**: Any specific date range

## Architecture

```
┌─────────────────────┐
│   User Request      │
│  (Natural Language) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Intent Parser      │
│   (GPT-4 NLU)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Parameter Extractor │
│   (GPT-4 NER)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Report Generator    │
│  (Data Fetching)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AI Insights        │
│ (Analysis & ML)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Response Builder   │
│ (Natural Language) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   User Response     │
│ (Report + Insights)│
└─────────────────────┘
```

## Best Practices

1. **Be Specific**: More specific requests get better results
   - Good: "Show me revenue by category for Q3 2024"
   - Vague: "Show me some data"

2. **Use Follow-ups**: Build on previous questions for deeper analysis
   - "Show me my P&L"
   - "How does this compare to last quarter?"
   - "What caused the biggest changes?"

3. **Leverage Insights**: Review AI-generated insights for actionable recommendations

4. **Monitor Anomalies**: Regular anomaly detection helps catch issues early

5. **Track Trends**: Use predictions to plan ahead and set realistic goals

## Limitations

- **OpenAI Dependency**: Requires active OpenAI API key
- **Rate Limits**: Subject to OpenAI API rate limits
- **Context Window**: GPT-4 has token limits (~8K tokens)
- **Accuracy**: AI responses are probabilistic, not deterministic
- **Historical Data**: Predictions require at least 3 data points

## Performance

- **Cache Duration**: Conversations cached for 1 hour
- **Response Time**: Typically 2-5 seconds for simple queries
- **Concurrency**: Supports parallel processing
- **Token Usage**: ~500-2000 tokens per request

## Security

- All endpoints require JWT authentication
- Organization-level data isolation
- No sensitive data sent to OpenAI (only aggregated metrics)
- Conversation context expires after 1 hour
- Role-based access control (RBAC) integration

## Testing

```bash
# Run tests
npm test ai-report.service.spec.ts

# Test coverage
npm run test:cov
```

## Troubleshooting

### "OpenAI is not configured"

**Solution**: Set `OPENAI_API_KEY` environment variable

### "Clarification needed"

**Solution**: Provide more specific parameters (dates, report type, etc.)

### "Rate limit exceeded"

**Solution**: Implement retry logic or reduce request frequency

### Inaccurate intent detection

**Solution**: Use more specific language or provide context

## Contributing

When extending this module:

1. Add new intents to `ReportIntent` enum
2. Update intent parser system prompt
3. Add parameter extraction logic
4. Implement report generation
5. Update documentation
6. Add tests

## Support

For issues or questions:
- Check this README
- Review API documentation
- Contact the development team

## License

Proprietary - Operate/CoachOS
