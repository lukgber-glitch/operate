# Subscription Analytics UI

Admin dashboard for monitoring subscription metrics, MRR/ARR tracking, and churn analytics.

## Features

### Dashboard Page (`/admin/subscriptions`)
- **KPI Cards**: Total MRR, ARR, active subscriptions, trial conversions, churn rate
- **MRR Movement Chart**: Line chart showing MRR trends over time with breakdown (new, expansion, churned)
- **Revenue by Tier**: Pie chart showing revenue distribution across subscription tiers
- **Churn Indicator**: Detailed churn metrics with visual indicators
- **Subscription Table**: Filterable, sortable list of all subscriptions
- **Date Range Selector**: 7d, 30d, 90d, 1y, all time
- **Export to CSV**: Download subscription data

### Detail Page (`/admin/subscriptions/[id]`)
- **Subscription Info**: Customer details, tier, status, billing info
- **Usage Metrics**: Users, storage, API calls with visual progress bars
- **Dunning Status**: Payment issues and retry information (when applicable)
- **Payment History**: Last 5 payment records with status
- **Actions**:
  - Extend trial period
  - Change subscription tier
  - Cancel subscription (immediate or at period end)

## Components

### Analytics Components (`/components/admin/subscriptions/`)

1. **MrrCard.tsx**
   - Displays KPI metrics with trend indicators
   - Supports currency, number, and percentage formats
   - Green/red trend indicators for growth/decline

2. **MrrChart.tsx**
   - Line chart using recharts
   - Shows total MRR, new MRR, expansion, and churn
   - Responsive with dark mode support

3. **RevenueByTierChart.tsx**
   - Donut chart showing revenue by tier
   - Color-coded by tier (starter, professional, enterprise, custom)
   - Includes stats summary below chart

4. **ChurnIndicator.tsx**
   - Churn rate with visual progress bar
   - Color-coded: green (<3%), yellow (3-5%), red (>5%)
   - Shows customer churn, revenue churn, churned MRR
   - Warning alert for high churn

5. **SubscriptionTable.tsx**
   - Filterable by status, tier, search term
   - Sortable by MRR or creation date
   - Status badges with color coding
   - Link to detail page

6. **SubscriptionDetailCard.tsx**
   - Complete subscription information
   - Usage metrics with progress bars
   - Payment history
   - Dunning status warnings
   - Action buttons with confirmation dialogs

## Hooks (`/hooks/use-subscription-analytics.ts`)

All hooks use React Query for data fetching and caching:

- `useSubscriptionStats()` - Dashboard KPIs
- `useMrrChart()` - MRR time series data
- `useRevenueByTier()` - Revenue breakdown
- `useSubscriptions()` - Paginated subscription list with filters
- `useSubscriptionDetail()` - Single subscription details
- `useSubscriptionChanges()` - Recent subscription changes
- `useChurnMetrics()` - Churn analytics
- `useCancelSubscription()` - Cancel mutation
- `useUpdateSubscriptionTier()` - Tier change mutation
- `useExtendTrial()` - Trial extension mutation
- `useExportSubscriptions()` - CSV export

## Types (`/types/subscription-analytics.ts`)

Comprehensive TypeScript types for:
- Subscription entities
- Stats and metrics
- Charts data
- Filters and pagination
- API responses

## API Endpoints

The UI expects these endpoints (to be implemented by FORGE):

```
GET  /api/v1/subscriptions/stats
GET  /api/v1/subscriptions/mrr-chart
GET  /api/v1/subscriptions/revenue-by-tier
GET  /api/v1/subscriptions/churn
GET  /api/v1/subscriptions
GET  /api/v1/subscriptions/:id
GET  /api/v1/subscriptions/changes
POST /api/v1/subscriptions/:id/cancel
PATCH /api/v1/subscriptions/:id/tier
POST /api/v1/subscriptions/:id/extend-trial
GET  /api/v1/subscriptions/export (returns CSV)
```

## Design Features

- **Responsive**: Mobile-first design with desktop optimizations
- **Dark Mode**: Full dark mode support using CSS variables
- **Color System**:
  - Green: positive trends, healthy metrics
  - Red: negative trends, warnings
  - Yellow: caution states
  - Blue: trial status
  - Purple/Orange: tier differentiation
- **Accessibility**: Proper ARIA labels, keyboard navigation
- **Loading States**: Skeleton loaders for all components
- **Error Handling**: User-friendly error messages with retry options

## Currency Formatting

Uses `Intl.NumberFormat` with German locale (de-DE) and EUR currency.
Can be easily adjusted per tenant settings.

## Next Steps

1. Backend API implementation (FORGE task)
2. WebSocket updates for real-time metrics
3. Advanced filters (date ranges, custom segments)
4. Cohort analysis
5. Revenue forecasting
6. Subscription lifecycle emails
