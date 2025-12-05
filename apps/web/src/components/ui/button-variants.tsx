/**
 * Enhanced Button Component with Success, Warning, and Info variants
 *
 * Extends the base Button component with additional semantic color variants
 * optimized for both light and dark modes.
 */

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const buttonVariantsEnhanced = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success:
          'bg-success text-success-foreground hover:bg-success/90',
        warning:
          'bg-warning text-warning-foreground hover:bg-warning/90',
        info:
          'bg-info text-info-foreground hover:bg-info/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        'outline-success':
          'border border-success text-success bg-background hover:bg-success/10 dark:hover:bg-success/20',
        'outline-warning':
          'border border-warning text-warning bg-background hover:bg-warning/10 dark:hover:bg-warning/20',
        'outline-info':
          'border border-info text-info bg-background hover:bg-info/10 dark:hover:bg-info/20',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        'ghost-success':
          'text-success hover:bg-success/10 dark:hover:bg-success/20',
        'ghost-warning':
          'text-warning hover:bg-warning/10 dark:hover:bg-warning/20',
        'ghost-info':
          'text-info hover:bg-info/10 dark:hover:bg-info/20',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonEnhancedProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariantsEnhanced> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const ButtonEnhanced = React.forwardRef<HTMLButtonElement, ButtonEnhancedProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText,
    disabled,
    children,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariantsEnhanced({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        )}
        {!loading && children}
      </Comp>
    )
  }
)
ButtonEnhanced.displayName = 'ButtonEnhanced'

export { ButtonEnhanced, buttonVariantsEnhanced }
