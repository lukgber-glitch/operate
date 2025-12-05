'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface StepTransitionProps {
  children: ReactNode;
  currentStep: number;
  direction?: 'forward' | 'backward';
  className?: string;
}

/**
 * StepTransition Component
 *
 * Provides slide transitions for multi-step flows like onboarding.
 * Automatically slides right for next step, left for previous step.
 *
 * @example
 * ```tsx
 * import { StepTransition } from '@/components/transitions';
 *
 * function OnboardingFlow() {
 *   const [step, setStep] = useState(0);
 *   const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
 *
 *   const nextStep = () => {
 *     setDirection('forward');
 *     setStep(s => s + 1);
 *   };
 *
 *   const prevStep = () => {
 *     setDirection('backward');
 *     setStep(s => s - 1);
 *   };
 *
 *   return (
 *     <StepTransition currentStep={step} direction={direction}>
 *       {step === 0 && <Step1 />}
 *       {step === 1 && <Step2 />}
 *       {step === 2 && <Step3 />}
 *     </StepTransition>
 *   );
 * }
 * ```
 */
export function StepTransition({
  children,
  currentStep,
  direction = 'forward',
  className
}: StepTransitionProps) {
  const slideVariants: Variants = {
    enter: {
      x: direction === 'forward' ? 100 : -100,
      opacity: 0,
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: direction === 'forward' ? -100 : 100,
      opacity: 0,
    },
  };

  const transition = {
    type: 'tween' as const,
    ease: 'anticipate' as const,
    duration: 0.4,
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={currentStep}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * VerticalStepTransition Component
 *
 * Similar to StepTransition but slides vertically.
 * Useful for vertical wizards or expandable sections.
 *
 * @example
 * ```tsx
 * <VerticalStepTransition currentStep={activeSection} direction="forward">
 *   <SectionContent />
 * </VerticalStepTransition>
 * ```
 */
export function VerticalStepTransition({
  children,
  currentStep,
  direction = 'forward',
  className
}: StepTransitionProps) {
  const slideVariants: Variants = {
    enter: {
      y: direction === 'forward' ? 50 : -50,
      opacity: 0,
    },
    center: {
      y: 0,
      opacity: 1,
    },
    exit: {
      y: direction === 'forward' ? -50 : 50,
      opacity: 0,
    },
  };

  const transition = {
    type: 'tween' as const,
    ease: 'easeInOut' as const,
    duration: 0.35,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * StepIndicator Component
 *
 * Animated step indicator dots with smooth transitions.
 *
 * @example
 * ```tsx
 * <StepIndicator totalSteps={5} currentStep={2} />
 * ```
 */
interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  className?: string;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({
  totalSteps,
  currentStep,
  className,
  onStepClick
}: StepIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <button
          key={index}
          onClick={() => onStepClick?.(index)}
          className="relative h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 transition-all"
          style={{
            width: currentStep === index ? '32px' : '8px',
          }}
          disabled={!onStepClick}
        >
          <motion.div
            className="absolute inset-0 bg-blue-600"
            initial={false}
            animate={{
              scaleX: currentStep === index ? 1 : currentStep > index ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ transformOrigin: 'left' }}
          />
        </button>
      ))}
    </div>
  );
}
