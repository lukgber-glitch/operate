'use client';

import * as React from 'react';

/**
 * useReducedMotion - Detect user's reduced motion preference
 *
 * Returns true if the user has enabled "reduce motion" in their OS settings.
 * Use this to disable or simplify animations for accessibility.
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * return (
 *   <motion.div
 *     animate={{ scale: prefersReducedMotion ? 1 : [1, 1.05, 1] }}
 *     transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * useMotionConfig - Get motion configuration based on reduced motion preference
 *
 * Returns animation configs that respect user preferences.
 *
 * @example
 * ```tsx
 * const { spring, fade, duration } = useMotionConfig();
 *
 * return (
 *   <motion.div
 *     transition={spring}
 *     initial={fade.initial}
 *     animate={fade.animate}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */

interface MotionConfig {
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean;
  /** Spring transition config */
  spring: {
    type: 'spring';
    stiffness: number;
    damping: number;
  } | { duration: number };
  /** Fade animation variants */
  fade: {
    initial: { opacity: number };
    animate: { opacity: number };
    exit: { opacity: number };
  };
  /** Scale animation variants */
  scale: {
    initial: { scale: number; opacity: number };
    animate: { scale: number; opacity: number };
    exit: { scale: number; opacity: number };
  };
  /** Slide up animation variants */
  slideUp: {
    initial: { y: number; opacity: number };
    animate: { y: number; opacity: number };
    exit: { y: number; opacity: number };
  };
  /** Duration multiplier (0 for reduced motion, 1 otherwise) */
  durationMultiplier: number;
  /** Get duration in ms */
  getDuration: (baseDuration: number) => number;
}

export function useMotionConfig(): MotionConfig {
  const prefersReducedMotion = useReducedMotion();

  const config = React.useMemo<MotionConfig>(() => {
    if (prefersReducedMotion) {
      return {
        prefersReducedMotion: true,
        spring: { duration: 0 },
        fade: {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 1 },
        },
        scale: {
          initial: { scale: 1, opacity: 1 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1, opacity: 1 },
        },
        slideUp: {
          initial: { y: 0, opacity: 1 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 0, opacity: 1 },
        },
        durationMultiplier: 0,
        getDuration: () => 0,
      };
    }

    return {
      prefersReducedMotion: false,
      spring: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      scale: {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 },
      },
      slideUp: {
        initial: { y: 10, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 10, opacity: 0 },
      },
      durationMultiplier: 1,
      getDuration: (baseDuration: number) => baseDuration,
    };
  }, [prefersReducedMotion]);

  return config;
}

export default useReducedMotion;
