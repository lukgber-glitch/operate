import * as React from 'react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';
import { cn } from '@/lib/utils';

export interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Type of hover effect
   * - 'lift': Subtle lift with shadow increase
   * - 'lift-strong': More pronounced lift
   * - 'interactive': Full interactive card (lift + border color)
   * - 'none': No hover effect
   */
  hoverEffect?: 'lift' | 'lift-strong' | 'interactive' | 'none';

  /**
   * Make the entire card clickable
   */
  onClick?: () => void;

  /**
   * Add stagger animation when appearing in a list
   */
  staggerIndex?: number;
}

/**
 * AnimatedCard - Card component with built-in micro-interactions
 *
 * Features:
 * - Hover lift effects
 * - Interactive card mode (with border color change)
 * - Stagger animations for lists
 * - Click feedback
 *
 * @example
 * <AnimatedCard hoverEffect="interactive" onClick={handleClick}>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Card content here</CardContent>
 * </AnimatedCard>
 */
export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({
    className,
    hoverEffect = 'lift',
    onClick,
    staggerIndex,
    children,
    ...props
  }, ref) => {
    const hoverClasses = cn(
      hoverEffect === 'lift' && 'card-hover',
      hoverEffect === 'lift-strong' && 'card-hover-lift',
      hoverEffect === 'interactive' && 'card-interactive',
      onClick && 'cursor-pointer',
      staggerIndex !== undefined && 'stagger-item',
      className
    );

    const style = staggerIndex !== undefined
      ? { animationDelay: `${staggerIndex * 50}ms` }
      : undefined;

    return (
      <Card
        ref={ref}
        className={hoverClasses}
        onClick={onClick}
        style={style}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Re-export card sub-components for convenience
export {
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
