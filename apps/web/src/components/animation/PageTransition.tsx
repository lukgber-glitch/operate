'use client';

/**
 * PageTransition Component
 *
 * Wrapper component for pages that handles enter/exit animations.
 * Integrates with GSAP for smooth transitions and supports reduced motion.
 */

import React, { useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { fadeIn, prefersReducedMotion } from '@/lib/animation/gsap-utils';
import { cn } from '@/lib/utils';

/**
 * PageTransition component props
 */
export interface PageTransitionProps {
  /** Page content to animate */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Callback when enter animation completes */
  onEnter?: () => void;
  /** Callback when exit animation completes */
  onExit?: () => void;
}

/**
 * PageTransition wrapper component
 *
 * Automatically animates page content on route changes using GSAP.
 * Marks the container with [data-page-content] for use with usePageTransition hook.
 *
 * @example
 * ```tsx
 * // In your page component
 * export default function MyPage() {
 *   return (
 *     <PageTransition>
 *       <h1>Page Content</h1>
 *       <p>This content will fade in smoothly</p>
 *     </PageTransition>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom className and callbacks
 * <PageTransition
 *   className="custom-page"
 *   onEnter={() => console.log('Page loaded')}
 * >
 *   <YourContent />
 * </PageTransition>
 * ```
 */
export function PageTransition({
  children,
  className,
  onEnter,
  onExit,
}: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Check for reduced motion
    const shouldAnimate = !prefersReducedMotion();

    if (!shouldAnimate) {
      if (onEnter) onEnter();
      return;
    }

    // Animate page entry
    const tween = fadeIn(containerRef.current, undefined, 0);

    // Call onEnter when animation completes
    if (onEnter) {
      tween.eventCallback('onComplete', onEnter);
    }

    // Cleanup
    return () => {
      if (onExit) onExit();
      tween.kill();
    };
  }, [pathname, onEnter, onExit]);

  return (
    <div
      ref={containerRef}
      data-page-content
      className={cn('w-full', className)}
    >
      {children}
    </div>
  );
}
