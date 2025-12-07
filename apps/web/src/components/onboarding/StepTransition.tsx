'use client'

import * as React from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'

interface StepTransitionProps {
  children: React.ReactNode
  direction?: 'forward' | 'backward'
  stepKey: string | number
}

/**
 * StepTransition Component
 * Animates transitions between onboarding steps
 * - Slides out current step (left for forward, right for backward)
 * - Slides in new step (from right for forward, from left for backward)
 */
export function StepTransition({ children, direction = 'forward', stepKey }: StepTransitionProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const prevKeyRef = React.useRef(stepKey)

  useGSAP(() => {
    if (containerRef.current && prevKeyRef.current !== stepKey) {
      const isForward = direction === 'forward'

      // Entry animation
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          x: isForward ? 50 : -50,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          ease: 'power2.out',
        }
      )

      prevKeyRef.current = stepKey
    }
  }, [stepKey, direction])

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  )
}
