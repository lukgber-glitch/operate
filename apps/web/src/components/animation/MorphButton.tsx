'use client';

/**
 * MorphButton Component
 *
 * A special button that morphs into the next container when clicked.
 * Uses GSAP FLIP technique for smooth position/size transitions.
 */

import React, { useRef, useEffect, type ButtonHTMLAttributes } from 'react';
import { usePageTransition } from '@/hooks/usePageTransition';
import { cn } from '@/lib/utils';

/**
 * MorphButton component props
 */
export interface MorphButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** ID used to identify this button for morphing (must be unique) */
  targetId: string;
  /** Button content */
  children: React.ReactNode;
  /** Click handler (optional - morphing happens automatically) */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * MorphButton component
 *
 * A button that automatically registers itself for morphing animations.
 * When used with usePageTransition.transitionTo(), this button will
 * smoothly expand to fill the target container on the next page.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <MorphButton
 *   targetId="form-container"
 *   onClick={() => router.push('/form')}
 * >
 *   Get Started
 * </MorphButton>
 * ```
 *
 * @example
 * ```tsx
 * // With transition coordination
 * function MyPage() {
 *   const { transitionTo } = usePageTransition();
 *   const router = useRouter();
 *
 *   const handleClick = () => {
 *     transitionTo('form-container', () => {
 *       router.push('/form');
 *     });
 *   };
 *
 *   return (
 *     <MorphButton
 *       targetId="form-container"
 *       onClick={handleClick}
 *       variant="primary"
 *       size="lg"
 *     >
 *       Get Started
 *     </MorphButton>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Target container on the next page
 * <div data-morph-target="form-container">
 *   <FormComponent />
 * </div>
 * ```
 */
export function MorphButton({
  targetId,
  children,
  onClick,
  className,
  disabled = false,
  variant = 'primary',
  size = 'md',
  ...props
}: MorphButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { registerElement, unregisterElement, isTransitioning } = usePageTransition();

  // Register this button for morphing
  useEffect(() => {
    if (buttonRef.current && targetId) {
      registerElement(targetId, buttonRef, 'button');
    }

    return () => {
      if (targetId) {
        unregisterElement(targetId);
      }
    };
  }, [targetId, registerElement, unregisterElement]);

  // Variant styles
  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-dark)]',
    secondary: 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]',
    ghost: 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)]',
  };

  // Size styles
  const sizeClasses = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  };

  return (
    <button
      ref={buttonRef}
      id={targetId}
      onClick={onClick}
      disabled={disabled || isTransitioning}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2',
        'rounded-[12px] font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',

        // Hover effects
        'hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]',

        // Active state
        'active:translate-y-0',

        // Disabled state
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'disabled:hover:translate-y-0 disabled:hover:shadow-none',

        // Variant
        variantClasses[variant],

        // Size
        sizeClasses[size],

        // Transitioning state - keep button visible during morph
        isTransitioning && 'pointer-events-none',

        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * MorphTarget Component
 *
 * Helper component for marking containers as morph targets.
 * Use this on the destination page to indicate where the button should morph to.
 *
 * @example
 * ```tsx
 * import { MorphTarget } from '@/components/animation/MorphButton';
 *
 * function NextPage() {
 *   return (
 *     <MorphTarget targetId="form-container">
 *       <FormComponent />
 *     </MorphTarget>
 *   );
 * }
 * ```
 */
export function MorphTarget({
  targetId,
  children,
  className,
}: {
  targetId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerElement, unregisterElement } = usePageTransition();

  // Register this container as a morph target
  useEffect(() => {
    if (containerRef.current && targetId) {
      registerElement(targetId, containerRef, 'container');
    }

    return () => {
      if (targetId) {
        unregisterElement(targetId);
      }
    };
  }, [targetId, registerElement, unregisterElement]);

  return (
    <div
      ref={containerRef}
      data-morph-target={targetId}
      className={cn('w-full', className)}
    >
      {children}
    </div>
  );
}
