# Trial Expiration Components

This directory contains all components related to the 14-day free trial experience.

## Components

### `TrialManager`
Central orchestrator that manages all trial-related UI. Automatically shows the appropriate component based on trial state and user interactions.

**Usage:**
```tsx
import { TrialManager } from '@/components/billing';

// Already integrated in dashboard layout
<TrialManager />
```

**Features:**
- Tracks what user has seen via localStorage
- Shows TrialWelcome on first trial login
- Shows TrialBanner during trial (dismissible)
- Shows TrialEndModal when trial expires
- Handles all state management automatically

### `TrialBanner`
Persistent banner showing trial status with progress bar and countdown.

**Props:**
```typescript
interface TrialBannerProps {
  daysRemaining: number;
  totalTrialDays?: number; // default: 14
  isUrgent?: boolean; // true for ≤3 days
  onDismiss?: () => void;
  className?: string;
}
```

**Features:**
- Visual progress bar (fills as trial progresses)
- Different styling for urgent state (≤3 days)
- GSAP pulse animation when urgent
- "Upgrade Now" CTA
- Dismissible (state saved in localStorage)

### `TrialCountdown`
Compact countdown timer showing days/hours remaining.

**Props:**
```typescript
interface TrialCountdownProps {
  daysRemaining: number;
  isUrgent?: boolean;
  className?: string;
}
```

**Features:**
- Shows days + hours remaining
- Animated number transitions (GSAP)
- Color-coded urgency (blue → orange)
- Clock icon pulses when urgent

### `TrialWelcome`
Welcome screen for new trial users showing features and checklist.

**Props:**
```typescript
interface TrialWelcomeProps {
  onGetStarted: () => void;
  className?: string;
}
```

**Features:**
- Feature grid showcasing Pro capabilities
- Checklist of things to try
- GSAP entrance animations
- Staggered card animations

### `TrialEndModal`
Modal shown when trial expires, comparing Free vs Pro tiers.

**Props:**
```typescript
interface TrialEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}
```

**Features:**
- Feature comparison table (Free vs Pro)
- Pricing display
- Strong upgrade CTA
- Option to continue with Free tier
- GSAP entrance animation

## Hook

### `useTrialStatus`
React hook to access trial status information.

**Returns:**
```typescript
interface TrialStatus {
  isOnTrial: boolean;
  daysRemaining: number | null;
  trialEndDate: Date | null;
  isExpired: boolean;
  isUrgent: boolean; // ≤3 days
  tier: string | null;
}
```

**Usage:**
```tsx
import { useTrialStatus } from '@/hooks/use-trial-status';

function MyComponent() {
  const trial = useTrialStatus();

  if (trial.isUrgent) {
    // Show urgent messaging
  }
}
```

## Trial Timeline

1. **Day 1** - Trial starts
   - User sees TrialWelcome modal (once)
   - TrialBanner appears in dashboard

2. **Day 1-11** - Normal state
   - TrialBanner shows "X days remaining"
   - Blue color scheme
   - Gentle upgrade messaging

3. **Day 12-14** - Urgent state
   - TrialBanner turns orange/amber
   - Pulse animations activate
   - "Only X days left!" messaging
   - Stronger upgrade CTAs

4. **Day 14+** - Trial expired
   - TrialEndModal shows (once)
   - User downgraded to Free tier
   - Feature comparison displayed
   - Option to upgrade or continue with Free

## LocalStorage Keys

- `hasSeenTrialWelcome` - Boolean, prevents showing welcome again
- `hasSeenTrialEnd` - Boolean, prevents showing end modal again
- `trialBannerDismissed` - Boolean, hides banner until page refresh

## Styling

All components use design tokens from `globals.css`:
- Colors: `--color-primary`, `--color-warning`, etc.
- Spacing: `--space-*`
- Borders: `--radius-*`
- Shadows: `--shadow-*`

Urgent states use warm colors (orange/amber) with pulse animations.

## Animations

All animations use GSAP for smooth, professional transitions:
- Number countdowns
- Entrance animations
- Pulse effects for urgency
- Staggered card reveals

## Integration

The TrialManager is already integrated into the dashboard layout at:
`apps/web/src/app/(dashboard)/layout.tsx`

No additional setup required - it works automatically!

## API Requirements

Components expect a subscription API endpoint at:
`GET /api/subscription/:orgId`

Response should include:
```typescript
{
  tier: 'FREE' | 'PRO' | 'ENTERPRISE',
  status: 'TRIALING' | 'ACTIVE' | 'CANCELED' | ...,
  trialEnd: '2024-01-15T00:00:00Z' | null,
  // ... other subscription data
}
```

## Testing

To test different trial states, modify the API response or localStorage:

```javascript
// Show welcome screen again
localStorage.removeItem('hasSeenTrialWelcome');

// Show end modal again
localStorage.removeItem('hasSeenTrialEnd');

// Un-dismiss banner
localStorage.removeItem('trialBannerDismissed');
```

## Future Enhancements

- Email integration for trial reminders (Day 7, Day 12)
- In-app notification system integration
- Analytics tracking for trial conversion
- A/B testing different messaging
- Personalized feature recommendations based on usage
