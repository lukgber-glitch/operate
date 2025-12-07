'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  onClick?: () => void
  'aria-label': string
  size?: 'sm' | 'md'
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
}

/**
 * IconButton - Minimal icon-only button
 *
 * Features:
 * - Ghost style (no background by default)
 * - Subtle hover background
 * - Accessible with required aria-label
 * - Two sizes: small (32px) and medium (40px)
 * - Rounded corners matching design system
 *
 * @example
 * <IconButton
 *   icon={<Settings className="h-5 w-5" />}
 *   aria-label="Open settings"
 *   onClick={handleSettings}
 * />
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, onClick, 'aria-label': ariaLabel, size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'rounded-[var(--radius-lg)] transition-all duration-200',

          // Ghost style - no background by default
          'bg-transparent text-[var(--color-text-secondary)]',

          // Hover state - subtle background
          'hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)]',

          // Active state
          'active:bg-[var(--color-border)]',

          // Focus state - accessible
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',

          // Disabled state
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-secondary)]',

          // Size
          sizeMap[size],

          className
        )}
        {...props}
      >
        {icon}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
