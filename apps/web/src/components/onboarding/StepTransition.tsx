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
 * Animates transitions between onboarding steps with EXIT→ENTER timing
 * Following DESIGN_OVERHAUL_PLAN.md specifications:
 * - EXIT: 300ms fade out + scale down (0.95) with power2.inOut
 * - ENTER: 400ms fade in + scale up (1.0) with power2.inOut
 * - Total duration: 700ms
 */
export function StepTransition({ children, direction = 'forward', stepKey }: StepTransitionProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const prevKeyRef = React.useRef(stepKey)
  const [currentChildren, setCurrentChildren] = React.useState(children)

  useGSAP(() => {
    if (!containerRef.current) return

    // Only animate when step actually changes
    if (prevKeyRef.current === stepKey) {
      return
    }

    // Create timeline for EXIT → ENTER sequence
    const timeline = gsap.timeline()

    // EXIT phase: Fade out + scale down current content (300ms)
    timeline.to(containerRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: 'power2.inOut',
      onComplete: () => {
        // Update content after exit completes
        setCurrentChildren(children)
        prevKeyRef.current = stepKey
      }
    })

    // ENTER phase: Fade in + scale up new content (400ms)
    timeline.fromTo(
      containerRef.current,
      {
        opacity: 0,
        scale: 0.95,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'power2.inOut',
      }
    )

    return () => {
      timeline.kill()
    }
  }, [stepKey, direction, children])

  // Set initial state
  React.useEffect(() => {
    if (prevKeyRef.current === stepKey) {
      setCurrentChildren(children)
    }
  }, [children, stepKey])

  return (
    <div ref={containerRef} className="w-full">
      {currentChildren}
    </div>
  )
}
