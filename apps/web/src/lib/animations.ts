/**
 * GSAP Animation Utilities
 *
 * Reusable animation functions for page transitions and morphing effects.
 * All animations respect prefers-reduced-motion and are cancelable.
 */

import gsap from 'gsap';

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Animation durations (ms)
export const DURATIONS = {
  exit: 0.3,
  morph: 0.5,
  enter: 0.4,
  stagger: 0.05,
} as const;

// Animation easings
export const EASINGS = {
  exit: 'power2.out',
  morph: 'power2.inOut',
  enter: 'power2.out',
} as const;

/**
 * Fade in animation
 */
export const fadeIn = (
  element: Element | string,
  options?: gsap.TweenVars
): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    return gsap.set(element, { opacity: 1, scale: 1 });
  }

  return gsap.to(element, {
    opacity: 1,
    scale: 1,
    duration: DURATIONS.enter,
    ease: EASINGS.enter,
    ...options,
  });
};

/**
 * Fade out animation
 */
export const fadeOut = (
  element: Element | string,
  options?: gsap.TweenVars
): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    return gsap.set(element, { opacity: 0, scale: 0.95 });
  }

  return gsap.to(element, {
    opacity: 0,
    scale: 0.95,
    duration: DURATIONS.exit,
    ease: EASINGS.exit,
    ...options,
  });
};

/**
 * Stagger in animation for multiple elements
 */
export const staggerIn = (
  elements: Element[] | string,
  stagger: number = DURATIONS.stagger,
  options?: gsap.TweenVars
): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    return gsap.set(elements, { opacity: 1, y: 0 });
  }

  return gsap.to(elements, {
    opacity: 1,
    y: 0,
    duration: DURATIONS.enter,
    ease: EASINGS.enter,
    stagger,
    ...options,
  });
};

/**
 * Stagger out animation for multiple elements
 */
export const staggerOut = (
  elements: Element[] | string,
  stagger: number = DURATIONS.stagger,
  options?: gsap.TweenVars
): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    return gsap.set(elements, { opacity: 0, y: -20 });
  }

  return gsap.to(elements, {
    opacity: 0,
    y: -20,
    duration: DURATIONS.exit,
    ease: EASINGS.exit,
    stagger,
    ...options,
  });
};

/**
 * Morph element to target size and border radius
 */
export const morphTo = (
  element: Element | string,
  target: {
    width: number;
    height: number;
    borderRadius?: number;
  },
  options?: gsap.TweenVars
): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    return gsap.set(element, {
      width: target.width,
      height: target.height,
      borderRadius: target.borderRadius ?? 24,
    });
  }

  return gsap.to(element, {
    width: target.width,
    height: target.height,
    borderRadius: target.borderRadius ?? 24,
    duration: DURATIONS.morph,
    ease: EASINGS.morph,
    ...options,
  });
};

/**
 * Scale element from center
 */
export const scaleFrom = (
  element: Element | string,
  scale: number = 0.8,
  options?: gsap.TweenVars
): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    return gsap.set(element, { scale: 1, opacity: 1 });
  }

  return gsap.fromTo(
    element,
    { scale, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: DURATIONS.enter,
      ease: EASINGS.enter,
      transformOrigin: 'center center',
      ...options,
    }
  );
};

/**
 * Create a GSAP timeline for complex sequences
 */
export const createTimeline = (options?: gsap.TimelineVars): gsap.core.Timeline => {
  return gsap.timeline(options);
};

/**
 * Kill all active tweens on an element
 */
export const killTweens = (target: Element | string): void => {
  gsap.killTweensOf(target);
};

/**
 * Create a morph transition sequence
 * Returns a timeline that can be played or reversed
 */
export const createMorphSequence = (
  button: Element | string,
  target: {
    width: number;
    height: number;
    borderRadius?: number;
  }
): gsap.core.Timeline => {
  const timeline = createTimeline({ paused: true });

  if (prefersReducedMotion()) {
    timeline
      .set(button, { opacity: 1 })
      .set(button, {
        width: target.width,
        height: target.height,
        borderRadius: target.borderRadius ?? 24,
      });
    return timeline;
  }

  timeline
    .to(button, {
      opacity: 0,
      duration: DURATIONS.exit * 0.5,
      ease: EASINGS.exit,
    })
    .to(
      button,
      {
        width: target.width,
        height: target.height,
        borderRadius: target.borderRadius ?? 24,
        duration: DURATIONS.morph,
        ease: EASINGS.morph,
      },
      '-=0.1'
    )
    .to(button, {
      opacity: 1,
      duration: DURATIONS.enter * 0.5,
      ease: EASINGS.enter,
    });

  return timeline;
};
