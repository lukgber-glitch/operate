# Client Insights Service

Comprehensive analytics and insights service for CRM clients in the Operate/CoachOS platform.

## Overview

The Client Insights Service provides deep analytics on client behavior, payment patterns, revenue trends, and churn risk. It enables data-driven decision-making for client relationship management.

## Files Created

1. **dto/client-insights.dto.ts** (432 lines)
   - Complete DTO definitions for all insights endpoints
   - Includes enums, request/response models
   - Full Swagger/OpenAPI documentation

2. **client-insights.service.ts** (1,481 lines)
   - Core business logic for all analytics calculations
   - On-demand and cached metrics
   - Batch processing support

3. **client-insights.controller.ts** (226 lines)
   - RESTful API endpoints
   - Full Swagger documentation
   - Query parameter validation

4. **client-insights.processor.ts** (353 lines)
   - Optional BullMQ background job processor
   - Batch recalculation support
   - Queue management service

**Total Lines of Code: 2,492**

## Features

### 1. Revenue Analytics
- Total lifetime revenue
- Month-over-month growth
- Year-over-year comparisons
- Revenue contribution percentage
- 6-month revenue trends
- Average monthly revenue

### 2. Payment Analytics
- Outstanding balance tracking
- Average payment days (overall and recent)
- Payment velocity trends (improving/stable/declining)
- Payment reliability score (0-100)
- On-time payment rate
- Overdue invoice tracking
- Invoice paid ratio

### 3. Invoice Analytics
- Total/paid/pending/overdue invoice counts
- Average invoice amount
- Invoice frequency analysis
- 6-month invoice count trends
- Days since last invoice

### 4. Client Lifetime Value (CLV)
- Current lifetime value
- Projected lifetime value
- Average monthly value
- Customer age (months)
- Revenue growth rate
- Value segment classification (High/Medium/Low)

### 5. Risk Assessment
- Churn risk level (Critical/High/Medium/Low)
- Churn risk score (0-100)
- Risk factors identification
- Positive indicators
- Engagement score (0-100)
- Days since last activity
- Recommended actions

### 6. Seasonal Patterns
- Quarterly revenue breakdown
- Monthly revenue distribution
- Peak and low period identification
- Pattern detection algorithm

### 7. Client Segmentation
- Enterprise (top 20% by revenue)
- Mid-market (next 30%)
- SMB (remaining 50%)
- New (< 3 months old)

### 8. Opportunity Identification
- Upsell opportunities
- Payment terms negotiation
- Volume discount eligibility
- Cross-sell opportunities
- Annual prepayment eligibility
- Long-term contract opportunities

## API Endpoints

### Individual Client Insights

#### GET /clients/:id/insights
Get complete insights for a client.

**Query Parameters:**
- `timeRange` (optional): `LAST_30_DAYS`, `LAST_90_DAYS`, `LAST_6_MONTHS`, `LAST_YEAR`, `ALL_TIME`

**Response:** Full `ClientInsightsDto` with all analytics

#### GET /clients/:id/insights/revenue
Get revenue breakdown only.

**Response:** `RevenueBreakdownDto`

#### GET /clients/:id/insights/payments
Get payment analytics only.

**Response:** `PaymentAnalyticsDto`

#### GET /clients/:id/insights/risk
Get risk assessment only.

**Response:** `RiskAssessmentDto`

### Aggregate Insights

#### GET /clients/insights/top-performers
Get top performing clients across multiple dimensions.

**Query Parameters:**
- `limit` (optional, default: 10): Number of results per category
- `timeRange` (optional): Time range filter

**Response:** `TopPerformersDto` with lists of:
- Top by revenue
- Top by growth rate
- Top by payment reliability
- Top by lifetime value

#### GET /clients/insights/at-risk
Get clients at risk of churning.

**Query Parameters:**
- `limit` (optional, default: 20): Maximum results
- `minRiskLevel` (optional): Filter by minimum risk level

**Response:** `AtRiskClientsDto` categorized by:
- Critical risk
- High risk
- Medium risk
- Total revenue at risk

#### GET /clients/insights/trends
Get organization-wide client trends.

**Response:** `ClientTrendsDto` with:
- Average revenue growth
- Average payment behavior
- Churn rate
- New/churned client counts
- 6-month trends
- Client distribution by segment

### Batch Operations

#### GET /clients/insights/recalculate
Trigger batch recalculation of insights for all clients.

**Response:** `{ processed: number }`

**Note:** Resource-intensive operation. Use sparingly or via background queue.

## Usage Examples

### Basic Usage

```typescript
// In another service
constructor(
  private readonly clientInsightsService: ClientInsightsService,
) {}

async getClientHealthScore(clientId: string, orgId: string) {
  const insights = await this.clientInsightsService.getClientInsights(
    clientId,
    orgId,
  );

  return {
    revenue: insights.revenue.totalRevenue,
    riskLevel: insights.risk.churnRisk,
    paymentScore: insights.payments.paymentReliabilityScore,
  };
}
```

### API Usage

```bash
# Get full insights
curl -X GET http://localhost:3000/clients/123e4567-e89b-12d3-a456-426614174000/insights \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get top performers
curl -X GET http://localhost:3000/clients/insights/top-performers?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get at-risk clients
curl -X GET http://localhost:3000/clients/insights/at-risk?minRiskLevel=HIGH \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get overall trends
curl -X GET http://localhost:3000/clients/insights/trends \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Background Job Processing (Optional)

The service includes optional BullMQ integration for batch processing.

### Setup

1. Uncomment BullMQ imports in `crm.module.ts`
2. Configure Redis connection in your app module
3. Register the queue

```typescript
// In crm.module.ts
imports: [
  DatabaseModule,
  BullModule.registerQueue({
    name: 'client-insights',
  }),
],
```

### Usage

```typescript
constructor(
  private readonly queueService: ClientInsightsQueueService,
) {}

// Schedule full recalculation
const jobId = await this.queueService.scheduleFullRecalculation(orgId);

// Schedule specific clients
await this.queueService.scheduleClientRecalculation(
  orgId,
  ['client-id-1', 'client-id-2'],
);

// Schedule daily recalculation (cron)
await this.queueService.scheduleDailyRecalculation(orgId);

// Check job status
const status = await this.queueService.getJobStatus(jobId);

// Get queue statistics
const stats = await this.queueService.getQueueStats();
```

## Metrics Calculation Logic

### Payment Reliability Score
```
Base: 100
- Deduct for avg payment days > 45: -30
- Deduct for avg payment days > 30: -20
- Deduct for avg payment days > 15: -10
- Deduct for avg payment days > 0: -5
- Deduct based on on-time rate: (100 - rate) * 0.3
- Deduct for overdue count > 3: -20
- Deduct for overdue count > 1: -10
- Deduct for overdue count > 0: -5
Result: Clamped to 0-100
```

### Churn Risk Score
```
Base: 0 (add risk points)
Payment behavior (0-30):
  - Avg payment days > 45: +20
  - Avg payment days > 30: +10
Overdue invoices (0-20):
  - Count > 2: +20
  - Count > 0: +10
Payment velocity (0-15):
  - Declining: +15
Invoice frequency (0-15):
  - No invoices 90+ days: +15
  - Low frequency 60+ days: +8
Communication (0-10):
  - No communication 90+ days: +10
Outstanding balance (0-10):
  - High balance > $20k: +10

Risk Level:
  - 80+: CRITICAL
  - 60-79: HIGH
  - 40-59: MEDIUM
  - 0-39: LOW
```

### Client Segmentation
```
NEW: < 3 months old
ENTERPRISE: Top 20% by revenue (excluding NEW)
MID_MARKET: Next 30% by revenue
SMB: Remaining 50%
```

### Payment Velocity Trend
```
Compare recent 30-day average to overall average:
- Recent < Overall - 2 days: IMPROVING
- Recent > Overall + 2 days: DECLINING
- Otherwise: STABLE
- < 2 payments: INSUFFICIENT_DATA
```

## Performance Considerations

### Caching Strategy
- Insights are calculated on-demand
- Results are not automatically cached (implement Redis caching if needed)
- Consider caching for frequently accessed clients

### Optimization Tips
1. Use specific endpoints (`/insights/revenue`) instead of full insights when possible
2. Implement result caching with Redis
3. Use background jobs for batch recalculation
4. Limit `top-performers` and `at-risk` results
5. Add database indexes on:
   - `Invoice.clientId`
   - `Invoice.status`
   - `Invoice.issueDate`
   - `Invoice.paidDate`

### Database Queries
The service uses:
- Aggregation queries for revenue calculations
- Filtered queries for status-based metrics
- Batch processing for organization-wide analytics

## Testing

### Unit Tests
```bash
npm test client-insights.service.spec.ts
```

### Integration Tests
```bash
npm run test:e2e client-insights.e2e-spec.ts
```

### Manual Testing
Use the Swagger UI at `/api/docs` to test all endpoints interactively.

## Future Enhancements

1. **Predictive Analytics**
   - ML-based churn prediction
   - Revenue forecasting
   - Anomaly detection

2. **Advanced Segmentation**
   - RFM (Recency, Frequency, Monetary) analysis
   - Custom segment definitions
   - Industry benchmarking

3. **Real-time Updates**
   - WebSocket notifications for risk changes
   - Live dashboards
   - Alert system

4. **Enhanced Reporting**
   - PDF report generation
   - Email digest
   - Executive summaries

5. **Comparative Analytics**
   - Peer comparison
   - Industry benchmarks
   - Historical trending

## Dependencies

### Required
- `@nestjs/common`
- `@nestjs/swagger`
- `@prisma/client`
- `class-validator`
- `class-transformer`

### Optional (for background jobs)
- `@nestjs/bullmq`
- `bullmq`
- `ioredis`

## Troubleshooting

### Issue: Insights calculation is slow
**Solution:**
- Ensure database indexes are in place
- Implement result caching
- Use background jobs for batch operations

### Issue: Missing data in insights
**Solution:**
- Verify invoices have correct `status` and `clientId`
- Check that invoice amounts are properly stored
- Ensure `paidDate` is set for paid invoices

### Issue: Inaccurate risk scores
**Solution:**
- Review risk calculation algorithm
- Adjust weights based on your business model
- Ensure all client activities are logged

## Support

For questions or issues:
1. Check this documentation
2. Review the inline code comments
3. Consult the Swagger API documentation at `/api/docs`
4. Contact the FORGE agent or backend team

## License

Proprietary - Operate/CoachOS Platform
