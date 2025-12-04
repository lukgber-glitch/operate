# Cash Flow Report Integration Guide

Quick guide for integrating the Cash Flow Report module into your application.

## Quick Start

### 1. Import the Module

The module is already integrated into the Reports module. No additional imports needed.

```typescript
// Already done in reports.module.ts
import { CashFlowReportModule } from './cashflow-report/cashflow-report.module';
```

### 2. Use in Your Service

```typescript
import { CashFlowReportService } from '@/modules/reports/cashflow-report';

@Injectable()
export class YourService {
  constructor(private readonly cashFlowService: CashFlowReportService) {}

  async getQuarterlyCashFlow(orgId: string) {
    return this.cashFlowService.generateCashFlowStatement(orgId, {
      periodType: 'QUARTERLY',
      method: CashFlowMethod.INDIRECT,
      includeComparison: true,
    });
  }
}
```

### 3. API Endpoints

All endpoints are available at `/reports/cashflow/:orgId`

#### Generate Basic Statement
```bash
GET /reports/cashflow/org-123?periodType=QUARTERLY
```

#### Get Burn Rate Analysis
```bash
GET /reports/cashflow/org-123/runway?months=6
```

#### Project Future Cash
```bash
POST /reports/cashflow/org-123/projection
{
  "months": 12,
  "method": "WEIGHTED_AVERAGE"
}
```

## Frontend Integration

### React/Next.js Example

```typescript
// hooks/useCashFlow.ts
import { useQuery } from '@tanstack/react-query';

export function useCashFlowStatement(orgId: string, options = {}) {
  return useQuery({
    queryKey: ['cashflow', orgId, options],
    queryFn: async () => {
      const params = new URLSearchParams(options);
      const res = await fetch(`/api/reports/cashflow/${orgId}?${params}`);
      return res.json();
    },
  });
}

export function useBurnRate(orgId: string, months = 6) {
  return useQuery({
    queryKey: ['burn-rate', orgId, months],
    queryFn: async () => {
      const res = await fetch(`/api/reports/cashflow/${orgId}/runway?months=${months}`);
      return res.json();
    },
  });
}

// Component usage
function CashFlowDashboard({ orgId }) {
  const { data: statement } = useCashFlowStatement(orgId, {
    periodType: 'QUARTERLY',
    includeComparison: true,
  });

  const { data: burnRate } = useBurnRate(orgId, 6);

  return (
    <div>
      <CashFlowSummary data={statement?.summary} />
      <BurnRateWidget data={burnRate} />
    </div>
  );
}
```

## Database Requirements

### Required Models

The module uses these Prisma models:

```prisma
model Organisation {
  id       String
  currency String
  // ... other fields
}

model Invoice {
  id          String
  orgId       String
  status      InvoiceStatus
  totalAmount Decimal
  paidDate    DateTime?
  // ... other fields
}

model Transaction {
  id       String
  orgId    String
  amount   Decimal
  date     DateTime
  category String?
  // ... other fields
}
```

### Transaction Categories

For accurate cash flow categorization, transactions should use these categories:

**Operating:**
- `INTEREST_RECEIVED`
- `SUPPLIER_PAYMENT`
- `TAX_PAYMENT`
- `DEPRECIATION`
- `AMORTIZATION`

**Investing:**
- `CAPEX_PURCHASE`
- `ASSET_SALE`
- `INVESTMENT_PURCHASE`

**Financing:**
- `DEBT_PROCEEDS`
- `DEBT_REPAYMENT`
- `DIVIDEND_PAYMENT`

See `cashflow.constants.ts` for the complete list.

## Common Use Cases

### 1. Board Meeting Report

```typescript
// Get comprehensive analysis for board presentation
const analysis = await cashFlowService.getComprehensiveAnalysis(orgId, {
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  includeCashConversionCycle: true,
  includeQualityOfEarnings: true,
  includeLiquidityRisks: true,
  includeFreeCashFlow: true,
});
```

### 2. Startup Runway Monitoring

```typescript
// Monitor burn rate and runway for startups
const burnAnalysis = await cashFlowService.analyzeCashBurnRate(orgId, {
  months: 6,
  includeRunway: true,
  includeGrowthAdjusted: true,
});

if (burnAnalysis.monthsOfRunway < 6) {
  // Trigger fundraising alert
  await notificationService.sendAlert({
    severity: 'WARNING',
    message: `Only ${burnAnalysis.monthsOfRunway} months of runway remaining`,
  });
}
```

### 3. Cash Flow Forecasting

```typescript
// Project cash position for next 12 months
const projection = await cashFlowService.projectCashPosition(orgId, {
  months: 12,
  method: ProjectionMethod.WEIGHTED_AVERAGE,
  includeConfidenceIntervals: true,
  includeScenarios: true,
});

// Identify potential cash shortfalls
const shortfalls = projection.projectedPeriods.filter(
  p => p.projectedEndingCash < 50000
);
```

### 4. Working Capital Optimization

```typescript
// Analyze cash conversion cycle
const ccc = await cashFlowService.calculateCashConversionCycle(orgId, period);

// Get optimization opportunities
const opportunities = ccc.optimizationOpportunities.filter(
  o => o.priority === 'HIGH'
);

// Recommendations might include:
// - Reduce DSO from 45 to 30 days → $50k cash impact
// - Extend DPO from 20 to 30 days → $30k cash impact
```

## Testing

### Unit Tests

```typescript
describe('CashFlowReportService', () => {
  it('should generate quarterly statement', async () => {
    const result = await service.generateCashFlowStatement('org-123', {
      periodType: 'QUARTERLY',
    });

    expect(result.operatingActivities).toBeDefined();
    expect(result.summary.reconciliationCheck).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Cash Flow API', () => {
  it('GET /reports/cashflow/:orgId', async () => {
    const response = await request(app.getHttpServer())
      .get('/reports/cashflow/org-123?periodType=QUARTERLY')
      .expect(200);

    expect(response.body).toHaveProperty('operatingActivities');
  });
});
```

## Performance Tips

### 1. Caching

```typescript
// Cache frequently accessed reports
const cacheKey = `cashflow:${orgId}:${period}`;
const cached = await cacheService.get(cacheKey);

if (cached) return cached;

const statement = await cashFlowService.generateCashFlowStatement(orgId, dto);
await cacheService.set(cacheKey, statement, 3600); // 1 hour
```

### 2. Background Processing

```typescript
// For large date ranges, process in background
import { Queue } from 'bull';

const cashFlowQueue = new Queue('cash-flow-generation');

cashFlowQueue.process(async (job) => {
  const { orgId, dto } = job.data;
  return await cashFlowService.generateCashFlowStatement(orgId, dto);
});
```

### 3. Pagination for Projections

```typescript
// For very long projections, paginate results
const projection = await cashFlowService.projectCashPosition(orgId, {
  months: 24, // 2 years
  method: ProjectionMethod.TREND_ANALYSIS,
});

// Return first 12 months, provide link for next page
const page1 = projection.projectedPeriods.slice(0, 12);
```

## Error Handling

```typescript
try {
  const statement = await cashFlowService.generateCashFlowStatement(orgId, dto);
} catch (error) {
  if (error instanceof NotFoundException) {
    // Organisation not found
    return res.status(404).json({ error: 'Organisation not found' });
  }

  if (error instanceof BadRequestException) {
    // Invalid parameters or insufficient data
    return res.status(400).json({ error: error.message });
  }

  // Unknown error
  logger.error('Cash flow generation failed', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

## Monitoring & Alerts

### Set Up Monitoring

```typescript
// Monitor generation times
const startTime = Date.now();
const statement = await cashFlowService.generateCashFlowStatement(orgId, dto);
const duration = Date.now() - startTime;

metrics.recordTiming('cashflow.generation.duration', duration);

if (duration > 5000) {
  logger.warn(`Slow cash flow generation: ${duration}ms for org ${orgId}`);
}
```

### Alert Configuration

```typescript
// Configure alerts for critical metrics
const burnRate = await cashFlowService.analyzeCashBurnRate(orgId, { months: 6 });

if (burnRate.monthsOfRunway < 3) {
  await alertService.send({
    severity: 'CRITICAL',
    channel: 'email',
    recipients: ['cfo@company.com'],
    subject: 'Critical: Low Cash Runway',
    message: `Only ${burnRate.monthsOfRunway.toFixed(1)} months of cash remaining`,
  });
}
```

## Migration from Old System

If migrating from an existing cash flow system:

1. **Map Old Categories** to new standard categories
2. **Backfill Historical Data** for accurate projections
3. **Validate Reconciliation** between old and new systems
4. **Run Parallel** for 1-2 periods to verify accuracy

```typescript
// Example migration script
async function migrateCashFlowData(oldSystemData) {
  const categoryMapping = {
    'old_category_1': 'CAPEX_PURCHASE',
    'old_category_2': 'SUPPLIER_PAYMENT',
    // ... etc
  };

  for (const transaction of oldSystemData) {
    const newCategory = categoryMapping[transaction.category];

    await prisma.transaction.create({
      data: {
        orgId: transaction.orgId,
        amount: transaction.amount,
        date: transaction.date,
        category: newCategory,
        // ... other fields
      },
    });
  }
}
```

## Support & Resources

- **Documentation**: See `README.md` for comprehensive docs
- **Constants**: Check `cashflow.constants.ts` for all mappings and thresholds
- **Types**: All TypeScript interfaces in `interfaces/cashflow.interfaces.ts`
- **Tests**: Examples in `cashflow-report.service.spec.ts`

## Troubleshooting

### Issue: Reconciliation Check Fails

```typescript
// Check opening and closing balances
const summary = statement.summary;

if (!summary.reconciliationCheck) {
  console.error('Reconciliation failed:', {
    expected: summary.cashAtBeginningOfPeriod + summary.netIncreaseDecreaseInCash,
    actual: summary.cashAtEndOfPeriod,
    difference: summary.reconciliationDifference,
  });

  // Common causes:
  // 1. Missing transactions
  // 2. Incorrect cash account balance
  // 3. Timing differences (accrual vs. cash basis)
}
```

### Issue: Insufficient Data for Projection

```typescript
// Ensure minimum historical data
const MINIMUM_MONTHS = 3;

const monthsAvailable = await getAvailableMonths(orgId);

if (monthsAvailable < MINIMUM_MONTHS) {
  throw new BadRequestException(
    `Need at least ${MINIMUM_MONTHS} months of data. You have ${monthsAvailable}.`
  );
}
```

### Issue: Slow Performance

```typescript
// Optimize by using date indexes
await prisma.$executeRaw`
  CREATE INDEX IF NOT EXISTS idx_transaction_date_org
  ON "Transaction" (date, "orgId");
`;

// Use aggregations instead of loading all records
const summary = await prisma.transaction.aggregate({
  where: { orgId, date: { gte: startDate, lte: endDate } },
  _sum: { amount: true },
  _count: true,
});
```

## Next Steps

1. Set up transaction categorization
2. Configure automatic report generation
3. Integrate with dashboards
4. Set up monitoring and alerts
5. Train finance team on new reports

For questions or issues, contact the backend team or check the module README.
