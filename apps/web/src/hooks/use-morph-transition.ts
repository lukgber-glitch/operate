'use client';

import * as React from 'react';

/**
 * useMorphTransition - State management hook for morphing animations
 *
 * Provides controlled state and helpers for MorphButton/MorphContainer components.
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle, layoutId } = useMorphTransition('my-morph');
 *
 * return (
 *   <>
 *     <MorphTrigger layoutId={layoutId} onClick={open}>
 *       Open
 *     </MorphTrigger>
 *     <MorphTarget layoutId={layoutId} isOpen={isOpen} onClose={close}>
 *       Content...
 *     </MorphTarget>
 *   </>
 * );
 * ```
 */

interface UseMorphTransitionOptions {
  /** Initial open state */
  defaultOpen?: boolean;
  /** Callback when state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Close on escape key press */
  closeOnEscape?: boolean;
  /** Close when clicking outside */
  closeOnClickOutside?: boolean;
}

interface UseMorphTransitionReturn {
  /** Current open state */
  isOpen: boolean;
  /** Open the morph target */
  open: () => void;
  /** Close the morph target */
  close: () => void;
  /** Toggle the open state */
  toggle: () => void;
  /** Set open state directly */
  setIsOpen: (value: boolean) => void;
  /** The layoutId for this transition */
  layoutId: string;
  /** Props to spread on the trigger element */
  triggerProps: {
    layoutId: string;
    onClick: () => void;
    'aria-expanded': boolean;
    'aria-controls': string;
  };
  /** Props to spread on the target element */
  targetProps: {
    layoutId: string;
    isOpen: boolean;
    onClose: () => void;
    id: string;
    role: 'dialog';
    'aria-modal': boolean;
  };
}

export function useMorphTransition(
  layoutId: string,
  options: UseMorphTransitionOptions = {}
): UseMorphTransitionReturn {
  const {
    defaultOpen = false,
    onOpenChange,
    closeOnEscape = true,
    closeOnClickOutside = true,
  } = options;

  const [isOpen, setIsOpenState] = React.useState(defaultOpen);
  const targetId = `${layoutId}-target`;

  const setIsOpen = React.useCallback(
    (value: boolean) => {
      setIsOpenState(value);
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  const open = React.useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = React.useCallback(() => setIsOpen(false), [setIsOpen]);
  const toggle = React.useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
    layoutId,
    triggerProps: {
      layoutId,
      onClick: toggle,
      'aria-expanded': isOpen,
      'aria-controls': targetId,
    },
    targetProps: {
      layoutId,
      isOpen,
      onClose: close,
      id: targetId,
      role: 'dialog',
      'aria-modal': true,
    },
  };
}

/**
 * useMorphGroup - Manage multiple morph transitions where only one can be open
 *
 * @example
 * ```tsx
 * const group = useMorphGroup(['panel-a', 'panel-b', 'panel-c']);
 *
 * // Only one panel can be open at a time
 * group.open('panel-a'); // Opens panel-a, closes others
 * group.isOpen('panel-a'); // true
 * group.isOpen('panel-b'); // false
 * ```
 */

interface UseMorphGroupReturn {
  /** Check if a specific morph is open */
  isOpen: (layoutId: string) => boolean;
  /** Open a specific morph (closes others) */
  open: (layoutId: string) => void;
  /** Close a specific morph */
  close: (layoutId: string) => void;
  /** Close all morphs */
  closeAll: () => void;
  /** Currently open layoutId (or null) */
  activeId: string | null;
  /** Get props for a specific trigger */
  getTriggerProps: (layoutId: string) => {
    layoutId: string;
    onClick: () => void;
    'aria-expanded': boolean;
  };
}

export function useMorphGroup(layoutIds: string[]): UseMorphGroupReturn {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const isOpen = React.useCallback(
    (layoutId: string) => activeId === layoutId,
    [activeId]
  );

  const open = React.useCallback((layoutId: string) => {
    if (layoutIds.includes(layoutId)) {
      setActiveId(layoutId);
    }
  }, [layoutIds]);

  const close = React.useCallback((layoutId: string) => {
    if (activeId === layoutId) {
      setActiveId(null);
    }
  }, [activeId]);

  const closeAll = React.useCallback(() => {
    setActiveId(null);
  }, []);

  const getTriggerProps = React.useCallback(
    (layoutId: string) => ({
      layoutId,
      onClick: () => (activeId === layoutId ? closeAll() : open(layoutId)),
      'aria-expanded': activeId === layoutId,
    }),
    [activeId, open, closeAll]
  );

  // Close on escape
  React.useEffect(() => {
    if (!activeId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeId, closeAll]);

  return {
    isOpen,
    open,
    close,
    closeAll,
    activeId,
    getTriggerProps,
  };
}

export default useMorphTransition;
