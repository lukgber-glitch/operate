/**
 * Cash Flow Alerts Example
 * Demonstrates the proactive cash flow alert system
 */

import { ProactiveScheduler } from './proactive.scheduler';
import { PrismaService } from '../../database/prisma.service';
import { ProactiveSuggestionsService } from './proactive-suggestions.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { TaxCalendarService } from '../../tax/calendar/tax-calendar.service';
import { VatService } from '../../tax/vat/vat.service';
import { CashFlowPredictorService } from '../../ai/bank-intelligence/cash-flow-predictor.service';

/**
 * Example: Generate Cash Flow Alerts
 *
 * This example demonstrates how the ProactiveScheduler generates intelligent
 * cash flow alerts based on the organization's financial data.
 *
 * Alert Scenarios:
 *
 * 1. Critical Runway (< 1 month)
 *    - Priority: CRITICAL
 *    - Action: Immediate cash injection needed
 *    - Notification: Push/Email sent immediately
 *
 * 2. Warning Runway (< 3 months)
 *    - Priority: HIGH
 *    - Action: Review receivables, reduce expenses
 *    - Notification: Email notification
 *
 * 3. Low Balance Point (within 30 days)
 *    - Priority: CRITICAL/HIGH (based on timing)
 *    - Action: View forecast, prepare for low point
 *    - Notification: Push if < 7 days
 *
 * 4. Large Upcoming Expense (> 20% of balance)
 *    - Priority: MEDIUM
 *    - Action: View bill details
 *    - Notification: None (suggestion only)
 *
 * 5. Overdue Receivables (> 50% of burn rate)
 *    - Priority: HIGH
 *    - Action: Send reminders, accelerate collection
 *    - Notification: None (suggestion only)
 */

async function exampleCashFlowAlerts() {
  // Mock services (in production, these are injected by NestJS)
  const prisma = new PrismaService();
  const proactiveSuggestionsService = null as any; // Mock
  const notificationsService = null as any; // Mock
  const taxCalendarService = null as any; // Mock
  const vatService = null as any; // Mock
  const cashFlowPredictor = new CashFlowPredictorService(prisma);

  const scheduler = new ProactiveScheduler(
    prisma,
    proactiveSuggestionsService,
    notificationsService,
    taxCalendarService,
    vatService,
    cashFlowPredictor,
  );

  const orgId = 'example-org-id';

  console.log('\n=== Cash Flow Alert Generation Example ===\n');

  // Generate alerts (called automatically by scheduler at 8:00 AM daily)
  // const alerts = await scheduler['generateCashFlowAlerts'](orgId);

  console.log(`
Example Cash Flow Alerts:

1. CRITICAL: Runway unter 1 Monat!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Titel: Kritische Liquiditätslage
   Beschreibung: Runway unter 1 Monat! Aktueller Kontostand: €5.234.
                 Sofortige Maßnahmen erforderlich.
   Aktion: Cash Flow analysieren → /dashboard/cash-flow
   Priority: CRITICAL
   Dismissible: false
   Notification: Push/Email sent to all admins

   Data:
   - Current Balance: €5,234
   - Runway Months: 0.8
   - Burn Rate: €6,500/month
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. HIGH: Runway bei 2.3 Monaten
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Titel: Liquiditätswarnung
   Beschreibung: Runway bei 2.3 Monaten. Empfehlung: Einnahmen
                 beschleunigen oder Ausgaben reduzieren.
   Aktion: Überfällige Rechnungen → /invoices?status=overdue
   Priority: HIGH
   Dismissible: true
   Notification: None

   Data:
   - Runway Months: 2.3
   - Burn Rate: €8,200/month
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. CRITICAL: Niedriger Kontostand in 5 Tagen
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Titel: Niedriger Kontostand in 5 Tagen
   Beschreibung: Am 15.12. wird Kontostand bei €892 sein.
   Aktion: Prognose anzeigen → /dashboard/cash-flow?view=forecast
   Priority: CRITICAL
   Dismissible: false
   Notification: Push sent to all admins

   Data:
   - Lowest Date: 2024-12-15
   - Lowest Balance: €892
   - Risk Factors:
     * Large payment(s) due
     * Bill #12345 - Deutsche Telekom: €2,500
     * Bill #12346 - Office Rent: €3,200
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. MEDIUM: Große Zahlung voraus
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Titel: Große Zahlung: Bill #12347 - AWS Cloud Services
   Beschreibung: €4.567 fällig am 18.12.
   Aktion: Details anzeigen → /bills/bill-id-12347
   Priority: MEDIUM
   Dismissible: true
   Notification: None
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. HIGH: Überfällige Forderungen belasten Cash Flow
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Titel: Überfällige Forderungen belasten Cash Flow
   Beschreibung: €12.345 überfällig. Eintreiben würde Runway um
                 1.5 Monate verlängern.
   Aktion: Mahnungen senden → /invoices?status=overdue
   Priority: HIGH
   Dismissible: true
   Notification: None
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== Alert Thresholds ===

Cash Flow Thresholds (from cash-flow.types.ts):
- Runway Critical: < 1 month
- Runway Warning: < 3 months
- Runway Caution: < 6 months
- Large Expense: > 20% of current balance
- Low Balance Critical: < €1,000
- Low Balance Warning: < €5,000

=== Notification Escalation ===

Critical Alerts (runway < 1 month OR low balance in < 7 days):
→ Push notification sent to all org admins
→ Stored as HIGH priority suggestion
→ Dismissible: false (requires action)

High Priority Alerts:
→ Stored as HIGH priority suggestion
→ Dismissible: true
→ No automatic push notification

Medium/Low Priority:
→ Stored as MEDIUM/LOW priority suggestion
→ Dismissible: true
→ Visible in chat suggestions panel

=== Daily Scheduler ===

The ProactiveScheduler runs daily at 8:00 AM Europe/Berlin:
1. Fetches all active organizations
2. Generates cash flow alerts for each org
3. Stores non-duplicate suggestions in database
4. Sends push notifications for critical alerts
5. Updates notification count for users

=== Integration Points ===

Cash Flow Predictor Service:
- predictCashFlow(orgId, 30) → 30-day forecast
- calculateRunway(orgId) → runway analysis
- Uses historical transactions
- Uses pending invoices (with payment probability)
- Uses pending bills
- Uses recurring payment detection

Notification Service:
- createNotification() → stores notification
- Type: 'CASH_FLOW_ALERT'
- Priority: 5 (critical) or 4 (high)
- Data: { url: '/dashboard/cash-flow' }

Suggestion Storage:
- Type: SuggestionType.CASH_FLOW
- Deduplication: same title within 24 hours
- Status: PENDING
- Action params: { url }

  `);
}

/**
 * Example Alert Conditions
 */
export const EXAMPLE_SCENARIOS = {
  criticalRunway: {
    currentBalance: 5234,
    runwayMonths: 0.8,
    monthlyBurnRate: 6500,
    expectedAlert: {
      priority: 'critical',
      title: 'Kritische Liquiditätslage',
      notification: true,
    },
  },

  warningRunway: {
    currentBalance: 18860,
    runwayMonths: 2.3,
    monthlyBurnRate: 8200,
    expectedAlert: {
      priority: 'high',
      title: 'Liquiditätswarnung',
      notification: false,
    },
  },

  lowBalancePoint: {
    currentBalance: 12000,
    lowestPoint: {
      date: new Date('2024-12-15'),
      balance: 892,
      daysFromNow: 5,
    },
    expectedAlert: {
      priority: 'critical',
      title: 'Niedriger Kontostand in 5 Tagen',
      notification: true,
    },
  },

  largeExpense: {
    currentBalance: 20000,
    upcomingExpense: {
      amount: 4567,
      description: 'Bill #12347 - AWS Cloud Services',
      dueDate: new Date('2024-12-18'),
    },
    expectedAlert: {
      priority: 'medium',
      title: 'Große Zahlung: Bill #12347 - AWS Cloud Services',
      notification: false,
    },
  },

  overdueReceivables: {
    totalOverdue: 12345,
    monthlyBurnRate: 8230,
    runwayExtension: 1.5, // months
    expectedAlert: {
      priority: 'high',
      title: 'Überfällige Forderungen belasten Cash Flow',
      notification: false,
    },
  },
};

// Run example if executed directly
if (require.main === module) {
  exampleCashFlowAlerts().catch(console.error);
}
