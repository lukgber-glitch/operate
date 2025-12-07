# Recurring Transaction Detector Service

## Overview

The `RecurringDetectorService` analyzes bank transaction history to automatically detect recurring transactions, subscriptions, and regular payments. It uses pattern recognition algorithms to identify payment frequencies, predict upcoming payments, and provide insights into subscription spending.

## Features

- **Pattern Detection**: Identifies weekly, bi-weekly, monthly, quarterly, and yearly payment patterns
- **Vendor Grouping**: Uses fuzzy matching to group similar vendor names
- **Confidence Scoring**: Calculates confidence based on payment regularity
- **Prediction**: Forecasts upcoming payments based on historical patterns
- **Category Recognition**: Automatically categorizes known subscriptions (AWS, Slack, etc.)
- **Tax Integration**: Maps patterns to German EÜR tax categories
- **Insights**: Generates actionable insights about duplicate services and potential savings

## API Methods

### 1. `detectRecurringTransactions(organizationId, options?)`

Detects all recurring transactions for an organization.

**Parameters:**
- `organizationId`: string - Organization ID
- `options`: DetectionOptions (optional)
  - `minOccurrences`: number (default: 2) - Minimum pattern occurrences
  - `lookbackDays`: number (default: 365) - Days to analyze
  - `includeEnded`: boolean (default: false) - Include ended subscriptions
  - `minConfidence`: number (default: 60) - Minimum confidence threshold
  - `vendorName`: string (optional) - Filter by vendor
  - `activeOnly`: boolean (default: false) - Only active patterns

**Returns:** `Promise<RecurringPattern[]>`

**Example:**
```typescript
const patterns = await recurringDetector.detectRecurringTransactions('org_123', {
  minOccurrences: 3,
  lookbackDays: 365,
  minConfidence: 70,
  activeOnly: true,
});

console.log(`Found ${patterns.length} recurring patterns`);
patterns.forEach(p => {
  console.log(`${p.vendorName}: €${p.averageAmount/100}/month`);
});
```

### 2. `analyzeVendorPattern(organizationId, vendorName)`

Analyzes a specific vendor's payment pattern.

**Parameters:**
- `organizationId`: string
- `vendorName`: string - Vendor name to analyze

**Returns:** `Promise<RecurringPattern | null>`

**Example:**
```typescript
const aws = await recurringDetector.analyzeVendorPattern('org_123', 'AWS');

if (aws) {
  console.log(`AWS: ${aws.frequency}, €${aws.averageAmount/100}`);
  console.log(`Next payment: ${aws.nextExpected}`);
}
```

### 3. `predictNextPayments(organizationId, days)`

Predicts upcoming payments within specified timeframe.

**Parameters:**
- `organizationId`: string
- `days`: number (default: 30) - Days to predict ahead

**Returns:** `Promise<UpcomingPayment[]>`

**Example:**
```typescript
const upcoming = await recurringDetector.predictNextPayments('org_123', 7);

console.log('Payments due this week:');
upcoming.forEach(payment => {
  console.log(`${payment.vendorName} - €${payment.expectedAmount/100}`);
  console.log(`Due in ${payment.daysTillDue} days`);
});
```

### 4. `getRecurringSummary(organizationId)`

Generates comprehensive recurring expense summary.

**Parameters:**
- `organizationId`: string

**Returns:** `Promise<RecurringSummary>`

**Example:**
```typescript
const summary = await recurringDetector.getRecurringSummary('org_123');

console.log(`Monthly recurring: €${summary.totalMonthlyRecurring/100}`);
console.log(`Annual recurring: €${summary.totalYearlyRecurring/100}`);
console.log(`Active subscriptions: ${summary.subscriptionCount}`);

// Category breakdown
summary.categories.forEach(cat => {
  console.log(`${cat.category}: €${cat.monthlyTotal/100}/month`);
});

// Insights
summary.insights?.forEach(insight => {
  console.log(`[${insight.type}] ${insight.message}`);
});
```

## Data Types

### RecurringPattern

```typescript
{
  vendorName: string;
  normalizedVendorName: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  averageAmount: number; // in cents
  minAmount: number;
  maxAmount: number;
  currency: string;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  nextExpected: Date;
  confidence: number; // 0-100
  category?: string;
  taxCategory?: string;
  transactions: Array<{id, date, amount}>;
  isActive: boolean;
  status: 'confirmed' | 'predicted' | 'ended';
}
```

### UpcomingPayment

```typescript
{
  vendorName: string;
  expectedDate: Date;
  expectedAmount: number; // in cents
  confidence: number; // 0-100
  frequency: string;
  lastPaymentDate: Date;
  daysTillDue: number;
  amountRange?: { min: number; max: number };
}
```

### RecurringSummary

```typescript
{
  totalMonthlyRecurring: number;
  totalYearlyRecurring: number;
  subscriptionCount: number;
  categories: Array<{
    category: string;
    monthlyTotal: number;
    yearlyTotal: number;
    count: number;
    patterns: RecurringPattern[];
  }>;
  topRecurringExpenses: RecurringPattern[];
  upcomingWeek: UpcomingPayment[];
  upcomingMonth: UpcomingPayment[];
  potentialSavings?: Array<{
    vendor: string;
    currentMonthlyAmount: number;
    suggestion: string;
    potentialSavingsPerYear: number;
  }>;
  insights?: Array<{
    type: 'DUPLICATE_SERVICES' | 'UNUSED_SUBSCRIPTION' | 'PRICE_INCREASE' | 'IRREGULAR_PATTERN';
    message: string;
    affectedVendors: string[];
    potentialSavings?: number;
  }>;
}
```

## Pattern Detection Algorithm

### 1. Vendor Grouping
- Normalizes vendor names (removes legal entities, punctuation)
- Uses Levenshtein distance for fuzzy matching (85% similarity threshold)
- Groups variations like "AWS", "Amazon Web Services", "AMZN"

### 2. Interval Analysis
- Calculates gaps between consecutive transactions
- Detects patterns:
  - Weekly: 7 ±3 days
  - Bi-weekly: 14 ±4 days
  - Monthly: 28-31 ±5 days
  - Quarterly: 85-95 days
  - Yearly: 355-375 days

### 3. Confidence Calculation
- Based on regularity of intervals (lower standard deviation = higher confidence)
- Formula: `confidence = 100 - (stdDev / avgGap * 100)`
- Penalizes irregular patterns

### 4. Active Status
- Pattern is "active" if last payment within 2x expected interval
- Example: Monthly subscription is active if paid within last 60 days

## Known Subscription Patterns

The service recognizes common business subscriptions:

**Cloud Services:**
- AWS, Google Cloud, Azure, DigitalOcean, Heroku

**Development Tools:**
- GitHub, GitLab, Bitbucket, JetBrains

**Communication:**
- Slack, Zoom, Microsoft Teams

**Design:**
- Adobe, Figma, Canva

**Productivity:**
- Office 365, Google Workspace, Dropbox

**Payment Processing:**
- Stripe, PayPal

These are automatically categorized and mapped to German EÜR tax categories.

## Integration Examples

### Dashboard Widget

```typescript
const upcomingWeek = await recurringDetector.predictNextPayments(orgId, 7);

const widget = {
  title: 'Bills Due This Week',
  total: upcomingWeek.reduce((sum, p) => sum + p.expectedAmount, 0),
  items: upcomingWeek.map(p => ({
    vendor: p.vendorName,
    amount: p.expectedAmount,
    dueIn: p.daysTillDue,
  })),
};
```

### Chat Proactive Message

```typescript
const summary = await recurringDetector.getRecurringSummary(orgId);

const message = {
  type: 'subscription_summary',
  text: `You have ${summary.subscriptionCount} active subscriptions costing €${summary.totalMonthlyRecurring/100}/month.`,
  actions: [
    { label: 'View Details', action: 'show_subscriptions' },
    { label: 'Find Savings', action: 'analyze_savings' },
  ],
};
```

### Budget Planning

```typescript
const summary = await recurringDetector.getRecurringSummary(orgId);

const budget = summary.categories.map(cat => ({
  category: cat.category,
  monthlyBudget: cat.monthlyTotal,
  services: cat.patterns.map(p => p.vendorName),
}));
```

## Performance Considerations

- **Lookback Period**: Default 365 days balances accuracy vs. performance
- **Batch Processing**: Analyzes multiple vendors in parallel
- **Caching**: Consider caching results (patterns change infrequently)
- **Database Indexes**: Ensure indexes on `bankAccountId`, `date`, `type`

## Testing

Run tests with:
```bash
npm test recurring-detector.spec.ts
```

See `recurring-detector.spec.ts` for comprehensive test coverage.

## Example Output

```
AWS Cloud Services
- Frequency: monthly
- Average: €299.00
- Range: €285.00 - €312.00
- Occurrences: 12
- Confidence: 95%
- Next Payment: 2025-01-01
- Status: confirmed
- Category: Cloud Services
- Tax Category: SONSTIGE_KOSTEN
```

## Future Enhancements

- [ ] Machine learning for better pattern recognition
- [ ] Price change detection
- [ ] Subscription ROI analysis
- [ ] Integration with vendor APIs for exact dates
- [ ] Anomaly detection (unusual charges)
- [ ] Multi-currency support improvements
- [ ] Auto-cancellation suggestions for unused services
