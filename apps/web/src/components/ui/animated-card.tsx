'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Phase 7: AnimatedCard
 *
 * Card component with smooth hover lift animations using Framer Motion.
 *
 * Features:
 * - Lift effect on hover (translateY -4px)
 * - Enhanced shadow on hover
 * - Border color transition
 * - Optional scale effect
 * - Respects reduced motion preferences
 */

// Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
  mass: 0.5,
};

export interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  /** Disable hover animations */
  disableAnimation?: boolean;
  /** Enable scale effect on hover (default: false) */
  enableScale?: boolean;
  /** Lift amount in pixels (default: 4) */
  liftAmount?: number;
  /** Make the card clickable with active state */
  clickable?: boolean;
  /** Apply glass morphism effect */
  glass?: boolean;
  /** Glass intensity if glass is true */
  glassIntensity?: 'subtle' | 'medium' | 'strong';
}

const glassStyles = {
  subtle: 'bg-white/40 backdrop-blur-sm border-white/20',
  medium: 'bg-white/60 backdrop-blur-md border-white/30',
  strong: 'bg-white/80 backdrop-blur-lg border-white/40',
};

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      className,
      children,
      disableAnimation = false,
      enableScale = false,
      liftAmount = 4,
      clickable = false,
      glass = false,
      glassIntensity = 'medium',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = !disableAnimation && !prefersReducedMotion;

    // Motion variants
    const motionVariants = {
      initial: {
        y: 0,
        scale: 1,
        boxShadow: 'var(--shadow-sm)',
      },
      hover: shouldAnimate ? {
        y: -liftAmount,
        scale: enableScale ? 1.01 : 1,
        boxShadow: 'var(--shadow-lg)',
      } : {},
      tap: shouldAnimate && clickable ? {
        y: 0,
        scale: 0.99,
        boxShadow: 'var(--shadow-sm)',
      } : {},
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-lg)] border bg-[var(--color-surface)] text-card-foreground',
          glass ? glassStyles[glassIntensity] : 'border-[var(--color-border)]',
          clickable && 'cursor-pointer',
          className
        )}
        variants={motionVariants}
        initial="initial"
        whileHover="hover"
        whileTap={clickable ? 'tap' : undefined}
        transition={springConfig}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

/**
 * AnimatedCardHeader
 */
export const AnimatedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-[var(--space-6)]', className)}
    {...props}
  />
));
AnimatedCardHeader.displayName = 'AnimatedCardHeader';

/**
 * AnimatedCardTitle
 */
export const AnimatedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
AnimatedCardTitle.displayName = 'AnimatedCardTitle';

/**
 * AnimatedCardDescription
 */
export const AnimatedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
AnimatedCardDescription.displayName = 'AnimatedCardDescription';

/**
 * AnimatedCardContent
 */
export const AnimatedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-[var(--space-6)] pt-0', className)} {...props} />
));
AnimatedCardContent.displayName = 'AnimatedCardContent';

/**
 * AnimatedCardFooter
 */
export const AnimatedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-[var(--space-6)] pt-0', className)}
    {...props}
  />
));
AnimatedCardFooter.displayName = 'AnimatedCardFooter';

/**
 * Card Grid with staggered animation
 */
interface AnimatedCardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid columns (responsive) */
  columns?: 1 | 2 | 3 | 4;
  /** Stagger delay between cards in ms */
  staggerDelay?: number;
}

const gridColClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export const AnimatedCardGrid = React.forwardRef<HTMLDivElement, AnimatedCardGridProps>(
  ({ className, children, columns = 3, staggerDelay = 100, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <div
        ref={ref}
        className={cn('grid gap-6', gridColClasses[columns], className)}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;

          return (
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{
                type: 'spring' as const,
                stiffness: 300,
                damping: 25,
                delay: prefersReducedMotion ? 0 : index * (staggerDelay / 1000),
              }}
            >
              {child}
            </motion.div>
          );
        })}
      </div>
    );
  }
);

AnimatedCardGrid.displayName = 'AnimatedCardGrid';

export default AnimatedCard;
