/**
 * GSAP Animation Utilities
 *
 * Provides reusable animation functions with consistent timing and easing
 * for the Operate app's page transitions and button morphing system.
 */

import { gsap } from 'gsap';

/**
 * Animation timing constants
 * Based on the design philosophy: EXIT (300ms) → MORPH (500ms) → ENTER (400ms)
 */
export const TIMING = {
  /** Duration for exit animations (content fading out) */
  EXIT_DURATION: 0.3,
  /** Duration for morph animations (button expanding to container) */
  MORPH_DURATION: 0.5,
  /** Duration for enter animations (new content fading in) */
  ENTER_DURATION: 0.4,
  /** Delay between staggered elements */
  STAGGER_DELAY: 0.05,
  /** Ease for exit animations */
  EASE_OUT: 'power2.out',
  /** Ease for smooth morphing */
  EASE_IN_OUT: 'power2.inOut',
  /** Ease for enter animations */
  EASE_IN: 'power2.in',
} as const;

/**
 * Fade out an element (for exit transitions)
 *
 * @param element - Target element or selector
 * @param duration - Animation duration (defaults to EXIT_DURATION)
 * @param onComplete - Callback when animation completes
 * @returns GSAP Tween instance
 *
 * @example
 * ```tsx
 * fadeOut('.content', undefined, () => console.log('Exit complete'));
 * ```
 */
export function fadeOut(
  element: gsap.TweenTarget,
  duration: number = TIMING.EXIT_DURATION,
  onComplete?: () => void
): gsap.core.Tween {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (prefersReducedMotion) {
    if (onComplete) onComplete();
    return gsap.to(element, { opacity: 0, duration: 0.01 });
  }

  return gsap.to(element, {
    opacity: 0,
    scale: 0.95,
    duration,
    ease: TIMING.EASE_IN,
    onComplete,
  });
}

/**
 * Fade in an element (for enter transitions)
 *
 * @param element - Target element or selector
 * @param duration - Animation duration (defaults to ENTER_DURATION)
 * @param delay - Delay before animation starts
 * @returns GSAP Tween instance
 *
 * @example
 * ```tsx
 * fadeIn('.new-content', undefined, 0.1);
 * ```
 */
export function fadeIn(
  element: gsap.TweenTarget,
  duration: number = TIMING.ENTER_DURATION,
  delay: number = 0
): gsap.core.Tween {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (prefersReducedMotion) {
    return gsap.fromTo(
      element,
      { opacity: 0 },
      { opacity: 1, duration: 0.01, delay }
    );
  }

  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.95 },
    {
      opacity: 1,
      scale: 1,
      duration,
      delay,
      ease: TIMING.EASE_OUT,
    }
  );
}

/**
 * Morph one element to another's position and size (FLIP technique)
 *
 * @param source - Source element (e.g., button)
 * @param target - Target element (e.g., container)
 * @param duration - Animation duration (defaults to MORPH_DURATION)
 * @param ease - Easing function
 * @returns GSAP Timeline instance
 *
 * @example
 * ```tsx
 * const button = document.getElementById('submit-btn');
 * const container = document.getElementById('form-container');
 * morphTo(button, container);
 * ```
 */
export function morphTo(
  source: HTMLElement,
  target: HTMLElement,
  duration: number = TIMING.MORPH_DURATION,
  ease: string = TIMING.EASE_IN_OUT
): gsap.core.Timeline {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (prefersReducedMotion) {
    // Instant transition for reduced motion
    const tl = gsap.timeline();
    tl.set(source, { opacity: 0 })
      .set(target, { opacity: 1 });
    return tl;
  }

  // Get bounding boxes (FLIP: First)
  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // Create morphing clone
  const clone = source.cloneNode(true) as HTMLElement;

  // Position clone exactly over source (FLIP: Last)
  clone.style.position = 'fixed';
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.margin = '0';
  clone.style.zIndex = '9999';
  clone.style.pointerEvents = 'none';

  // Preserve border radius from source
  const sourceStyles = window.getComputedStyle(source);
  clone.style.borderRadius = sourceStyles.borderRadius;

  document.body.appendChild(clone);

  // Hide original source
  gsap.set(source, { opacity: 0 });

  // Ensure target is hidden initially
  gsap.set(target, { opacity: 0, scale: 0.95 });

  // Create timeline for morph sequence (FLIP: Invert & Play)
  const tl = gsap.timeline();

  tl
    // Morph clone to target position/size
    .to(clone, {
      left: targetRect.left,
      top: targetRect.top,
      width: targetRect.width,
      height: targetRect.height,
      borderRadius: window.getComputedStyle(target).borderRadius || '24px',
      duration,
      ease,
    })
    // Fade out clone and reveal target
    .to(
      clone,
      {
        opacity: 0,
        duration: 0.15,
      },
      `-=0.15`
    )
    .to(
      target,
      {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: TIMING.EASE_OUT,
      },
      `-=0.15`
    )
    // Cleanup
    .add(() => {
      document.body.removeChild(clone);
      gsap.set(source, { opacity: 1 }); // Restore source visibility
    });

  return tl;
}

/**
 * Stagger in multiple elements (for lists and grids)
 *
 * @param elements - Array of elements or selector
 * @param stagger - Delay between each element
 * @param duration - Animation duration
 * @returns GSAP Tween instance
 *
 * @example
 * ```tsx
 * staggerIn('.list-item', 0.05, 0.4);
 * ```
 */
export function staggerIn(
  elements: gsap.TweenTarget,
  stagger: number = TIMING.STAGGER_DELAY,
  duration: number = TIMING.ENTER_DURATION
): gsap.core.Tween {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (prefersReducedMotion) {
    return gsap.fromTo(
      elements,
      { opacity: 0 },
      { opacity: 1, duration: 0.01 }
    );
  }

  return gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: 20,
    },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      ease: TIMING.EASE_OUT,
    }
  );
}

/**
 * Check if user prefers reduced motion
 *
 * @returns boolean indicating preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
