/**
 * Phase 7: Micro-Interactions
 *
 * Export all micro-interaction components and utilities.
 * These provide delightful animations for buttons, cards, and feedback states.
 */

// Animated Button with spring-based hover/tap
export {
  AnimatedButton,
  AnimatedIconButton,
  type AnimatedButtonProps,
  type AnimatedIconButtonProps,
} from '../animated-button';

// Animated Card with lift effect
export {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardTitle,
  AnimatedCardDescription,
  AnimatedCardContent,
  AnimatedCardFooter,
  AnimatedCardGrid,
  type AnimatedCardProps,
} from '../animated-card';

// Celebration and feedback components
export {
  SuccessCheckmark,
  ErrorIndicator,
  WarningIndicator,
  ConfettiBurst,
  SuccessCelebration,
  InlineFeedback,
} from '../celebrations';

// Re-export types
export type {
  SuccessCheckmarkProps,
  ErrorIndicatorProps,
  WarningIndicatorProps,
  ConfettiBurstProps,
  SuccessCelebrationProps,
  InlineFeedbackProps,
} from '../celebrations';
