# Financial Dashboard

A comprehensive financial dashboard for the Operate business automation app, displaying key performance indicators, charts, and actionable items.

## Overview

The Financial Dashboard provides users with a real-time overview of their business finances, including:
- Cash balance and trends
- Accounts receivable and payable summaries
- Financial runway calculation
- Revenue trends (12-month chart)
- Expense breakdown by category
- Overdue invoices requiring attention
- Upcoming bills to pay
- Quick action shortcuts

## Components

### Main Dashboard Page
**Location:** `apps/web/src/app/(dashboard)/dashboard/page.tsx`

The main dashboard page that orchestrates all widget components in a responsive grid layout.

### Widget Components

#### 1. CashBalanceCard
Displays current cash balance with weekly change percentage.

**Features:**
- Real-time balance display
- Weekly trend indicator (up/down arrow)
- Percentage change from previous week
- Loading and error states

#### 2. ArApSummaryCard
Shows accounts receivable or payables summary.

**Props:**
- `type: 'receivables' | 'payables'`

**Features:**
- Total amount outstanding
- Count of overdue items
- Trend indicator
- Separate styling for AR (green) vs AP (red)

#### 3. RunwayCard
Calculates and displays business runway in months.

**Features:**
- Runway calculation (months of cash remaining)
- Status indicator:
  - Healthy (green): > 6 months
  - Warning (orange): 3-6 months
  - Critical (red): < 3 months

#### 4. RevenueChart
Area chart showing revenue trends over the last 12 months.

**Features:**
- Responsive Recharts area chart
- Gradient fill
- Tooltips with formatted currency
- Dark mode support
- Empty state for no data

#### 5. ExpenseBreakdown
Pie chart showing expenses by category.

**Features:**
- Interactive pie chart with percentages
- Color-coded categories
- Legend
- Tooltips with formatted amounts
- Empty state for no data

#### 6. UpcomingItems
List of overdue invoices or upcoming bills.

**Props:**
- `type: 'invoices' | 'bills'`
- `title: string`

**Features:**
- Top 5 items by default
- Formatted dates (relative time)
- Color-coded amounts (green for invoices, red for bills)
- Link to view all items
- Empty state

#### 7. QuickActions
Grid of common financial actions.

**Features:**
- 6 quick action buttons:
  - Create invoice
  - Record expense
  - View transactions
  - Generate report
  - Send payments
  - Export data
- Icon-based navigation
- Responsive 2-column grid

## Data Hooks

**Location:** `apps/web/src/hooks/useDashboard.ts`

All dashboard components use React Query hooks for data fetching with automatic caching and refetching.

### Available Hooks

```typescript
// Cash flow forecast with configurable days
useCashFlowForecast(days: number = 7)

// Revenue data for specified months
useRevenueData(months: number = 12)

// Expense categories breakdown
useExpenseCategories()

// AR/AP summary by type
useArApSummary(type: 'receivables' | 'payables')

// Financial runway calculation
useRunwayData()

// Overdue invoices list
useOverdueInvoices(limit: number = 5)

// Upcoming bills list
useUpcomingBills(limit: number = 5)
```

### Cache Strategy

Each hook has optimized stale times:
- Cash flow: 5 minutes
- Revenue/Expenses: 10 minutes
- AR/AP: 5 minutes
- Runway: 30 minutes
- Overdue/Upcoming: 2 minutes

## Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│  Dashboard                                                  │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ 💰 Kontostand │ 📥 Forderungen│ 📤 Verbindl. │ 📊 Runway    │
│   €45.230     │   €12.500    │   €8.200     │   3.6 Mo.    │
│   ↑ +5.2%     │   2 überfäll.│   3 fällig   │   Vorsicht   │
├──────────────────────────────┴──────────────────────────────┤
│  📈 Umsatz (12 Monate)        │  🥧 Ausgaben nach Kategorie │
│  [Area Chart]                 │  [Pie Chart]                │
├───────────────────┬───────────────────┬─────────────────────┤
│ Überfällige       │ Anstehende        │ Schnellaktionen     │
│ Rechnungen        │ Zahlungen         │ • Rechnung erstellen│
│ • Acme €2,500     │ • Miete €1,200    │ • Ausgabe erfassen  │
│ • BigCo €1,800    │ • AWS €299        │ • Bericht erstellen │
└───────────────────┴───────────────────┴─────────────────────┘
```

## Responsive Design

- **Mobile (< 768px):** Single column layout
- **Tablet (768px - 1024px):** 2-column grid for metrics, single column for charts
- **Desktop (> 1024px):** Full 4-column grid layout as shown above

## Styling

- Uses Tailwind CSS with shadcn/ui components
- Full dark mode support via CSS variables
- Consistent color scheme:
  - Green: Positive trends, receivables
  - Red: Negative trends, payables
  - Orange: Warnings
  - Blue/Purple: Neutral actions

## Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `recharts` - Chart components
- `date-fns` - Date formatting
- `lucide-react` - Icons
- `shadcn/ui` - UI components (Card, Button, Skeleton)

## API Requirements

See `DASHBOARD_API_REQUIREMENTS.md` for detailed API endpoint specifications required by the dashboard.

## Usage Example

```typescript
import DashboardPage from '@/app/(dashboard)/dashboard/page';

// The dashboard is automatically displayed at /dashboard route
// All data fetching happens automatically via hooks
// No props required
```

## Error Handling

All components gracefully handle:
- Loading states (Skeleton loaders)
- Error states (Empty state messages)
- Missing data (Shows "Keine Daten verfügbar")
- API failures (Defaults to empty/zero values)

This ensures the dashboard always renders, even with incomplete or unavailable data.

## Future Enhancements

Potential improvements for future sprints:
1. Customizable widgets (drag & drop, show/hide)
2. Date range selectors
3. Export dashboard to PDF
4. Real-time updates via WebSocket
5. Drill-down into individual metrics
6. Comparison with previous periods
7. Budget vs actual visualizations
8. Alerts and notifications integration

## Testing

Components can be tested independently:

```typescript
import { render, screen } from '@testing-library/react';
import { CashBalanceCard } from '@/components/dashboard/CashBalanceCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test('renders cash balance card', () => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <CashBalanceCard />
    </QueryClientProvider>
  );

  expect(screen.getByText('Kontostand')).toBeInTheDocument();
});
```

## Support

For questions or issues, contact the PRISM team or refer to the main project documentation.
