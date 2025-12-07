# Usage Prompts User Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER ACTIVITY                                │
│  (Using AI messages, creating invoices, adding bank accounts)   │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Usage Tracking (API)   │
                    │  /api/v1/usage/limits   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   useUsageCheck Hook    │
                    │   (5-min cache)         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
          ┌─────────▼─────────┐    ┌─────────▼─────────┐
          │  80-99% Usage     │    │   100% Usage      │
          │  (Warning Zone)   │    │  (Limit Reached)  │
          └────────┬──────────┘    └─────────┬─────────┘
                   │                          │
                   ▼                          ▼
          ┌─────────────────┐       ┌──────────────────┐
          │  UsageBanner    │       │ UsageLimitModal  │
          │  (Soft Warning) │       │ (Blocking Modal) │
          └────────┬────────┘       └─────────┬────────┘
                   │                           │
          ┌────────┴────────┐         ┌────────┴────────┐
          │                 │         │                 │
     ┌────▼────┐      ┌────▼────┐    │           ┌─────▼─────┐
     │ Dismiss │      │ Upgrade │    │           │  Upgrade  │
     │(24 hrs) │      │         │    │           │           │
     └────┬────┘      └────┬────┘    │           └─────┬─────┘
          │                │         │                 │
          │                │         │                 │
          ▼                ▼         ▼                 ▼
     localStorage    /settings/  Remind Later   /settings/
     tracking        billing    (24 hrs)        billing
```

## State Transitions

### Healthy Usage (< 80%)
```
┌──────────────────────────────┐
│  No warnings shown            │
│  User can use all features    │
│  Usage stats available        │
│  in settings if requested     │
└──────────────────────────────┘
```

### Warning Zone (80-99%)
```
┌──────────────────────────────┐
│  ⚠️  UsageBanner appears      │
│  Slides in from top (GSAP)    │
│  Yellow/amber styling         │
│  Shows: "80% of AI messages   │
│          used this month"     │
│                               │
│  Actions:                     │
│  • Upgrade → /settings/billing│
│  • Dismiss → Hide for 24hrs   │
└──────────────────────────────┘
```

### Limit Reached (100%)
```
┌──────────────────────────────┐
│  🚫 UsageLimitModal appears   │
│  Overlay blocks screen        │
│  Red/error styling            │
│  Shows: All usage stats       │
│         Plan comparison       │
│         Upgrade options       │
│                               │
│  Actions:                     │
│  • View Pricing → billing page│
│  • Remind Later → Hide 24hrs  │
└──────────────────────────────┘
```

## User Journey Example

### Scenario: Free Tier User - AI Message Limit

#### Day 1-20: Normal Usage
```
Status: 70/100 AI messages (70%)
Display: No prompts shown
Action: User continues working normally
```

#### Day 21: Warning Threshold
```
Status: 82/100 AI messages (82%)
Display: Yellow banner slides in from top
Message: "You've used 82% of your AI messages this month"
CTA: [Upgrade] [Dismiss]

User Action 1: Click "Dismiss"
Result: Banner hides, localStorage set, reappears tomorrow

User Action 2: Click "Upgrade"
Result: Redirect to /settings/billing, banner dismissed
```

#### Day 25: Approaching Limit
```
Status: 95/100 AI messages (95%)
Display: Yellow banner (if not dismissed today)
Message: "You've used 95% of your AI messages this month"
Note: More urgent, but still non-blocking
```

#### Day 27: Limit Reached
```
Status: 100/100 AI messages (100%)
Display: Modal appears, blocks screen
Message: "You've Reached Your AI messages Limit"

Shows:
• All usage indicators (AI, banks, invoices)
• Current plan: Free ($0/mo)
• Recommended: Starter ($29/mo)
• Feature comparison with highlights
• 14-day trial badge

User Action 1: Click "Remind Me Later"
Result: Modal dismisses for 24 hours
Note: User may be blocked from sending more AI messages

User Action 2: Click "View Pricing"
Result: Redirect to /settings/billing
Note: User can upgrade immediately
```

## Component Interaction Flow

### 1. Page Load Sequence
```
Dashboard Layout renders
       ↓
UsageManager mounts
       ↓
useUsageCheck hook initializes
       ↓
Fetch /api/v1/usage/limits (or use cache)
       ↓
Data returned
       ↓
Compute showBanner & showModal flags
       ↓
Conditionally render components
```

### 2. Banner Display Logic
```typescript
if (usage.aiMessages.percentage >= 80 &&
    usage.aiMessages.percentage < 100 &&
    !dismissedToday) {

  showBanner = true
  resourceType = 'AI messages'

  GSAP animation: slide in from top
}
```

### 3. Modal Display Logic
```typescript
if (usage.aiMessages.percentage >= 100 ||
    usage.bankConnections.percentage >= 100 ||
    usage.invoices.percentage >= 100) {

  showModal = true

  Display all usage stats
  Show recommended upgrade
}
```

### 4. Dismissal Tracking
```typescript
// Banner dismissal
localStorage.setItem(
  'usage-banner-dismissed-AI messages',
  new Date().toDateString()
)

// Modal dismissal
localStorage.setItem(
  'usage-limit-modal-dismissed',
  new Date().toDateString()
)

// Check on next render
const lastDismissed = localStorage.getItem(key)
const today = new Date().toDateString()
const dismissedToday = (lastDismissed === today)
```

## Priority Logic

When multiple resources are at warning levels, display in this order:

### 1. AI Messages (Highest Priority)
```
Rationale: Core product feature, highest engagement
Show banner for AI messages first
```

### 2. Bank Connections (Medium Priority)
```
Rationale: Critical for financial tracking
Show if AI messages < 80%
```

### 3. Invoices (Lowest Priority)
```
Rationale: Important but less urgent
Show if both AI messages and banks < 80%
```

Example:
```
Status:
• AI Messages: 75% ❌ Don't show
• Bank Connections: 85% ⚠️ Would show, but...
• Invoices: 90% ⚠️ Would show, but...

Result: No banner (AI messages takes priority and isn't at 80% yet)
```

```
Status:
• AI Messages: 85% ⚠️ SHOW THIS
• Bank Connections: 90% ⚠️ Don't show
• Invoices: 95% ⚠️ Don't show

Result: Show banner for "AI messages" only
```

## Modal vs Banner Decision Tree

```
                    Usage Check
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     < 80% usage    80-99% usage   100% usage
          │              │              │
          ▼              ▼              ▼
    No prompts      Show Banner    Show Modal
    shown           (Warning)      (Blocking)
          │              │              │
          └──────────────┴──────────────┘
                         │
                   User Action
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Dismiss        Ignore        Upgrade
          │              │              │
          ▼              ▼              ▼
    Hide for 24hrs  Keep showing  Go to billing
```

## Animation Timeline

### Banner Slide-In
```
t=0ms:   y=-100px, opacity=0 (off-screen top)
         ↓ GSAP animation
t=500ms: y=0px, opacity=1 (visible)
         ↓
         User sees banner
```

### Banner Slide-Out
```
t=0ms:   y=0px, opacity=1 (visible)
         ↓ User clicks dismiss
         ↓ GSAP animation
t=300ms: y=-100px, opacity=0 (off-screen top)
         ↓
         localStorage updated
         Component unmounted
```

### Modal Fade-In
```
t=0ms:   opacity=0 (hidden)
         ↓ Radix UI Dialog animation
t=200ms: opacity=1 (visible)
         ↓
         Overlay blocks screen
```

## Edge Cases Handled

### 1. Multiple Resources at 100%
```
All resources show in modal
User sees comprehensive usage overview
Upgrade card shows benefits for all limits
```

### 2. User Upgrades Mid-Session
```
useUsageCheck refetches data
New limits reflected immediately
Prompts disappear if under new limits
```

### 3. Network Error
```
useUsageCheck returns error
No prompts shown (graceful degradation)
User can continue working
Retry on next interval (5 min)
```

### 4. Unlimited Plan
```
limit: -1 indicates unlimited
Percentage calculation skipped
No prompts shown for that resource
```

### 5. First-time User
```
No localStorage dismissal data
Prompts show immediately when threshold reached
User learns about limits organically
```

## A/B Testing Opportunities

### Test 1: Threshold Variations
- **A**: 80% warning
- **B**: 90% warning
- **Metric**: Upgrade conversion rate

### Test 2: Messaging Variants
- **A**: "You've used 80% of your AI messages"
- **B**: "Only 20 AI messages remaining"
- **Metric**: Click-through rate

### Test 3: Dismissal Duration
- **A**: 24-hour dismissal
- **B**: 7-day dismissal with reminder
- **Metric**: User satisfaction vs. conversion

### Test 4: Modal vs. Inline
- **A**: Full-screen modal
- **B**: Persistent inline banner
- **Metric**: Upgrade rate vs. annoyance

## Performance Optimization

### Caching Strategy
```
1st call:  Fetch from API → Cache for 5 min
2nd call:  Return from cache (instant)
...
After 5min: Fetch from API → Update cache
```

### Lazy Loading
```
Components only render when needed
GSAP loaded on-demand
Modal content loaded on open
```

### Memory Management
```
Cleanup animations on unmount
Remove event listeners
Clear timers
Disconnect observers
```

---

## Quick Reference

### Show Banner When:
- Any resource 80-99% used
- Not dismissed today
- Highest priority resource selected

### Show Modal When:
- Any resource 100% used
- Not dismissed today
- Can show alongside features being blocked

### Update Usage When:
- Page load (from cache if fresh)
- After 5 minutes (stale data)
- Manual refetch() call
- User upgrades plan
