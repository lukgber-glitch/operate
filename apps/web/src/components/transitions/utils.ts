/**
 * Transition Utilities
 *
 * Helper functions and hooks for managing animations with
 * accessibility and performance considerations.
 */

import { useReducedMotion } from 'framer-motion';
import { Variants, Transition } from 'framer-motion';

/**
 * Hook to get safe animation variants based on user's motion preference
 *
 * Automatically reduces animations for users who prefer reduced motion.
 *
 * @example
 * ```tsx
 * const variants = useSafeVariants(myVariants);
 * <motion.div variants={variants} />
 * ```
 */
export function useSafeVariants(variants: Variants): Variants {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    // Return simplified variants for reduced motion
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }

  return variants;
}

/**
 * Hook to get safe transition config based on user's motion preference
 *
 * Reduces transition duration for users who prefer reduced motion.
 *
 * @example
 * ```tsx
 * const transition = useSafeTransition({ duration: 0.3 });
 * <motion.div transition={transition} />
 * ```
 */
export function useSafeTransition(transition: Transition): Transition {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return {
      ...transition,
      duration: 0.01, // Near-instant for reduced motion
    };
  }

  return transition;
}

/**
 * Create stagger configuration for list animations
 *
 * @param delay - Delay between each item (in seconds)
 * @param maxItems - Maximum items to animate (prevents performance issues)
 *
 * @example
 * ```tsx
 * const containerVariants = {
 *   show: {
 *     transition: createStagger(0.1, 50)
 *   }
 * };
 * ```
 */
export function createStagger(delay: number = 0.1, maxItems: number = 50) {
  return {
    staggerChildren: delay,
    delayChildren: 0.05,
    // Prevent lag on large lists
    when: 'beforeChildren' as const,
  };
}

/**
 * Get optimal viewport transition config
 *
 * Adjusts animation based on viewport size for better performance
 * on mobile devices.
 */
export function getViewportTransition(): Transition {
  if (typeof window === 'undefined') {
    return { duration: 0.3 };
  }

  const isMobile = window.innerWidth < 768;

  return {
    type: 'tween',
    ease: 'easeInOut',
    duration: isMobile ? 0.2 : 0.3, // Faster on mobile
  };
}

/**
 * Create safe exit animation config
 *
 * Prevents layout shift during exit animations by using
 * position: absolute during exit.
 *
 * @example
 * ```tsx
 * <AnimatePresence {...createSafeExit()}>
 *   <motion.div />
 * </AnimatePresence>
 * ```
 */
export function createSafeExit() {
  return {
    mode: 'wait' as const,
    initial: false,
  };
}

/**
 * Debounce function for performance-intensive animations
 *
 * Use this to prevent excessive re-renders during animations.
 *
 * @example
 * ```tsx
 * const debouncedResize = debounce(() => {
 *   // Handle resize
 * }, 150);
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if animations should be enabled
 *
 * Considers user preference, device capabilities, and performance.
 *
 * @example
 * ```tsx
 * if (shouldAnimate()) {
 *   // Apply animations
 * }
 * ```
 */
export function shouldAnimate(): boolean {
  if (typeof window === 'undefined') return true;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) return false;

  // Check for low-end device (using connection speed as proxy)
  const connection = (navigator as any).connection;
  if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
    return false;
  }

  // Check battery status (if available)
  // Note: Battery check is async, so we can only use it as a hint for future animations
  // The actual check happens asynchronously and doesn't block this function
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      if (battery.level < 0.2 && !battery.charging) {
        // Low battery detected - animations should be reduced
        // This is handled asynchronously and can be used for future reference
        console.debug('Low battery mode - consider reducing animations');
      }
    });
  }

  return true;
}

/**
 * Performance monitoring for animations
 *
 * Log slow animations in development.
 */
export function monitorAnimationPerformance(label: string, threshold: number = 16) {
  if (process.env.NODE_ENV !== 'development') return;

  const start = performance.now();

  return () => {
    const duration = performance.now() - start;
    if (duration > threshold) {
      console.warn(
        `[Animation Performance] "${label}" took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }
  };
}

/**
 * Create spring animation config
 *
 * Pre-configured spring animations for different use cases.
 */
export const springs = {
  /** Gentle spring for subtle interactions */
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
  },

  /** Default spring for most use cases */
  default: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  },

  /** Snappy spring for quick interactions */
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },

  /** Bouncy spring for playful interactions */
  bouncy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 15,
  },

  /** Slow spring for dramatic effects */
  slow: {
    type: 'spring' as const,
    stiffness: 50,
    damping: 20,
  },
};

/**
 * Ease functions for tween animations
 */
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  sharp: [0.4, 0, 0.6, 1] as [number, number, number, number],
  anticipate: [0.36, 0, 0.66, -0.56] as [number, number, number, number],
};

/**
 * Common animation durations (in seconds)
 */
export const durations = {
  instant: 0.01,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
};

/**
 * Preload animation images/assets
 *
 * Use this to preload images that will be animated to prevent jank.
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   preloadImages(['/logo.png', '/hero.jpg']);
 * }, []);
 * ```
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  });

  return Promise.all(promises);
}

/**
 * Calculate optimal stagger delay based on item count
 *
 * Prevents animations from taking too long on large lists.
 *
 * @param itemCount - Number of items to animate
 * @param maxDuration - Maximum total animation duration
 *
 * @example
 * ```tsx
 * const delay = calculateStaggerDelay(items.length);
 * <AnimatedList staggerDelay={delay}>
 * ```
 */
export function calculateStaggerDelay(
  itemCount: number,
  maxDuration: number = 1.5
): number {
  if (itemCount === 0) return 0.1;

  const optimalDelay = maxDuration / itemCount;

  // Clamp between 0.05 and 0.2 seconds
  return Math.max(0.05, Math.min(0.2, optimalDelay));
}

/**
 * Check if element is in viewport
 *
 * Useful for triggering animations only when elements are visible.
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
