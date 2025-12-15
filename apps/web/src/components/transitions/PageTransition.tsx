'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, memo } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  /**
   * Unique key for the page to trigger transitions
   * Use pathname or a unique identifier
   */
  pageKey?: string;
}

// Page variants defined outside component for optimal performance
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
} as const;

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.3,
} as const;

/**
 * PageTransition Component
 *
 * Wraps page content with smooth fade and slide transitions.
 * Use this at the page/route level for smooth navigation.
 *
 * @example
 * ```tsx
 * import { PageTransition } from '@/components/transitions';
 *
 * export default function HomePage() {
 *   return (
 *     <PageTransition pageKey="home">
 *       <div>Your page content</div>
 *     </PageTransition>
 *   );
 * }
 * ```
 */
export const PageTransition = memo(function PageTransition({ children, className, pageKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
})

/**
 * FadeTransition Component
 *
 * Simple fade-only transition without slide effect.
 * Useful for content swaps within the same page.
 *
 * @example
 * ```tsx
 * <FadeTransition show={isVisible}>
 *   <div>Content</div>
 * </FadeTransition>
 * ```
 */
interface FadeTransitionProps {
  children: ReactNode;
  show: boolean;
  className?: string;
  duration?: number;
}

export const FadeTransition = memo(function FadeTransition({
  children,
  show,
  className,
  duration = 0.3
}: FadeTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: 'easeInOut' as const }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
})
