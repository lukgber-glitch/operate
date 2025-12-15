import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  /** Key to listen for (e.g., 'k', 'Enter', 'Escape') */
  key: string;
  /** Require Cmd (Mac) or Ctrl (Windows/Linux) */
  meta?: boolean;
  /** Require Ctrl key */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt/Option key */
  alt?: boolean;
  /** Callback when shortcut is triggered */
  handler: (event: KeyboardEvent) => void;
  /** Whether the shortcut is enabled (default: true) */
  enabled?: boolean;
  /** Prevent default browser behavior (default: true) */
  preventDefault?: boolean;
  /** Description for accessibility/help text */
  description?: string;
}

export interface UseKeyboardShortcutOptions {
  /** Only trigger when this element or its children have focus */
  scope?: React.RefObject<HTMLElement>;
  /** Disable all shortcuts */
  disabled?: boolean;
}

/**
 * useKeyboardShortcut - Hook for registering keyboard shortcuts
 *
 * @example
 * ```tsx
 * // Single shortcut
 * useKeyboardShortcut({
 *   key: 'k',
 *   meta: true,
 *   handler: () => setSearchOpen(true),
 *   description: 'Open search'
 * });
 *
 * // Multiple shortcuts
 * useKeyboardShortcut([
 *   { key: 'k', meta: true, handler: openSearch },
 *   { key: 'Escape', handler: closeModal },
 *   { key: 'n', meta: true, shift: true, handler: createNew },
 * ]);
 * ```
 */
export function useKeyboardShortcut(
  shortcuts: KeyboardShortcut | KeyboardShortcut[],
  options: UseKeyboardShortcutOptions = {}
): void {
  const { scope, disabled = false } = options;

  // Normalize to array
  const shortcutList = Array.isArray(shortcuts) ? shortcuts : [shortcuts];

  // Use ref to avoid stale closures
  const shortcutsRef = useRef(shortcutList);
  shortcutsRef.current = shortcutList;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Check scope if provided
      if (scope?.current && !scope.current.contains(event.target as Node)) {
        return;
      }

      // Don't trigger shortcuts when typing in inputs (unless it's Escape)
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        // Check key match (case-insensitive for letters)
        const keyMatch =
          event.key.toLowerCase() === shortcut.key.toLowerCase() ||
          event.code.toLowerCase() === `key${shortcut.key.toLowerCase()}`;

        if (!keyMatch) continue;

        // Check modifier keys
        const metaMatch = shortcut.meta
          ? event.metaKey || event.ctrlKey // Cmd on Mac, Ctrl on Windows
          : !event.metaKey && !event.ctrlKey;

        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // Special handling for Escape - always allow
        const isEscape = shortcut.key.toLowerCase() === 'escape';

        // Skip if in input and not Escape
        if (isInput && !isEscape && !shortcut.meta) continue;

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
          return; // Only trigger first matching shortcut
        }
      }
    },
    [disabled, scope]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get a human-readable string for a keyboard shortcut
 *
 * @example
 * formatShortcut({ key: 'k', meta: true }) // "⌘K" on Mac, "Ctrl+K" on Windows
 */
export function formatShortcut(shortcut: Partial<KeyboardShortcut>): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const parts: string[] = [];

  if (shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.ctrl) {
    parts.push('Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.key) {
    // Capitalize single letter keys
    const keyDisplay =
      shortcut.key.length === 1
        ? shortcut.key.toUpperCase()
        : shortcut.key;
    parts.push(keyDisplay);
  }

  return isMac ? parts.join('') : parts.join('+');
}

/**
 * Common keyboard shortcuts for quick reference
 */
export const CommonShortcuts = {
  search: { key: 'k', meta: true, description: 'Open search' },
  newItem: { key: 'n', meta: true, description: 'Create new' },
  save: { key: 's', meta: true, description: 'Save' },
  close: { key: 'Escape', description: 'Close' },
  submit: { key: 'Enter', meta: true, description: 'Submit' },
  selectAll: { key: 'a', meta: true, description: 'Select all' },
  undo: { key: 'z', meta: true, description: 'Undo' },
  redo: { key: 'z', meta: true, shift: true, description: 'Redo' },
} as const;

export default useKeyboardShortcut;
