'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'sm' | 'md' | 'lg'
}

const paddingMap = {
  sm: 'p-[var(--space-4)]',
  md: 'p-[var(--space-6)]',
  lg: 'p-[var(--space-8)]',
}

/**
 * AnimatedCard - Main container component for the minimal design system
 *
 * Features:
 * - Large rounded corners (24px)
 * - Flat, minimal design
 * - Subtle elevation variants
 * - Ready for GSAP animations via data-animate attribute
 *
 * @example
 * <AnimatedCard variant="elevated" padding="lg">
 *   <h2>Card Content</h2>
 * </AnimatedCard>
 */
export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, variant = 'default', padding = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-animate="card"
        className={cn(
          // Base styles - large border radius for minimal design
          'rounded-[24px] bg-[var(--color-surface)] transition-all duration-300',

          // Variant styles
          variant === 'default' && 'border border-[var(--color-border)]',
          variant === 'elevated' && 'border border-[var(--color-border)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
          variant === 'outlined' && 'border-2 border-[var(--color-primary)]',

          // Padding
          paddingMap[padding],

          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'
