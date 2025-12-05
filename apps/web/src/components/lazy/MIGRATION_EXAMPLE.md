# Lazy Loading Migration Examples

This guide shows practical examples of migrating existing components to lazy loading.

## Example 1: Dashboard Page with Charts

### Before (Direct Import)

```tsx
// app/(dashboard)/finance/page.tsx
import { CashFlowChartWidget } from '@/components/dashboard/CashFlowChartWidget';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { ClientDataTable } from '@/components/clients/ClientDataTable';

export default function FinancePage() {
  return (
    <div className="space-y-6">
      {/* These all load immediately, increasing initial bundle */}
      <CashFlowChartWidget data={cashFlowData} />
      <AIInsightsCard insights={insights} />
      <ClientDataTable clients={clients} />
    </div>
  );
}
```

**Bundle Impact:** ~120KB added to initial bundle

### After (Lazy Import)

```tsx
// app/(dashboard)/finance/page.tsx
import {
  CashFlowChartWidget,
  AIInsightsCard,
  ClientDataTable,
} from '@/components/lazy';

export default function FinancePage() {
  return (
    <div className="space-y-6">
      {/* These load on-demand, reducing initial bundle */}
      <CashFlowChartWidget data={cashFlowData} />
      <AIInsightsCard insights={insights} />
      <ClientDataTable clients={clients} />
    </div>
  );
}
```

**Bundle Impact:** ~120KB moved to separate chunks, loaded only when visiting this page

---

## Example 2: Modal/Dialog Components

### Before

```tsx
// app/(dashboard)/clients/page.tsx
import { useState } from 'react';
import { AddClientDialog } from '@/components/clients/AddClientDialog';
import { EditClientDialog } from '@/components/clients/EditClientDialog';

export default function ClientsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div>
      <button onClick={() => setShowAdd(true)}>Add Client</button>

      {/* Modal components loaded even when not visible */}
      <AddClientDialog open={showAdd} onOpenChange={setShowAdd} />
      <EditClientDialog open={showEdit} onOpenChange={setShowEdit} />
    </div>
  );
}
```

### After

```tsx
// app/(dashboard)/clients/page.tsx
import { useState } from 'react';
import { AddClientDialog, EditClientDialog } from '@/components/lazy';

export default function ClientsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div>
      <button onClick={() => setShowAdd(true)}>Add Client</button>

      {/* Modals only load when opened */}
      {showAdd && (
        <AddClientDialog open={showAdd} onOpenChange={setShowAdd} />
      )}
      {showEdit && (
        <EditClientDialog open={showEdit} onOpenChange={setShowEdit} />
      )}
    </div>
  );
}
```

**Improvement:** Modals only load when user clicks the button

---

## Example 3: Tab-Based Content

### Before

```tsx
// app/(dashboard)/reports/page.tsx
import { ClientMetrics } from '@/components/reports/ClientMetrics';
import { FinancialOverview } from '@/components/reports/FinancialOverview';
import { TaxSummary } from '@/components/reports/TaxSummary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ReportsPage() {
  return (
    <Tabs defaultValue="financial">
      <TabsList>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="tax">Tax</TabsTrigger>
      </TabsList>

      {/* All tabs load immediately, even hidden ones */}
      <TabsContent value="financial">
        <FinancialOverview />
      </TabsContent>
      <TabsContent value="clients">
        <ClientMetrics />
      </TabsContent>
      <TabsContent value="tax">
        <TaxSummary />
      </TabsContent>
    </Tabs>
  );
}
```

### After

```tsx
// app/(dashboard)/reports/page.tsx
import { useState } from 'react';
import {
  ClientMetrics,
  FinancialOverview,
  TaxSummary,
} from '@/components/lazy';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('financial');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="tax">Tax</TabsTrigger>
      </TabsList>

      {/* Only load the active tab's content */}
      <TabsContent value="financial">
        {activeTab === 'financial' && <FinancialOverview />}
      </TabsContent>
      <TabsContent value="clients">
        {activeTab === 'clients' && <ClientMetrics />}
      </TabsContent>
      <TabsContent value="tax">
        {activeTab === 'tax' && <TaxSummary />}
      </TabsContent>
    </Tabs>
  );
}
```

**Improvement:** Only loads content for the active tab

---

## Example 4: Custom Lazy Component

### Create a New Lazy Component

```tsx
// components/heavy/DataVisualizer.tsx
export function DataVisualizer({ data }: Props) {
  // Heavy component using D3, WebGL, etc.
  return <div>{/* visualization */}</div>;
}
```

### Register in Lazy Index

```tsx
// components/lazy/index.ts
export const DataVisualizer = dynamic(
  () => import('@/components/heavy/DataVisualizer').then((mod) => mod.DataVisualizer),
  {
    loading: () => <ChartSkeleton height={600} />,
    ssr: false, // Client-only if using browser APIs
  }
);
```

### Use It

```tsx
// app/analytics/page.tsx
import { DataVisualizer } from '@/components/lazy';

export default function AnalyticsPage() {
  return <DataVisualizer data={data} />;
}
```

---

## Example 5: Conditional Feature Loading

### Before (Always Loaded)

```tsx
// app/(dashboard)/layout.tsx
import { CommandPalette } from '@/components/command-palette';

export default function DashboardLayout({ children }) {
  return (
    <>
      {children}
      {/* Command palette always loaded, even if user never opens it */}
      <CommandPalette />
    </>
  );
}
```

### After (Lazy Loaded on First Use)

```tsx
// app/(dashboard)/layout.tsx
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const CommandPalette = dynamic(
  () => import('@/components/command-palette').then((mod) => mod.CommandPalette),
  { ssr: false }
);

export default function DashboardLayout({ children }) {
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    // Load on Cmd+K / Ctrl+K
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(true);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {children}
      {/* Only loads when user presses Cmd+K for the first time */}
      {showPalette && <CommandPalette />}
    </>
  );
}
```

---

## Example 6: Route-Specific Heavy Component

### Before (In Page)

```tsx
// app/(dashboard)/admin/subscriptions/page.tsx
import { SubscriptionTable } from '@/components/admin/subscriptions/SubscriptionTable';
import { MrrChart } from '@/components/admin/subscriptions/MrrChart';
import { RevenueByTierChart } from '@/components/admin/subscriptions/RevenueByTierChart';

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <MrrChart />
        <RevenueByTierChart />
      </div>
      <SubscriptionTable />
    </div>
  );
}
```

### After (Lazy Loaded)

```tsx
// app/(dashboard)/admin/subscriptions/page.tsx
import {
  SubscriptionTable,
  MrrChart,
  RevenueByTierChart,
} from '@/components/lazy';

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <MrrChart />
        <RevenueByTierChart />
      </div>
      <SubscriptionTable />
    </div>
  );
}
```

**Why This Works:**
- Admin pages are visited less frequently
- Components only load when admins visit this specific route
- Initial app bundle stays small for regular users

---

## Performance Comparison

### Before Lazy Loading
```
Initial Bundle: 450KB (gzipped)
Dashboard Route: +120KB
Admin Route: +95KB
Reports Route: +80KB

Total for first visit to admin: 450 + 120 + 95 = 665KB
```

### After Lazy Loading
```
Initial Bundle: 180KB (gzipped)
Dashboard Route: +45KB (core only)
Admin Route: +35KB (loaded on demand)
Reports Route: +30KB (loaded on demand)

Total for first visit to admin: 180 + 45 + 35 = 260KB
```

**Improvement: 61% reduction in bundle size**

---

## Tips & Best Practices

### 1. Import Only What You Need

```tsx
// ❌ Bad: Imports entire component even if lazy
import { CashFlowChartWidget } from '@/components/dashboard/CashFlowChartWidget';

// ✅ Good: Lazy-loaded from central registry
import { CashFlowChartWidget } from '@/components/lazy';
```

### 2. Use Skeletons for Better UX

```tsx
// ❌ Bad: No loading state
const Chart = dynamic(() => import('./Chart'));

// ✅ Good: Shows skeleton while loading
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton height={350} />,
});
```

### 3. Group Related Lazy Loads

```tsx
// ✅ Load multiple related components together
import {
  MrrChart,
  RevenueByTierChart,
  ChurnIndicator,
} from '@/components/lazy';
```

### 4. Avoid Lazy Loading Critical Components

```tsx
// ❌ Bad: Header needs to be immediate
import { Header } from '@/components/lazy';

// ✅ Good: Direct import for critical UI
import { Header } from '@/components/dashboard/header';
```

---

## Checklist for Migration

- [ ] Identify heavy components (>30KB)
- [ ] Check if component is critical (above fold?)
- [ ] Add component to `@/components/lazy/index.ts`
- [ ] Create appropriate loading skeleton
- [ ] Update imports in consuming pages
- [ ] Test loading behavior
- [ ] Verify no layout shift occurs
- [ ] Run bundle analyzer to confirm size reduction
- [ ] Update tests if needed
