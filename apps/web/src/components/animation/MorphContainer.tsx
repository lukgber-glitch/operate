'use client';

import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * MorphContainer - Wrapper for morphing animations using Framer Motion layoutId
 *
 * Use the same layoutId on both the trigger (button) and target (expanded content)
 * to create smooth morphing transitions between them.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * // Trigger (collapsed state)
 * <MorphContainer layoutId="my-morph" isVisible={!isOpen}>
 *   <button onClick={() => setIsOpen(true)}>Open</button>
 * </MorphContainer>
 *
 * // Target (expanded state)
 * <MorphContainer layoutId="my-morph" isVisible={isOpen}>
 *   <div>Expanded content...</div>
 * </MorphContainer>
 * ```
 */

interface MorphContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Unique ID for the morph transition - must match between trigger and target */
  layoutId: string;
  /** Whether this container is currently visible */
  isVisible?: boolean;
  /** Content to render inside the container */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Animation duration in seconds (default: 0.5) */
  duration?: number;
  /** Whether to animate child content opacity */
  animateChildren?: boolean;
  /** Delay before children animate in (seconds) */
  childrenDelay?: number;
}

// Spring animation config matching design tokens
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export function MorphContainer({
  layoutId,
  isVisible = true,
  children,
  className,
  duration = 0.5,
  animateChildren = true,
  childrenDelay = 0.15,
  ...props
}: MorphContainerProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          layoutId={layoutId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            layout: springConfig,
            opacity: { duration: duration * 0.4 },
          }}
          className={cn('relative', className)}
          {...props}
        >
          {animateChildren ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                delay: childrenDelay,
                duration: duration * 0.4,
              }}
            >
              {children}
            </motion.div>
          ) : (
            children
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * MorphTrigger - Simplified trigger component for morphing
 * Wraps a button/clickable element that morphs into content
 */
interface MorphTriggerProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  layoutId: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MorphTrigger({
  layoutId,
  children,
  className,
  onClick,
  ...props
}: MorphTriggerProps) {
  return (
    <motion.button
      layoutId={layoutId}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer transition-colors',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springConfig}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * MorphTarget - Expanded content container
 * The content that appears after morphing from the trigger
 */
interface MorphTargetProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  layoutId: string;
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function MorphTarget({
  layoutId,
  isOpen,
  children,
  className,
  onClose,
  ...props
}: MorphTargetProps) {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          layoutId={layoutId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            layout: springConfig,
            opacity: { duration: 0.2 },
          }}
          className={cn('relative', className)}
          {...props}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.15, duration: 0.2 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MorphContainer;
