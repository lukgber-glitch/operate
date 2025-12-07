import { useRef, useEffect, MutableRefObject } from 'react';
import { gsap } from '../index';

/**
 * useGsapContext Hook
 *
 * Creates a GSAP context that automatically cleans up animations on unmount.
 * This prevents memory leaks and ensures animations are properly reverted.
 *
 * @returns A ref to use as the scope for GSAP selectors
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const scopeRef = useGsapContext((ctx) => {
 *     gsap.to('.element', { x: 100 });
 *   });
 *
 *   return (
 *     <div ref={scopeRef}>
 *       <div className="element">Animated content</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGsapContext<T extends HTMLElement = HTMLDivElement>(
  callback?: (ctx: gsap.Context) => void | (() => void),
  deps: React.DependencyList = []
): MutableRefObject<T | null> {
  const scopeRef = useRef<T | null>(null);
  const contextRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    // Clean up previous context if it exists
    if (contextRef.current) {
      contextRef.current.revert();
    }

    // Create new context with scope
    const ctx = gsap.context(() => {
      if (callback) {
        callback(contextRef.current!);
      }
    }, scopeRef);

    contextRef.current = ctx;

    // Cleanup on unmount or deps change
    return () => {
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scopeRef;
}

/**
 * useGsapTimeline Hook
 *
 * Creates a GSAP timeline with automatic cleanup.
 *
 * @param vars - Timeline configuration
 * @returns GSAP Timeline instance
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const timeline = useGsapTimeline({ paused: true });
 *
 *   useEffect(() => {
 *     timeline
 *       .to('.element1', { x: 100 })
 *       .to('.element2', { y: 100 })
 *       .play();
 *   }, [timeline]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useGsapTimeline(
  vars?: gsap.TimelineVars
): gsap.core.Timeline {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!timelineRef.current) {
      timelineRef.current = gsap.timeline(vars);
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return timelineRef.current!;
}

/**
 * useGsapSelector Hook
 *
 * Helper hook for scoped GSAP selectors.
 *
 * @returns A tuple of [scopeRef, selector function]
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [scopeRef, q] = useGsapSelector();
 *
 *   useEffect(() => {
 *     gsap.to(q('.element'), { x: 100 });
 *   }, [q]);
 *
 *   return (
 *     <div ref={scopeRef}>
 *       <div className="element">Content</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGsapSelector<T extends HTMLElement = HTMLDivElement>(): [
  MutableRefObject<T | null>,
  (selector: string) => Element | null
] {
  const scopeRef = useRef<T | null>(null);

  const selector = (query: string): Element | null => {
    if (!scopeRef.current) return null;
    return scopeRef.current.querySelector(query);
  };

  return [scopeRef, selector];
}
