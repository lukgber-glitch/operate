'use client';

import { useRef, useLayoutEffect } from 'react';
import { gsap } from '../index';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

/**
 * FadeIn Component
 *
 * Simple wrapper that fades in its children on mount.
 * Can optionally slide in from a direction.
 *
 * @example
 * ```tsx
 * <FadeIn delay={0.2} direction="up">
 *   <YourContent />
 * </FadeIn>
 * ```
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.4,
  direction = 'up',
}: FadeInProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const fromVars: gsap.TweenVars = { opacity: 0 };
      const toVars: gsap.TweenVars = {
        opacity: 1,
        duration,
        delay,
        ease: 'power2.out',
      };

      // Add directional movement
      if (direction !== 'none') {
        switch (direction) {
          case 'up':
            fromVars.y = 20;
            toVars.y = 0;
            break;
          case 'down':
            fromVars.y = -20;
            toVars.y = 0;
            break;
          case 'left':
            fromVars.x = 20;
            toVars.x = 0;
            break;
          case 'right':
            fromVars.x = -20;
            toVars.x = 0;
            break;
        }
      }

      gsap.fromTo(containerRef.current, fromVars, toVars);
    });

    return () => ctx.revert();
  }, [delay, duration, direction]);

  return <div ref={containerRef}>{children}</div>;
}
