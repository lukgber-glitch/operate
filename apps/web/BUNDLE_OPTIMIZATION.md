# Bundle Size Optimization Guide

## Overview

This document describes the bundle optimization strategies implemented for the Operate/CoachOS web application to improve performance and reduce initial load times.

## Optimization Strategies

### 1. Bundle Analyzer

The `@next/bundle-analyzer` package is installed to visualize bundle composition.

**Run bundle analysis:**
```bash
# From the web app directory
pnpm build:analyze

# From the monorepo root
pnpm --filter @operate/web build:analyze
```

This will generate interactive HTML reports:
- `.next/analyze/client.html` - Client-side bundle
- `.next/analyze/server.html` - Server-side bundle

### 2. Code Splitting Configuration

#### Vendor Chunk Splitting

The webpack configuration splits vendor libraries into separate chunks for better caching:

- **react-vendor**: React, ReactDOM, Scheduler (40KB-50KB)
- **radix-vendor**: All Radix UI components (30KB-40KB)
- **recharts-vendor**: Chart library (80KB-100KB)
- **query-vendor**: TanStack Query (20KB-30KB)
- **vendor**: Other third-party libraries

**Benefits:**
- Separate caching for React core (rarely changes)
- Isolate heavy libraries (recharts)
- Reduce cache invalidation on updates

#### Package Import Optimization

Using Next.js 14's `optimizePackageImports` for:
- `lucide-react` - Icon library tree-shaking
- `@radix-ui/*` - Component tree-shaking
- `recharts` - Chart component tree-shaking

### 3. Dynamic Imports (Lazy Loading)

Heavy components are lazy-loaded using `next/dynamic` to reduce initial bundle size.

#### Lazy Component Index

Import from `@/components/lazy`:

```typescript
import {
  CashFlowChartWidget,
  AIInsightsCard,
  ChartSkeleton,
  // ... etc
} from '@/components/lazy';
```

#### Lazy-Loaded Component Categories

**Dashboard Components:**
- `CashFlowChartWidget` - Main chart widget with controls
- `AIInsightsCard` - AI insights display
- `DashboardCustomizer` - Dashboard customization UI

**Chart Components (Recharts - Heavy):**
- `CashFlowChart` - All chart types (Bar, Line, Area)
- `MrrChart` - Monthly recurring revenue chart
- `RevenueByTierChart` - Pie chart for revenue breakdown

**Modal/Dialog Components:**
- `AddClientDialog`
- `EditClientDialog`
- `RecordPaymentDialog`
- `AddConnectionDialog`
- `ConnectBankModal`
- `CommandPaletteModal`

**Data Tables:**
- `ClientDataTable`
- `SubscriptionTable`

**Report Components:**
- `ClientMetrics`
- `FinancialOverview`
- `TaxSummary`
- `DocumentStats`

**Email Components:**
- `EmailComposer`
- `EmailTemplateEditor`

**Voice Components:**
- `VoiceRecorder` - Speech recognition (client-only)

**Currency Components:**
- `CurrencyConverter`

### 4. Loading Skeletons

Loading components provide visual feedback during code splitting:

```typescript
import {
  LoadingSkeleton,
  ChartSkeleton,
  ModalSkeleton,
  DashboardSkeleton,
} from '@/components/lazy';
```

**Usage:**
```tsx
// Automatic with lazy components
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton height={350} />,
  ssr: false,
});

// Or standalone
<ChartSkeleton height={400} title="Cash Flow" showLegend />
```

## Usage Examples

### Basic Lazy Loading

```tsx
import { CashFlowChartWidget } from '@/components/lazy';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Component loads on demand */}
      <CashFlowChartWidget data={data} />
    </div>
  );
}
```

### Custom Lazy Component

```tsx
import { createLazy } from '@/components/lazy';
import { ChartSkeleton } from '@/components/lazy';

const MyHeavyComponent = createLazy(
  () => import('./MyHeavyComponent'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Client-only if needed
  }
);
```

### Conditional Loading

```tsx
import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/lazy';

export function ReportSection({ showAdvanced }: Props) {
  // Only load when needed
  const AdvancedReport = showAdvanced
    ? dynamic(() => import('./AdvancedReport'), {
        loading: () => <ChartSkeleton />,
      })
    : null;

  return (
    <div>
      {/* ... basic content ... */}
      {showAdvanced && AdvancedReport && <AdvancedReport />}
    </div>
  );
}
```

## Performance Targets

### Bundle Size Goals

- **Initial JS**: < 200KB gzipped
- **First Load JS per route**: < 100KB
- **Vendor chunks**: Individually < 150KB
- **Route chunks**: < 50KB each

### Loading Performance

- **Time to Interactive (TTI)**: < 3.5s (3G)
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s

## Monitoring Bundle Size

### CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Analyze bundle size
  run: |
    pnpm --filter @operate/web build:analyze
    # Optional: Upload reports to artifact storage
```

### Size Budgets

Configure in `next.config.js` (future enhancement):

```javascript
experimental: {
  bundlePagesRouterDependencies: true,
  bundlePagesExternals: true,
  optimizeCss: true,
}
```

## Best Practices

### 1. When to Use Dynamic Imports

Use dynamic imports for:
- Heavy third-party libraries (>50KB)
- Components not visible on initial load
- Route-specific features
- Admin/settings panels
- Modals and dialogs
- Charts and visualizations
- Rich text editors
- PDF viewers
- Video players

### 2. When NOT to Use Dynamic Imports

Avoid dynamic imports for:
- Critical UI components (header, nav)
- Components visible above the fold
- Small utility components (<10KB)
- Core authentication flows
- Error boundaries

### 3. Loading State Guidelines

- Always provide loading states for lazy components
- Use skeletons that match final component size
- Avoid layout shift with proper height/width
- Consider suspense boundaries for groups of components

### 4. SSR Considerations

Set `ssr: false` for:
- Browser-only APIs (Web Speech, Canvas, etc.)
- Chart libraries (often don't need SSR)
- User-specific heavy components
- Client-side only features

Keep SSR enabled for:
- SEO-critical content
- Above-the-fold content
- Public-facing pages

## Migration Guide

### Converting Existing Components

**Before:**
```tsx
import { CashFlowChartWidget } from '@/components/dashboard';

export default function Page() {
  return <CashFlowChartWidget data={data} />;
}
```

**After:**
```tsx
import { CashFlowChartWidget } from '@/components/lazy';

export default function Page() {
  return <CashFlowChartWidget data={data} />;
}
```

No other changes needed - lazy loading is transparent!

## Troubleshooting

### Issue: "Module not found" Error

**Solution:** Ensure the component export is correct:
```tsx
// Preferred: default export
export default function MyComponent() { ... }

// Or: named export (adjust lazy config)
export function MyComponent() { ... }
```

### Issue: Layout Shift on Load

**Solution:** Use proper loading skeleton:
```tsx
dynamic(() => import('./Component'), {
  loading: () => <div style={{ height: 400 }}>Loading...</div>,
})
```

### Issue: Component Not Lazy Loading

**Solution:** Verify you're importing from `@/components/lazy`, not direct path.

## Future Optimizations

- [ ] Implement route-based code splitting
- [ ] Add bundle size budgets with CI checks
- [ ] Optimize CSS delivery
- [ ] Implement module preloading for critical routes
- [ ] Add Brotli compression
- [ ] Consider edge runtime for static pages
- [ ] Implement service worker-based caching strategies
- [ ] Add image optimization audit

## Resources

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Next.js Code Splitting](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Coverage](https://developer.chrome.com/docs/devtools/coverage/)
