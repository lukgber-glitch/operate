'use client';

import { useRef, useLayoutEffect } from 'react';
import { gsap } from '../index';

interface StaggerListProps {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
}

/**
 * StaggerList Component
 *
 * Animates child elements appearing one by one with a stagger effect.
 * Perfect for lists, navigation items, or any collection of elements.
 *
 * @example
 * ```tsx
 * <StaggerList stagger={0.1} delay={0.2}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </StaggerList>
 * ```
 */
export function StaggerList({
  children,
  stagger = 0.1,
  delay = 0,
}: StaggerListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const items = containerRef.current?.children;
      if (!items) return;

      gsap.fromTo(
        items,
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

  return <div ref={containerRef}>{children}</div>;
}
