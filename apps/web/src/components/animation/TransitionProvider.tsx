'use client';

/**
 * TransitionProvider
 *
 * Context provider for managing page transitions and button morphing animations.
 * Maintains a registry of elements that can be morphed and coordinates transitions.
 */

import React, { createContext, useContext, useRef, useState, useCallback, type RefObject } from 'react';

/**
 * Element registry entry
 */
interface ElementEntry {
  ref: RefObject<HTMLElement>;
  type: 'button' | 'container';
}

/**
 * Transition context value
 */
interface TransitionContextValue {
  /** Currently animating state */
  isTransitioning: boolean;
  /** Register an element for morphing */
  registerElement: (id: string, ref: RefObject<HTMLElement>, type: 'button' | 'container') => void;
  /** Unregister an element */
  unregisterElement: (id: string) => void;
  /** Get registered element */
  getElement: (id: string) => HTMLElement | null;
  /** Set transitioning state */
  setTransitioning: (value: boolean) => void;
  /** Get the currently morphing element ID */
  currentMorphId: string | null;
  /** Set the currently morphing element ID */
  setCurrentMorphId: (id: string | null) => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

/**
 * Provider component for transition state
 *
 * @example
 * ```tsx
 * // In app layout
 * <TransitionProvider>
 *   <YourApp />
 * </TransitionProvider>
 * ```
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentMorphId, setCurrentMorphId] = useState<string | null>(null);
  const elementsRef = useRef<Map<string, ElementEntry>>(new Map());

  /**
   * Register an element for potential morphing
   */
  const registerElement = useCallback(
    (id: string, ref: RefObject<HTMLElement>, type: 'button' | 'container') => {
      if (!id) return;
      elementsRef.current.set(id, { ref, type });
    },
    []
  );

  /**
   * Unregister an element (cleanup on unmount)
   */
  const unregisterElement = useCallback((id: string) => {
    if (!id) return;
    elementsRef.current.delete(id);
  }, []);

  /**
   * Get a registered element by ID
   */
  const getElement = useCallback((id: string): HTMLElement | null => {
    const entry = elementsRef.current.get(id);
    return entry?.ref.current || null;
  }, []);

  const value: TransitionContextValue = {
    isTransitioning,
    registerElement,
    unregisterElement,
    getElement,
    setTransitioning: setIsTransitioning,
    currentMorphId,
    setCurrentMorphId,
  };

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  );
}

/**
 * Hook to access transition context
 *
 * @returns Transition context value
 * @throws Error if used outside TransitionProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isTransitioning, registerElement } = useTransitionContext();
 *   const buttonRef = useRef<HTMLButtonElement>(null);
 *
 *   useEffect(() => {
 *     registerElement('my-button', buttonRef, 'button');
 *   }, [registerElement]);
 *
 *   return <button ref={buttonRef}>Click me</button>;
 * }
 * ```
 */
export function useTransitionContext() {
  const context = useContext(TransitionContext);

  if (!context) {
    throw new Error('useTransitionContext must be used within a TransitionProvider');
  }

  return context;
}
