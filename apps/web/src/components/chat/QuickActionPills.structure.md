# QuickActionPills - Component Structure

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  QuickActionPills Container                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [📄 Create invoice] [📈 Cash flow] [🧮 Tax summary]      │  │
│  │  [✉️ Email insights] [🏢 Bank summary]                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  ChatInput Container                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [📎] [🎤] [🕒]  [Type your message...]           [Send]  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
QuickActionPills
├── Container (div with ref, responsive classes)
│   ├── Desktop View (hidden on mobile)
│   │   └── Scroll Container
│   │       └── Pills Container (flex, gap-2)
│   │           ├── Pill Button 1 (quick-action-pill)
│   │           │   ├── Icon (lucide-react)
│   │           │   └── Label (span)
│   │           ├── Pill Button 2
│   │           ├── Pill Button 3
│   │           └── ...
│   │
│   └── Mobile View (hidden on desktop)
│       └── Native Scroll Container
│           └── Pills Container (flex, gap-2, snap)
│               ├── Pill Button 1 (snap-start)
│               ├── Pill Button 2 (snap-start)
│               └── ...
│
└── Styled JSX (scoped styles for scrollbar)
```

## File Structure

```
apps/web/src/components/chat/
├── QuickActionPills.tsx                 # Main component
├── QuickActionPills.example.tsx         # Demo with state management
├── QuickActionPills.integration.md      # Integration guide
├── QuickActionPills.structure.md        # This file
└── QUICK_ACTION_PILLS_SUMMARY.md        # Implementation summary
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  ChatInterface                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  getContextualActions()                          │   │
│  │  ├── Check last message metadata                │   │
│  │  ├── Determine topic (invoice/tax/bank/etc)     │   │
│  │  └── Return QuickAction[] or undefined          │   │
│  └─────────────────────────────────────────────────┘   │
│                        │                                 │
│                        │ quickActions prop               │
│                        ▼                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ChatInput                                       │   │
│  │  ├── Pass quickActions to QuickActionPills      │   │
│  │  └── Handle onActionClick                       │   │
│  └─────────────────────────────────────────────────┘   │
│                        │                                 │
│                        │ contextualActions prop          │
│                        ▼                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  QuickActionPills                                │   │
│  │  ├── Use contextual or default actions          │   │
│  │  ├── Render pills with GSAP animation           │   │
│  │  └── onClick → onActionClick(action.action)     │   │
│  └─────────────────────────────────────────────────┘   │
│                        │                                 │
│                        │ action string                   │
│                        ▼                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  handleQuickActionClick()                        │   │
│  │  ├── setValue(action)                           │   │
│  │  ├── Focus textarea                             │   │
│  │  └── Auto-expand textarea                       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Animation Timeline (GSAP)

```
Time:  0ms      60ms     120ms    180ms    240ms    300ms
       │        │        │        │        │        │
Pill1: [fade in + scale up + slide up] ─────────────┘
       │        │        │        │        │        │
Pill2: ─────────[fade in + scale up + slide up] ────┘
       │        │        │        │        │        │
Pill3: ──────────────────[fade in + scale up + slide up]
       │        │        │        │        │        │
Pill4: ───────────────────────────[fade in + scale up + slide up]
       │        │        │        │        │        │
Pill5: ────────────────────────────────────[fade in + scale up + slide up]

Initial State:         Final State:
opacity: 0            opacity: 1
scale: 0.85           scale: 1
y: 8px                y: 0

Duration: 0.35s per pill
Stagger: 0.06s between pills
Easing: back.out(1.4)
```

## Responsive Breakpoints

```
Mobile (< 768px):                Desktop (≥ 768px):
┌──────────────────────┐        ┌─────────────────────────────────┐
│ [📄] [📈] [🧮]  →   │        │ [📄 Create invoice] [📈 Cash...]│
│                      │        │ [🧮 Tax summary] [✉️ Email...]  │
│ Native scroll        │        │                                 │
│ Snap to start        │        │ Custom scrollbar (4px)          │
│ Hidden scrollbar     │        │ Visible on hover                │
│ Padding: 10px 16px   │        │ Padding: 8px 16px               │
│ Min-height: 44px     │        │ Height: auto                    │
│ Touch-optimized      │        │ Mouse-optimized                 │
└──────────────────────┘        └─────────────────────────────────┘
```

## State Management

```
QuickActionPills (Stateless - receives props)
├── contextualActions?: QuickAction[]  (from parent)
├── onActionClick: (action: string) => void  (callback)
└── className?: string  (optional styling)

ChatInput (Manages local input state)
├── value: string  (controlled input value)
├── setValue: (value: string) => void  (state setter)
├── quickActions?: QuickAction[]  (passed to QuickActionPills)
└── handleQuickActionClick(action)
    ├── setValue(action)
    ├── Focus textarea
    └── Auto-expand textarea

ChatInterface (Manages conversation state)
├── messages: ChatMessage[]  (conversation history)
├── activeConversation: Conversation  (current conversation)
└── getContextualActions()
    ├── Analyze last message
    ├── Determine topic/context
    └── Return QuickAction[] | undefined
```

## Styling Architecture

```
Component Level:
├── Wrapper div
│   ├── py-2, px-3 (mobile), px-4 (desktop)
│   ├── border-t
│   └── background: var(--color-surface)
│
├── Desktop Container (.hidden.md:block)
│   └── Custom scrollbar (styled via JSX)
│       ├── height: 4px
│       ├── thumb: var(--color-border)
│       └── hover: var(--color-text-muted)
│
├── Mobile Container (.md:hidden)
│   └── Native scroll
│       ├── scrollbarWidth: none
│       ├── -ms-overflow-style: none
│       └── ::-webkit-scrollbar: display none
│
└── Pill Button (.quick-action-pill)
    ├── Static styles (inline)
    │   ├── background: var(--color-accent-light)
    │   ├── color: var(--color-primary-dark)
    │   ├── borderRadius: var(--radius-full)
    │   └── transition: var(--transition-fast)
    │
    └── Hover/Focus (scoped JSX)
        ├── background: var(--color-secondary-light)
        ├── box-shadow: var(--shadow-sm)
        └── focus: box-shadow: var(--shadow-focus)
```

## Icon Mapping

```typescript
Default Actions Icons:
FileText       → 📄 Create invoice
TrendingUp     → 📈 Cash flow forecast
Calculator     → 🧮 Tax summary
Mail           → ✉️  Email insights
Building2      → 🏢 Bank summary

Contextual Actions Examples:
CheckCircle    → ✓  Mark as paid
ArrowRight     → →  Next item
AlertCircle    → ⚠  Alerts/warnings
Download       → ⬇  Download/export
Upload         → ⬆  Upload/import
```

## Accessibility Tree

```
<div role="region" aria-label="Quick actions">
  <div>
    <button aria-label="Quick action: Create invoice">
      <FileText aria-hidden="true" />
      <span>Create invoice</span>
    </button>
    <button aria-label="Quick action: Cash flow">
      <TrendingUp aria-hidden="true" />
      <span>Cash flow</span>
    </button>
    <!-- ... more buttons -->
  </div>
</div>
```

## Event Flow

```
User Interaction:
1. User clicks pill button
   ↓
2. onClick handler triggered
   ↓
3. onActionClick(action.action) called
   ↓
4. Parent's handleQuickActionClick receives action string
   ↓
5. setValue(action) updates input value
   ↓
6. textareaRef.current?.focus() focuses input
   ↓
7. Auto-expand logic adjusts textarea height
   ↓
8. User sees action text in input, cursor focused
```

## Performance Optimization Points

```
1. GSAP Context Cleanup
   useLayoutEffect(() => {
     const ctx = gsap.context(...);
     return () => ctx.revert(); // ← Cleanup
   }, [actions]);

2. Conditional Rendering
   if (!actions || actions.length === 0) {
     return null; // ← No DOM overhead
   }

3. Memo Opportunities (future)
   - Memoize getContextualActions result
   - Memoize pill rendering if actions stable
   - Use React.memo for QuickActionPills

4. Native Scroll
   - No JavaScript scroll handling
   - Browser-optimized performance
   - Hardware acceleration
```

## Testing Structure

```
QuickActionPills.test.tsx (recommended)
├── Rendering Tests
│   ├── Renders with default actions
│   ├── Renders with contextual actions
│   ├── Returns null when no actions
│   └── Applies custom className
│
├── Interaction Tests
│   ├── Calls onActionClick with correct action
│   ├── All pills are clickable
│   └── Keyboard navigation works
│
├── Animation Tests
│   ├── GSAP animation runs on mount
│   ├── Animation cleanup on unmount
│   └── Re-animates when actions change
│
├── Responsive Tests
│   ├── Shows desktop view on large screens
│   ├── Shows mobile view on small screens
│   └── Scroll behavior works
│
└── Accessibility Tests
    ├── All buttons have aria-labels
    ├── Icons are aria-hidden
    ├── Keyboard focus visible
    └── Touch targets ≥ 44px on mobile
```
