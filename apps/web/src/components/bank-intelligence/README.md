# Bank Intelligence Dashboard

A comprehensive, production-ready dashboard for displaying bank transaction intelligence, cash flow forecasts, tax tracking, and automated reconciliation.

## Features

- **Cash Flow Forecasting**: Visual 30-day projection with low balance warnings
- **Transaction Classification**: AI-powered automatic categorization with confidence scores
- **Invoice/Bill Matching**: Smart matching suggestions with one-click confirmation
- **Recurring Expense Detection**: Automatic identification of subscriptions and recurring payments
- **Tax Liability Tracking**: Real-time tax estimates with payment reminders
- **Smart Alerts**: Proactive notifications for low cash, payment dues, and tax deadlines

## Components

### Main Dashboard

```tsx
import { BankIntelligenceDashboard } from '@/components/bank-intelligence';

function Page() {
  return <BankIntelligenceDashboard />;
}
```

### Individual Widgets

You can also use individual components separately:

```tsx
import {
  CashFlowChart,
  RecurringExpensesList,
  TaxLiabilityCard,
  TransactionClassificationTable,
  InvoiceMatchingWidget,
  BillMatchingWidget,
  BankIntelligenceAlerts,
} from '@/components/bank-intelligence';

// Example: Use in custom layout
function CustomDashboard() {
  return (
    <div className="grid gap-6">
      <CashFlowChart />
      <div className="grid md:grid-cols-2 gap-6">
        <RecurringExpensesList />
        <TaxLiabilityCard />
      </div>
      <TransactionClassificationTable limit={20} />
    </div>
  );
}
```

## API Hooks

All data fetching is done via React Query hooks:

```tsx
import {
  useCashFlowForecast,
  useRecurringExpenses,
  useTaxLiability,
  useRecentTransactions,
  useUnmatchedPayments,
  useBankAlerts,
  useBankIntelligenceSummary,
  useConfirmMatch,
  useReclassifyTransaction,
  useDismissAlert,
} from '@/components/bank-intelligence';

function CustomComponent() {
  const { data: cashFlow, isLoading } = useCashFlowForecast(30);
  const confirmMatch = useConfirmMatch();

  const handleConfirm = (transactionId: string, invoiceId: string) => {
    confirmMatch.mutate({ transactionId, invoiceId });
  };

  return <div>{/* ... */}</div>;
}
```

## Backend API Endpoints Required

The dashboard expects the following API endpoints to be available:

### GET Endpoints

- `GET /bank-intelligence/summary` - Dashboard summary statistics
- `GET /bank-intelligence/cash-flow?days=30` - Cash flow forecast data
- `GET /bank-intelligence/recurring` - Recurring expenses list
- `GET /bank-intelligence/tax-liability?year=2025` - Tax liability summary
- `GET /bank-intelligence/transactions?limit=20` - Recent classified transactions
- `GET /bank-intelligence/unmatched` - Unmatched incoming/outgoing payments
- `GET /bank-intelligence/alerts` - Active alerts and notifications

### POST/PATCH/DELETE Endpoints

- `POST /bank-intelligence/confirm-match` - Confirm a transaction match
  - Body: `{ transactionId, invoiceId?, billId? }`
- `PATCH /bank-intelligence/transactions/:id/classify` - Reclassify a transaction
  - Body: `{ category, taxCategory? }`
- `DELETE /bank-intelligence/alerts/:id` - Dismiss an alert

## Type Definitions

All TypeScript types are exported from `types.ts`:

```tsx
import type {
  CashFlowDataPoint,
  RecurringExpense,
  TaxSummary,
  ClassifiedTransaction,
  UnmatchedPayment,
  SuggestedMatch,
  BankAlert,
  BankIntelligenceSummary,
} from '@/components/bank-intelligence';
```

## Styling

The components use:
- **Tailwind CSS** for styling
- **shadcn/ui** components (Card, Button, Badge, etc.)
- **Recharts** for data visualization
- **Lucide React** for icons
- **date-fns** for date formatting

All components support dark mode automatically via Tailwind's dark mode classes.

## Responsive Design

All components are fully responsive:
- Mobile-first design
- Grid layouts adapt to screen size
- Tables transform to cards on mobile
- Touch-friendly interactions

## Error Handling

All components include:
- Loading skeletons during data fetch
- Error states with user-friendly messages
- Retry mechanisms via React Query
- Toast notifications for mutations

## Performance

- Data caching via React Query
- Configurable stale times
- Automatic background refetching
- Optimistic UI updates for mutations

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Screen reader friendly

## Integration Example

```tsx
// app/bank-intelligence/page.tsx
import { BankIntelligenceDashboard } from '@/components/bank-intelligence';

export default function BankIntelligencePage() {
  return (
    <div className="container mx-auto py-8">
      <BankIntelligenceDashboard />
    </div>
  );
}
```

## Customization

All components accept a `className` prop for custom styling:

```tsx
<BankIntelligenceDashboard className="custom-class" />
<CashFlowChart className="my-custom-chart" />
<RecurringExpensesList className="shadow-lg" />
```

## Dependencies

Required packages (already in package.json):
- `@tanstack/react-query`: ^5.17.19
- `recharts`: ^3.5.1
- `date-fns`: ^4.1.0
- `lucide-react`: ^0.309.0
- `@radix-ui/*`: Various UI primitives

## Notes

- All currency formatting defaults to EUR but respects the currency from API data
- Dates are formatted using the user's locale
- Components automatically refetch data at configured intervals
- Mutations invalidate relevant queries for instant UI updates
