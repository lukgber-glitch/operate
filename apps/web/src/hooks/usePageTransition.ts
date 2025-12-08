'use client';

/**
 * usePageTransition Hook
 *
 * Manages page transition state and provides functions for coordinating
 * button-to-container morph animations with page content transitions.
 *
 * DESIGN_OVERHAUL Phase 2: GSAP Motion Morph System
 * GSAP Timeline sequence:
 * 1. Phase 1 - Content Exit (0.2s): Fade out content except button
 * 2. Phase 2 - Button Persist (0.1s pause): Empty button visible alone
 * 3. Phase 3 - Morph (0.4s): Animate button position/size to target
 * 4. Phase 4 - Content Enter (0.25s): Target content fades in
 */

import { useCallback, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { useTransitionContext } from '@/components/animation/TransitionProvider';
import { fadeOut, fadeIn, morphTo, TIMING } from '@/lib/animation/gsap-utils';
import { gsap } from 'gsap';

/**
 * Page transition hook return value
 */
interface UsePageTransitionReturn {
  /** Whether a transition is currently in progress */
  isTransitioning: boolean;
  /** Trigger full button→rectangle morph transition */
  triggerTransition: (
    buttonRef: RefObject<HTMLButtonElement>,
    sourceId: string,
    targetId: string,
    onComplete?: () => void
  ) => void;
  /** Transition to a new page with button morph animation */
  transitionTo: (targetId: string, callback: () => void) => void;
  /** Register an element for morphing */
  registerElement: (id: string, ref: RefObject<HTMLElement>, type: 'button' | 'container') => void;
  /** Unregister an element */
  unregisterElement: (id: string) => void;
  /** Simple page transition without morphing */
  transitionWithFade: (callback: () => void) => void;
}

/**
 * Hook for managing page transitions with button morphing
 *
 * This hook coordinates the three-phase animation sequence:
 * 1. EXIT (300ms): Current content fades out
 * 2. MORPH (500ms): Button expands to container size
 * 3. ENTER (400ms): New content fades in
 *
 * @returns Object with transition state and control functions
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const { transitionTo, registerElement } = usePageTransition();
 *   const buttonRef = useRef<HTMLButtonElement>(null);
 *
 *   useEffect(() => {
 *     registerElement('submit-button', buttonRef, 'button');
 *   }, [registerElement]);
 *
 *   const handleSubmit = () => {
 *     transitionTo('form-container', () => {
 *       router.push('/next-page');
 *     });
 *   };
 *
 *   return (
 *     <button ref={buttonRef} onClick={handleSubmit}>
 *       Submit
 *     </button>
 *   );
 * }
 * ```
 */
export function usePageTransition(): UsePageTransitionReturn {
  const {
    isTransitioning,
    setTransitioning,
    registerElement,
    unregisterElement,
    getElement,
    setCurrentMorphId,
  } = useTransitionContext();

  /**
   * Trigger full button→rectangle morph transition
   * Implements 4-phase animation sequence as per spec
   *
   * @param buttonRef - Reference to the button element
   * @param sourceId - ID of the source element (button)
   * @param targetId - ID of the target container
   * @param onComplete - Callback when transition completes
   */
  const triggerTransition = useCallback(
    (
      buttonRef: RefObject<HTMLButtonElement>,
      sourceId: string,
      targetId: string,
      onComplete?: () => void
    ) => {
      if (isTransitioning || !buttonRef.current) return;

      const sourceElement = buttonRef.current;
      const targetElement = getElement(targetId);

      if (!targetElement) {
        console.warn(`Target element not found: ${targetId}`);
        if (onComplete) onComplete();
        return;
      }

      setTransitioning(true);
      setCurrentMorphId(targetId);

      // Get all page content except the button
      const pageContent = document.querySelector('[data-page-content]') as HTMLElement;
      const allContent = pageContent?.querySelectorAll('*:not([data-morph-preserve])') || [];

      // Create master timeline
      const masterTimeline = gsap.timeline({
        onComplete: () => {
          setTransitioning(false);
          setCurrentMorphId(null);
          if (onComplete) onComplete();
        },
      });

      // PHASE 1: Content Exit (0.2s) - Fade out everything except button
      if (pageContent) {
        masterTimeline.to(
          Array.from(allContent).filter((el) => !sourceElement.contains(el as Node)),
          {
            opacity: 0,
            duration: 0.2,
            ease: 'power1.out',
          },
          0
        );
      }

      // PHASE 2: Button Persist (0.1s pause) - Already visible, just wait
      masterTimeline.add(() => {}, '+=0.1');

      // PHASE 3: Morph (0.4s) - Button expands to target
      masterTimeline.add(
        morphTo(sourceElement, targetElement, 0.4, 'power2.inOut'),
        '-=0.05' // Slight overlap
      );

      // PHASE 4: Content Enter (0.25s) - Target content fades in
      masterTimeline.to(
        targetElement,
        {
          opacity: 1,
          scale: 1,
          duration: 0.25,
          ease: 'power1.out',
        },
        '-=0.1' // Overlap with morph end
      );
    },
    [isTransitioning, getElement, setTransitioning, setCurrentMorphId]
  );

  /**
   * Execute a page transition with button morph animation
   *
   * @param targetId - ID of the container element to morph into
   * @param callback - Function to call during the morph phase (e.g., router.push)
   */
  const transitionTo = useCallback(
    (targetId: string, callback: () => void) => {
      if (isTransitioning) return;

      // Get the current page content container
      const pageContent = document.querySelector('[data-page-content]') as HTMLElement;
      if (!pageContent) {
        console.warn('No element with [data-page-content] found, falling back to simple transition');
        transitionWithFade(callback);
        return;
      }

      // Get the source button and target container
      const sourceElement = getElement(targetId);
      if (!sourceElement) {
        console.warn(`No element registered with ID: ${targetId}, falling back to simple transition`);
        transitionWithFade(callback);
        return;
      }

      setTransitioning(true);
      setCurrentMorphId(targetId);

      // PHASE 1: EXIT - Fade out current content
      fadeOut(pageContent, TIMING.EXIT_DURATION, () => {
        // PHASE 2: MORPH - Execute callback and start morph
        // The callback typically navigates to the new page
        callback();

        // Wait for next frame to ensure new page is rendering
        requestAnimationFrame(() => {
          const newPageContent = document.querySelector('[data-page-content]') as HTMLElement;
          const targetElement = document.querySelector(`[data-morph-target="${targetId}"]`) as HTMLElement;

          if (newPageContent && targetElement) {
            // Hide new content initially
            newPageContent.style.opacity = '0';

            // Morph button to target container
            morphTo(sourceElement, targetElement, TIMING.MORPH_DURATION).then(() => {
              // PHASE 3: ENTER - Fade in new content
              fadeIn(newPageContent, TIMING.ENTER_DURATION);

              // Cleanup
              setTimeout(() => {
                setTransitioning(false);
                setCurrentMorphId(null);
              }, TIMING.ENTER_DURATION * 1000);
            });
          } else {
            // Fallback if morph target not found
            if (newPageContent) {
              fadeIn(newPageContent, TIMING.ENTER_DURATION);
            }
            setTransitioning(false);
            setCurrentMorphId(null);
          }
        });
      });
    },
    [isTransitioning, getElement, setTransitioning, setCurrentMorphId]
  );

  /**
   * Execute a simple fade transition without morphing
   *
   * @param callback - Function to call during transition (e.g., router.push)
   */
  const transitionWithFade = useCallback(
    (callback: () => void) => {
      if (isTransitioning) return;

      const pageContent = document.querySelector('[data-page-content]') as HTMLElement;
      if (!pageContent) {
        callback();
        return;
      }

      setTransitioning(true);

      // Fade out current page
      fadeOut(pageContent, TIMING.EXIT_DURATION, () => {
        // Execute callback (navigation)
        callback();

        // Wait for new page to mount
        requestAnimationFrame(() => {
          const newPageContent = document.querySelector('[data-page-content]') as HTMLElement;
          if (newPageContent) {
            fadeIn(newPageContent, TIMING.ENTER_DURATION);
          }

          setTimeout(() => {
            setTransitioning(false);
          }, TIMING.ENTER_DURATION * 1000);
        });
      });
    },
    [isTransitioning, setTransitioning]
  );

  return {
    isTransitioning,
    triggerTransition,
    transitionTo,
    registerElement,
    unregisterElement,
    transitionWithFade,
  };
}
