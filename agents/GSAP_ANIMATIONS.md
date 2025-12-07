# GSAP Animation System Specification

**Version**: 1.0
**Created**: December 7, 2024
**Framework**: GSAP with React

---

## Installation

```bash
cd apps/web
pnpm add gsap @gsap/react
```

### GSAP Plugins (Free)
- **ScrollTrigger**: Scroll-based animations
- **TextPlugin**: Text animations
- **Flip**: Layout animations

### GSAP Plugins (Club - Now Free via Webflow)
- **MorphSVG**: SVG morphing animations
- **SplitText**: Text splitting for character animations

---

## Animation Library Structure

```
apps/web/src/lib/gsap/
├── index.ts              # GSAP registration & exports
├── animations.ts         # Reusable animation functions
├── hooks/
│   ├── useGsapContext.ts # Cleanup context hook
│   ├── useMorph.ts       # Morph animation hook
│   └── useStagger.ts     # Stagger animation hook
└── components/
    ├── MorphButton.tsx   # Button that morphs into content
    ├── PageTransition.tsx # Page transition wrapper
    ├── StaggerList.tsx   # Stagger children on mount
    └── FadeIn.tsx        # Simple fade-in wrapper
```

---

## Core Animations

### 1. Button Morph to Card

The signature animation where a button morphs into an onboarding step or content card.

```tsx
// lib/gsap/hooks/useMorph.ts
import { useRef } from 'react';
import gsap from 'gsap';

export function useMorph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const morphToContent = () => {
    const tl = gsap.timeline();

    // Get positions
    const buttonRect = buttonRef.current!.getBoundingClientRect();
    const containerRect = containerRef.current!.getBoundingClientRect();

    // Create a clone for morphing
    const clone = buttonRef.current!.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = `${buttonRect.left}px`;
    clone.style.top = `${buttonRect.top}px`;
    clone.style.width = `${buttonRect.width}px`;
    clone.style.height = `${buttonRect.height}px`;
    clone.style.zIndex = '1000';
    document.body.appendChild(clone);

    // Hide original button
    buttonRef.current!.style.visibility = 'hidden';

    // Morph animation
    tl.to(clone, {
      left: containerRect.left,
      top: containerRect.top,
      width: containerRect.width,
      height: containerRect.height,
      borderRadius: '16px',
      duration: 0.5,
      ease: 'power2.inOut',
    })
    .to(clone, {
      opacity: 0,
      duration: 0.15,
    })
    .set(contentRef.current, { display: 'block' })
    .fromTo(contentRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' },
      '-=0.1'
    )
    .add(() => {
      document.body.removeChild(clone);
    });

    return tl;
  };

  const morphToButton = () => {
    const tl = gsap.timeline();

    tl.to(contentRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      ease: 'power2.in',
    })
    .set(contentRef.current, { display: 'none' })
    .set(buttonRef.current, { visibility: 'visible' })
    .fromTo(buttonRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' }
    );

    return tl;
  };

  return { containerRef, buttonRef, contentRef, morphToContent, morphToButton };
}
```

### 2. Page Transitions

Smooth transitions when navigating between pages.

```tsx
// lib/gsap/components/PageTransition.tsx
'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Enter animation
      gsap.fromTo(containerRef.current,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: 'power2.out',
        }
      );
    });

    return () => ctx.revert();
  }, [pathname]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}
```

### 3. Stagger List

Animate list items appearing one by one.

```tsx
// lib/gsap/components/StaggerList.tsx
'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

interface StaggerListProps {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
}

export function StaggerList({ children, stagger = 0.1, delay = 0 }: StaggerListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const items = containerRef.current?.children;
      if (!items) return;

      gsap.fromTo(items,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger,
          delay,
          ease: 'power2.out',
        }
      );
    });

    return () => ctx.revert();
  }, [stagger, delay]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}
```

### 4. Typing Indicator

Animated dots for chat typing state.

```tsx
// lib/gsap/components/TypingIndicator.tsx
'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

export function TypingIndicator() {
  const dotsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const dots = dotsRef.current?.children;
      if (!dots) return;

      gsap.to(dots, {
        y: -6,
        duration: 0.4,
        stagger: {
          each: 0.15,
          repeat: -1,
          yoyo: true,
        },
        ease: 'power2.inOut',
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div ref={dotsRef} className="flex gap-1 items-center p-3">
      <div className="w-2 h-2 bg-gray-400 rounded-full" />
      <div className="w-2 h-2 bg-gray-400 rounded-full" />
      <div className="w-2 h-2 bg-gray-400 rounded-full" />
    </div>
  );
}
```

---

## Onboarding Animations

### Welcome Animation Sequence

```tsx
// components/onboarding/WelcomeAnimation.tsx
'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

export function WelcomeAnimation() {
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });

      // Logo bounces in
      tl.fromTo(logoRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.7)' }
      )
      // Title fades up
      .fromTo(titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      )
      // Subtitle fades up
      .fromTo(subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        '-=0.2'
      )
      // Button pops in
      .fromTo(buttonRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' },
        '-=0.1'
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="text-center">
      <div ref={logoRef} className="mb-8">
        {/* Logo SVG */}
      </div>
      <h1 ref={titleRef} className="text-3xl font-bold mb-4">
        Welcome to Operate
      </h1>
      <p ref={subtitleRef} className="text-gray-600 mb-8">
        Your AI-powered business assistant
      </p>
      <button ref={buttonRef} className="btn-primary">
        Get Started
      </button>
    </div>
  );
}
```

### Step Transition

```tsx
// components/onboarding/StepTransition.tsx
'use client';

import { useRef, useLayoutEffect, useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';

interface StepTransitionProps {
  children: React.ReactNode;
  direction?: 'forward' | 'backward';
}

export interface StepTransitionHandle {
  exit: () => Promise<void>;
}

export const StepTransition = forwardRef<StepTransitionHandle, StepTransitionProps>(
  ({ children, direction = 'forward' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      exit: () => {
        return new Promise((resolve) => {
          gsap.to(containerRef.current, {
            opacity: 0,
            x: direction === 'forward' ? -50 : 50,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: resolve,
          });
        });
      },
    }));

    useLayoutEffect(() => {
      const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current,
          {
            opacity: 0,
            x: direction === 'forward' ? 50 : -50,
          },
          {
            opacity: 1,
            x: 0,
            duration: 0.35,
            ease: 'power2.out',
          }
        );
      });

      return () => ctx.revert();
    }, [direction]);

    return (
      <div ref={containerRef}>
        {children}
      </div>
    );
  }
);

StepTransition.displayName = 'StepTransition';
```

### Progress Bar Animation

```tsx
// components/onboarding/AnimatedProgress.tsx
'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

interface AnimatedProgressProps {
  current: number;
  total: number;
}

export function AnimatedProgress({ current, total }: AnimatedProgressProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const prevProgressRef = useRef(0);

  useLayoutEffect(() => {
    const progress = (current / total) * 100;

    gsap.to(barRef.current, {
      width: `${progress}%`,
      duration: 0.5,
      ease: 'power2.out',
    });

    prevProgressRef.current = progress;
  }, [current, total]);

  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        ref={barRef}
        className="h-full bg-primary rounded-full"
        style={{ width: '0%' }}
      />
    </div>
  );
}
```

---

## Chat Animations

### Message Appear

```tsx
// components/chat/MessageAnimation.tsx
'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

interface MessageAnimationProps {
  children: React.ReactNode;
  isUser?: boolean;
}

export function MessageAnimation({ children, isUser }: MessageAnimationProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(messageRef.current,
        {
          opacity: 0,
          y: 20,
          scale: 0.9,
          x: isUser ? 20 : -20,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          x: 0,
          duration: 0.3,
          ease: 'power2.out',
        }
      );
    });

    return () => ctx.revert();
  }, [isUser]);

  return (
    <div ref={messageRef}>
      {children}
    </div>
  );
}
```

### Suggestion Pills

```tsx
// components/chat/SuggestionPills.tsx
'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

interface SuggestionPillsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SuggestionPills({ suggestions, onSelect }: SuggestionPillsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const pills = containerRef.current?.children;
      if (!pills) return;

      gsap.fromTo(pills,
        {
          opacity: 0,
          scale: 0.8,
          y: 10,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.08,
          ease: 'back.out(1.5)',
        }
      );
    });

    return () => ctx.revert();
  }, [suggestions]);

  return (
    <div ref={containerRef} className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="quick-action"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
```

---

## Scroll Animations

### ScrollTrigger Setup

```tsx
// lib/gsap/index.ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
```

### Fade In On Scroll

```tsx
// lib/gsap/components/FadeInOnScroll.tsx
'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

interface FadeInOnScrollProps {
  children: React.ReactNode;
  delay?: number;
}

export function FadeInOnScroll({ children, delay = 0 }: FadeInOnScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(containerRef.current,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }, [delay]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}
```

---

## Easing Reference

| Name | GSAP Ease | Usage |
|------|-----------|-------|
| Smooth | `power2.out` | Default for most animations |
| Bouncy | `back.out(1.7)` | Button pops, logos |
| Snappy | `power3.out` | Quick UI responses |
| Gentle | `power1.out` | Subtle fades |
| Elastic | `elastic.out(1, 0.5)` | Playful celebrations |

---

## Performance Guidelines

### 1. Use `useGSAP` Hook
Always use `useGSAP` or manual cleanup to prevent memory leaks.

```tsx
import { useGSAP } from '@gsap/react';

useGSAP(() => {
  // animations here are auto-cleaned
  gsap.to('.element', { x: 100 });
}, { scope: containerRef }); // scope for selector context
```

### 2. Prefer Transform Properties
Animate `x`, `y`, `scale`, `rotation`, `opacity` instead of `left`, `top`, `width`, `height`.

### 3. Use `will-change` Sparingly
Only add `will-change: transform` to elements that will definitely animate.

### 4. Batch Animations
Use timelines for related animations instead of multiple `gsap.to()` calls.

### 5. Clean Up
Always revert animations in useEffect cleanup or use `useGSAP`.

---

## Integration with Framer Motion

The codebase already uses Framer Motion (v12.23.25). For complex morphing and timeline animations, use GSAP. For simple presence animations, continue using Framer Motion.

### When to Use Which

| Animation Type | Use |
|---------------|-----|
| Page enter/exit | Framer Motion (already configured) |
| Button morph to card | GSAP |
| List item stagger | Either (GSAP for more control) |
| Scroll-triggered | GSAP ScrollTrigger |
| Drag and drop | Framer Motion |
| SVG morphing | GSAP MorphSVG |
| Simple hover | CSS transitions |

---

## Implementation Checklist

- [ ] Install GSAP: `pnpm add gsap @gsap/react`
- [ ] Create `lib/gsap/index.ts` with plugin registration
- [ ] Create `lib/gsap/animations.ts` with reusable functions
- [ ] Create `MorphButton` component
- [ ] Create `PageTransition` wrapper
- [ ] Create `StaggerList` component
- [ ] Create `TypingIndicator` component
- [ ] Update onboarding with step transitions
- [ ] Add welcome animation sequence
- [ ] Add animated progress bar
- [ ] Add message appear animations
- [ ] Add suggestion pill animations
