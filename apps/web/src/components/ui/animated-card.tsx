'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'

export interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

/**
 * AnimatedCard - A card component with GSAP entrance animations
 *
 * Features:
 * - 24px border radius per design system
 * - CSS variable-based theming
 * - Smooth hover transitions
 * - Optional elevated variant with shadow
 * - GSAP fade-in animation on mount
 */
export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, variant = 'default', padding = 'md', animate = true, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement | null>(null)

    const setRefs = React.useCallback((node: HTMLDivElement | null) => {
      internalRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    }, [ref])

    useEffect(() => {
      if (!animate || !internalRef.current) return

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) return

      // GSAP entrance animation
      gsap.fromTo(
        internalRef.current,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        }
      )
    }, [animate])

    return (
      <div
        ref={setRefs}
        data-animate="card"
        className={cn(
          // Base styles with design system values
          'rounded-[24px] bg-[var(--color-surface)] transition-all duration-300',
          
          // Variant styles
          variant === 'default' && 'border border-[var(--color-border)]',
          variant === 'elevated' && 'border border-[var(--color-border)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
          variant === 'outline' && 'border-2 border-[var(--color-border)]',
          
          // Padding
          paddingMap[padding],
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'
