'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

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

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const defaultItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween',
      ease: 'easeOut',
      duration: 0.3,
    },
  },
};

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
export function AnimatedList({
  children,
  className,
  staggerDelay = 0.1,
}: AnimatedListProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

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
}

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

export function AnimatedListItem({
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
}

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

export function AnimatedGrid({
  children,
  className,
  pattern = 'sequential',
  staggerDelay = 0.05,
}: AnimatedGridProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

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
}

/**
 * AnimatedGridItem Component
 *
 * Grid item with scale + fade animation.
 */
export function AnimatedGridItem({
  children,
  className
}: { children: ReactNode; className?: string }) {
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
export function ScaleList({
  children,
  className,
  staggerDelay = 0.08,
}: AnimatedListProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

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
}

export function ScaleListItem({
  children,
  className
}: { children: ReactNode; className?: string }) {
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
    },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
