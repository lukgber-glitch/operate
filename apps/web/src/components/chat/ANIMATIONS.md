# Chat Streaming Animations Reference

## Visual States

### 1. Typing Indicator (Before Streaming)

Shows when AI is preparing to respond, before any content arrives.

```
┌─────────────────────────────────┐
│  [🤖]  ○ ○ ○                   │  <- Bouncing dots
└─────────────────────────────────┘
```

**CSS Animation:**
- 3 dots bouncing vertically
- Staggered delays: 0ms, 150ms, 300ms
- `animate-bounce` Tailwind class
- Background: `bg-muted`

**Component:** `TypingIndicator.tsx`

---

### 2. Streaming Message (Content Arriving)

Shows as content streams in character-by-character or chunk-by-chunk.

```
┌─────────────────────────────────┐
│  [🤖]  Hello, I can help you █  │  <- Pulsing cursor
│        with that...             │
│        ○ ○ ○  12:34 PM          │  <- Status dots
└─────────────────────────────────┘
```

**Visual Elements:**
1. **Streaming Cursor:** Pulsing vertical bar `█`
   - `animate-pulse` class
   - Width: 1.5px (w-1.5)
   - Height: 1rem (h-4)
   - Inline with text

2. **Status Indicator:** 3 pulsing dots
   - Same animation as typing indicator
   - Shows in footer alongside timestamp
   - Color: `bg-muted-foreground`

**Accessibility:**
- `aria-live="polite"` - announces updates
- `aria-atomic="false"` - incremental updates

**Component:** `ChatMessage.tsx` with `status="streaming"`

---

### 3. Complete Message

Final state after streaming completes.

```
┌─────────────────────────────────┐
│  [🤖]  Hello, I can help you    │
│        with that. What would    │
│        you like to know?        │
│                                 │
│        12:34 PM                 │
│  [Action Buttons]               │  <- Appears after streaming
└─────────────────────────────────┘
```

**Changes from Streaming:**
- Cursor disappears
- Status dots disappear
- Action buttons appear (if applicable)
- Status changes to 'sent'

---

## Animation Timing

### Bounce Animation (Typing & Status)
```css
.animate-bounce {
  animation: bounce 1s infinite;
}

/* Staggered delays */
dot-1: 0ms
dot-2: 150ms  (animation-delay-150)
dot-3: 300ms  (animation-delay-300)
```

### Pulse Animation (Cursor)
```css
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Fade In (Message Entry)
```css
.animate-in {
  animation: fadeIn 300ms ease-out,
             slideInFromBottom 300ms ease-out;
}
```

---

## State Flow

```
User sends message
       ↓
[Typing Indicator]           ← isLoading && !streamingMessageId
       ↓
Content starts arriving
       ↓
[Streaming Message]          ← status="streaming"
  - Cursor pulsing           ← isStreaming && content
  - Content updating         ← Real-time updates
  - Status dots              ← Visual feedback
  - Auto-scroll              ← Smooth following
       ↓
Streaming complete
       ↓
[Complete Message]           ← status="sent"
  - No cursor                ← isStreaming = false
  - No status dots           ← Complete
  - Action buttons           ← Interactive
```

---

## CSS Classes Used

### Tailwind Utilities

**Animations:**
- `animate-bounce` - Bouncing dots
- `animate-pulse` - Pulsing cursor
- `animate-in` - Entrance animation
- `fade-in-50` - Fade in effect
- `slide-in-from-bottom-2` - Slide up effect

**Delays:**
- `animation-delay-150` - 150ms delay
- `animation-delay-300` - 300ms delay

**Sizing:**
- `h-2 w-2` - Dot size (8px × 8px)
- `h-1.5 w-1.5` - Status dot size (6px × 6px)
- `h-4 w-1.5` - Cursor size (16px × 6px)

**Colors:**
- `bg-muted` - Background for bot messages
- `bg-muted-foreground/50` - Dot color
- `bg-current` - Cursor (inherits text color)

**Spacing:**
- `gap-1` - Small gaps
- `gap-1.5` - Dot spacing
- `ml-0.5` - Cursor margin

---

## Accessibility Attributes

### During Streaming

```html
<div
  role="article"
  aria-live="polite"
  aria-atomic="false"
>
  <!-- Content updates announced incrementally -->
</div>
```

### Status Indicators

```html
<div
  role="status"
  aria-label="Receiving message"
>
  <!-- Visual-only, announced by aria-live -->
</div>
```

### Typing Indicator

```html
<div
  role="status"
  aria-label="AI is thinking"
>
  <!-- Announces when AI is preparing -->
</div>
```

---

## Responsive Behavior

### Mobile (< 768px)
- Messages max-width: 85%
- Single column layout
- Touch-friendly spacing
- Reduced animation if `prefers-reduced-motion`

### Desktop (≥ 768px)
- Messages max-width: 85%
- Full animations
- Hover states enabled
- Keyboard navigation

---

## Performance

**Optimizations:**
- CSS animations (GPU accelerated)
- React memoization for formatting
- Debounced scroll via React render
- Efficient state updates (map instead of filter+add)

**Best Practices:**
- Use `will-change` sparingly
- Avoid layout thrashing
- Minimize re-renders
- Clean up on unmount

---

## Dark Mode Support

All animations work seamlessly in dark mode:

```css
/* Light mode */
bg-muted → hsl(var(--muted))
bg-muted-foreground → hsl(var(--muted-foreground))

/* Dark mode */
bg-muted → darker shade
bg-muted-foreground → lighter shade
```

Colors automatically adjust via CSS variables.

---

## Testing Animations

### Visual Testing
1. Send message
2. Observe typing indicator bounce
3. Watch content stream in
4. Verify cursor pulses
5. Check status dots animate
6. Confirm smooth transitions

### Accessibility Testing
1. Enable screen reader
2. Send message
3. Listen for status announcements
4. Verify incremental content reading
5. Check for duplicate announcements

### Performance Testing
1. Open DevTools Performance
2. Start recording
3. Send message with streaming
4. Check for layout thrashing
5. Verify smooth 60fps animations
6. Check memory usage

---

## Browser DevTools

### Useful Inspections

**Chrome/Edge DevTools:**
```
Elements → Computed → Filter: animation
Elements → Computed → Filter: transition
```

**Firefox DevTools:**
```
Inspector → Animations
Inspector → Computed → Filter: animation
```

**Safari DevTools:**
```
Elements → Computed → Filter: animation
Timeline → Records animations
```

---

## Customization

To adjust animation timing, modify Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'bounce-custom': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-25%)' },
        }
      }
    }
  }
}
```

Or use inline styles for delays:
```tsx
<span style={{ animationDelay: '150ms' }} />
```
