import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

// GPU-accelerated base styles with transform3d for compositor layer promotion
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 transform-gpu will-change-transform',
  {
    variants: {
      variant: {
        // New design system variants
        primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:-translate-y-[1px] hover:scale-[1.02] hover:shadow-[var(--shadow-md)] active:bg-[var(--color-primary-dark)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
        secondary: 'bg-white text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-accent-light)] hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
        ghost: 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',

        // Keep legacy Shadcn variants for compatibility with scale effects
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-[1.02] active:scale-[0.98]',
        outline:
          'border border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white hover:scale-[1.01] active:scale-[0.99]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'min-h-[44px] h-11 px-4 text-sm rounded-[var(--radius-md)]',
        default: 'min-h-[44px] h-11 px-6 text-base rounded-[var(--radius-md)]',
        lg: 'min-h-[44px] h-12 px-8 text-lg rounded-[var(--radius-md)]',
        icon: 'min-h-[44px] min-w-[44px] h-11 w-11 rounded-[var(--radius-md)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const ButtonComponent = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
ButtonComponent.displayName = 'Button'

const Button = React.memo(ButtonComponent)

export { Button, buttonVariants }
