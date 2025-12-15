'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Phase 7: AnimatedButton
 *
 * Enhanced button with Framer Motion spring-based hover/tap animations.
 * Uses smooth spring physics for a more natural, delightful feel.
 *
 * Features:
 * - Spring-based scale animations on hover (1.02x) and tap (0.98x)
 * - Subtle lift effect on hover (translateY -2px)
 * - Ripple effect on click
 * - Respects reduced motion preferences
 * - All existing button variants preserved
 */

const animatedButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-primary)] text-white focus-visible:ring-[var(--color-primary)]',
        secondary: 'bg-white text-[var(--color-primary)] border border-[var(--color-primary)]',
        ghost: 'bg-transparent text-[var(--color-text-secondary)]',
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background',
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
);

// Spring animation config for natural feel
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
  mass: 0.5,
};

// Hover variant styles (applied via motion)
const hoverVariantStyles: Record<string, { backgroundColor?: string; borderColor?: string }> = {
  primary: { backgroundColor: 'var(--color-primary-hover)' },
  secondary: { backgroundColor: 'var(--color-accent-light)' },
  ghost: { backgroundColor: 'var(--color-background)' },
  default: {},
  destructive: {},
  outline: {},
  link: {},
};

export interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof animatedButtonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
  /** Disable animations (still applies reduced motion automatically) */
  disableAnimation?: boolean;
  /** Enable ripple effect on click */
  enableRipple?: boolean;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size,
      asChild = false,
      children,
      disableAnimation = false,
      enableRipple = false,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = !disableAnimation && !prefersReducedMotion && !disabled;
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    const rippleIdRef = React.useRef(0);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Add ripple
      if (enableRipple && shouldAnimate) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const newRipple = { id: rippleIdRef.current++, x, y };
        setRipples((prev) => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);
      }

      onClick?.(event);
    };

    // Motion variants
    const motionVariants = {
      initial: {
        scale: 1,
        y: 0,
        boxShadow: 'var(--shadow-sm)',
      },
      hover: shouldAnimate ? {
        scale: 1.02,
        y: -2,
        boxShadow: 'var(--shadow-md)',
        ...hoverVariantStyles[variant || 'primary'],
      } : {},
      tap: shouldAnimate ? {
        scale: 0.98,
        y: 0,
        boxShadow: 'var(--shadow-sm)',
      } : {},
    };

    if (asChild) {
      return (
        <Slot
          className={cn(animatedButtonVariants({ variant, size, className }))}
          ref={ref as React.Ref<HTMLElement>}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={cn(
          animatedButtonVariants({ variant, size, className }),
          enableRipple && 'relative overflow-hidden'
        )}
        disabled={disabled}
        variants={motionVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        transition={springConfig}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {enableRipple && ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full bg-white/30"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
            }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' as const }}
          />
        ))}

        {children}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

/**
 * IconButton with animation
 * Specialized for icon-only buttons with circular hover effect
 */
export interface AnimatedIconButtonProps extends Omit<AnimatedButtonProps, 'size'> {
  size?: 'sm' | 'md' | 'lg';
}

const iconSizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export const AnimatedIconButton = React.forwardRef<HTMLButtonElement, AnimatedIconButtonProps>(
  ({ className, size = 'md', variant = 'ghost', ...props }, ref) => {
    return (
      <AnimatedButton
        ref={ref}
        variant={variant}
        className={cn(
          iconSizeClasses[size],
          'rounded-full p-0',
          className
        )}
        {...props}
      />
    );
  }
);

AnimatedIconButton.displayName = 'AnimatedIconButton';

export default AnimatedButton;
