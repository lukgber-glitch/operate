# GSAP Animation Library

A comprehensive animation library built on top of GSAP for the Operate web application.

## Installation

The GSAP packages should already be installed. If not:

```bash
cd apps/web
pnpm add gsap @gsap/react
```

## Quick Start

```tsx
import { FadeIn, StaggerList, gsap } from '@/lib/gsap';

function MyComponent() {
  return (
    <FadeIn delay={0.2} direction="up">
      <StaggerList stagger={0.1}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </StaggerList>
    </FadeIn>
  );
}
```

## Components

### PageTransition

Wraps page content with smooth enter animations. Automatically triggers on route changes.

```tsx
import { PageTransition } from '@/lib/gsap';

export default function Page() {
  return (
    <PageTransition>
      <YourPageContent />
    </PageTransition>
  );
}
```

### StaggerList

Animates child elements appearing one by one with a stagger effect.

```tsx
<StaggerList stagger={0.1} delay={0.2}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggerList>
```

**Props:**
- `stagger?: number` - Delay between each item (default: 0.1)
- `delay?: number` - Initial delay before animation starts (default: 0)
- `className?: string` - Additional CSS classes

### FadeIn

Simple wrapper that fades in its children on mount with optional directional slide.

```tsx
<FadeIn delay={0.2} direction="up" duration={0.4}>
  <YourContent />
</FadeIn>
```

**Props:**
- `delay?: number` - Delay before animation starts (default: 0)
- `duration?: number` - Animation duration (default: 0.4)
- `direction?: 'up' | 'down' | 'left' | 'right' | 'none'` - Slide direction (default: 'up')
- `className?: string` - Additional CSS classes

## Animation Functions

### fadeIn / fadeOut

```tsx
import { fadeIn, fadeOut } from '@/lib/gsap';

fadeIn('.element', { duration: 0.4, delay: 0.2 });
fadeOut('.element', { duration: 0.3 });
```

### slideIn / slideOut

```tsx
import { slideIn, slideOut } from '@/lib/gsap';

slideIn('.element', 'up', { duration: 0.4 });
slideOut('.element', 'down', { duration: 0.3 });
```

**Directions:** `'left' | 'right' | 'up' | 'down'`

### staggerIn

Animate multiple elements with a stagger effect.

```tsx
import { staggerIn } from '@/lib/gsap';

staggerIn('.items', { stagger: 0.1, duration: 0.4 });
```

### morphTo

Morph one element to another's position and size.

```tsx
import { morphTo } from '@/lib/gsap';

const buttonEl = document.querySelector('.button');
const cardEl = document.querySelector('.card');

morphTo(buttonEl, cardEl, { duration: 0.5 });
```

### scaleIn

Scale in with bounce effect.

```tsx
import { scaleIn } from '@/lib/gsap';

scaleIn('.element', { duration: 0.4, ease: 'back.out(1.7)' });
```

## Hooks

### useGsapContext

Creates a GSAP context with automatic cleanup.

```tsx
import { useGsapContext, gsap } from '@/lib/gsap';

function MyComponent() {
  const scopeRef = useGsapContext((ctx) => {
    gsap.to('.element', { x: 100 });
  });

  return (
    <div ref={scopeRef}>
      <div className="element">Animated content</div>
    </div>
  );
}
```

### useGsapTimeline

Creates a GSAP timeline with automatic cleanup.

```tsx
import { useGsapTimeline, gsap } from '@/lib/gsap';

function MyComponent() {
  const timeline = useGsapTimeline({ paused: true });

  useEffect(() => {
    timeline
      .to('.element1', { x: 100 })
      .to('.element2', { y: 100 })
      .play();
  }, [timeline]);

  return <div>...</div>;
}
```

### useGsapSelector

Helper for scoped GSAP selectors.

```tsx
import { useGsapSelector, gsap } from '@/lib/gsap';

function MyComponent() {
  const [scopeRef, q] = useGsapSelector();

  useEffect(() => {
    gsap.to(q('.element'), { x: 100 });
  }, [q]);

  return (
    <div ref={scopeRef}>
      <div className="element">Content</div>
    </div>
  );
}
```

## GSAP Core

The library re-exports GSAP core for direct access:

```tsx
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

// Use GSAP directly
gsap.to('.element', { x: 100 });

// Use ScrollTrigger
ScrollTrigger.create({
  trigger: '.element',
  start: 'top center',
  onEnter: () => console.log('entered'),
});

// Use the official useGSAP hook
useGSAP(() => {
  gsap.to('.element', { rotation: 360 });
}, { scope: containerRef });
```

## Easing Reference

| Name | GSAP Ease | Usage |
|------|-----------|-------|
| Smooth | `power2.out` | Default for most animations |
| Bouncy | `back.out(1.7)` | Button pops, logos |
| Snappy | `power3.out` | Quick UI responses |
| Gentle | `power1.out` | Subtle fades |
| Elastic | `elastic.out(1, 0.5)` | Playful celebrations |

## Best Practices

1. **Always use 'use client' directive** - All GSAP animations must run on the client
2. **Check for window/document** - Handle SSR gracefully
3. **Use cleanup** - Always use `useGsapContext` or manual cleanup
4. **Prefer transforms** - Animate `x`, `y`, `scale`, `rotation`, `opacity`
5. **Scope selectors** - Use context/scope to avoid global selector conflicts

## TypeScript Support

All components and functions are fully typed. Import types as needed:

```tsx
import type { AnimationOptions, SlideDirection, FadeInProps } from '@/lib/gsap';
```

## File Structure

```
lib/gsap/
├── index.ts              # Main entry point
├── animations.ts         # Reusable animation functions
├── types.ts              # TypeScript types
├── components/
│   ├── index.ts         # Component exports
│   ├── FadeIn.tsx       # Fade in wrapper
│   ├── PageTransition.tsx # Page transition wrapper
│   └── StaggerList.tsx  # Stagger list wrapper
└── hooks/
    ├── index.ts         # Hook exports
    └── useGsapContext.ts # Context management hooks
```

## Examples

See `agents/GSAP_ANIMATIONS.md` for more detailed examples including:
- Button morph to card
- Onboarding animations
- Chat message animations
- Typing indicators
- Scroll-triggered animations
