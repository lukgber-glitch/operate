/**
 * Enhanced Badge Component with Success, Warning, and Info variants
 *
 * Extends the base Badge component with additional semantic color variants
 * optimized for both light and dark modes.
 */

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        success:
          'border-transparent bg-success text-success-foreground hover:bg-success/80',
        warning:
          'border-transparent bg-warning text-warning-foreground hover:bg-warning/80',
        info:
          'border-transparent bg-info text-info-foreground hover:bg-info/80',
        outline: 'text-foreground',
        'outline-success':
          'border-success text-success dark:text-success-foreground',
        'outline-warning':
          'border-warning text-warning dark:text-warning-foreground',
        'outline-info':
          'border-info text-info dark:text-info-foreground',
        'outline-destructive':
          'border-destructive text-destructive dark:text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeEnhancedProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Optional dot indicator
   */
  showDot?: boolean
  /**
   * Dot position (defaults to 'left')
   */
  dotPosition?: 'left' | 'right'
}

function BadgeEnhanced({
  className,
  variant,
  showDot = false,
  dotPosition = 'left',
  children,
  ...props
}: BadgeEnhancedProps) {
  const dotColor = React.useMemo(() => {
    switch (variant) {
      case 'success':
      case 'outline-success':
        return 'bg-success'
      case 'warning':
      case 'outline-warning':
        return 'bg-warning'
      case 'info':
      case 'outline-info':
        return 'bg-info'
      case 'destructive':
      case 'outline-destructive':
        return 'bg-destructive'
      default:
        return 'bg-current'
    }
  }, [variant])

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && dotPosition === 'left' && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            dotColor
          )}
          aria-hidden="true"
        />
      )}
      {children}
      {showDot && dotPosition === 'right' && (
        <span
          className={cn(
            'ml-1.5 h-1.5 w-1.5 rounded-full',
            dotColor
          )}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export { BadgeEnhanced, badgeVariants }
