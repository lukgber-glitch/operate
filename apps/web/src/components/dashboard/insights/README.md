# AI Insights Components

AI-powered insights and suggestions components for the dashboard.

## Components

### AIInsightsCard
Main card component that displays AI-generated insights with filtering and refresh capabilities.

```tsx
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';

<AIInsightsCard
  limit={10}
  showFilters={true}
  showRefresh={true}
  autoRefresh={false}
  maxHeight="600px"
  onInsightAction={(id, data) => console.log('Action:', id, data)}
/>
```

**Props:**
- `limit` - Maximum number of insights to display (default: 10)
- `showFilters` - Show category/urgency filter dropdown (default: true)
- `showRefresh` - Show refresh button (default: true)
- `autoRefresh` - Auto-refresh every 5 minutes (default: false)
- `maxHeight` - Maximum height with scroll (default: "600px")
- `onInsightAction` - Callback when action button is clicked
- `className` - Additional CSS classes

### InsightItem
Individual insight display with expand/collapse and actions.

```tsx
import { InsightItem } from '@/components/dashboard/insights';

<InsightItem
  insight={insight}
  onExpand={(id) => console.log('Expanded:', id)}
  onDismiss={(id) => console.log('Dismissed:', id)}
  onAction={(id, data) => console.log('Action:', id, data)}
  compact={false}
/>
```

**Props:**
- `insight` - AIInsight object
- `onExpand` - Called when expanded/collapsed
- `onDismiss` - Called when dismissed
- `onAction` - Called when action button is clicked
- `compact` - Use compact layout (default: false)

### InsightsCompactList
Horizontal scrollable list of compact insights.

```tsx
import { InsightsCompactList } from '@/components/dashboard/insights';

<InsightsCompactList
  insights={insights}
  onDismiss={(id) => dismissInsight(id)}
  onAction={(id, data) => handleAction(id, data)}
/>
```

### EmptyInsightsState
Empty state display when no insights are available.

```tsx
import { EmptyInsightsState } from '@/components/dashboard/insights';

<EmptyInsightsState
  hasFilters={true}
  onClearFilters={() => clearFilters()}
  onRefresh={() => refresh()}
/>
```

### InsightsCategoryBadge
Category badge with icon and colors.

```tsx
import { InsightsCategoryBadge } from '@/components/dashboard/insights';

<InsightsCategoryBadge
  category="TAX_OPTIMIZATION"
  size="md"
  showIcon={true}
/>
```

## Hook: useAIInsights

Fetch and manage AI insights data.

```tsx
import { useAIInsights } from '@/hooks/useAIInsights';

const {
  insights,
  isLoading,
  error,
  refresh,
  dismissInsight,
  snoozeInsight,
  clearDismissed,
} = useAIInsights({
  filters: {
    categories: ['TAX_OPTIMIZATION', 'EXPENSE_ANOMALY'],
    urgency: ['HIGH', 'URGENT'],
    dismissed: false,
    limit: 10,
  },
  autoRefresh: true,
  refreshInterval: 300000, // 5 minutes
});
```

**Options:**
- `filters.categories` - Filter by insight categories
- `filters.urgency` - Filter by urgency levels
- `filters.dismissed` - Include dismissed insights
- `filters.limit` - Maximum number to fetch
- `autoRefresh` - Enable auto-refresh
- `refreshInterval` - Refresh interval in milliseconds

## Types

### AIInsight
```typescript
interface AIInsight {
  id: string;
  category: InsightCategory;
  type: SuggestionType;
  priority: SuggestionPriority;
  urgency: InsightUrgency;
  title: string;
  description: string;
  summary?: string;
  details?: string;
  actionUrl?: string;
  actionLabel?: string;
  actionData?: Record<string, any>;
  metric?: {
    label: string;
    value: string | number;
    change?: {
      value: number;
      direction: 'up' | 'down' | 'stable';
      label: string;
    };
  };
  tags?: string[];
  createdAt: Date;
  expiresAt?: Date;
  dismissable?: boolean;
  isDismissed?: boolean;
}
```

### InsightCategory
```typescript
type InsightCategory =
  | 'TAX_OPTIMIZATION'
  | 'EXPENSE_ANOMALY'
  | 'CASH_FLOW'
  | 'PAYMENT_REMINDER'
  | 'GENERAL';
```

### InsightUrgency
```typescript
type InsightUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
```

## Integration with Backend

The components integrate with Wave 30's proactive suggestions service:

- **Endpoint:** `GET /api/suggestions`
- **Service:** `apps/api/src/modules/chatbot/suggestions/proactive-suggestions.service.ts`

The hook automatically fetches from:
- `/api/suggestions` - For proactive suggestions
- `/api/insights` - For AI-generated insights

## Features

1. **Real-time Updates** - Auto-refresh capability
2. **Filtering** - By category and urgency
3. **Dismissable** - Users can dismiss insights
4. **Expandable** - Show/hide details
5. **Actions** - Configurable action buttons
6. **Metrics** - Display values with trend indicators
7. **Loading States** - Skeleton loaders
8. **Empty States** - User-friendly empty states
9. **Responsive** - Mobile-friendly layouts
10. **Accessibility** - ARIA labels and keyboard navigation

## Styling

All components use the existing design system:
- Tailwind CSS utilities
- shadcn/ui components
- Consistent color scheme based on category/urgency
- Dark mode support

## Example: Dashboard Page

```tsx
'use client';

import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';

export default function DashboardPage() {
  const handleInsightAction = (id: string, data?: any) => {
    if (data?.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Your main dashboard content */}
        </div>

        {/* Insights sidebar */}
        <div className="lg:col-span-1">
          <AIInsightsCard
            limit={8}
            showFilters={true}
            autoRefresh={true}
            onInsightAction={handleInsightAction}
          />
        </div>
      </div>
    </div>
  );
}
```
