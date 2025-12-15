'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode, useMemo, memo } from 'react';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  /**
   * Custom variants for list items
   * If not provided, uses default fade + slide up
   */
  itemVariants?: Variants;
}

// Default item variants defined outside component to prevent recreation
const defaultItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      ease: 'easeOut' as const,
      duration: 0.3,
    },
  },
} as const;

/**
 * AnimatedList Component
 *
 * Wrapper for lists that need stagger animations.
 * Items appear one by one with a delay.
 *
 * @example
 * ```tsx
 * import { AnimatedList, AnimatedListItem } from '@/components/transitions';
 *
 * function MyList({ items }) {
 *   return (
 *     <AnimatedList>
 *       {items.map(item => (
 *         <AnimatedListItem key={item.id}>
 *           <div>{item.name}</div>
 *         </AnimatedListItem>
 *       ))}
 *     </AnimatedList>
 *   );
 * }
 * ```
 */
export const AnimatedList = memo(function AnimatedList({
  children,
  className,
  staggerDelay = 0.1,
}: AnimatedListProps) {
  // Memoize container variants to prevent recreation on each render
  const containerVariants = useMemo<Variants>(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }), [staggerDelay]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
})

/**
 * AnimatedListItem Component
 *
 * Individual item wrapper for AnimatedList.
 * Use this as a direct child of AnimatedList.
 */
interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
}

export const AnimatedListItem = memo(function AnimatedListItem({
  children,
  className,
  variants = defaultItemVariants,
}: AnimatedListItemProps) {
  return (
    <motion.div
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
})

/**
 * AnimatedGrid Component
 *
 * Similar to AnimatedList but optimized for grid layouts.
 * Supports different stagger patterns.
 *
 * @example
 * ```tsx
 * <AnimatedGrid pattern="diagonal">
 *   {items.map(item => (
 *     <AnimatedGridItem key={item.id}>
 *       <Card />
 *     </AnimatedGridItem>
 *   ))}
 * </AnimatedGrid>
 * ```
 */
interface AnimatedGridProps {
  children: ReactNode;
  className?: string;
  pattern?: 'sequential' | 'diagonal' | 'random';
  staggerDelay?: number;
}

export const AnimatedGrid = memo(function AnimatedGrid({
  children,
  className,
  staggerDelay = 0.05,
}: AnimatedGridProps) {
  // Memoize container variants
  const containerVariants = useMemo<Variants>(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  }), [staggerDelay]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
})

// Grid item variants - defined outside component
const gridItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
} as const;

/**
 * AnimatedGridItem Component
 *
 * Grid item with scale + fade animation.
 */
export const AnimatedGridItem = memo(function AnimatedGridItem({
  children,
  className
}: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={gridItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
})

// Scale list item variants - defined outside component
const scaleListItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 20,
    },
  },
} as const;

/**
 * ScaleList Component
 *
 * List that uses scale animation instead of slide.
 * Good for cards and thumbnails.
 *
 * @example
 * ```tsx
 * <ScaleList>
 *   {cards.map(card => (
 *     <ScaleListItem key={card.id}>
 *       <Card />
 *     </ScaleListItem>
 *   ))}
 * </ScaleList>
 * ```
 */
export const ScaleList = memo(function ScaleList({
  children,
  className,
  staggerDelay = 0.08,
}: AnimatedListProps) {
  // Memoize container variants
  const containerVariants = useMemo<Variants>(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }), [staggerDelay]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
})

export const ScaleListItem = memo(function ScaleListItem({
  children,
  className
}: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={scaleListItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
})
