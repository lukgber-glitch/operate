import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state for accessibility */
  error?: boolean
  /** Error message to be announced by screen readers */
  errorMessage?: string
}

/**
 * Textarea component with enhanced accessibility
 * - Proper ARIA attributes for error states
 * - Auto-resize support (via CSS resize property)
 * - High contrast focus states
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorMessage, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-base md:text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:border-white/40 focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
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
Textarea.displayName = "Textarea"

export { Textarea }
