# Mobile Components

Touch-friendly, mobile-optimized components for the Operate web application.

## Components

### MobileHeader
A responsive header component for mobile devices with hamburger menu, search, and notifications.

```tsx
import { MobileHeader } from '@/components/mobile'

<MobileHeader
  title="Dashboard"
  showSearch={true}
/>
```

**Features:**
- Hamburger menu with slide-out navigation
- Search button with full-screen search sheet
- Notification bell
- User avatar
- Automatically hidden on desktop (lg breakpoint)

### MobileSidebar
Full-height navigation sidebar for mobile devices.

```tsx
import { MobileSidebar } from '@/components/mobile'

<MobileSidebar onClose={() => setMenuOpen(false)} />
```

**Features:**
- Expandable navigation items with children
- Touch-friendly 44px minimum height
- User profile section
- Auto-close on navigation

### MobileCard
Base card component optimized for touch interactions.

```tsx
import { MobileCard } from '@/components/mobile'

<MobileCard href="/details" className="...">
  {/* Your content */}
</MobileCard>
```

**Props:**
- `href` - Link destination (optional)
- `onClick` - Click handler (optional)
- `asButton` - Render as button (optional)
- Touch-friendly with 44x44px minimum target
- Active state feedback (scale animation)

### MobileListCard
Specialized card for list items with icon, title, subtitle, and actions.

```tsx
import { MobileListCard } from '@/components/mobile'

<MobileListCard
  icon={FileText}
  title="Invoice #2024-001"
  subtitle="Acme Corp"
  badge={<Badge>Paid</Badge>}
  actions={
    <div>
      <span>$1,500</span>
      <span>Due: Jan 15</span>
    </div>
  }
  href="/invoices/123"
/>
```

### MobileStatCard
Card for displaying key statistics.

```tsx
import { MobileStatCard } from '@/components/mobile'

<MobileStatCard
  label="Revenue"
  value="$12,500"
  icon={DollarSign}
  trend={{ value: "12%", isPositive: true }}
  href="/finance"
/>
```

### MobileInvoiceList
Complete invoice list component with loading and empty states.

```tsx
import { MobileInvoiceList } from '@/components/mobile'

<MobileInvoiceList
  invoices={invoices}
  isLoading={isLoading}
  emptyMessage="No invoices found"
  onInvoiceClick={(invoice) => console.log(invoice)}
/>
```

### MobileDashboard
Dashboard stats grid optimized for mobile.

```tsx
import { MobileDashboard } from '@/components/mobile'

const stats = {
  revenue: { value: 12500, currency: 'EUR', trend: { value: '12%', isPositive: true } },
  invoices: { total: 45, pending: 12, overdue: 3 },
  employees: { total: 8, active: 8 },
  expenses: { value: 4200, currency: 'EUR' }
}

<MobileDashboard stats={stats} isLoading={false} />
```

## Hooks

### useMediaQuery
Hook for responsive breakpoint detection.

```tsx
import { useIsMobile, useIsDesktop, useMediaQuery } from '@/hooks/useMediaQuery'

function MyComponent() {
  const isMobile = useIsMobile() // max-width: 639px
  const isDesktop = useIsDesktop() // min-width: 1024px
  const customBreakpoint = useMediaQuery('(min-width: 768px)')

  return isMobile ? <MobileView /> : <DesktopView />
}
```

**Available hooks:**
- `useIsMobile()` - max-width: 639px
- `useIsTablet()` - 640px - 1023px
- `useIsDesktop()` - min-width: 1024px
- `useIsSmallScreen()` - max-width: 767px
- `useIsMediumScreen()` - 768px - 1023px
- `useIsLargeScreen()` - min-width: 1024px
- `useIsExtraLargeScreen()` - min-width: 1280px
- `useIsTouchDevice()` - Detects touch support
- `useBreakpoint()` - Returns 'mobile', 'tablet', or 'desktop'

### useSwipeGesture
Hook for detecting swipe gestures on touch devices.

```tsx
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

function MyComponent() {
  const ref = useSwipeGesture({
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    onSwipeUp: () => console.log('Swiped up'),
    onSwipeDown: () => console.log('Swiped down'),
  }, {
    minSwipeDistance: 50,
    maxSwipeTime: 1000,
  })

  return <div ref={ref}>Swipe me!</div>
}
```

**Alternative with state tracking:**

```tsx
import { useSwipeState } from '@/hooks/useSwipeGesture'

function MyComponent() {
  const { ref, swipeDirection, swipeDistance, isSwiping } = useSwipeState()

  return (
    <div ref={ref}>
      {isSwiping && <span>Swiping...</span>}
      {swipeDirection && <span>Swiped {swipeDirection}</span>}
    </div>
  )
}
```

## Design Principles

### Touch Targets
All interactive elements meet the minimum 44x44px touch target size recommended by Apple and Google.

### Responsive Spacing
- Mobile: 16px padding (p-4)
- Tablet: 24px padding (sm:p-6)
- Desktop: 24px padding (lg:p-6)

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

### Color System
Uses the existing design system with HSL CSS variables:
- `bg-slate-50/900` - Backgrounds
- `text-slate-600/900` - Text
- `border-slate-200/800` - Borders

### Dark Mode
All components support dark mode via Tailwind's `dark:` variant.

## Usage Examples

### Responsive Page Layout

```tsx
'use client'

import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileDashboard } from '@/components/mobile'
import { DesktopDashboard } from '@/components/dashboard'

export default function DashboardPage() {
  const isMobile = useIsMobile()
  const stats = useDashboardStats()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 lg:text-3xl">Dashboard</h1>

      {isMobile ? (
        <MobileDashboard stats={stats} />
      ) : (
        <DesktopDashboard stats={stats} />
      )}
    </div>
  )
}
```

### Responsive Invoice List

```tsx
'use client'

import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileInvoiceList } from '@/components/mobile'
import { InvoiceTable } from '@/components/finance'

export default function InvoicesPage() {
  const isMobile = useIsMobile()
  const { invoices, isLoading } = useInvoices()

  return (
    <div>
      {isMobile ? (
        <MobileInvoiceList
          invoices={invoices}
          isLoading={isLoading}
        />
      ) : (
        <InvoiceTable
          invoices={invoices}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
```

### Swipeable Card Gallery

```tsx
'use client'

import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { MobileCard } from '@/components/mobile'

export function CardGallery() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const ref = useSwipeGesture({
    onSwipeLeft: () => setCurrentIndex(prev => Math.min(prev + 1, items.length - 1)),
    onSwipeRight: () => setCurrentIndex(prev => Math.max(prev - 1, 0)),
  })

  return (
    <div ref={ref} className="relative overflow-hidden">
      <MobileCard>
        {items[currentIndex]}
      </MobileCard>
    </div>
  )
}
```

## Testing on Mobile

### Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device preset or custom dimensions
4. Test touch events with mouse

### Real Device Testing
1. Ensure your dev server is accessible on local network
2. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Access from mobile: `http://YOUR_IP:3000`

### Responsive Design Mode (Firefox)
1. Open DevTools (F12)
2. Click Responsive Design Mode icon
3. Test various screen sizes and orientations
