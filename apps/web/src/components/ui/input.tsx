import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error state for accessibility */
  error?: boolean
  /** Error message to be announced by screen readers */
  errorMessage?: string
}

/**
 * Input component with enhanced accessibility
 * - Proper ARIA attributes for error states
 * - Touch-friendly minimum height (44px)
 * - High contrast focus states
 */
const InputComponent = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorMessage, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-[44px] h-11 w-full max-w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-base md:text-sm text-white transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/40 focus-visible:outline-none focus-visible:border-white/40 focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={ariaDescribedBy || (errorMessage ? `${props.id}-error` : undefined)}
        {...props}
      />
    )
  }
)
InputComponent.displayName = 'Input'

const Input = React.memo(InputComponent)

export { Input }
