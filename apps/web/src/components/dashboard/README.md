# Cash Flow Chart Widget

A comprehensive React component for visualizing cash flow data with multiple chart types, time periods, and interactive features.

## Features

- **Multiple Chart Types**: Bar, Line, and Area charts
- **Flexible Time Periods**: 7 days, 30 days, 3 months, 12 months, or custom range
- **Summary Statistics**: Total income, expenses, and net cash flow with trend indicators
- **Export Functionality**: Save charts as PNG images
- **Responsive Design**: Adapts to all screen sizes
- **Theme Support**: Works with light and dark themes
- **Loading States**: Skeleton loaders during data fetch
- **Error Handling**: Graceful fallback with error messages
- **Custom Tooltips**: Rich hover information showing all data points

## Files Structure

```
apps/web/src/
├── components/
│   └── dashboard/
│       ├── CashFlowChartWidget.tsx          # Main widget component
│       ├── CashFlowChartWidget.example.tsx  # Usage examples
│       └── charts/
│           ├── CashFlowChart.tsx            # Chart rendering component
│           └── ChartTooltip.tsx             # Custom tooltip component
└── hooks/
    └── useCashFlowData.ts                   # Data fetching hook
```

## Quick Start

### Basic Usage

```tsx
import { CashFlowChartWidget } from '@/components/dashboard/CashFlowChartWidget';

export function Dashboard() {
  return (
    <div className="container">
      <CashFlowChartWidget />
    </div>
  );
}
```

### Custom Configuration

```tsx
<CashFlowChartWidget
  defaultPeriod="12m"           // Start with 12-month view
  defaultChartType="line"       // Use line chart
  showExport={true}             // Enable export button
  className="shadow-lg"         // Custom styling
/>
```

## Props

### CashFlowChartWidget

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `defaultPeriod` | `'7d' \| '30d' \| '3m' \| '12m' \| 'custom'` | `'30d'` | Initial time period |
| `defaultChartType` | `'bar' \| 'line' \| 'area'` | `'bar'` | Initial chart type |
| `showExport` | `boolean` | `true` | Show/hide export button |

## Data Hook

The `useCashFlowData` hook manages data fetching and provides:

```typescript
const { data, isLoading, isError, error } = useCashFlowData({
  period: '30d',
  startDate: '2024-01-01',  // Optional for custom range
  endDate: '2024-12-31',     // Optional for custom range
  currency: 'EUR'
});
```

### Response Type

```typescript
interface CashFlowResponse {
  data: Array<{
    date: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    percentChange: number;
    previousPeriodNet: number;
  };
  period: {
    from: string;
    to: string;
  };
  currency: string;
}
```

## Chart Types

### Bar Chart
- Best for comparing income vs expenses
- Shows stacked or grouped bars
- Clear visual separation of categories

### Line Chart
- Ideal for trend analysis
- Shows net cash flow as dashed line
- Smooth transitions between data points

### Area Chart
- Emphasizes magnitude of change
- Gradient fill for visual appeal
- Good for seeing cumulative effects

## API Integration

The widget expects data from `/api/reports/cash-flow` endpoint:

```typescript
GET /api/reports/cash-flow?fromDate=2024-01-01&toDate=2024-12-31&currency=EUR
```

### Mock Data

During development, the widget automatically generates realistic mock data if the API is unavailable. This includes:
- Daily cash flow patterns
- Weekday vs weekend variations
- Realistic income/expense ratios
- Trend calculations

## Styling

The widget uses Tailwind CSS and respects your theme configuration:

```tsx
// Custom container styling
<CashFlowChartWidget className="border-2 shadow-xl rounded-xl" />
```

### Theme Colors

Charts automatically adapt to light/dark mode:
- **Income**: Green (success color)
- **Expenses**: Red (destructive color)
- **Net**: Blue (primary color)
- **Grid**: Muted border color
- **Text**: Muted foreground

## Performance

- **Data Optimization**: Automatically reduces data points for large datasets (max 50 points)
- **Query Caching**: 5-minute cache via React Query
- **Lazy Loading**: Components load only when needed
- **Memoization**: Chart re-renders only on data changes

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- ARIA labels on interactive elements
- High contrast colors
- Focus indicators

## Export Feature

The widget can export charts as PNG images:

1. Click the download icon in the header
2. Chart is captured at 2x resolution for quality
3. File is named: `cash-flow-{period}-{date}.png`

**Requirements**: Uses `html-to-image` library

```bash
pnpm add html-to-image --filter @operate/web
```

## Error Handling

The widget handles errors gracefully:

1. **Network Errors**: Falls back to mock data
2. **Invalid Data**: Shows error message with icon
3. **Loading States**: Displays skeleton loaders
4. **Missing API**: Automatically uses mock data

## Examples

See `CashFlowChartWidget.example.tsx` for comprehensive examples:

1. Basic usage
2. Custom period
3. Different chart types
4. Dashboard layouts
5. Responsive grids
6. Tabbed interfaces
7. Custom styling

## Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { CashFlowChartWidget } from './CashFlowChartWidget';

describe('CashFlowChartWidget', () => {
  it('renders loading state initially', () => {
    render(<CashFlowChartWidget />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('displays cash flow data', async () => {
    render(<CashFlowChartWidget />);
    await waitFor(() => {
      expect(screen.getByText(/total income/i)).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

### Chart not rendering
- Ensure Recharts is installed: `pnpm add recharts`
- Check console for errors
- Verify data format matches interface

### Export not working
- Install `html-to-image`: `pnpm add html-to-image`
- Check browser compatibility
- Ensure ref is attached to chart container

### Data not loading
- Verify API endpoint is accessible
- Check network tab for errors
- Mock data will be used as fallback

## Future Enhancements

- [ ] Custom date range picker
- [ ] Compare multiple periods
- [ ] CSV export
- [ ] Email reports
- [ ] Scheduled reports
- [ ] Custom color themes
- [ ] Drill-down to transaction details
- [ ] Forecasting/predictions

## Dependencies

- `recharts`: ^3.5.1 - Chart rendering
- `html-to-image`: ^1.11.11 - Export functionality
- `@tanstack/react-query`: ^5.17.19 - Data fetching
- `lucide-react`: ^0.309.0 - Icons
- `next-themes`: ^0.2.1 - Theme support

## Contributing

When adding features:

1. Update TypeScript types
2. Add examples to example file
3. Update this README
4. Test in light and dark mode
5. Ensure responsive design
6. Add error handling

## License

Part of Operate/CoachOS - Enterprise SaaS Platform
