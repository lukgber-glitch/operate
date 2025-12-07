'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface HeadlineOutsideProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  subtitle?: string
  align?: 'left' | 'center'
  actions?: React.ReactNode
}

/**
 * HeadlineOutside - Headline component that sits outside containers
 *
 * Features:
 * - 24px font size, weight 600
 * - Secondary text color for subtle appearance
 * - Optional subtitle below
 * - Optional actions on the right
 * - Margin bottom to create space before card
 * - Left or center alignment
 *
 * @example
 * <HeadlineOutside subtitle="Manage your account settings" actions={<Button>Add</Button>}>
 *   Settings
 * </HeadlineOutside>
 * <AnimatedCard>
 *   // Card content
 * </AnimatedCard>
 */
export const HeadlineOutside = React.forwardRef<HTMLDivElement, HeadlineOutsideProps>(
  ({ children, subtitle, align = 'left', actions, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Spacing below to separate from card
          'mb-[var(--space-6)]',

          // Alignment
          align === 'center' && 'text-center',
          align === 'left' && 'text-start',

          className
        )}
        {...props}
      >
        <div className={cn('flex items-start justify-between gap-4', actions && 'flex-wrap sm:flex-nowrap')}>
          <div>
            {/* Main Headline */}
            <h2
              className={cn(
                'text-[24px] font-semibold leading-tight',
                'text-[var(--color-text-secondary)]',
                subtitle && 'mb-1'
              )}
            >
              {children}
            </h2>

            {/* Optional Subtitle */}
            {subtitle && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Optional Actions */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    )
  }
)

HeadlineOutside.displayName = 'HeadlineOutside'
