/**
 * PremiumProgressBar Component
 * Animated progress bar with step indicators, gradient fill, and shine effect
 * WCAG accessible with ARIA progressbar role
 */

'use client'

import * as React from 'react'
import { Check } from 'lucide-react'

interface PremiumProgressBarProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function PremiumProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: PremiumProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress bar container */}
      <div
        className="relative h-2 bg-white/10 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        {/* Gradient fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-4">
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isPending = index > currentStep

          return (
            <div
              key={index}
              className={`flex flex-col items-center transition-all duration-300 ${
                isPending ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {/* Circle indicator */}
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent'
                    : isCurrent
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 bg-transparent'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                ) : (
                  <span className="text-sm font-semibold text-white">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span className="text-xs text-white/70 mt-2 text-center max-w-[80px]">
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
