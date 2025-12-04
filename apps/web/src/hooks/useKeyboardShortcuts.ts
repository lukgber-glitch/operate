/**
 * Keyboard Shortcuts Hook
 * Global keyboard shortcuts for invoice review
 */

import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  handler: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputActive =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      // Don't trigger shortcuts when typing in inputs
      if (isInputActive && !event.ctrlKey && !event.metaKey) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const ctrlPressed = event.ctrlKey || event.metaKey;
        const shiftPressed = event.shiftKey;
        const altPressed = event.altKey;

        const ctrlMatch = shortcut.ctrl ? ctrlPressed : !ctrlPressed;
        const shiftMatch = shortcut.shift ? shiftPressed : !shiftPressed;
        const altMatch = shortcut.alt ? altPressed : !altPressed;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.handler();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

/**
 * Hook for invoice review shortcuts
 */
export function useInvoiceReviewShortcuts({
  onApprove,
  onReject,
  onEdit,
  onNext,
  onPrevious,
  onClose,
  enabled = true,
}: {
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'a',
      description: 'Approve extraction',
      handler: () => onApprove?.(),
      enabled: enabled && !!onApprove,
    },
    {
      key: 'r',
      description: 'Reject extraction',
      handler: () => onReject?.(),
      enabled: enabled && !!onReject,
    },
    {
      key: 'e',
      description: 'Toggle edit mode',
      handler: () => onEdit?.(),
      enabled: enabled && !!onEdit,
    },
    {
      key: 'ArrowRight',
      description: 'Next extraction',
      handler: () => onNext?.(),
      enabled: enabled && !!onNext,
    },
    {
      key: 'ArrowLeft',
      description: 'Previous extraction',
      handler: () => onPrevious?.(),
      enabled: enabled && !!onPrevious,
    },
    {
      key: 'Escape',
      description: 'Close dialog',
      handler: () => onClose?.(),
      enabled: enabled && !!onClose,
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts.filter((s) => s.enabled !== false);
}
