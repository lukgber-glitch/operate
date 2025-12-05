# Lazy Loading Components - Quick Reference

## Import Lazy Components

```tsx
import {
  // Dashboard
  CashFlowChartWidget,
  AIInsightsCard,
  DashboardCustomizer,

  // Charts (Heavy)
  CashFlowChart,
  MrrChart,
  RevenueByTierChart,

  // Modals
  AddClientDialog,
  EditClientDialog,
  ConnectBankModal,

  // Tables
  ClientDataTable,
  SubscriptionTable,

  // Reports
  ClientMetrics,
  FinancialOverview,
  TaxSummary,

  // Loading Skeletons
  LoadingSkeleton,
  ChartSkeleton,
  ModalSkeleton,
  DashboardSkeleton,
} from '@/components/lazy';
```

## Usage

### Basic Usage

```tsx
import { CashFlowChartWidget } from '@/components/lazy';

export function MyPage() {
  return <CashFlowChartWidget data={data} />;
}
```

### Custom Lazy Component

```tsx
import { createLazy } from '@/components/lazy';
import { ChartSkeleton } from '@/components/lazy';

const MyComponent = createLazy(
  () => import('./MyComponent'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Optional: disable SSR
  }
);
```

### Conditional Loading

```tsx
import { AddClientDialog } from '@/components/lazy';

export function ClientsPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Add Client</button>
      {/* Only loads when open is true */}
      {open && <AddClientDialog open={open} onOpenChange={setOpen} />}
    </>
  );
}
```

## Adding New Lazy Components

1. **Edit** `apps/web/src/components/lazy/index.ts`

```typescript
export const MyNewComponent = dynamic(
  () => import('@/components/path/MyNewComponent').then((mod) => mod.MyNewComponent),
  {
    loading: () => <LoadingSkeleton height={300} />,
    ssr: true, // Set to false for client-only
  }
);
```

2. **Use** in your pages

```tsx
import { MyNewComponent } from '@/components/lazy';
```

## When to Use

**Use lazy loading for:**
- Charts and visualizations (recharts)
- Modals and dialogs
- Admin/settings panels
- Report components
- Data tables
- Email editors
- Voice/video components
- Heavy third-party libraries

**Don't lazy load:**
- Critical above-the-fold components
- Navigation and headers
- Small utility components (<10KB)
- Core authentication UI

## Loading Skeletons

```tsx
import {
  LoadingSkeleton,
  ChartSkeleton,
  ModalSkeleton,
  DashboardSkeleton,
} from '@/components/lazy';

// Generic skeleton
<LoadingSkeleton height={200} variant="card" />

// Chart skeleton
<ChartSkeleton height={350} title="Revenue" showLegend />

// Modal skeleton
<ModalSkeleton />

// Full dashboard
<DashboardSkeleton />
```

## Performance

**Before:**
```
Initial Bundle: 450KB
Dashboard: +120KB
Admin: +95KB
```

**After:**
```
Initial Bundle: 180KB ⬇️ 60%
Dashboard: +45KB ⬇️ 62%
Admin: +35KB ⬇️ 63%
```

## Bundle Analysis

```bash
# Analyze bundle
pnpm build:analyze

# View results
open .next/analyze/client.html
```

## More Info

- [Bundle Optimization Guide](../../../BUNDLE_OPTIMIZATION.md)
- [Migration Examples](./MIGRATION_EXAMPLE.md)
