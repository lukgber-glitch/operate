# AI Report Module - Quick Start Guide

## 5-Minute Setup

### 1. Configure OpenAI API Key

```bash
# Add to .env file
OPENAI_API_KEY=sk-your-actual-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### 2. Module is Already Integrated

The AIReportModule is already imported in `ReportsModule`, so it's available immediately after configuration.

### 3. Try Your First AI Report

```bash
# Simple chat request
curl -X POST http://localhost:3000/api/reports/ai/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my profit and loss for last month"
  }'
```

## Example Requests

### Generate Reports

```bash
# P&L Report
curl -X POST http://localhost:3000/api/reports/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me my P&L for Q3 2024"}'

# Cash Flow
curl -X POST http://localhost:3000/api/reports/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my cash flow this month?"}'

# Expense Breakdown
curl -X POST http://localhost:3000/api/reports/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show expenses by category for last quarter"}'
```

### Get Insights

```bash
# On any report data
curl -X POST http://localhost:3000/api/reports/ai/insights \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportData": {
      "summary": {
        "totalRevenue": 100000,
        "totalExpenses": 80000,
        "netIncome": 20000,
        "netProfitMargin": 20
      }
    }
  }'
```

### Detect Anomalies

```bash
curl -X POST http://localhost:3000/api/reports/ai/anomalies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportData": {
      "sections": [{
        "id": "expenses",
        "title": "Expenses",
        "data": [
          {"value": 1000},
          {"value": 1100},
          {"value": 5000},
          {"value": 1050}
        ]
      }]
    },
    "sensitivity": "medium"
  }'
```

### Get Suggestions

```bash
# What reports should I run?
curl -X GET http://localhost:3000/api/reports/ai/suggestions \
  -H "Authorization: Bearer $TOKEN"
```

## TypeScript/JavaScript Usage

```typescript
import { AIReportService } from './modules/reports/ai-report';

// Inject in your service
constructor(private aiReportService: AIReportService) {}

// Generate report from chat
async generateReport() {
  const response = await this.aiReportService.generateReportFromChat(
    'organisation-id',
    'user-id',
    {
      message: 'Show me revenue for last quarter',
      context: {
        userPreferences: {
          preferredCurrency: 'EUR'
        }
      }
    }
  );

  console.log('Report:', response.reportData);
  console.log('Insights:', response.insights);
  console.log('Suggested follow-ups:', response.suggestedFollowUps);
}

// Get insights on existing report
async analyzeReport(reportData: any) {
  const insights = await this.aiReportService.generateInsights(reportData, {
    focusAreas: ['profitability', 'growth'],
    businessContext: {
      industry: 'technology',
      businessGoals: ['increase_margin']
    }
  });

  insights.forEach(insight => {
    console.log(`${insight.severity.toUpperCase()}: ${insight.title}`);
    console.log(insight.description);
    console.log('Actions:', insight.recommendedActions);
  });
}

// Detect anomalies
async checkAnomalies(reportData: any) {
  const anomalies = await this.aiReportService.detectAnomalies(reportData, {
    sensitivity: 'high',
    anomalyTypes: ['spike', 'drop', 'outlier']
  });

  anomalies.forEach(anomaly => {
    console.log(`⚠️ ${anomaly.type} in ${anomaly.location.metric}`);
    console.log(`Expected: ${anomaly.expected}, Actual: ${anomaly.actual}`);
    console.log(`Deviation: ${anomaly.deviation}%`);
  });
}
```

## Common Use Cases

### 1. Month-End Review

```typescript
const response = await aiReportService.generateReportFromChat(orgId, userId, {
  message: 'Generate a complete financial review for last month with comparison to previous month'
});

// Returns P&L with MoM comparison + insights
```

### 2. Quarterly Planning

```typescript
// Historical analysis
const response = await aiReportService.generateReportFromChat(orgId, userId, {
  message: 'Show me Q3 performance compared to Q2 and Q1'
});

// Future predictions
const predictions = await aiReportService.predictTrends(historicalData, {
  forecastPeriods: 3, // Next 3 quarters
  confidenceLevel: 95
});
```

### 3. Expense Optimization

```typescript
// Get expense breakdown
const response = await aiReportService.generateReportFromChat(orgId, userId, {
  message: 'Show expenses by category for this year'
});

// Analyze for optimization
const insights = await aiReportService.generateInsights(response.reportData, {
  focusAreas: ['cost_reduction']
});

// Compare with benchmarks
const benchmarks = await aiReportService.compareWithBenchmarks(
  response.reportData,
  {
    companyData: response.reportData,
    industry: 'technology'
  }
);
```

### 4. Cash Flow Monitoring

```typescript
const response = await aiReportService.generateReportFromChat(orgId, userId, {
  message: 'What is my current cash position and runway?'
});

// Get anomalies in cash flow
const anomalies = await aiReportService.detectAnomalies(response.reportData);

// Predict future cash flow
const predictions = await aiReportService.predictTrends(historicalCashFlow, {
  forecastPeriods: 6,
  metrics: ['netCashFlow']
});
```

### 5. Executive Dashboard

```typescript
// Get key metrics
const metrics = await aiReportService.generateReportFromChat(orgId, userId, {
  message: 'Show me all key financial metrics for this quarter'
});

// Generate executive summary
const summary = await aiReportService.summarizeForExecutive(
  metrics.reportData,
  {
    reportData: metrics.reportData,
    audienceLevel: 'executive',
    maxLength: 150
  }
);

// Get health score
const insightsResponse = await aiReportService.generateInsights(metrics.reportData);
// insightsResponse.healthScore is 0-100
```

## Natural Language Examples

The AI understands various phrasings:

### Revenue Queries
- "Show me revenue for last month"
- "What was our sales performance in Q3?"
- "Compare revenue this year vs last year"
- "Show me revenue breakdown by client"

### Expense Queries
- "What are my biggest expenses?"
- "Show expense categories for this quarter"
- "Compare operating expenses YoY"
- "Which department spent the most?"

### Profitability
- "What's my profit margin?"
- "Show me P&L for last quarter"
- "Am I profitable this year?"
- "How does my margin compare to industry?"

### Cash Flow
- "What's my cash runway?"
- "Show me cash flow statement"
- "Do I have enough cash for next month?"
- "What's my burn rate?"

### Tax & Compliance
- "Generate tax summary for 2024"
- "Show me VAT report for Q3"
- "What are my tax deductions?"
- "Prepare year-end tax documents"

### Comparative Analysis
- "Compare this month to last month"
- "Show year over year growth"
- "How do I compare to industry benchmarks?"
- "What changed from Q1 to Q2?"

## Testing Your Setup

### 1. Health Check

```bash
curl http://localhost:3000/api/reports/ai/health
```

Expected response:
```json
{
  "status": "healthy",
  "openaiConfigured": true,
  "message": "AI report service is operational",
  "timestamp": "2024-12-04T10:30:00Z"
}
```

### 2. Simple Request

```bash
curl -X POST http://localhost:3000/api/reports/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

Should return clarification questions if too vague.

### 3. Full Flow Test

```typescript
// 1. Generate report
const report = await aiReportService.generateReportFromChat(orgId, userId, {
  message: 'Show me my P&L for last month'
});

// 2. Get insights
const insights = await aiReportService.generateInsights(report.reportData);

// 3. Detect anomalies
const anomalies = await aiReportService.detectAnomalies(report.reportData);

// 4. Ask follow-up
const followup = await aiReportService.answerFollowUp(
  'What caused the revenue increase?',
  report.reportData,
  userId
);

console.log('Report:', report);
console.log('Insights:', insights);
console.log('Anomalies:', anomalies);
console.log('Follow-up:', followup);
```

## Troubleshooting

### "OpenAI is not configured"

**Problem**: OPENAI_API_KEY not set
**Solution**:
```bash
export OPENAI_API_KEY=sk-your-key
# or add to .env file
```

### "Clarification needed"

**Problem**: Request too vague
**Solution**: Be more specific
```bash
# Vague
"show me data"

# Specific
"Show me profit and loss for September 2024"
```

### "Rate limit exceeded"

**Problem**: Too many OpenAI requests
**Solution**:
- Implement exponential backoff
- Use caching
- Reduce request frequency

### Slow responses

**Problem**: GPT-4 processing time
**Expected**: 2-5 seconds for most requests
**If longer**:
- Check OpenAI API status
- Verify network connection
- Reduce data size sent to AI

## Configuration Tips

### Production Settings

```bash
# .env
OPENAI_API_KEY=sk-prod-key
CLASSIFICATION_CONFIDENCE_THRESHOLD=0.8
NODE_ENV=production
```

### Development Settings

```bash
# .env.development
OPENAI_API_KEY=sk-dev-key
CLASSIFICATION_CONFIDENCE_THRESHOLD=0.7
NODE_ENV=development
```

### Cost Optimization

```typescript
// Use caching
const response = await aiReportService.generateReportFromChat(orgId, userId, {
  message: 'Show me revenue',
  // Conversations cached for 1 hour
});

// Batch requests when possible
const [insights, anomalies, predictions] = await Promise.all([
  aiReportService.generateInsights(data),
  aiReportService.detectAnomalies(data),
  aiReportService.predictTrends(historicalData)
]);
```

## Next Steps

1. **Read Full Documentation**: See README.md for complete API reference
2. **Review Implementation**: Check IMPLEMENTATION.md for technical details
3. **Run Tests**: `npm test ai-report.service.spec.ts`
4. **Explore Examples**: Try different natural language queries
5. **Integrate**: Add AI reports to your frontend

## Getting Help

- **Documentation**: README.md, IMPLEMENTATION.md
- **Tests**: ai-report.service.spec.ts for usage examples
- **API Reference**: Swagger UI at `/api/docs`
- **Source Code**: Well-commented TypeScript files

## Summary

**You can now:**
- ✅ Generate reports from natural language
- ✅ Get AI-powered insights
- ✅ Detect anomalies automatically
- ✅ Predict future trends
- ✅ Compare with industry benchmarks
- ✅ Get proactive suggestions
- ✅ Ask follow-up questions

**Start with the simplest example and build from there!**

```bash
curl -X POST http://localhost:3000/api/reports/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me my P&L for last month"}'
```

Happy reporting! 🚀
