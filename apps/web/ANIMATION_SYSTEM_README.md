# Page Transition & Button Morph Animation System

A world-class animation system for the Operate app using GSAP, featuring smooth page transitions with button morphing effects.

## Overview

This system provides a complete solution for creating fluid page transitions where buttons morph into containers, creating a seamless user experience.

### Core Animation Pattern

Every page transition follows a three-phase sequence:

1. **EXIT (300ms)**: Current content fades out with opacity 0 and scale 0.95
2. **MORPH (500ms)**: Button stays visible and expands to the new container size
3. **ENTER (400ms)**: New content fades in with opacity 1 and scale 1

## Architecture

### Files Created

```
apps/web/
├── src/
│   ├── lib/animation/
│   │   ├── gsap-utils.ts         # GSAP utility functions and timing constants
│   │   └── index.ts              # Exports
│   ├── components/animation/
│   │   ├── TransitionProvider.tsx # Context provider for transition state
│   │   ├── PageTransition.tsx     # Page content wrapper
│   │   ├── MorphButton.tsx        # Button that morphs into containers
│   │   └── index.ts               # Exports
│   └── hooks/
│       └── usePageTransition.ts   # Hook for managing transitions
```

### Key Components

#### 1. TransitionProvider

Global context provider that manages transition state and element registry.

```tsx
import { TransitionProvider } from '@/components/animation';

function App() {
  return (
    <TransitionProvider>
      <YourApp />
    </TransitionProvider>
  );
}
```

#### 2. PageTransition

Wrapper component for page content that handles enter animations.

```tsx
import { PageTransition } from '@/components/animation';

export default function MyPage() {
  return (
    <PageTransition>
      <h1>Page Content</h1>
      <p>This content will fade in smoothly</p>
    </PageTransition>
  );
}
```

**Important**: Wrap all page content with `data-page-content` attribute:
```tsx
<div data-page-content>
  {/* Your content */}
</div>
```

#### 3. MorphButton

A button that morphs into the target container on the next page.

```tsx
import { MorphButton } from '@/components/animation';
import { usePageTransition } from '@/hooks/usePageTransition';
import { useRouter } from 'next/navigation';

function HomePage() {
  const { transitionTo } = usePageTransition();
  const router = useRouter();

  const handleClick = () => {
    transitionTo('form-container', () => {
      router.push('/form');
    });
  };

  return (
    <MorphButton
      targetId="form-container"
      onClick={handleClick}
      variant="primary"
      size="lg"
    >
      Get Started
    </MorphButton>
  );
}
```

#### 4. MorphTarget

Helper component to mark containers as morph targets on the destination page.

```tsx
import { MorphTarget } from '@/components/animation';

function FormPage() {
  return (
    <MorphTarget targetId="form-container">
      <FormComponent />
    </MorphTarget>
  );
}
```

### Hook: usePageTransition

Provides functions for coordinating page transitions.

```tsx
const {
  isTransitioning,    // Boolean - whether transition is in progress
  transitionTo,       // Function - execute button morph transition
  transitionWithFade, // Function - simple fade transition
  registerElement,    // Function - register element for morphing
  unregisterElement,  // Function - cleanup element registration
} = usePageTransition();
```

## Animation Timing Constants

```typescript
export const TIMING = {
  EXIT_DURATION: 0.3,      // 300ms - Content fade out
  MORPH_DURATION: 0.5,     // 500ms - Button expansion
  ENTER_DURATION: 0.4,     // 400ms - Content fade in
  STAGGER_DELAY: 0.05,     // 50ms - Stagger between elements
  EASE_OUT: 'power2.out',  // Smooth deceleration
  EASE_IN_OUT: 'power2.inOut', // Smooth morph
  EASE_IN: 'power2.in',    // Smooth acceleration
};
```

## GSAP Utility Functions

### fadeOut(element, duration?, onComplete?)

Fades out an element with scale effect.

```typescript
import { fadeOut } from '@/lib/animation/gsap-utils';

fadeOut('.content', 0.3, () => {
  console.log('Exit complete');
});
```

### fadeIn(element, duration?, delay?)

Fades in an element with scale effect.

```typescript
import { fadeIn } from '@/lib/animation/gsap-utils';

fadeIn('.new-content', 0.4, 0.1);
```

### morphTo(source, target, duration?, ease?)

Morphs one element to another's position and size using FLIP technique.

```typescript
import { morphTo } from '@/lib/animation/gsap-utils';

const button = document.getElementById('btn');
const container = document.getElementById('target');
morphTo(button, container);
```

### staggerIn(elements, stagger?, duration?)

Animates multiple elements with stagger effect.

```typescript
import { staggerIn } from '@/lib/animation/gsap-utils';

staggerIn('.list-item', 0.05, 0.4);
```

## Complete Usage Example

### Source Page (e.g., `/onboarding`)

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { usePageTransition } from '@/hooks/usePageTransition';
import { MorphButton, PageTransition } from '@/components/animation';

export default function OnboardingPage() {
  const router = useRouter();
  const { transitionTo } = usePageTransition();

  const handleGetStarted = () => {
    transitionTo('setup-form', () => {
      router.push('/setup');
    });
  };

  return (
    <PageTransition>
      <div className="container">
        <h1>Welcome to Operate</h1>
        <p>Let's get your business set up</p>

        <MorphButton
          targetId="setup-form"
          onClick={handleGetStarted}
          variant="primary"
          size="lg"
        >
          Get Started
        </MorphButton>
      </div>
    </PageTransition>
  );
}
```

### Destination Page (e.g., `/setup`)

```tsx
'use client';

import { PageTransition, MorphTarget } from '@/components/animation';
import { SetupForm } from '@/components/forms/SetupForm';

export default function SetupPage() {
  return (
    <PageTransition>
      <MorphTarget targetId="setup-form">
        <div className="form-container">
          <h2>Business Setup</h2>
          <SetupForm />
        </div>
      </MorphTarget>
    </PageTransition>
  );
}
```

## Accessibility

The system automatically respects the `prefers-reduced-motion` media query:

- When enabled, animations are skipped or simplified
- Transitions become instant (10ms)
- Scale and morph effects are disabled
- Only opacity changes remain

## MorphButton Props

```typescript
interface MorphButtonProps {
  targetId: string;           // Required - ID for morph target
  children: ReactNode;        // Button content
  onClick?: () => void;       // Click handler
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;         // Additional CSS classes
  disabled?: boolean;
}
```

## Best Practices

### 1. Always Use TransitionProvider

Wrap your app in the root layout:

```tsx
// app/layout.tsx
import { TransitionProvider } from '@/components/animation';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TransitionProvider>
          {children}
        </TransitionProvider>
      </body>
    </html>
  );
}
```

### 2. Mark Page Content

Always mark your page content container:

```tsx
<div data-page-content>
  {/* Your page content */}
</div>
```

Or use the PageTransition component which does this automatically:

```tsx
<PageTransition>
  {/* Your page content */}
</PageTransition>
```

### 3. Unique Target IDs

Ensure target IDs are unique across your app:

```tsx
// Good
<MorphButton targetId="onboarding-form">Start</MorphButton>

// Bad - generic ID might conflict
<MorphButton targetId="form">Start</MorphButton>
```

### 4. Error Handling

The system includes fallbacks:
- If morph target not found → falls back to simple fade transition
- If page content not found → executes callback immediately
- Provides console warnings for debugging

## Technical Details

### FLIP Technique

The morph animation uses GSAP's FLIP (First, Last, Invert, Play) technique:

1. **First**: Record source element position/size
2. **Last**: Get target element position/size
3. **Invert**: Position a clone at source location
4. **Play**: Animate clone to target location, reveal actual target

### Performance

- Uses `transform` and `opacity` for GPU acceleration
- Clone element removed after animation completes
- `requestAnimationFrame` ensures smooth transitions
- Respects reduced motion preferences

### Browser Support

- Modern browsers with GSAP support
- Chrome, Firefox, Safari, Edge (latest versions)
- Graceful degradation for older browsers

## Troubleshooting

### Button doesn't morph

1. Check TransitionProvider is wrapping your app
2. Ensure targetId matches on both pages
3. Verify MorphTarget exists on destination page
4. Check console for warnings

### Transition feels jerky

1. Ensure elements use `transform` not `left/top` for positioning
2. Check no other animations are conflicting
3. Verify GSAP is properly loaded

### Content doesn't fade in

1. Check PageTransition component is used
2. Ensure `data-page-content` attribute is present
3. Verify no CSS overriding opacity

## Future Enhancements

Potential improvements:
- Shared element transitions between pages
- Route-based transition presets
- Animation performance monitoring
- Gesture-based transitions for mobile
- Custom easing curves library

## Credits

Built with:
- [GSAP](https://greensock.com/gsap/) - Professional animation library
- Next.js 14 App Router
- TypeScript
- React 18

---

For questions or issues, see the existing component implementations in `apps/web/src/components/animation/`.
