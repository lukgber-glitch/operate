# Cash Flow Predictor Service

## Overview

The Cash Flow Predictor Service provides intelligent cash flow forecasting based on:
- **Historical transaction patterns** - Learn from past behavior
- **Pending invoices** - Expected income with payment probability
- **Pending bills** - Scheduled expenses
- **Recurring payments** - Auto-detected subscription and regular payments
- **Customer payment behavior** - Adjust predictions based on how customers actually pay

## Features

### 1. Cash Flow Forecasting
Predict cash flow for any number of days (typically 30-90):
```typescript
const forecast = await cashFlowPredictor.predictCashFlow(organizationId, 30);

// Returns comprehensive forecast with:
// - Current and projected balance
// - Expected inflows (invoices, recurring income, predictions)
// - Expected outflows (bills, recurring expenses, predictions)
// - Daily projections
// - Lowest cash point
// - Alerts and warnings
// - Confidence score
```

### 2. Daily Projections
Get day-by-day breakdown:
```typescript
const dailyProjections = await cashFlowPredictor.getDailyProjections(organizationId, 30);

// Each day includes:
// - Opening and closing balance
// - Inflows and outflows
// - List of specific items (invoices, bills, recurring)
// - Weekend/payday indicators
```

### 3. Lowest Cash Point
Identify when cash will be lowest (potential danger point):
```typescript
const lowestPoint = await cashFlowPredictor.getLowestCashPoint(organizationId, 30);

// Returns:
// - Date of lowest point
// - Projected balance at that point
// - Days from now
// - Whether it's critical (below threshold)
// - Risk factors contributing to low point
```

### 4. Runway Analysis
Calculate how long until cash runs out:
```typescript
const runway = await cashFlowPredictor.calculateRunway(organizationId);

// Returns:
// - Current balance
// - Monthly burn rate
// - Average monthly income
// - Net monthly change
// - Runway in months
// - Date when cash hits zero (if applicable)
// - Status: healthy / caution / critical
// - Recommendations
```

### 5. Scenario Analysis (What-If)
Test different scenarios:
```typescript
const scenario = await cashFlowPredictor.getScenarioAnalysis(organizationId, {
  name: 'New Large Client',
  adjustments: {
    additionalIncome: 50000,
    additionalExpense: 10000,
    delayedPayments: ['invoice-123'], // Not yet implemented
    removedRecurring: ['Netflix'], // Not yet implemented
  },
});

// Compare scenario to base forecast
```

## How It Works

### Payment Probability
The service doesn't just assume invoices will be paid on time. It calculates probability based on:

1. **Customer Payment Behavior**
   - Analyzes historical paid invoices
   - Calculates average days to payment per customer
   - Determines on-time payment rate
   - Adjusts expected payment date accordingly

2. **Overdue Decay**
   - For overdue invoices, probability decreases over time
   - 5% decrease per week overdue
   - Minimum 30% probability (never goes to zero)

3. **Confidence Levels**
   - On-time customers: 90% probability
   - Late payers: 70% probability with typical delay added
   - Overdue invoices: Reduced by decay rate

### Recurring Detection
Automatically detects recurring payments by:

1. **Pattern Analysis**
   - Groups transactions by vendor
   - Calculates intervals between payments
   - Identifies consistent patterns (low standard deviation)

2. **Frequency Classification**
   - Daily (1 day)
   - Weekly (7 days)
   - Biweekly (14 days)
   - Monthly (30 days)
   - Quarterly (90 days)
   - Yearly (365 days)

3. **Next Payment Prediction**
   - Calculates next expected date
   - Includes if within forecast period
   - Provides confidence score

### Historical Patterns
For days without specific bills/invoices:

1. **Day-of-Week Analysis**
   - Groups past transactions by day of week
   - Calculates average inflows/outflows
   - Applies conservative weight (30%) to predictions

2. **Transaction Count**
   - More historical data = higher confidence
   - Used to calculate overall forecast confidence

## Alert Types

### Low Balance Warning
```typescript
{
  type: 'low_balance',
  severity: 'warning', // or 'critical'
  message: 'Balance projected to drop to €8,200 on Jan 15',
  actionRequired: 'Follow up on outstanding invoices'
}
```

Triggered when:
- **Warning**: Balance < €5,000
- **Critical**: Balance < €1,000

### Large Outflow
```typescript
{
  type: 'large_outflow',
  severity: 'warning',
  message: 'Large outflow of €15,000 expected on Jan 10',
  actionRequired: 'Ensure sufficient funds are available'
}
```

Triggered when: Single day outflow > 30% of opening balance

### Missed Income
```typescript
{
  type: 'missed_income',
  severity: 'info',
  message: '15 days with below-average income expected',
  actionRequired: 'Consider accelerating invoicing'
}
```

Triggered when: More than 50% of days have below-average inflows

### Runway Warning
```typescript
{
  type: 'runway_warning',
  severity: 'critical',
  message: 'Runway critically low: 1.2 months remaining',
  actionRequired: 'Urgent: Secure additional funding'
}
```

Triggered when:
- **Warning**: Runway < 3 months
- **Critical**: Runway < 1 month

## Configuration

### Thresholds
```typescript
const CASH_FLOW_THRESHOLDS = {
  lowBalanceWarning: 5000,      // EUR
  lowBalanceCritical: 1000,     // EUR
  largeOutflowThreshold: 0.3,   // 30% of balance
  runwayWarningMonths: 3,
  runwayCriticalMonths: 1,
  minBalanceForHealthy: 10000,  // EUR
};
```

### Payment Probability
```typescript
const PAYMENT_PROBABILITY = {
  onTimeCustomer: 0.9,      // 90% probability by due date
  lateCustomer: 0.7,        // 70% probability with delay
  overdueDecayRate: 0.05,   // 5% decrease per week overdue
  minProbability: 0.3,      // Minimum 30% for very overdue
};
```

## Usage Examples

### Basic Forecast
```typescript
import { CashFlowPredictorService } from '@/modules/ai/bank-intelligence';

@Injectable()
export class DashboardService {
  constructor(
    private readonly cashFlowPredictor: CashFlowPredictorService
  ) {}

  async getDashboardData(orgId: string) {
    // Get 30-day forecast
    const forecast = await this.cashFlowPredictor.predictCashFlow(orgId, 30);

    // Get runway
    const runway = await this.cashFlowPredictor.calculateRunway(orgId);

    return {
      currentBalance: forecast.currentBalance,
      projectedBalance: forecast.projectedBalance,
      netChange: forecast.summary.netChange,
      lowestPoint: forecast.lowestPoint,
      runway: runway.runwayMonths,
      alerts: forecast.alerts.filter(a => a.severity !== 'info'),
    };
  }
}
```

### Weekly Email Summary
```typescript
async function sendWeeklyCashFlowSummary(orgId: string) {
  const forecast = await cashFlowPredictor.predictCashFlow(orgId, 7);
  const runway = await cashFlowPredictor.calculateRunway(orgId);

  const email = {
    subject: `Cash Flow Summary - Week of ${format(new Date(), 'MMM dd')}`,
    body: `
      Current Balance: €${forecast.currentBalance.toFixed(2)}
      7-Day Projection: €${forecast.projectedBalance.toFixed(2)}
      Net Change: €${forecast.summary.netChange.toFixed(2)}

      Runway: ${runway.runwayMonths} months (${runway.status})

      Alerts:
      ${forecast.alerts.map(a => `- ${a.message}`).join('\n')}

      Action Items:
      ${runway.recommendations.join('\n')}
    `,
  };

  await emailService.send(email);
}
```

### Proactive Warning System
```typescript
async function checkCashFlowHealth(orgId: string) {
  const lowestPoint = await cashFlowPredictor.getLowestCashPoint(orgId, 30);

  if (lowestPoint.isCritical) {
    await notificationService.send({
      type: 'critical',
      title: 'Cash Flow Alert',
      message: `Balance will drop to €${lowestPoint.projectedBalance} in ${lowestPoint.daysFromNow} days`,
      actions: [
        { label: 'View Forecast', link: '/cash-flow' },
        { label: 'Review Invoices', link: '/invoices?status=overdue' },
      ],
    });
  }
}
```

### Scenario Planning
```typescript
async function planForNewHire(orgId: string, annualSalary: number) {
  const monthlyCost = annualSalary / 12;

  const scenario = await cashFlowPredictor.getScenarioAnalysis(orgId, {
    name: 'New Hire Impact',
    adjustments: {
      additionalExpense: monthlyCost * 3, // 3 months forecast
    },
  });

  const baseRunway = await cashFlowPredictor.calculateRunway(orgId);

  console.log('Hiring Impact:');
  console.log(`Current Runway: ${baseRunway.runwayMonths} months`);
  console.log(`New Lowest Point: €${scenario.lowestPoint.projectedBalance}`);
  console.log(`New Alerts: ${scenario.alerts.length}`);

  return {
    isAffordable: scenario.lowestPoint.projectedBalance > CASH_FLOW_THRESHOLDS.lowBalanceWarning,
    recommendation: scenario.lowestPoint.projectedBalance > 10000
      ? 'Safe to hire'
      : 'Wait or secure additional funding first',
  };
}
```

## Integration Points

### Database Models Used
- `BankAccount` - Current balances
- `BankTransaction` - Historical patterns, recurring detection
- `Invoice` - Expected income, customer behavior analysis
- `Bill` - Expected expenses

### Dependencies
- **PrismaService** - Database access
- **date-fns** - Date manipulation

### Export
The service is exported from the `BankIntelligenceModule` and can be injected anywhere:

```typescript
import { CashFlowPredictorService } from '@/modules/ai/bank-intelligence';

@Injectable()
export class YourService {
  constructor(
    private readonly cashFlowPredictor: CashFlowPredictorService
  ) {}
}
```

## Performance Considerations

### Caching
Consider caching forecasts for:
- **Same organization + same day**: Cache for 1 hour
- **Historical patterns**: Cache for 24 hours
- **Customer payment behavior**: Cache for 1 week

Invalidate cache when:
- New invoice created/paid
- New bill created/paid
- New bank transaction synced

### Optimization
For large organizations with many transactions:
- Limit historical analysis to last 6 months
- Consider async processing for runway analysis
- Use database indexes on:
  - `BankTransaction.date`
  - `BankTransaction.bankAccountId`
  - `Invoice.status` + `Invoice.orgId`
  - `Bill.status` + `Bill.organisationId`

## Testing

Run the example:
```bash
npx ts-node apps/api/src/modules/ai/bank-intelligence/cash-flow-predictor.example.ts
```

## Future Enhancements

### Potential Additions
1. **Machine Learning**
   - Train model on historical accuracy
   - Improve predictions over time
   - Seasonal adjustments

2. **Advanced Scenarios**
   - Implement delayed payment scenarios
   - Remove/add recurring payments
   - Multi-scenario comparison

3. **Cash Flow Goals**
   - Set minimum balance targets
   - Alert when off track
   - Suggest actions to meet goals

4. **Industry Benchmarks**
   - Compare to similar businesses
   - Industry-specific patterns
   - Best practice recommendations

5. **Integration with Planning**
   - Link to budgets
   - Track variance
   - Forecast vs. actual analysis

## Related Services

- **RecurringDetectorService** - Could be extracted and used here for better recurring detection
- **InvoiceMatcherService** - Payment behavior data
- **BillMatcherService** - Expense pattern data
- **TransactionClassifierService** - Better categorization for predictions

## Support

For questions or issues, contact the development team or refer to:
- `cash-flow-predictor.example.ts` - Usage examples
- `types/cash-flow.types.ts` - Type definitions
- `cash-flow-predictor.service.ts` - Implementation
