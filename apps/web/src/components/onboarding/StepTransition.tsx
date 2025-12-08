'use client'

import * as React from 'react'

interface StepTransitionProps {
  children: React.ReactNode
  direction?: 'forward' | 'backward'
  stepKey: string | number
}

/**
 * StepTransition Component
 * Simple CSS-based transitions between onboarding steps
 */
export function StepTransition({ children, direction = 'forward', stepKey }: StepTransitionProps) {
  return (
    <div className="w-full transition-opacity duration-300">
      {children}
    </div>
  )
}
