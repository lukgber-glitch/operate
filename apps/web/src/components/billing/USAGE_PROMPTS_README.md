# Usage Prompts System

## Overview

The Usage Prompts System provides non-intrusive upgrade prompts that appear when users approach or reach their tier limits. This system helps convert free users to paid tiers and encourages upgrades when limits are reached.

## Components

### 1. **UsageManager** (Main Orchestrator)
**Location**: `components/billing/UsageManager.tsx`

The main component that manages the display of usage warnings and limit modals throughout the dashboard. It automatically:
- Shows banners at 80% usage
- Shows blocking modals at 100% usage
- Prioritizes AI messages > bank connections > invoices

**Usage**:
```tsx
import { UsageManager } from '@/components/billing';

// In layout.tsx or main dashboard
<UsageManager />
```

### 2. **UsageBanner** (Soft Warning)
**Location**: `components/billing/UsageBanner.tsx`

A non-intrusive yellow/amber warning banner that slides in from the top at 80% usage.

**Features**:
- GSAP slide-in animation from top
- Dismissible with localStorage tracking (once per day)
- Shows current usage percentage
- Clear upgrade CTA button
- Auto-dismisses after user interaction

**Props**:
```tsx
interface UsageBannerProps {
  percentage: number;
  used: number;
  limit: number;
  resourceType: 'AI messages' | 'bank connections' | 'invoices';
  onDismiss?: () => void;
  className?: string;
}
```

### 3. **UsageLimitModal** (Blocking Modal)
**Location**: `components/billing/UsageLimitModal.tsx`

A blocking modal that appears when users hit 100% of any limit.

**Features**:
- Shows all usage stats with progress indicators
- Compares current plan to recommended upgrade
- Displays upgrade pricing and features
- Can be dismissed once per day
- Clear upgrade path to billing settings

**Props**:
```tsx
interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage: UsageLimits;
}
```

### 4. **UsageIndicator** (Progress Bar)
**Location**: `components/billing/UsageIndicator.tsx`

A small progress bar component showing current usage with color-coded status.

**Features**:
- Color changes: green → yellow → red based on percentage
- Shows used/limit text
- Displays percentage when >= 80%
- Smooth transitions

**Props**:
```tsx
interface UsageIndicatorProps {
  label: string;
  used: number;
  limit: number;
  percentage: number;
  className?: string;
}
```

### 5. **UpgradeCard** (Plan Comparison)
**Location**: `components/billing/UpgradeCard.tsx`

A compact card comparing the current plan to the recommended upgrade.

**Features**:
- Side-by-side plan comparison
- Highlights key improvements
- Shows pricing for both plans
- Optional 14-day trial badge
- One-click upgrade CTA

**Props**:
```tsx
interface UpgradeCardProps {
  currentPlan: string;
  upgradePlan: string;
  currentPrice: string;
  upgradePrice: string;
  features: PlanFeature[];
  onUpgrade: () => void;
  className?: string;
  showTrialBadge?: boolean;
}
```

## Hook

### **useUsageCheck**
**Location**: `hooks/use-usage-check.ts`

Hook to check user's usage status against their plan limits.

**Features**:
- Fetches from `/api/v1/usage/limits`
- Caches results for 5 minutes
- Returns computed `showBanner` and `showModal` flags
- Auto-refetches on stale data

**Usage**:
```tsx
import { useUsageCheck } from '@/hooks/use-usage-check';

const { showBanner, showModal, usage, isLoading, refetch } = useUsageCheck();
```

**Return Type**:
```tsx
interface UsageCheckResult {
  showBanner: boolean;      // True at 80-99% usage
  showModal: boolean;        // True at 100% usage
  usage: UsageLimits | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

## API Integration

### Required Backend Endpoint

**Endpoint**: `GET /api/v1/usage/limits`

**Response Structure**:
```json
{
  "aiMessages": {
    "used": 85,
    "limit": 100,
    "percentage": 85
  },
  "bankConnections": {
    "used": 2,
    "limit": 5,
    "percentage": 40
  },
  "invoices": {
    "used": 50,
    "limit": 100,
    "percentage": 50
  },
  "plan": {
    "name": "Free Plan",
    "tier": "free"
  }
}
```

**Tier Values**: `"free"` | `"starter"` | `"pro"` | `"enterprise"`

## Design Tokens

The components use design tokens from `globals.css`:

### Colors
- `--color-primary`: Primary brand color
- `--color-warning`: Amber/yellow for warnings (80%)
- `--color-error`: Red for limits (100%)
- `--color-success`: Green for healthy usage

### Spacing
- Uses 8px spacing system (`--space-*`)

### Animations
- GSAP for banner slide-in/out
- Smooth transitions using `--transition-base` (250ms)

## Usage Flow

### 1. Banner Trigger (80% Usage)
1. User reaches 80% of any limit
2. `UsageManager` detects via `useUsageCheck` hook
3. `UsageBanner` slides in from top with GSAP animation
4. User can:
   - Click "Upgrade" → Redirects to `/settings/billing`
   - Click "Dismiss" → Hides for 24 hours (localStorage)

### 2. Modal Trigger (100% Usage)
1. User reaches 100% of any limit
2. `UsageManager` shows `UsageLimitModal`
3. Modal displays:
   - All usage stats with progress bars
   - Current plan vs recommended upgrade
   - Pricing and feature comparison
4. User can:
   - Click "View Pricing" → Redirects to `/settings/billing`
   - Click "Remind Me Later" → Hides for 24 hours (localStorage)

### 3. Dismissal Tracking
Both banner and modal track dismissals in `localStorage`:
- **Banner**: `usage-banner-dismissed-{resourceType}` = `{date string}`
- **Modal**: `usage-limit-modal-dismissed` = `{date string}`

These reset daily, so users see prompts again the next day.

## Integration Points

### Dashboard Layout
**File**: `app/(dashboard)/layout.tsx`

```tsx
import { UsageManager } from '@/components/billing';

// Inside layout component
<UsageManager />
```

### Settings/Billing Page
Use individual components for detailed usage display:

```tsx
import { UsageIndicator, UpgradeCard } from '@/components/billing';

// Show usage stats
<UsageIndicator
  label="AI Messages"
  used={85}
  limit={100}
  percentage={85}
/>

// Show upgrade options
<UpgradeCard
  currentPlan="Free Plan"
  upgradePlan="Starter"
  currentPrice="Free"
  upgradePrice="$29/month"
  features={features}
  onUpgrade={handleUpgrade}
  showTrialBadge
/>
```

## Customization

### Thresholds
Edit in `hooks/use-usage-check.ts`:
```tsx
const USAGE_WARNING_THRESHOLD = 80;  // Show banner
const USAGE_LIMIT_THRESHOLD = 100;   // Show modal
```

### Resource Priority
Edit in `components/billing/UsageManager.tsx`:
```tsx
// Current priority: AI messages > bank connections > invoices
const getBannerResource = () => {
  if (usage.aiMessages.percentage >= 80) return aiMessagesData;
  if (usage.bankConnections.percentage >= 80) return bankConnectionsData;
  if (usage.invoices.percentage >= 80) return invoicesData;
  return null;
};
```

### Animation Settings
Edit GSAP animations in `UsageBanner.tsx`:
```tsx
gsap.fromTo(bannerRef.current, {
  y: -100,           // Start position
  opacity: 0,
}, {
  y: 0,              // End position
  opacity: 1,
  duration: 0.5,     // Animation duration
  ease: 'power2.out' // Easing function
});
```

## Testing

### Test Different States

```tsx
// 80% usage (banner)
const mockUsage80: UsageLimits = {
  aiMessages: { used: 80, limit: 100, percentage: 80 },
  bankConnections: { used: 2, limit: 5, percentage: 40 },
  invoices: { used: 50, limit: 100, percentage: 50 },
  plan: { name: 'Free Plan', tier: 'free' },
};

// 100% usage (modal)
const mockUsage100: UsageLimits = {
  aiMessages: { used: 100, limit: 100, percentage: 100 },
  bankConnections: { used: 5, limit: 5, percentage: 100 },
  invoices: { used: 100, limit: 100, percentage: 100 },
  plan: { name: 'Free Plan', tier: 'free' },
};

// Render with mock data
<UsageManager />
```

### Clear localStorage for Testing
```tsx
// Clear all dismissals
localStorage.removeItem('usage-banner-dismissed-AI messages');
localStorage.removeItem('usage-banner-dismissed-bank connections');
localStorage.removeItem('usage-banner-dismissed-invoices');
localStorage.removeItem('usage-limit-modal-dismissed');
```

## Accessibility

- All components use semantic HTML
- Proper ARIA labels on buttons
- Keyboard navigation support
- Focus management in modals
- Screen reader announcements for status changes

## Performance

- Components use React Query for caching
- 5-minute stale time prevents excessive API calls
- LocalStorage for dismissal state (no server calls)
- GSAP animations are GPU-accelerated
- Conditional rendering (only show when needed)

## Future Enhancements

1. **A/B Testing**: Track conversion rates for different messages
2. **Smart Timing**: Show prompts at optimal times (not during critical tasks)
3. **Personalization**: Customize messages based on user behavior
4. **Analytics**: Track banner/modal impressions and conversions
5. **Multi-language**: Add i18n support for messages
6. **Snooze Options**: Let users choose snooze duration (1 day, 3 days, 1 week)
7. **Preview Mode**: Admin toggle to preview prompts at any usage level
