# Cash Flow Alerts - Proactive Suggestions

## Overview

The Cash Flow Alerts system provides intelligent, proactive warnings about an organization's financial health. It analyzes cash flow patterns, runway, pending transactions, and generates actionable suggestions in German.

## Implementation: S6-02

**Task**: Add Cash Flow Alerts to Proactive Suggestions
**Status**: ✅ Complete
**Files Modified**:
- `proactive.scheduler.ts` - Added cash flow alert generation
- `suggestion.types.ts` - Added CashFlowSuggestion interface
- `chatbot.module.ts` - Imported BankIntelligenceModule
- `cash-flow-alerts.example.ts` - Example implementation (NEW)

## Alert Scenarios

### 1. Critical Runway (< 1 month)
**When**: Runway drops below 1 month
**Priority**: CRITICAL
**Notification**: Push/Email to all admins
**Action**: View cash flow dashboard

```typescript
{
  title: 'Kritische Liquiditätslage',
  description: 'Runway unter 1 Monat! Aktueller Kontostand: €5.234. Sofortige Maßnahmen erforderlich.',
  priority: 'critical',
  dismissible: false,
  action: {
    type: 'VIEW_CASH_FLOW',
    url: '/dashboard/cash-flow',
    label: 'Cash Flow analysieren'
  }
}
```

### 2. Warning Runway (< 3 months)
**When**: Runway between 1-3 months
**Priority**: HIGH
**Notification**: None (suggestion only)
**Action**: View overdue receivables

```typescript
{
  title: 'Liquiditätswarnung',
  description: 'Runway bei 2.3 Monaten. Empfehlung: Einnahmen beschleunigen oder Ausgaben reduzieren.',
  priority: 'high',
  dismissible: true,
  action: {
    type: 'VIEW_RECEIVABLES',
    url: '/invoices?status=overdue',
    label: 'Überfällige Rechnungen'
  }
}
```

### 3. Low Balance Point (within 30 days)
**When**: Balance projected to drop critically low
**Priority**: CRITICAL (< 7 days) or HIGH (7-30 days)
**Notification**: Push if < 7 days
**Action**: View forecast

```typescript
{
  title: 'Niedriger Kontostand in 5 Tagen',
  description: 'Am 15.12. wird Kontostand bei €892 sein.',
  priority: daysUntil <= 7 ? 'critical' : 'high',
  dismissible: daysUntil > 7,
  action: {
    type: 'VIEW_FORECAST',
    url: '/dashboard/cash-flow?view=forecast',
    label: 'Prognose anzeigen'
  }
}
```

### 4. Large Upcoming Expense (> 20% of balance)
**When**: Bill exceeds 20% of current balance
**Priority**: MEDIUM
**Notification**: None
**Action**: View bill details

```typescript
{
  title: 'Große Zahlung: Bill #12347 - AWS',
  description: '€4.567 fällig am 18.12.',
  priority: 'medium',
  dismissible: true,
  action: {
    type: 'VIEW_BILL',
    url: '/bills/bill-id',
    label: 'Details anzeigen'
  }
}
```

### 5. Overdue Receivables (> 50% of burn rate)
**When**: Overdue invoices exceed 50% of monthly burn
**Priority**: HIGH
**Notification**: None
**Action**: Send reminders

```typescript
{
  title: 'Überfällige Forderungen belasten Cash Flow',
  description: '€12.345 überfällig. Eintreiben würde Runway um 1.5 Monate verlängern.',
  priority: 'high',
  dismissible: true,
  action: {
    type: 'SEND_REMINDERS',
    url: '/invoices?status=overdue',
    label: 'Mahnungen senden'
  }
}
```

## Configuration

### Thresholds

From `cash-flow.types.ts`:

```typescript
export const CASH_FLOW_THRESHOLDS = {
  lowBalanceWarning: 5000,       // EUR
  lowBalanceCritical: 1000,      // EUR
  largeOutflowThreshold: 0.3,    // 30% of balance
  runwayWarningMonths: 3,
  runwayCriticalMonths: 1,
  minBalanceForHealthy: 10000,   // EUR
};
```

### Alert Priorities

```typescript
const ALERT_PRIORITY = {
  runwayCritical: 'critical',     // < 1 month
  runwayWarning: 'high',          // < 3 months
  lowPointCritical: 'critical',   // < 7 days
  lowPointWarning: 'high',        // 7-30 days
  largeExpense: 'medium',         // > 20% balance
  overdueReceivables: 'high',     // > 50% burn rate
};
```

## Daily Scheduler

The `ProactiveScheduler` runs at **8:00 AM Europe/Berlin** daily:

```typescript
@Cron('0 8 * * *', { timeZone: 'Europe/Berlin' })
async generateDailySuggestions() {
  // 1. Get all active organizations
  // 2. For each organization:
  //    - Generate cash flow alerts
  //    - Generate tax reminders
  //    - Generate other suggestions
  // 3. Store suggestions (with deduplication)
  // 4. Send notifications for critical alerts
}
```

## Integration

### Cash Flow Predictor Service

```typescript
// Get 30-day forecast
const forecast = await this.cashFlowPredictor.predictCashFlow(orgId, 30);

// Calculate runway
const runway = await this.cashFlowPredictor.calculateRunway(orgId);

// Access data
forecast.currentBalance
forecast.lowestPoint.projectedBalance
forecast.lowestPoint.daysFromNow
forecast.outflows.breakdown
runway.runwayMonths
runway.monthlyBurnRate
```

### Notification Escalation

Critical alerts trigger push notifications:

```typescript
if (priority === 'critical') {
  await this.sendCashFlowNotification(orgId, {
    title: 'Kritische Liquiditätslage!',
    body: `Runway unter 1 Monat. Kontostand: €${balance}`,
    priority: 'high',
    url: '/dashboard/cash-flow'
  });
}
```

### Database Storage

Suggestions stored in `Suggestion` table:

```typescript
{
  orgId: string,
  type: SuggestionType.CASH_FLOW,
  priority: SuggestionPriority.HIGH | MEDIUM | LOW,
  title: string,
  description: string,
  actionLabel: string,
  actionType: string,
  actionParams: { url: string },
  data: {
    currentBalance?: number,
    runwayMonths?: number,
    burnRate?: number,
    lowestDate?: Date,
    lowestBalance?: number,
    riskFactors?: string[]
  },
  status: 'PENDING'
}
```

## German Message Templates

```typescript
const MESSAGES = {
  criticalRunway: 'Kritische Liquiditätslage! Runway unter {months} Monat(en).',
  warningRunway: 'Liquiditätswarnung: Runway bei {months} Monaten.',
  lowPoint: 'Niedriger Kontostand erwartet am {date}: €{amount}',
  largeExpense: 'Große Zahlung voraus: €{amount} für {vendor} am {date}',
  overdueReceivables: '€{amount} überfällige Forderungen belasten Cash Flow',
};
```

## Testing

Run the example:

```bash
cd apps/api
npx ts-node src/modules/chatbot/suggestions/cash-flow-alerts.example.ts
```

Manual trigger via API:

```bash
POST /api/suggestions/trigger-daily
```

## Frontend Integration

The alerts appear in:
1. **Chat Suggestions Panel** - All priorities
2. **Dashboard Notifications** - High/Critical only
3. **Push Notifications** - Critical only

Action handlers:
- `VIEW_CASH_FLOW` → Navigate to `/dashboard/cash-flow`
- `VIEW_RECEIVABLES` → Navigate to `/invoices?status=overdue`
- `VIEW_FORECAST` → Navigate to `/dashboard/cash-flow?view=forecast`
- `VIEW_BILL` → Navigate to `/bills/{id}`
- `SEND_REMINDERS` → Trigger reminder workflow

## Performance

- **Caching**: Results cached for 5 minutes
- **Deduplication**: Same title within 24 hours skipped
- **Batch Processing**: 10 organizations at a time
- **Error Handling**: Individual org failures don't stop batch

## Dependencies

```typescript
// Required services
- CashFlowPredictorService (bank-intelligence)
- NotificationsService
- PrismaService

// Required modules
- BankIntelligenceModule
- NotificationsModule
- DatabaseModule
```

## Monitoring

Logs generated:
- `Generated {N} cash flow alerts for org {orgId}`
- `Cash flow alerts failed for {orgId}: {error}`
- `Created {N} new suggestions for org {orgId}`
- `Notification sent to user {userId}`

## Future Enhancements

1. **Machine Learning**: Predict payment patterns
2. **Scenario Analysis**: What-if scenarios for decisions
3. **Custom Thresholds**: Per-organization settings
4. **Historical Trends**: Compare with previous periods
5. **Automated Actions**: Auto-send reminders when runway critical
