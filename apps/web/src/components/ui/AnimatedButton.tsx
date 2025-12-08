'use client'

import * as React from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

export interface AnimatedButtonProps extends ButtonProps {
  /**
   * Type of press animation
   * - 'default': Subtle scale down on press (scale-[0.98])
   * - 'soft': More pronounced scale down (scale-[0.96])
   * - 'none': No press animation
   */
  pressEffect?: 'default' | 'soft' | 'none';

  /**
   * Add a success pulse animation (useful for save/submit actions)
   */
  success?: boolean;

  /**
   * Add an error shake animation
   */
  error?: boolean;

  /**
   * Show loading spinner animation
   */
  loading?: boolean;
}

/**
 * AnimatedButton - Button component with built-in micro-interactions
 *
 * Features:
 * - Press feedback (scale down on click)
 * - Success pulse animation
 * - Error shake animation
 * - Loading spinner
 *
 * @example
 * <AnimatedButton pressEffect="soft" success={saved}>
 *   Save Changes
 * </AnimatedButton>
 */
export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({
    className,
    pressEffect = 'default',
    success = false,
    error = false,
    loading = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [showError, setShowError] = React.useState(false);

    // Handle success animation
    React.useEffect(() => {
      if (success) {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), 1000);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [success]);

    // Handle error animation
    React.useEffect(() => {
      if (error) {
        setShowError(true);
        const timer = setTimeout(() => setShowError(false), 500);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [error]);

    const animationClasses = cn(
      pressEffect === 'default' && 'btn-press',
      pressEffect === 'soft' && 'btn-press-soft',
      showSuccess && 'animate-pulse-success',
      showError && 'animate-shake',
      className
    );

    return (
      <Button
        ref={ref}
        className={animationClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spinner me-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
