# Cash Flow Predictor - Implementation Summary

## Task: S4-06 - Cash Flow Predictor

### Status: ✅ COMPLETED

## Files Created

### 1. Types Definition
**File:** `types/cash-flow.types.ts`

Comprehensive TypeScript types for cash flow prediction:
- `CashFlowForecast` - Main forecast result with complete breakdown
- `CashFlowItem` - Individual income/expense items
- `DailyProjection` - Day-by-day projections
- `LowestCashPoint` - Critical low balance point
- `RunwayAnalysis` - How long until cash runs out
- `CashFlowAlert` - Warnings and critical alerts
- `Scenario` - What-if scenario analysis
- `RecurringPayment` - Auto-detected recurring payments
- `HistoricalPattern` - Day-of-week patterns
- `CustomerPaymentBehavior` - Payment probability tracking

**Configuration Constants:**
- `CASH_FLOW_THRESHOLDS` - Alert thresholds (low balance, large outflow, runway)
- `PAYMENT_PROBABILITY` - Invoice payment probability factors

### 2. Main Service
**File:** `cash-flow-predictor.service.ts` (1,000+ lines)

Production-ready NestJS service with 5 main public methods:

#### `predictCashFlow(organizationId, days)`
Full cash flow forecast including:
- Current and projected balance
- Expected inflows (invoices, recurring, predicted)
- Expected outflows (bills, recurring, predicted)
- Daily projections
- Lowest cash point
- Alerts and warnings
- Confidence score

#### `getDailyProjections(organizationId, days)`
Day-by-day breakdown with:
- Opening/closing balance
- Inflows/outflows
- Specific items due each day
- Weekend/payday indicators

#### `getLowestCashPoint(organizationId, days)`
Identifies danger point:
- Date of lowest balance
- Projected balance at that point
- Days from now
- Critical status
- Risk factors

#### `calculateRunway(organizationId)`
Financial runway analysis:
- Monthly burn rate
- Average monthly income
- Net monthly change
- Months until cash runs out
- Status: healthy/caution/critical
- Recommendations

#### `getScenarioAnalysis(organizationId, scenario)`
What-if scenario testing:
- Test additional income/expenses
- Compare to base forecast
- See impact on alerts and runway

### 3. Documentation
**File:** `CASH_FLOW_PREDICTOR_README.md`

Complete documentation including:
- Feature overview
- How it works (algorithm details)
- Payment probability system
- Recurring payment detection
- Alert types and thresholds
- Usage examples
- Integration examples
- Performance considerations
- Future enhancements

### 4. Examples
**File:** `cash-flow-predictor.example.ts`

Real-world integration examples:
- Dashboard summary endpoint
- Weekly email summary preparation
- New hire affordability check
- Proactive alert checking for background jobs
- Example output formats

## Key Features Implemented

### 1. Intelligent Payment Probability
Unlike simple forecasts, this service calculates realistic payment probabilities:

**Customer Behavior Analysis:**
- Analyzes historical paid invoices per customer
- Calculates average days to payment
- Determines on-time payment rate (within 7 days)
- Adjusts expected payment date based on typical delay

**Probability Factors:**
- On-time customers: 90% probability by due date
- Late payers: 70% probability with typical delay added
- Overdue invoices: 5% decrease per week overdue
- Minimum 30% probability (never assumes zero)

### 2. Recurring Payment Detection
Automatically detects subscription and recurring payments:

**Pattern Analysis:**
- Groups transactions by vendor
- Calculates intervals between payments
- Identifies consistent patterns (low standard deviation < 20%)
- Classifies frequency (daily/weekly/biweekly/monthly/quarterly/yearly)

**Prediction:**
- Calculates next expected date
- Only includes payments within forecast period
- Provides confidence score based on pattern consistency

### 3. Historical Pattern Learning
For days without specific bills/invoices:

**Day-of-Week Analysis:**
- Groups transactions by day of week (Monday, Tuesday, etc.)
- Calculates average inflows/outflows per day
- Applies conservative 30% weight to predictions
- Higher confidence with more historical data

### 4. Multi-Source Aggregation
Combines data from multiple sources:
- Pending invoices (with payment probability)
- Pending bills (scheduled expenses)
- Recurring payments (auto-detected)
- Historical patterns (day-of-week averages)

### 5. Comprehensive Alert System

**Low Balance Alerts:**
- Warning: Balance < €5,000
- Critical: Balance < €1,000

**Large Outflow Alerts:**
- Triggered when single day outflow > 30% of balance

**Missed Income Alerts:**
- More than 50% of days with below-average inflows

**Runway Warnings:**
- Warning: < 3 months runway
- Critical: < 1 month runway

### 6. Scenario Planning
Test what-if scenarios:
- Additional income (new client)
- Additional expenses (equipment purchase, new hire)
- See impact on projections, alerts, and runway
- Compare to base forecast

## Integration

### Module Registration
Service added to `BankIntelligenceModule`:
```typescript
@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [
    // ... other services
    CashFlowPredictorService,
  ],
  exports: [
    // ... other services
    CashFlowPredictorService,
  ],
})
```

### Export
Service exported from `index.ts`:
```typescript
export * from './types/cash-flow.types';
export * from './cash-flow-predictor.service';
```

### Usage
Inject anywhere in the application:
```typescript
import { CashFlowPredictorService } from '@/modules/ai/bank-intelligence';

@Injectable()
export class YourService {
  constructor(
    private readonly cashFlowPredictor: CashFlowPredictorService
  ) {}
}
```

## Algorithm Overview

### Main Prediction Flow
1. Get current bank balance from all accounts
2. Get pending invoices with payment probability
3. Get pending bills (scheduled expenses)
4. Detect recurring payments from historical data
5. Analyze historical patterns (day-of-week)
6. Build daily projections combining all sources
7. Find lowest cash point
8. Generate alerts based on thresholds
9. Calculate confidence score

### Daily Projection Logic
For each day in forecast period:
1. Start with opening balance (previous day's closing)
2. Add invoices due on this day (weighted by probability)
3. Add bills due on this day (high confidence)
4. Add recurring payments due on this day
5. Add historical pattern prediction (if no specific items, 30% weight)
6. Calculate closing balance
7. Track all items for transparency

### Runway Calculation
1. Look at last 3 months of transactions
2. Calculate monthly income and expenses
3. Determine burn rate (monthly expenses)
4. Calculate net monthly change (income - expenses)
5. If negative: runway = balance / abs(net change)
6. If positive: infinite runway
7. Generate recommendations based on status

## Database Models Used

- `BankAccount` - Current balances, account info
- `BankTransaction` - Historical patterns, recurring detection
- `Invoice` - Expected income, payment behavior
- `Bill` - Expected expenses

## Dependencies

- **PrismaService** - Database access
- **date-fns** - Date manipulation and formatting
- **@nestjs/common** - NestJS decorators and utilities

## Performance Considerations

### Recommended Caching Strategy
```typescript
// Cache keys
forecast:{orgId}:{date}  // TTL: 1 hour
runway:{orgId}           // TTL: 24 hours
patterns:{orgId}         // TTL: 1 week

// Invalidate on:
- New invoice created/paid
- New bill created/paid
- New bank transaction synced
```

### Database Indexes Recommended
```sql
CREATE INDEX idx_bank_transaction_date ON BankTransaction(date);
CREATE INDEX idx_bank_transaction_account ON BankTransaction(bankAccountId);
CREATE INDEX idx_invoice_status_org ON Invoice(status, orgId);
CREATE INDEX idx_bill_status_org ON Bill(status, organisationId);
```

### Query Optimization
- Historical analysis limited to last 6 months (configurable)
- Recurring detection requires minimum 2 occurrences
- Pattern analysis groups efficiently by day of week

## Testing

### TypeScript Compilation
✅ All files compile without errors

### Example Outputs
See `cash-flow-predictor.example.ts` for:
- Dashboard summary format
- Weekly email summary format
- Scenario analysis examples
- Alert notification examples

## Real-World Use Cases

### 1. Dashboard Widget
Show current balance, projected balance, runway, and alerts

### 2. Weekly Email Summary
Automated email every Monday with upcoming week's forecast

### 3. Proactive Notifications
Background job checks for critical alerts and notifies users

### 4. Business Decision Support
"Can we afford to hire someone?" - Test scenarios before committing

### 5. Cash Flow Management
Identify upcoming tight periods early, take action in advance

### 6. Invoice Follow-up
See which overdue invoices are most critical for cash position

## Future Enhancement Opportunities

### Machine Learning Integration
- Train model on prediction accuracy
- Learn customer payment patterns better
- Seasonal adjustments for different industries

### Advanced Recurring Detection
- Handle irregular recurring patterns
- Detect subscription price changes
- Predict upcoming renewals

### Multi-Currency Support
- Convert all to base currency
- Track exchange rate impacts
- Forecast FX exposure

### Integration with Budgets
- Compare forecast to budget
- Track variance
- Alert on budget overage

### Tax Payment Predictions
- Predict quarterly tax payments
- Include VAT liabilities
- Factor in tax deadlines

## Production Readiness Checklist

✅ TypeScript types defined
✅ Error handling implemented
✅ Logging throughout service
✅ Null checks and validation
✅ Documentation complete
✅ Example code provided
✅ Module integration done
✅ Exports configured
✅ No compilation errors

## Next Steps for Frontend Integration

1. Create API endpoints (controller)
2. Add to dashboard (widget component)
3. Create cash flow page (detailed view)
4. Implement alert notifications
5. Add email summary background job
6. Create scenario testing UI

## Summary

The Cash Flow Predictor Service is a production-ready, intelligent forecasting system that goes beyond simple projections. It learns from customer behavior, detects recurring patterns, and provides actionable insights through alerts and recommendations. The service is fully typed, well-documented, and ready to integrate into the Operate application's full automation features.

**Lines of Code:** ~1,000+ (service) + 200+ (types) + 300+ (examples)
**Public Methods:** 5 main + 15+ private helper methods
**Alert Types:** 4 (low balance, large outflow, missed income, runway warning)
**Data Sources:** 4 (invoices, bills, recurring, historical)
**Status:** COMPLETE AND READY FOR USE ✅
