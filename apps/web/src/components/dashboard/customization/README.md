# Dashboard Customization System

Complete drag-and-drop dashboard customization system for Operate/CoachOS.

## Features

- **Drag & Drop Reordering** - Intuitive widget reordering with @dnd-kit
- **Responsive Grid** - 12 columns (desktop), 6 columns (tablet), 1 column (mobile)
- **Widget Resize** - Four sizes: small (25%), medium (50%), large (75%), full-width (100%)
- **Show/Hide Widgets** - Toggle visibility without removing widgets
- **Add/Remove Widgets** - Widget picker modal with search and categories
- **Persistent Layouts** - Saves to localStorage and syncs to API
- **Edit Mode** - Clear visual distinction between view and edit modes
- **Smooth Animations** - Polished drag animations and transitions

## Installation

The required dependencies are already installed:

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Quick Start

```tsx
import { CustomizableDashboard } from '@/components/dashboard/customization/CustomizableDashboard.example';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <CustomizableDashboard />
    </div>
  );
}
```

## Components

### DashboardGrid

Main container component that orchestrates all customization functionality.

```tsx
import { DashboardGrid, useDashboardLayout } from '@/components/dashboard/customization';

function MyDashboard() {
  const {
    visibleWidgets,
    isEditMode,
    isDragging,
    toggleEditMode,
    reorderWidgets,
    updateWidgetSize,
    // ... other methods
  } = useDashboardLayout();

  return (
    <DashboardGrid
      widgets={visibleWidgets}
      isEditMode={isEditMode}
      isDragging={isDragging}
      onDragEnd={reorderWidgets}
      renderWidget={(widget) => {
        // Render your widgets based on type
        switch (widget.type) {
          case 'ai-insights':
            return <AIInsightsCard />;
          // ... other widgets
        }
      }}
    />
  );
}
```

### useDashboardLayout Hook

Custom hook that manages dashboard state and persistence.

```tsx
const {
  // State
  activeLayout,           // Current active layout object
  visibleWidgets,         // Array of visible widgets
  isEditMode,             // Boolean edit mode flag
  isDragging,             // Boolean dragging state
  isLoading,              // Boolean loading state
  isSaving,               // Boolean saving state

  // Actions
  toggleEditMode,         // Toggle edit mode on/off
  reorderWidgets,         // Reorder widgets after drag
  updateWidgetSize,       // Change widget size
  toggleWidgetVisibility, // Show/hide widget
  addWidget,              // Add new widget
  removeWidget,           // Remove widget
  resetToDefault,         // Reset to default layout
  setIsDragging,          // Set dragging state
} = useDashboardLayout();
```

### DraggableWidget

Wrapper component that makes widgets draggable with edit controls.

```tsx
<DraggableWidget
  widget={widget}
  isEditMode={isEditMode}
  onRemove={removeWidget}
  onResize={updateWidgetSize}
  onToggleVisibility={toggleWidgetVisibility}
>
  <YourWidgetContent />
</DraggableWidget>
```

### WidgetPicker

Modal dialog for adding new widgets to the dashboard.

```tsx
<WidgetPicker
  onAddWidget={addWidget}
  disabledWidgets={['ai-insights-1']} // Already added widgets
/>
```

### DashboardCustomizer

Edit mode banner with customization controls.

```tsx
<DashboardCustomizer
  isEditMode={isEditMode}
  isSaving={isSaving}
  visibleWidgetCount={5}
  totalWidgetCount={8}
  onToggleEditMode={toggleEditMode}
  onReset={resetToDefault}
  onAddWidget={addWidget}
/>
```

## Available Widgets

The system comes pre-configured with 8 widget types:

1. **AI Insights** - Smart recommendations and business insights
2. **Cash Flow Chart** - Visualize cash flow over time
3. **Quick Actions** - Common tasks and shortcuts
4. **Recent Invoices** - Latest invoices and payments
5. **Notification Summary** - Recent alerts and updates
6. **Tax Deadline Reminders** - Upcoming tax obligations
7. **Revenue Chart** - Track revenue trends
8. **Expense Breakdown** - Categorized expense analysis

## Widget Configuration

Widgets are defined in `dashboard-layout.types.ts`:

```tsx
export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: 'ai-insights',
    type: 'ai-insights',
    title: 'AI Insights',
    description: 'Smart recommendations and business insights',
    icon: 'Sparkles',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'full-width',
    category: 'insights',
  },
  // ... more widgets
];
```

## Adding New Widgets

1. Add widget type to `WidgetType` union:

```tsx
export type WidgetType =
  | 'ai-insights'
  | 'cash-flow-chart'
  | 'your-new-widget'; // Add here
```

2. Add widget config to `AVAILABLE_WIDGETS`:

```tsx
{
  id: 'your-new-widget',
  type: 'your-new-widget',
  title: 'Your Widget',
  description: 'Widget description',
  icon: 'IconName', // lucide-react icon name
  defaultSize: 'medium',
  minSize: 'small',
  maxSize: 'full-width',
  category: 'analytics',
}
```

3. Add render case in your dashboard:

```tsx
case 'your-new-widget':
  return <YourNewWidget />;
```

## Persistence

### LocalStorage

Layouts are automatically saved to `localStorage` with versioning:

```tsx
{
  "version": "1.0",
  "layout": {
    "id": "default",
    "userId": "current-user",
    "widgets": [...],
    "updatedAt": "2024-12-04T..."
  }
}
```

### API Sync

To enable API sync, implement the API endpoint:

```tsx
// In useDashboardLayout.ts, uncomment:
await fetch('/api/dashboard/layout', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(layout),
});
```

Create the API endpoint:

```tsx
// apps/api/src/dashboard/dashboard.controller.ts
@Put('layout')
async updateLayout(@Body() layout: DashboardLayout) {
  return this.dashboardService.saveLayout(layout);
}

@Get('layout')
async getLayout(@User() user) {
  return this.dashboardService.getLayout(user.id);
}
```

## Grid System

The responsive grid uses CSS Grid with breakpoint-aware column spans:

```css
/* Tailwind classes used */
.grid-cols-1       /* Mobile: 1 column */
.md:grid-cols-6    /* Tablet: 6 columns */
.lg:grid-cols-12   /* Desktop: 12 columns */
```

Widget sizes map to column spans:

```tsx
const WIDGET_SIZE_SPANS: Record<WidgetSize, number> = {
  small: 3,        // 25% width (3/12 columns)
  medium: 6,       // 50% width (6/12 columns)
  large: 9,        // 75% width (9/12 columns)
  'full-width': 12 // 100% width (12/12 columns)
};
```

## Styling

The system uses Tailwind CSS and shadcn/ui components for consistent styling:

- Edit mode: `ring-2 ring-primary/20`
- Dragging: `shadow-2xl ring-4 ring-primary/40 opacity-50`
- Hidden widgets: `opacity-50 bg-muted`
- Smooth transitions: `transition-all duration-200`

## Accessibility

- Keyboard navigation support via `KeyboardSensor`
- ARIA labels on interactive elements
- Focus management during drag operations
- Screen reader friendly widget labels

## Performance

- Optimized re-renders with React.memo (where needed)
- Efficient collision detection (`closestCenter`)
- Debounced save operations
- Lazy loading widget content

## Example Integration

See `CustomizableDashboard.example.tsx` for a complete working example.

## File Structure

```
customization/
├── dashboard-layout.types.ts          # TypeScript definitions
├── useDashboardLayout.ts              # State management hook
├── DashboardGrid.tsx                  # Main grid container
├── DraggableWidget.tsx                # Draggable widget wrapper
├── WidgetPlaceholder.tsx              # Drop zone placeholder
├── WidgetResizeHandle.tsx             # Resize controls
├── DashboardCustomizer.tsx            # Edit mode controls
├── WidgetPicker.tsx                   # Add widget modal
├── CustomizableDashboard.example.tsx  # Complete example
├── index.ts                           # Public exports
└── README.md                          # This file
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Part of Operate/CoachOS - Enterprise SaaS Platform
