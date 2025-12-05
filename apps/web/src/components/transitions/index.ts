/**
 * Transition Components
 *
 * A collection of reusable Framer Motion animation components
 * for smooth, polished UX across the application.
 *
 * @module transitions
 */

// Page transitions
export {
  PageTransition,
  FadeTransition
} from './PageTransition';

// Step transitions for wizards/onboarding
export {
  StepTransition,
  VerticalStepTransition,
  StepIndicator,
} from './StepTransition';

// List animations
export {
  AnimatedList,
  AnimatedListItem,
  AnimatedGrid,
  AnimatedGridItem,
  ScaleList,
  ScaleListItem,
} from './AnimatedList';

// Modal and overlay transitions
export {
  ModalTransition,
  DrawerTransition,
  TooltipTransition,
  DropdownTransition,
} from './ModalTransition';

/**
 * Common Animation Variants
 *
 * Reusable variant configurations for consistent animations.
 * Import these when you need custom motion components.
 *
 * @example
 * ```tsx
 * import { fadeVariants, slideVariants } from '@/components/transitions';
 * import { motion } from 'framer-motion';
 *
 * <motion.div variants={fadeVariants} initial="hidden" animate="visible">
 *   Content
 * </motion.div>
 * ```
 */
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const slideLeftVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

export const slideRightVariants = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

/**
 * Common Transition Presets
 *
 * Pre-configured transition objects for consistent timing.
 *
 * @example
 * ```tsx
 * import { transitions } from '@/components/transitions';
 *
 * <motion.div transition={transitions.smooth}>
 *   Content
 * </motion.div>
 * ```
 */
export const transitions = {
  /** Fast snappy transition (200ms) */
  fast: {
    type: 'tween' as const,
    ease: 'easeInOut' as const,
    duration: 0.2,
  },

  /** Standard smooth transition (300ms) */
  smooth: {
    type: 'tween' as const,
    ease: 'easeInOut' as const,
    duration: 0.3,
  },

  /** Slower deliberate transition (400ms) */
  deliberate: {
    type: 'tween' as const,
    ease: 'anticipate' as const,
    duration: 0.4,
  },

  /** Spring physics transition */
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  },

  /** Bouncy spring */
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 20,
  },
};
