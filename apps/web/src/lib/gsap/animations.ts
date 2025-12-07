import { gsap } from './index';

/**
 * Animation Options Interface
 */
export interface AnimationOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
  onComplete?: () => void;
}

/**
 * Slide Direction
 */
export type SlideDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Fade in animation
 * @param element - Target element or selector
 * @param options - Animation options
 */
export function fadeIn(
  element: gsap.TweenTarget,
  options: AnimationOptions = {}
): gsap.core.Tween {
  const {
    duration = 0.4,
    delay = 0,
    ease = 'power2.out',
    onComplete,
  } = options;

  return gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration,
      delay,
      ease,
      onComplete,
    }
  );
}

/**
 * Fade out animation
 * @param element - Target element or selector
 * @param options - Animation options
 */
export function fadeOut(
  element: gsap.TweenTarget,
  options: AnimationOptions = {}
): gsap.core.Tween {
  const {
    duration = 0.3,
    delay = 0,
    ease = 'power2.in',
    onComplete,
  } = options;

  return gsap.to(element, {
    opacity: 0,
    duration,
    delay,
    ease,
    onComplete,
  });
}

/**
 * Slide in animation
 * @param element - Target element or selector
 * @param direction - Direction to slide from
 * @param options - Animation options
 */
export function slideIn(
  element: gsap.TweenTarget,
  direction: SlideDirection = 'up',
  options: AnimationOptions = {}
): gsap.core.Tween {
  const {
    duration = 0.4,
    delay = 0,
    ease = 'power2.out',
    onComplete,
  } = options;

  const fromVars: gsap.TweenVars = {
    opacity: 0,
  };

  const toVars: gsap.TweenVars = {
    opacity: 1,
    duration,
    delay,
    ease,
    onComplete,
  };

  // Set initial position based on direction
  switch (direction) {
    case 'left':
      fromVars.x = -50;
      toVars.x = 0;
      break;
    case 'right':
      fromVars.x = 50;
      toVars.x = 0;
      break;
    case 'up':
      fromVars.y = 30;
      toVars.y = 0;
      break;
    case 'down':
      fromVars.y = -30;
      toVars.y = 0;
      break;
  }

  return gsap.fromTo(element, fromVars, toVars);
}

/**
 * Stagger in animation for multiple elements
 * @param elements - Array of elements or selector
 * @param options - Animation options
 */
export function staggerIn(
  elements: gsap.TweenTarget,
  options: AnimationOptions = {}
): gsap.core.Tween {
  const {
    duration = 0.4,
    delay = 0,
    ease = 'power2.out',
    stagger = 0.1,
    onComplete,
  } = options;

  return gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: 30,
    },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      stagger,
      ease,
      onComplete,
    }
  );
}

/**
 * Morph one element to another position/size
 * @param from - Source element
 * @param to - Target element
 * @param options - Animation options
 */
export function morphTo(
  from: HTMLElement,
  to: HTMLElement,
  options: AnimationOptions = {}
): gsap.core.Timeline {
  const {
    duration = 0.5,
    delay = 0,
    ease = 'power2.inOut',
    onComplete,
  } = options;

  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();

  // Create a clone for morphing
  const clone = from.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.left = `${fromRect.left}px`;
  clone.style.top = `${fromRect.top}px`;
  clone.style.width = `${fromRect.width}px`;
  clone.style.height = `${fromRect.height}px`;
  clone.style.zIndex = '1000';
  clone.style.pointerEvents = 'none';
  document.body.appendChild(clone);

  // Hide original
  from.style.visibility = 'hidden';

  const tl = gsap.timeline({ onComplete });

  // Morph animation
  tl.to(clone, {
    left: toRect.left,
    top: toRect.top,
    width: toRect.width,
    height: toRect.height,
    duration,
    delay,
    ease,
  })
    .to(
      clone,
      {
        opacity: 0,
        duration: 0.15,
      },
      '+=0'
    )
    .set(to, { display: 'block' })
    .fromTo(
      to,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' },
      '-=0.1'
    )
    .add(() => {
      document.body.removeChild(clone);
      from.style.visibility = 'visible';
    });

  return tl;
}

/**
 * Scale in animation with bounce
 * @param element - Target element or selector
 * @param options - Animation options
 */
export function scaleIn(
  element: gsap.TweenTarget,
  options: AnimationOptions = {}
): gsap.core.Tween {
  const {
    duration = 0.4,
    delay = 0,
    ease = 'back.out(1.7)',
    onComplete,
  } = options;

  return gsap.fromTo(
    element,
    {
      opacity: 0,
      scale: 0.8,
    },
    {
      opacity: 1,
      scale: 1,
      duration,
      delay,
      ease,
      onComplete,
    }
  );
}

/**
 * Slide out animation
 * @param element - Target element or selector
 * @param direction - Direction to slide to
 * @param options - Animation options
 */
export function slideOut(
  element: gsap.TweenTarget,
  direction: SlideDirection = 'up',
  options: AnimationOptions = {}
): gsap.core.Tween {
  const {
    duration = 0.3,
    delay = 0,
    ease = 'power2.in',
    onComplete,
  } = options;

  const toVars: gsap.TweenVars = {
    opacity: 0,
    duration,
    delay,
    ease,
    onComplete,
  };

  // Set target position based on direction
  switch (direction) {
    case 'left':
      toVars.x = -50;
      break;
    case 'right':
      toVars.x = 50;
      break;
    case 'up':
      toVars.y = -30;
      break;
    case 'down':
      toVars.y = 30;
      break;
  }

  return gsap.to(element, toVars);
}
