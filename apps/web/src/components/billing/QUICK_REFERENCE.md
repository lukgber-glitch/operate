# Trial Components - Quick Reference Card

## Import & Use

```typescript
import { TrialManager } from '@/components/billing';
import { useTrialStatus } from '@/hooks/use-trial-status';

// Already integrated in dashboard layout - no action needed!
// But if you need manual control:

function MyComponent() {
  const trial = useTrialStatus();

  if (trial.isUrgent) {
    // Show urgent messaging
  }
}
```

## Hook API

```typescript
const {
  isOnTrial,      // boolean - currently on trial?
  daysRemaining,  // number | null - days left
  trialEndDate,   // Date | null - when trial ends
  isExpired,      // boolean - trial ended?
  isUrgent,       // boolean - ≤3 days remaining?
  tier,           // string | null - current tier
} = useTrialStatus();
```

## Component Props

### TrialBanner
```typescript
<TrialBanner
  daysRemaining={7}
  totalTrialDays={14}  // optional, default: 14
  isUrgent={false}     // optional, auto-calculated
  onDismiss={() => {}} // optional
  className=""         // optional
/>
```

### TrialCountdown
```typescript
<TrialCountdown
  daysRemaining={7}
  isUrgent={false}  // optional
  className=""      // optional
/>
```

### TrialWelcome
```typescript
<TrialWelcome
  onGetStarted={() => {}}
  className=""  // optional
/>
```

### TrialEndModal
```typescript
<TrialEndModal
  isOpen={true}
  onClose={() => {}}
  onUpgrade={() => {}}
/>
```

### TrialManager
```typescript
<TrialManager />  // No props - fully automatic
```

## LocalStorage Keys

```typescript
// Check if user has seen components
localStorage.getItem('hasSeenTrialWelcome')  // 'true' | null
localStorage.getItem('hasSeenTrialEnd')      // 'true' | null
localStorage.getItem('trialBannerDismissed') // 'true' | null

// Reset for testing
localStorage.removeItem('hasSeenTrialWelcome');
localStorage.removeItem('hasSeenTrialEnd');
localStorage.removeItem('trialBannerDismissed');
```

## States & Thresholds

```typescript
// Normal State: 4-14 days remaining
isUrgent = false
color = blue
animation = none

// Urgent State: 1-3 days remaining
isUrgent = true
color = orange
animation = pulse (1s infinite)

// Expired: 0 or negative days
isExpired = true
tier = 'FREE'
```

## API Contract

```typescript
// Endpoint
GET /api/subscription/:orgId

// Response
{
  tier: 'FREE' | 'PRO' | 'ENTERPRISE',
  status: 'TRIALING' | 'ACTIVE' | 'CANCELED',
  trialEnd: '2024-01-15T00:00:00Z' | null,
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
}
```

## Testing Checklist

```bash
# Test Welcome Screen
□ Remove localStorage key
□ Refresh page
□ Verify modal shows
□ Click "Get Started"
□ Verify key is set

# Test Normal Banner (7 days)
□ Mock API: 7 days remaining
□ Verify blue theme
□ Verify calm messaging
□ Click dismiss
□ Verify dismissal persists

# Test Urgent Banner (2 days)
□ Mock API: 2 days remaining
□ Verify orange theme
□ Verify pulsing animation
□ Verify urgent messaging

# Test End Modal
□ Mock API: tier='FREE', expired trial
□ Remove localStorage key
□ Refresh page
□ Verify modal shows
□ Test both CTAs

# Test Mobile Responsive
□ Resize to 375px width
□ Verify single column layout
□ Verify touch targets ≥44px
□ Test all components

# Test Dark Mode
□ Toggle dark mode
□ Verify colors readable
□ Verify contrast ratios
□ Check all components

# Test Accessibility
□ Tab through all elements
□ Verify focus indicators
□ Test with screen reader
□ Verify ARIA labels
□ Test keyboard shortcuts
```

## Common Modifications

### Change Urgency Threshold
```typescript
// In use-trial-status.ts
const isUrgent = daysRemaining > 0 && daysRemaining <= 5; // Changed to 5
```

### Change Trial Length
```typescript
// Backend: .env
SUBSCRIPTION_TRIAL_DAYS=30

// Frontend: TrialBanner
totalTrialDays={30}
```

### Customize Messaging
```typescript
// In TrialBanner.tsx
{isUrgent ? (
  <>Custom urgent message</>
) : (
  <>Custom normal message</>
)}
```

### Add Analytics
```typescript
// In TrialManager.tsx
useEffect(() => {
  if (showWelcome) {
    analytics.track('trial_welcome_shown');
  }
}, [showWelcome]);
```

## File Locations

```
apps/web/src/
├── components/billing/
│   ├── TrialManager.tsx       ← Main orchestrator
│   ├── TrialBanner.tsx        ← Persistent banner
│   ├── TrialCountdown.tsx     ← Timer widget
│   ├── TrialWelcome.tsx       ← First-time modal
│   ├── TrialEndModal.tsx      ← Expiration modal
│   ├── index.ts               ← Exports
│   ├── README.md              ← Full docs
│   ├── VISUAL_GUIDE.md        ← Visual layouts
│   └── QUICK_REFERENCE.md     ← This file
│
├── hooks/
│   └── use-trial-status.ts    ← Trial data hook
│
└── app/(dashboard)/
    └── layout.tsx             ← Integration point
```

## Troubleshooting

### Welcome doesn't show
```typescript
// Check localStorage
console.log(localStorage.getItem('hasSeenTrialWelcome'));
// Should be null to show

// Check trial status
const trial = useTrialStatus();
console.log(trial.isOnTrial); // Should be true
```

### Banner doesn't appear
```typescript
// Check trial status
const trial = useTrialStatus();
console.log(trial); // Verify data

// Check dismissal
console.log(localStorage.getItem('trialBannerDismissed'));
// Should be null to show

// Check subscription API
fetch('/api/subscription/YOUR_ORG_ID')
  .then(r => r.json())
  .then(console.log);
```

### Animations not smooth
```typescript
// Check GSAP is loaded
console.log(typeof gsap); // Should be 'object'

// Check GPU acceleration
// In DevTools > Rendering > Paint flashing
// Green = GPU accelerated ✓
// Red = CPU rendered ✗
```

### API errors
```typescript
// Check network tab
// Look for 401 (unauthorized) or 404 (not found)

// Verify orgId
const { user } = useAuth();
console.log(user.orgId); // Should have value

// Test endpoint directly
curl http://localhost:3000/api/subscription/ORG_ID
```

## Performance Tips

```typescript
// ✓ Good - Hook refreshes every 5 minutes
const trial = useTrialStatus(); // Auto-cached

// ✗ Bad - Fetching on every render
const [data, setData] = useState(null);
useEffect(() => {
  fetch('/api/subscription').then(...);
}, []); // Use hook instead!

// ✓ Good - Components only render when needed
{trial.isOnTrial && <TrialBanner />}

// ✗ Bad - Always rendering hidden
<TrialBanner style={{ display: trial.isOnTrial ? 'block' : 'none' }} />
```

## Design Token Reference

```css
/* Colors */
--color-primary: #04BDA5        /* Teal */
--color-warning: #F59E0B        /* Amber */
--color-error: #EF4444          /* Red */

/* Spacing */
--space-4: 16px
--space-6: 24px
--space-8: 32px

/* Border Radius */
--radius-lg: 12px
--radius-xl: 16px

/* Shadows */
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)

/* Transitions */
--transition-base: 250ms ease-in-out
--transition-slow: 350ms ease-in-out
```

## Git Workflow

```bash
# Created files
git add apps/web/src/components/billing/Trial*.tsx
git add apps/web/src/hooks/use-trial-status.ts
git add apps/web/src/components/billing/*.md

# Modified files
git add apps/web/src/components/billing/index.ts
git add apps/web/src/app/\(dashboard\)/layout.tsx

# Commit
git commit -m "feat: add trial expiration flow with countdown and notifications"

# Before production
git rm apps/web/src/components/billing/TrialDemo.tsx
git commit -m "chore: remove trial demo component"
```

## Production Deployment

```bash
# 1. Build check
npm run build

# 2. Type check
npm run type-check

# 3. Lint check
npm run lint

# 4. Remove demo
rm apps/web/src/components/billing/TrialDemo.tsx

# 5. Update index.ts (remove TrialDemo export if added)

# 6. Test production build
npm run build
npm run start

# 7. Verify components work
# Visit: http://localhost:3000
```

## Support Contacts

- **Frontend Issues**: PRISM agent
- **Backend API**: FORGE agent
- **Database**: VAULT agent
- **Subscription Module**: See `apps/api/src/modules/subscription/`

---

**Quick Reference v1.0** | Last Updated: 2025-12-07
