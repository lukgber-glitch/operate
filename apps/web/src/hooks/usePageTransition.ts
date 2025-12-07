'use client';

/**
 * usePageTransition Hook
 *
 * Manages page transition state and provides functions for coordinating
 * button-to-container morph animations with page content transitions.
 */

import { useCallback, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { useTransitionContext } from '@/components/animation/TransitionProvider';
import { fadeOut, fadeIn, morphTo, TIMING } from '@/lib/animation/gsap-utils';

/**
 * Page transition hook return value
 */
interface UsePageTransitionReturn {
  /** Whether a transition is currently in progress */
  isTransitioning: boolean;
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
    transitionTo,
    registerElement,
    unregisterElement,
    transitionWithFade,
  };
}
