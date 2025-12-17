'use client'

import { motion, AnimatePresence } from 'framer-motion'
import * as React from 'react'

import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface StepTransitionProps {
  children: React.ReactNode
  direction?: 'forward' | 'backward'
  stepKey: string | number
}

/**
 * Phase 8: Enhanced StepTransition with Framer Motion
 *
 * Features:
 * - Smooth slide + fade transitions between steps
 * - Direction-aware animations (forward slides left, backward slides right)
 * - Morphing card container with layoutId
 * - Respects reduced motion preferences
 */

// Animation variants for step content - start visible for SSR compatibility
const variants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 100 : -100,
    opacity: 1,  // Start visible for SSR
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? -100 : 100,
    opacity: 0,
    scale: 0.98,
  }),
}

// Reduced motion variants (no movement, just fade) - start visible for SSR
const reducedMotionVariants = {
  enter: {
    opacity: 1,  // Start visible for SSR
  },
  center: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
}

// Spring transition for natural feel
const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
}

// Fast transition for reduced motion
const reducedTransition = {
  duration: 0.15,
}

export function StepTransition({
  children,
  direction = 'forward',
  stepKey
}: StepTransitionProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="w-full relative overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={stepKey}
          custom={direction}
          variants={prefersReducedMotion ? reducedMotionVariants : variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={prefersReducedMotion ? reducedTransition : springTransition}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/**
 * MorphingStepCard - Glassmorphic card that morphs between steps
 *
 * Use this to wrap step content for a consistent morphing effect
 */
interface MorphingStepCardProps {
  children: React.ReactNode
  className?: string
  /** Unique ID for morphing - defaults to 'onboarding-step-card' */
  layoutId?: string
}

export function MorphingStepCard({
  children,
  className,
  layoutId = 'onboarding-step-card'
}: MorphingStepCardProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      layoutId={prefersReducedMotion ? undefined : layoutId}
      className={`
        w-full max-w-2xl mx-auto
        bg-white/80 backdrop-blur-md
        border border-white/40
        rounded-[16px]
        shadow-lg
        p-8
        ${className || ''}
      `}
      transition={springTransition}
    >
      {children}
    </motion.div>
  )
}

/**
 * StepContentWrapper - Animates step content with stagger
 *
 * Wraps step content to add staggered entrance animations
 */
interface StepContentWrapperProps {
  children: React.ReactNode
  className?: string
}

export function StepContentWrapper({ children, className }: StepContentWrapperProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 1 }}  // Start visible for SSR
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * StepTitle - Animated step title
 */
interface StepTitleProps {
  children: React.ReactNode
  className?: string
}

export function StepTitle({ children, className }: StepTitleProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <h2 className={`text-2xl font-semibold mb-2 ${className || ''}`}>{children}</h2>
  }

  return (
    <motion.h2
      className={`text-2xl font-semibold mb-2 ${className || ''}`}
      initial={{ opacity: 1, y: 0 }}  // Start visible for SSR
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 25, delay: 0.05 }}
    >
      {children}
    </motion.h2>
  )
}

/**
 * StepDescription - Animated step description
 */
interface StepDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function StepDescription({ children, className }: StepDescriptionProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <p className={`text-muted-foreground mb-6 ${className || ''}`}>{children}</p>
  }

  return (
    <motion.p
      className={`text-muted-foreground mb-6 ${className || ''}`}
      initial={{ opacity: 1, y: 0 }}  // Start visible for SSR
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 25, delay: 0.1 }}
    >
      {children}
    </motion.p>
  )
}

export default StepTransition
