/**
 * Animated UI Components - Centralized export
 *
 * This file exports all animated components and animation utilities.
 * Import from here for better tree-shaking and consistency.
 */

export { AnimatedButton } from './AnimatedButton';
export type { AnimatedButtonProps } from './AnimatedButton';

export { AnimatedCard, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './AnimatedCard';
export type { AnimatedCardProps } from './AnimatedCard';

export { AnimatedIcon } from './AnimatedIcon';
export type { AnimatedIconProps } from './AnimatedIcon';

// Re-export hooks for convenience
export {
  useSuccessAnimation,
  useErrorAnimation,
  useLoadingAnimation,
  useStaggerAnimation,
  useRippleAnimation,
  useEntranceAnimation,
  useAnimationTrigger,
  useFormAnimation,
} from '@/hooks/useAnimations';
