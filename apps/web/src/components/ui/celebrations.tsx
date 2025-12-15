'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, PartyPopper } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Phase 7: Celebration and Success Animations
 *
 * Components for success, error, and celebration feedback states.
 * Uses Framer Motion for smooth, spring-based animations.
 */

// ============================================
// SUCCESS CHECKMARK
// ============================================

export interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onComplete?: () => void;
}

const sizeMap = {
  sm: { container: 'w-12 h-12', icon: 20 },
  md: { container: 'w-16 h-16', icon: 28 },
  lg: { container: 'w-24 h-24', icon: 40 },
};

export function SuccessCheckmark({
  size = 'md',
  className,
  onComplete
}: SuccessCheckmarkProps) {
  const { container, icon } = sizeMap[size];

  return (
    <motion.div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-green-500',
        container,
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
      }}
      onAnimationComplete={onComplete}
    >
      {/* Circle ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-green-400"
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      />

      {/* Checkmark icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring' as const,
          stiffness: 400,
          damping: 15,
          delay: 0.15,
        }}
      >
        <Check size={icon} className="text-white" strokeWidth={3} />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// ERROR INDICATOR
// ============================================

export interface ErrorIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  shake?: boolean;
  onComplete?: () => void;
}

export function ErrorIndicator({
  size = 'md',
  className,
  shake = true,
  onComplete
}: ErrorIndicatorProps) {
  const { container, icon } = sizeMap[size];

  return (
    <motion.div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-red-500',
        container,
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: shake ? [0, -8, 8, -8, 8, -4, 4, 0] : 0,
      }}
      transition={{
        scale: {
          type: 'spring' as const,
          stiffness: 300,
          damping: 20,
        },
        x: {
          duration: 0.5,
          ease: 'easeInOut' as const,
          delay: 0.2,
        },
      }}
      onAnimationComplete={onComplete}
    >
      {/* Flash effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-red-400"
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' as const }}
      />

      {/* X icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -90 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{
          type: 'spring' as const,
          stiffness: 400,
          damping: 15,
          delay: 0.15,
        }}
      >
        <X size={icon} className="text-white" strokeWidth={3} />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// WARNING INDICATOR
// ============================================

export interface WarningIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
}

export function WarningIndicator({
  size = 'md',
  className,
  pulse = true
}: WarningIndicatorProps) {
  const { container, icon } = sizeMap[size];

  return (
    <motion.div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-amber-500',
        container,
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* Pulse effect */}
      {pulse && (
        <motion.div
          className="absolute inset-0 rounded-full bg-amber-400"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut' as const,
            repeat: Infinity,
          }}
        />
      )}

      <AlertCircle size={icon} className="text-white" strokeWidth={2.5} />
    </motion.div>
  );
}

// ============================================
// CONFETTI BURST
// ============================================

export interface ConfettiBurstProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  className?: string;
}

const defaultColors = [
  '#1E88E5', // Primary blue
  '#42A5F5', // Light blue
  '#0D47A1', // Dark blue
  '#E3F2FD', // Very light blue
  '#FFD700', // Gold
  '#FF6B6B', // Coral
  '#4ECDC4', // Teal
];

export function ConfettiBurst({
  isActive,
  duration = 3000,
  particleCount = 50,
  colors = defaultColors,
  className,
}: ConfettiBurstProps) {
  const [particles, setParticles] = React.useState<Array<{
    id: number;
    x: number;
    delay: number;
    color: string;
    rotation: number;
    size: number;
  }>>([]);

  React.useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)] || colors[0] || '#3B82F6',
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActive, particleCount, colors, duration]);

  return (
    <div className={cn('pointer-events-none fixed inset-0 z-50 overflow-hidden', className)}>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: -20,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{
              y: '100vh',
              rotate: particle.rotation + 720,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3,
              delay: particle.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// SUCCESS CELEBRATION (Checkmark + Confetti)
// ============================================

export interface SuccessCelebrationProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  onComplete?: () => void;
  showConfetti?: boolean;
  className?: string;
}

export function SuccessCelebration({
  isVisible,
  title = 'Success!',
  message,
  onComplete,
  showConfetti = true,
  className,
}: SuccessCelebrationProps) {
  const [showContent, setShowContent] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
    return undefined;
  }, [isVisible]);

  return (
    <>
      {showConfetti && <ConfettiBurst isActive={isVisible} />}

      <AnimatePresence>
        {isVisible && showContent && (
          <motion.div
            className={cn(
              'fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm',
              className
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
          >
            <motion.div
              className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-2xl"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{
                type: 'spring' as const,
                stiffness: 300,
                damping: 25,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <SuccessCheckmark size="lg" />

              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                {message && (
                  <p className="mt-1 text-gray-600">{message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <PartyPopper className="h-6 w-6 text-amber-500" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// INLINE FEEDBACK TOAST
// ============================================

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export interface InlineFeedbackProps {
  type: FeedbackType;
  message: string;
  isVisible: boolean;
  onDismiss?: () => void;
  autoDismiss?: number; // ms
  className?: string;
}

const feedbackStyles: Record<FeedbackType, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-50 border-green-200 text-green-800',
    icon: <Check className="h-4 w-4 text-green-600" />,
  },
  error: {
    bg: 'bg-red-50 border-red-200 text-red-800',
    icon: <X className="h-4 w-4 text-red-600" />,
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
  },
  info: {
    bg: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <AlertCircle className="h-4 w-4 text-blue-600" />,
  },
};

export function InlineFeedback({
  type,
  message,
  isVisible,
  onDismiss,
  autoDismiss,
  className,
}: InlineFeedbackProps) {
  React.useEffect(() => {
    if (isVisible && autoDismiss && onDismiss) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, autoDismiss, onDismiss]);

  const styles = feedbackStyles[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm',
            styles.bg,
            className
          )}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            x: type === 'error' ? [0, -4, 4, -4, 4, 0] : 0,
          }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{
            type: 'spring' as const,
            stiffness: 300,
            damping: 25,
            x: { duration: 0.4, delay: 0.1 },
          }}
        >
          {styles.icon}
          <span>{message}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-auto rounded p-0.5 hover:bg-black/5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// STEP COMPLETION CELEBRATION (Lightweight CSS-based)
// ============================================

/**
 * Celebrates step completion with CSS-based confetti animation
 * Colors: blurple (#635bff), cyan (#02bcf5), orange (#ff7600)
 * Lightweight alternative to ConfettiBurst for onboarding flows
 */
export function celebrateStepCompletion() {
  // Create confetti container
  const container = document.createElement('div')
  container.className = 'fixed inset-0 pointer-events-none z-50'
  document.body.appendChild(container)

  // Create 30 confetti particles
  const colors = ['#635bff', '#02bcf5', '#ff7600']
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div')
    confetti.className = 'absolute w-2 h-2 rounded-full animate-confetti'
    confetti.style.left = `${50 + (Math.random() - 0.5) * 30}%`
    confetti.style.top = '50%'
    confetti.style.backgroundColor = colors[i % colors.length] || '#635bff'
    confetti.style.animationDelay = `${i * 0.05}s`
    confetti.style.animationDuration = `${1.2 + Math.random() * 0.5}s`
    container.appendChild(confetti)
  }

  // Clean up after animation completes (1.7s max duration)
  setTimeout(() => {
    document.body.removeChild(container)
  }, 2000)
}

export default {
  SuccessCheckmark,
  ErrorIndicator,
  WarningIndicator,
  ConfettiBurst,
  SuccessCelebration,
  InlineFeedback,
  celebrateStepCompletion,
};
