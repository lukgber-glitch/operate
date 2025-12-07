'use client';

import { useRef, useLayoutEffect } from 'react';
import { gsap } from '../index';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition Component
 *
 * Wraps page content with smooth enter/exit animations.
 * Automatically triggers animation on route changes.
 *
 * @example
 * ```tsx
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 * ```
 */
export function PageTransition({ children }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Enter animation
      gsap.fromTo(
        containerRef.current,
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

  return <div ref={containerRef}>{children}</div>;
}
