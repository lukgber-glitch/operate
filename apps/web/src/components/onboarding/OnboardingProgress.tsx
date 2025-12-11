'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  optional?: boolean
}

interface OnboardingProgressProps {
  steps: OnboardingStep[]
  currentStep: number
  completedSteps: Set<number>
}

/**
 * Phase 8: Enhanced OnboardingProgress with Framer Motion
 *
 * Features:
 * - Animated step circles with scale and color transitions
 * - Smooth progress bar with spring physics
 * - Checkmark icon with bounce animation on completion
 * - Pulsing current step indicator
 * - Respects reduced motion preferences
 */

// Spring config for natural animations
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
}

export function OnboardingProgress({
  steps,
  currentStep,
  completedSteps,
}: OnboardingProgressProps) {
  const [isMounted, setIsMounted] = React.useState(false)
  const prefersReducedMotion = useReducedMotion()
  const progressPercent = ((currentStep + 1) / steps.length) * 100

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="w-full py-6">
      {/* Mobile: Compact progress bar */}
      <div className="md:hidden mb-4">
        <div className="flex justify-between text-sm text-white/60 mb-2">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <motion.span
            key={progressPercent}
            initial={prefersReducedMotion || !isMounted ? {} : { opacity: 0, y: -5 }}
            animate={prefersReducedMotion || !isMounted ? {} : { opacity: 1, y: 0 }}
            transition={springConfig}
          >
            {Math.round(progressPercent)}%
          </motion.span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            initial={prefersReducedMotion ? { width: `${progressPercent}%` } : { width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={prefersReducedMotion ? { duration: 0 } : {
              type: 'spring' as const,
              stiffness: 100,
              damping: 20,
            }}
          />
        </div>
      </div>

      {/* Desktop: Step indicator */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index)
            const isCurrent = index === currentStep
            const isLast = index === steps.length - 1

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  {/* Step circle with animation */}
                  <motion.div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 relative',
                      isCompleted &&
                        'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500 text-white',
                      isCurrent &&
                        !isCompleted &&
                        'border-blue-500 bg-white/10 text-white',
                      !isCurrent &&
                        !isCompleted &&
                        'border-white/30 bg-white/5 text-white/60'
                    )}
                    initial={prefersReducedMotion || !isMounted ? {} : { scale: 0.8, opacity: 0 }}
                    animate={prefersReducedMotion || !isMounted ? {} : {
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{
                      ...springConfig,
                      delay: prefersReducedMotion || !isMounted ? 0 : index * 0.05,
                    }}
                    whileHover={prefersReducedMotion || !isMounted ? {} : { scale: 1.05 }}
                  >
                    {/* Pulse ring for current step */}
                    {isCurrent && !isCompleted && !prefersReducedMotion && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-blue-500"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut' as const,
                        }}
                      />
                    )}

                    {isCompleted ? (
                      <motion.div
                        initial={prefersReducedMotion || !isMounted ? {} : { scale: 0, rotate: -45 }}
                        animate={prefersReducedMotion || !isMounted ? {} : { scale: 1, rotate: 0 }}
                        transition={{
                          type: 'spring' as const,
                          stiffness: 400,
                          damping: 15,
                        }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.span
                        className="text-sm font-medium"
                        initial={prefersReducedMotion || !isMounted ? {} : { opacity: 0 }}
                        animate={prefersReducedMotion || !isMounted ? {} : { opacity: 1 }}
                        transition={{ delay: prefersReducedMotion || !isMounted ? 0 : 0.1 + index * 0.05 }}
                      >
                        {index + 1}
                      </motion.span>
                    )}
                  </motion.div>

                  {/* Step label with animation */}
                  <motion.div
                    className="mt-2 text-center max-w-[120px]"
                    initial={prefersReducedMotion || !isMounted ? {} : { opacity: 0, y: 5 }}
                    animate={prefersReducedMotion || !isMounted ? {} : { opacity: 1, y: 0 }}
                    transition={{
                      ...springConfig,
                      delay: prefersReducedMotion || !isMounted ? 0 : 0.1 + index * 0.05,
                    }}
                  >
                    <p
                      className={cn(
                        'text-xs font-medium transition-colors duration-200',
                        isCurrent ? 'text-white' : 'text-white/60'
                      )}
                    >
                      {step.title}
                    </p>
                    {step.optional && (
                      <p className="text-xs text-white/60 mt-0.5">
                        (Optional)
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Connector line with animation */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 bg-white/10 relative -mt-12 overflow-hidden rounded-full">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full origin-left"
                      initial={prefersReducedMotion ? { scaleX: isCompleted ? 1 : 0 } : { scaleX: 0 }}
                      animate={{ scaleX: isCompleted ? 1 : 0 }}
                      transition={prefersReducedMotion ? { duration: 0 } : {
                        type: 'spring' as const,
                        stiffness: 100,
                        damping: 20,
                        delay: isCompleted ? 0.2 : 0,
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Mini progress indicator for compact displays
 */
interface MiniProgressProps {
  current: number
  total: number
  className?: string
}

export function MiniProgress({ current, total, className }: MiniProgressProps) {
  const [isMounted, setIsMounted] = React.useState(false)
  const prefersReducedMotion = useReducedMotion()
  const percent = ((current + 1) / total) * 100

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          initial={prefersReducedMotion || !isMounted ? { width: `${percent}%` } : { width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={prefersReducedMotion || !isMounted ? { duration: 0 } : springConfig}
        />
      </div>
      <span className="text-xs text-white/60 whitespace-nowrap">
        {current + 1}/{total}
      </span>
    </div>
  )
}

export default OnboardingProgress
