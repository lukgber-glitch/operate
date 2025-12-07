import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // New design system variants
        primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)] active:bg-[var(--color-primary-dark)] active:translate-y-0 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
        secondary: 'bg-white text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-accent-light)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
        ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',

        // Keep legacy Shadcn variants for compatibility
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-[var(--radius-md)]',
        default: 'h-10 px-6 text-base rounded-[var(--radius-md)]',
        lg: 'h-12 px-8 text-lg rounded-[var(--radius-md)]',
        icon: 'h-10 w-10 rounded-[var(--radius-md)]',
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
Button.displayName = 'Button'

export { Button, buttonVariants }
