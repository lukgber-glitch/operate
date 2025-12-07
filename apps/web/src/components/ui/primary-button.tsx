'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  id?: string
}

const sizeMap = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-lg',
}

/**
 * PrimaryButton - Main action button for the minimal design system
 *
 * Features:
 * - Primary brand color background
 * - Rounded corners (12px)
 * - Hover state with darkening
 * - Loading state with spinner
 * - Accessible focus ring
 * - Ready for GSAP morphing animations via id prop
 *
 * @example
 * <PrimaryButton
 *   id="submit-btn"
 *   loading={isSubmitting}
 *   onClick={handleSubmit}
 * >
 *   Submit
 * </PrimaryButton>
 */
export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({
    children,
    onClick,
    disabled = false,
    loading = false,
    fullWidth = false,
    size = 'md',
    id,
    className,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'rounded-[12px] font-medium transition-all duration-200',
          'bg-[var(--color-primary)] text-white',

          // Hover state
          'hover:bg-[var(--color-primary-hover)] hover:-translate-y-[1px]',
          'hover:shadow-[var(--shadow-md)]',

          // Active state
          'active:bg-[var(--color-primary-dark)] active:translate-y-0',

          // Focus state - accessible
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',

          // Disabled state
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'disabled:hover:translate-y-0 disabled:hover:shadow-none',

          // Size
          sizeMap[size],

          // Full width
          fullWidth && 'w-full',

          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    )
  }
)

PrimaryButton.displayName = 'PrimaryButton'
