# AI Insights Card - Quick Start Guide

## Basic Usage

### 1. Import the Component

```tsx
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
```

### 2. Add to Your Page

```tsx
export default function DashboardPage() {
  return (
    <div className="container py-6">
      <AIInsightsCard />
    </div>
  );
}
```

That's it! The component works out of the box with default settings.

## Common Configurations

### Sidebar Layout (Recommended)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main Content */}
  <div className="lg:col-span-2">
    {/* Your dashboard content */}
  </div>

  {/* AI Insights Sidebar */}
  <div className="lg:col-span-1">
    <AIInsightsCard
      limit={8}
      maxHeight="calc(100vh - 200px)"
    />
  </div>
</div>
```

### With Custom Action Handler

```tsx
<AIInsightsCard
  onInsightAction={(id, data) => {
    // Handle when user clicks "Take Action" button
    if (data?.url) {
      router.push(data.url);
    }
  }}
/>
```

### With Auto-Refresh

```tsx
<AIInsightsCard
  autoRefresh={true}  // Refreshes every 5 minutes
/>
```

### Compact Horizontal List

```tsx
import { InsightsCompactList } from '@/components/dashboard/insights';
import { useAIInsights } from '@/hooks/useAIInsights';

export function DashboardHeader() {
  const { insights } = useAIInsights({
    filters: { limit: 5, urgency: ['HIGH', 'URGENT'] }
  });

  return (
    <div>
      <h2>Priority Insights</h2>
      <InsightsCompactList insights={insights} />
    </div>
  );
}
```

## Available Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | number | 10 | Max insights to display |
| `showFilters` | boolean | true | Show filter dropdown |
| `showRefresh` | boolean | true | Show refresh button |
| `autoRefresh` | boolean | false | Auto-refresh every 5 min |
| `maxHeight` | string | "600px" | Max height with scroll |
| `onInsightAction` | function | - | Action button callback |
| `className` | string | - | Additional CSS classes |

## Categories

The component automatically categorizes insights:

- **Tax Optimization** - Tax deduction suggestions, filing reminders
- **Expense Anomaly** - Unusual spending patterns, duplicate expenses
- **Cash Flow** - Revenue trends, payment predictions
- **Payment Reminder** - Invoice due dates, bill payments
- **General** - Tips, best practices, quick actions

## Urgency Levels

Insights are prioritized by urgency:

- **URGENT** - Requires immediate attention (red badge)
- **HIGH** - Important, should be addressed soon (orange badge)
- **MEDIUM** - Noteworthy, can be reviewed later (blue badge)
- **LOW** - Informational, nice to know (gray badge)

## Advanced Usage

### Using the Hook Directly

```tsx
import { useAIInsights } from '@/hooks/useAIInsights';

export function MyCustomComponent() {
  const {
    insights,
    isLoading,
    error,
    refresh,
    dismissInsight,
  } = useAIInsights({
    filters: {
      categories: ['TAX_OPTIMIZATION'],
      urgency: ['HIGH', 'URGENT'],
      limit: 5,
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading insights</div>;

  return (
    <div>
      {insights.map(insight => (
        <div key={insight.id}>
          <h3>{insight.title}</h3>
          <p>{insight.description}</p>
          <button onClick={() => dismissInsight(insight.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Filtering

```tsx
// Show only tax-related urgent insights
<AIInsightsCard
  limit={5}
  onInsightAction={(id) => {
    // User selected an insight
  }}
/>

// Then use the filter dropdown in the UI to select:
// - Categories: Tax Optimization
// - Urgency: Urgent, High
```

### Custom Styling

```tsx
<AIInsightsCard
  className="shadow-lg border-2"
  maxHeight="500px"
/>
```

## Integration with Backend

The component automatically fetches from:

- `GET /api/suggestions` - Proactive suggestions
- `GET /api/insights?orgId={orgId}` - AI insights

Make sure these endpoints are available and returning data in the expected format.

## Troubleshooting

### No insights showing?

1. Check if the API endpoints are responding
2. Verify authentication token is valid
3. Check browser console for errors
4. Try the refresh button

### Insights not updating?

1. Enable auto-refresh: `autoRefresh={true}`
2. Or manually call `refresh()` from the hook
3. Check if filters are too restrictive

### Need to clear dismissed insights?

```tsx
const { clearDismissed } = useAIInsights();

<button onClick={clearDismissed}>
  Clear Dismissed Insights
</button>
```

## Next Steps

1. Add the component to your dashboard
2. Test with different configurations
3. Customize action handlers for your workflow
4. Read the full documentation in `README.md`

## Support

For issues or questions:
1. Check the full documentation: `apps/web/src/components/dashboard/insights/README.md`
2. Review the implementation examples in this guide
