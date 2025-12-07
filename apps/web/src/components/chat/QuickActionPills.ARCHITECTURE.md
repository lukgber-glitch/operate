# QuickActionPills Architecture (S4-05)

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User on Page                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js usePathname() Hook                      │
│              Returns: "/dashboard/invoices"                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         detectContextFromRoute(pathname)                     │
│         Analyzes path and returns context                    │
│                                                              │
│  "/dashboard/invoices" → 'invoices'                         │
│  "/dashboard/expenses" → 'expenses'                         │
│  "/dashboard/hr"       → 'hr'                               │
│  etc.                                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Priority Selection Logic                             │
│                                                              │
│  1. contextualActions prop (if provided) ─────────┐         │
│  2. context prop (if provided) ──────────────┐    │         │
│  3. Auto-detected context from route ────┐   │    │         │
│                                          │   │    │         │
│                                          ▼   ▼    ▼         │
│                              Selected Actions Set           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              contextActions Map Lookup                       │
│                                                              │
│  contextActions['invoices'] = [                             │
│    { icon: FileText, label: 'Create Invoice', ... },       │
│    { icon: Send, label: 'Send Reminders', ... },           │
│    { icon: PieChart, label: 'Revenue Report', ... },       │
│    { icon: AlertCircle, label: 'Overdue Invoices', ... }   │
│  ]                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              GSAP Animation System                           │
│                                                              │
│  useLayoutEffect(() => {                                    │
│    gsap.fromTo(pills, {                                     │
│      opacity: 0, scale: 0.85, y: 8                         │
│    }, {                                                     │
│      opacity: 1, scale: 1, y: 0,                           │
│      duration: 0.35, stagger: 0.06                         │
│    })                                                       │
│  }, [actions])  ← Re-runs when context changes             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Render Quick Action Pills                       │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ 📄 Create    │ │ 📧 Send      │ │ 📊 Revenue   │       │
│  │   Invoice    │ │   Reminders  │ │   Report     │ ...   │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                              │
│  Desktop: Horizontal scroll with scrollbar                  │
│  Mobile: Native scroll with snap                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              User Clicks a Pill                              │
│         onClick={() => onActionClick(action.action)}        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Parent Component (e.g., ChatInput)                   │
│                                                              │
│  handleActionClick(action: string) {                        │
│    setInputValue(action); // Pre-fill chat input           │
│    textareaRef.current?.focus();                           │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Chat Input Filled with Action Text                   │
│         User can edit or send immediately                    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Props Input
  │
  ├─ contextualActions?: QuickAction[]  (Priority 1)
  ├─ context?: QuickActionContext       (Priority 2)
  └─ onActionClick: (action) => void
  │
  ▼
Component State
  │
  ├─ pathname: string (from usePathname())
  ├─ detectedContext: QuickActionContext
  └─ actions: QuickAction[] (selected based on priority)
  │
  ▼
Render Output
  │
  ├─ Desktop Pills (with scrollbar)
  └─ Mobile Pills (with snap scroll)
  │
  ▼
User Interaction
  │
  └─ Click → onActionClick(action.action)
```

## Context Detection Logic

```
Route Pathname
  │
  ▼
┌─────────────────────────────────────┐
│  Remove leading slash               │
│  Convert to lowercase               │
│  path = pathname.replace(/^\//, '') │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  Pattern Matching                   │
│                                     │
│  if (path.includes('invoice'))      │
│    return 'invoices'                │
│                                     │
│  if (path.includes('expense'))      │
│    return 'expenses'                │
│                                     │
│  if (path.includes('hr'))           │
│    return 'hr'                      │
│                                     │
│  // ... more patterns              │
│                                     │
│  else                               │
│    return 'default'                 │
└─────────────────────────────────────┘
```

## Animation Timeline

```
Context Change Detected
  │
  ▼
useLayoutEffect Triggered
  │
  ▼
GSAP Context Created
  │
  ▼
Query All Pills (.quick-action-pill)
  │
  ▼
┌─────────────────────────────────────────────────────┐
│  Animation Sequence (Stagger)                       │
│                                                     │
│  Pill 1: t=0.00s                                   │
│    opacity: 0→1, scale: 0.85→1, y: 8→0            │
│                                                     │
│  Pill 2: t=0.06s (stagger delay)                  │
│    opacity: 0→1, scale: 0.85→1, y: 8→0            │
│                                                     │
│  Pill 3: t=0.12s                                   │
│    opacity: 0→1, scale: 0.85→1, y: 8→0            │
│                                                     │
│  Pill 4: t=0.18s                                   │
│    opacity: 0→1, scale: 0.85→1, y: 8→0            │
│                                                     │
│  Duration: 0.35s each                              │
│  Easing: back.out(1.4) for bounce                 │
└─────────────────────────────────────────────────────┘
  │
  ▼
Animation Complete
  │
  ▼
Cleanup on Unmount/Context Change
```

## Component Hierarchy

```
QuickActionPills
  │
  ├─ usePathname() (Next.js)
  ├─ useRef<HTMLDivElement>() (container)
  ├─ useLayoutEffect() (GSAP animation)
  │
  └─ return (
       │
       ├─ Container <div> with ref
       │  │
       │  ├─ Desktop Version (hidden md:block)
       │  │  │
       │  │  └─ Horizontal Scroll Container
       │  │     │
       │  │     └─ Pills (actions.map)
       │  │        │
       │  │        └─ <button> with Icon + Label
       │  │
       │  └─ Mobile Version (md:hidden)
       │     │
       │     └─ Native Scroll Container (with snap)
       │        │
       │        └─ Pills (actions.map)
       │           │
       │           └─ <button> with Icon + Label
       │
       └─ <style jsx> for custom scrollbar styling
     )
```

## Integration Points

```
┌─────────────────────────────────────────┐
│         ChatInput Component             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  QuickActionPills                 │ │
│  │  - Auto-detects context           │ │
│  │  - Shows relevant actions         │ │
│  └───────────────────────────────────┘ │
│                 │                       │
│                 ▼                       │
│  ┌───────────────────────────────────┐ │
│  │  Textarea (Chat Input)            │ │
│  │  - Receives action text           │ │
│  │  - User can edit or send          │ │
│  └───────────────────────────────────┘ │
│                 │                       │
│                 ▼                       │
│  ┌───────────────────────────────────┐ │
│  │  Send Button                      │ │
│  │  - Submits to chat API            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## State Management

```
Component Props
  │
  ├─ contextualActions (optional)
  ├─ context (optional)
  └─ onActionClick (required)
  │
  ▼
Internal State
  │
  ├─ containerRef: RefObject<HTMLDivElement>
  ├─ pathname: string | null (from usePathname)
  └─ actions: QuickAction[] (computed)
  │
  ▼
Derived Values
  │
  ├─ detectedContext = detectContextFromRoute(pathname)
  └─ finalActions = contextualActions || contextActions[context] || contextActions[detectedContext]
```

## Error Handling

```
┌─────────────────────────────────────┐
│  No pathname?                       │
│  → Return 'default' context         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  No actions available?              │
│  → Return null (don't render)       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Unknown route?                     │
│  → Fall back to 'default' context   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  GSAP context cleanup               │
│  → Prevent memory leaks             │
└─────────────────────────────────────┘
```

## Performance Optimizations

1. **useLayoutEffect**: Prevents flash of unstyled content
2. **GSAP Context**: Proper cleanup on unmount
3. **Dependency Array**: Only re-animate when actions change
4. **CSS Variables**: Efficient theme switching
5. **Native Scroll**: Better mobile performance

## Responsive Breakpoints

```
Mobile (< 768px)
  │
  ├─ Hide desktop version (display: none)
  ├─ Show mobile version (display: flex)
  ├─ Native scroll with snap
  └─ Min height 44px (touch-friendly)

Desktop (≥ 768px)
  │
  ├─ Show desktop version (display: flex)
  ├─ Hide mobile version (display: none)
  ├─ Custom scrollbar (4px height)
  └─ Hover effects enabled
```

## Type System

```typescript
QuickAction {
  icon: LucideIcon
  label: string
  action: string
}
  │
  └─ Used in: QuickAction[]

QuickActionContext =
  'invoices' | 'expenses' | 'hr' |
  'dashboard' | 'banking' | 'tax' |
  'vendors' | 'reports' | 'documents' |
  'chat' | 'default'
  │
  └─ Used for: context detection & map keys

QuickActionPillsProps {
  onActionClick: (action: string) => void
  contextualActions?: QuickAction[]
  context?: QuickActionContext
  className?: string
}
  │
  └─ Component props interface
```

## Accessibility Tree

```
<div> (container)
  │
  ├─ <div> (desktop)
  │  │
  │  └─ <div> (scroll container)
  │     │
  │     └─ <button> × N
  │        │
  │        ├─ aria-label="Quick action: {label}"
  │        ├─ role="button"
  │        └─ tabindex="0"
  │
  └─ <div> (mobile)
     │
     └─ <div> (scroll container)
        │
        └─ <button> × N
           │
           ├─ aria-label="Quick action: {label}"
           ├─ role="button"
           └─ tabindex="0"
```

This architecture ensures:
- Automatic context detection
- Smooth user experience
- Proper accessibility
- Efficient performance
- Clean separation of concerns
