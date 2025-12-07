# GSAP Animation System

Complete page transition and morph animation system for Operate.

## Overview

This animation system provides:
- **Page transitions** - Smooth enter/exit animations
- **Morph buttons** - Buttons that expand into containers
- **Element registry** - Cross-page morph transitions
- **Reduced motion support** - Respects user preferences
- **Promise-based** - Easy sequencing of animations

## Installation

GSAP is already installed in the project:
```json
{
  "gsap": "^3.13.0",
  "@gsap/react": "^2.1.2"
}
```

## Core Files

### 1. Animation Utilities (`lib/animations.ts`)
Reusable GSAP animation functions.

```typescript
import { fadeIn, fadeOut, morphTo, staggerIn } from '@/lib/animations';

// Fade in element
fadeIn(element);

// Fade out element
fadeOut(element);

// Morph to size
morphTo(button, { width: 600, height: 400, borderRadius: 24 });

// Stagger multiple elements
staggerIn(elements, 0.05);
```

### 2. usePageTransition Hook (`hooks/usePageTransition.ts`)
Hook for managing page transitions.

```typescript
import { usePageTransition } from '@/hooks/usePageTransition';

const { exitAnimation, enterAnimation, morphButton, isTransitioning } = usePageTransition({
  onExitComplete: () => console.log('Exit done'),
  onEnterComplete: () => console.log('Enter done'),
});
```

### 3. MorphButton Component (`components/animation/morph-button.tsx`)
Button that morphs into a container.

```tsx
import { MorphButton } from '@/components/animation';

<MorphButton
  targetWidth={600}
  targetHeight={400}
  onMorphComplete={() => console.log('Morphed!')}
>
  Click Me
</MorphButton>
```

### 4. PageTransition Component (`components/animation/page-transition.tsx`)
Wrapper for page content with auto-animations.

```tsx
import { PageTransition } from '@/components/animation';

<PageTransition>
  <div data-animate>Content 1</div>
  <div data-animate>Content 2</div>
  <div data-animate>Content 3</div>
</PageTransition>
```

### 5. AnimationProvider (`providers/animation-provider.tsx`)
Global context for animations (already added to providers).

```tsx
import { useAnimation } from '@/providers/animation-provider';

const { registerElement, triggerTransition, isReducedMotion } = useAnimation();
```

## Usage Examples

### Basic Page Transition

```tsx
import { PageTransition } from '@/components/animation';

export default function MyPage() {
  return (
    <PageTransition>
      <h1 data-animate>Welcome</h1>
      <p data-animate>This content will fade in</p>
      <button data-animate>Click me</button>
    </PageTransition>
  );
}
```

### Morph Button to New Page

```tsx
import { MorphButton } from '@/components/animation';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleMorph = () => {
    // Navigate after morph completes
    router.push('/dashboard');
  };

  return (
    <MorphButton
      targetWidth={800}
      targetHeight={600}
      onMorphComplete={handleMorph}
    >
      Go to Dashboard
    </MorphButton>
  );
}
```

### Custom Transition Sequence

```tsx
import { usePageTransition } from '@/hooks/usePageTransition';

function MyComponent() {
  const { exitAnimation, morphButton, enterAnimation } = usePageTransition();

  const handleTransition = async () => {
    // 1. Exit current content
    await exitAnimation('.current-content');

    // 2. Morph button
    await morphButton('my-button', { width: 600, height: 400 });

    // 3. Enter new content
    await enterAnimation('.new-content');
  };

  return (
    <button id="my-button" onClick={handleTransition}>
      Transition
    </button>
  );
}
```

### Cross-Page Morph (Advanced)

```tsx
import { useAnimation } from '@/providers/animation-provider';
import { useEffect, useRef } from 'react';

function SourcePage() {
  const { registerElement } = useAnimation();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (buttonRef.current) {
      registerElement('dashboard-button', buttonRef.current);
    }
  }, [registerElement]);

  return <button ref={buttonRef}>Go to Dashboard</button>;
}

function TargetPage() {
  const { registerElement, triggerTransition } = useAnimation();
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      registerElement('dashboard-container', containerRef.current);
      triggerTransition('dashboard-button', 'dashboard-container');
    }
  }, [registerElement, triggerTransition]);

  return <div ref={containerRef}>Dashboard</div>;
}
```

## Animation Timing

All animations follow this timing:

| Animation | Duration | Easing |
|-----------|----------|--------|
| Exit | 300ms | power2.out |
| Morph | 500ms | power2.inInt |
| Enter | 400ms | power2.out |
| Stagger | 50ms | - |

## Accessibility

The system automatically respects `prefers-reduced-motion`:

```typescript
// Automatically detected
const isReducedMotion = prefersReducedMotion();

// In AnimationProvider
const { isReducedMotion } = useAnimation();
```

When reduced motion is enabled:
- All animations are skipped
- Elements appear/disappear instantly
- No CPU-intensive transitions

## TypeScript Support

Full TypeScript support with interfaces:

```typescript
interface UsePageTransitionOptions {
  onExitComplete?: () => void;
  onEnterComplete?: () => void;
}

interface MorphButtonProps {
  children: React.ReactNode;
  targetWidth?: number;
  targetHeight?: number;
  onMorphComplete?: () => void;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}

interface AnimationContextValue {
  isReducedMotion: boolean;
  isTransitioning: boolean;
  registerElement: (id: string, element: Element) => void;
  unregisterElement: (id: string) => void;
  triggerTransition: (fromId: string, toId: string) => Promise<void>;
  getElement: (id: string) => Element | null;
}
```

## Best Practices

### 1. Use data-animate for stagger effects
```tsx
<div>
  <p data-animate>Item 1</p>
  <p data-animate>Item 2</p>
  <p data-animate>Item 3</p>
</div>
```

### 2. Clean up on unmount
The hooks automatically clean up GSAP contexts.

### 3. Cancel transitions when needed
```tsx
const { cancelTransition } = usePageTransition();

useEffect(() => {
  return () => cancelTransition();
}, []);
```

### 4. Use promise chains for sequences
```tsx
await exitAnimation(element);
await morphButton(button, size);
await enterAnimation(newElement);
```

### 5. Register elements early
```tsx
useEffect(() => {
  registerElement('my-element', elementRef.current);
  return () => unregisterElement('my-element');
}, []);
```

## Troubleshooting

### Animations not working
1. Check GSAP is installed: `npm list gsap`
2. Verify element exists before animating
3. Check browser console for warnings

### Janky animations
1. Use `will-change: transform` CSS
2. Avoid animating during heavy renders
3. Use `stagger` for multiple elements

### TypeScript errors
1. Ensure `@gsap/react` is installed
2. Check element refs are typed correctly
3. Use provided interfaces

## Next Steps

This system is ready for:
- Onboarding flows
- Dashboard transitions
- Modal animations
- Page navigation
- Mobile app-like experiences

All components are production-ready and follow Operate's design system.
