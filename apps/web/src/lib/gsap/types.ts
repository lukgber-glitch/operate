/**
 * GSAP Animation Library Types
 */

/**
 * Common animation options
 */
export interface AnimationOptions {
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Easing function (e.g., 'power2.out', 'back.out(1.7)') */
  ease?: string;
  /** Stagger delay between elements in seconds */
  stagger?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Direction for slide animations
 */
export type SlideDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Direction for fade animations
 */
export type FadeDirection = 'up' | 'down' | 'left' | 'right' | 'none';

/**
 * Page transition configuration
 */
export interface PageTransitionOptions {
  /** Animation duration in seconds */
  duration?: number;
  /** Easing function */
  ease?: string;
}

/**
 * Stagger list configuration
 */
export interface StaggerListOptions {
  /** Stagger delay between items */
  stagger?: number;
  /** Initial delay before animation starts */
  delay?: number;
  /** Animation duration */
  duration?: number;
  /** Easing function */
  ease?: string;
}

/**
 * Morph animation configuration
 */
export interface MorphOptions extends AnimationOptions {
  /** Border radius for the morphed element */
  borderRadius?: string;
  /** Z-index for the morphing clone */
  zIndex?: number;
}

/**
 * Timeline configuration
 */
export interface TimelineOptions {
  /** Whether timeline starts paused */
  paused?: boolean;
  /** Delay before timeline starts */
  delay?: number;
  /** Callback when timeline completes */
  onComplete?: () => void;
  /** Callback when timeline starts */
  onStart?: () => void;
  /** Callback on each timeline update */
  onUpdate?: () => void;
}

/**
 * ScrollTrigger configuration
 */
export interface ScrollTriggerOptions {
  /** Element that triggers the animation */
  trigger?: Element | string;
  /** Start position (e.g., 'top center', 'top 80%') */
  start?: string;
  /** End position */
  end?: string;
  /** Scrub the animation to scroll position */
  scrub?: boolean | number;
  /** Pin the trigger element */
  pin?: boolean;
  /** Animation markers (for debugging) */
  markers?: boolean;
  /** Actions on enter, leave, enter back, leave back */
  toggleActions?: string;
}

/**
 * Fade in component props
 */
export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: FadeDirection;
  className?: string;
}

/**
 * Page transition component props
 */
export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Stagger list component props
 */
export interface StaggerListProps {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
}
