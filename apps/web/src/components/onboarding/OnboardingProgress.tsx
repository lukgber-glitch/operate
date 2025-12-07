import { Check } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'

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

export function OnboardingProgress({
  steps,
  currentStep,
  completedSteps,
}: OnboardingProgressProps) {
  const mobileBarRef = React.useRef<HTMLDivElement>(null)
  const stepDotsRef = React.useRef<HTMLDivElement>(null)
  const prevStepRef = React.useRef(currentStep)

  // Animate progress bar on mobile
  useGSAP(() => {
    if (mobileBarRef.current) {
      gsap.to(mobileBarRef.current, {
        width: `${((currentStep + 1) / steps.length) * 100}%`,
        duration: 0.5,
        ease: 'power2.out',
      })
    }
  }, [currentStep, steps.length])

  // Animate step dots on desktop
  useGSAP(() => {
    if (stepDotsRef.current && prevStepRef.current !== currentStep) {
      const dots = stepDotsRef.current.querySelectorAll('.step-dot')
      const currentDot = dots[currentStep]

      if (currentDot) {
        // Scale up the current step dot
        gsap.fromTo(
          currentDot,
          { scale: 0.9 },
          { scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
        )
      }

      // Animate connector lines for completed steps
      const lines = stepDotsRef.current.querySelectorAll('.connector-line-fill')
      lines.forEach((line, index) => {
        if (completedSteps.has(index)) {
          gsap.to(line, {
            scaleX: 1,
            duration: 0.4,
            ease: 'power2.out',
          })
        }
      })

      prevStepRef.current = currentStep
    }
  }, [currentStep, completedSteps])

  return (
    <div className="w-full py-6">
      {/* Mobile: Compact progress bar */}
      <div className="md:hidden mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            ref={mobileBarRef}
            className="h-full bg-primary"
            style={{
              width: '0%',
            }}
          />
        </div>
      </div>

      {/* Desktop: Step indicator */}
      <div ref={stepDotsRef} className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index)
            const isCurrent = index === currentStep
            const isLast = index === steps.length - 1

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  {/* Step circle */}
                  <div
                    className={cn(
                      'step-dot w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200',
                      isCompleted &&
                        'bg-primary border-primary text-primary-foreground',
                      isCurrent &&
                        !isCompleted &&
                        'border-primary bg-background text-primary',
                      !isCurrent &&
                        !isCompleted &&
                        'border-muted bg-background text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Step label */}
                  <div className="mt-2 text-center max-w-[120px]">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        isCurrent ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </p>
                    {step.optional && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        (Optional)
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 bg-muted relative -mt-12 overflow-hidden">
                    <div
                      className="connector-line-fill h-full bg-primary origin-left"
                      style={{
                        transform: isCompleted ? 'scaleX(1)' : 'scaleX(0)',
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
