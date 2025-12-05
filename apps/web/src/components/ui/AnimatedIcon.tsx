import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedIconProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Type of icon animation
   * - 'bounce': Subtle bounce on hover
   * - 'rotate': Rotate 12deg on hover
   * - 'spin': Rotate 180deg on hover
   * - 'scale': Scale up on hover
   * - 'none': No animation
   */
  animation?: 'bounce' | 'rotate' | 'spin' | 'scale' | 'none';

  /**
   * Continuously animate without hover (useful for loading states)
   */
  continuous?: boolean;

  children: React.ReactNode;
}

/**
 * AnimatedIcon - Wrapper for icons with built-in micro-interactions
 *
 * Features:
 * - Bounce animation on hover
 * - Rotation effects
 * - Scale effects
 * - Continuous animations
 *
 * @example
 * <AnimatedIcon animation="bounce">
 *   <Star className="h-5 w-5" />
 * </AnimatedIcon>
 *
 * @example
 * <AnimatedIcon animation="spin" continuous>
 *   <Loader2 className="h-5 w-5" />
 * </AnimatedIcon>
 */
export const AnimatedIcon = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, animation = 'scale', continuous = false, children, ...props }, ref) => {
    const animationClasses = cn(
      'inline-flex items-center justify-center',
      !continuous && animation === 'bounce' && 'icon-bounce-hover',
      !continuous && animation === 'rotate' && 'icon-rotate-hover',
      !continuous && animation === 'spin' && 'icon-spin-hover',
      !continuous && animation === 'scale' && 'icon-scale-hover',
      continuous && animation === 'spin' && 'animate-spinner',
      continuous && animation === 'bounce' && 'animate-bounce-subtle',
      className
    );

    return (
      <div ref={ref} className={animationClasses} {...props}>
        {children}
      </div>
    );
  }
);

AnimatedIcon.displayName = 'AnimatedIcon';
