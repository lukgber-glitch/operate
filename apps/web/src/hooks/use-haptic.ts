'use client';

import { useCallback } from 'react';

export type HapticPattern = 'success' | 'error' | 'warning' | 'selection' | 'light' | 'medium' | 'heavy';

interface HapticConfig {
  pattern: number | number[];
  description: string;
}

const HAPTIC_PATTERNS: Record<HapticPattern, HapticConfig> = {
  success: {
    pattern: [10, 50, 10],
    description: 'Success - double tap',
  },
  error: {
    pattern: [100, 50, 100],
    description: 'Error - strong double pulse',
  },
  warning: {
    pattern: [50, 30, 50, 30, 50],
    description: 'Warning - triple tap',
  },
  selection: {
    pattern: 10,
    description: 'Selection - light tap',
  },
  light: {
    pattern: 10,
    description: 'Light tap',
  },
  medium: {
    pattern: 30,
    description: 'Medium tap',
  },
  heavy: {
    pattern: 50,
    description: 'Heavy tap',
  },
};

export function useHaptic() {
  const isSupported = useCallback(() => {
    return typeof window !== 'undefined' && 'vibrate' in navigator;
  }, []);

  const vibrate = useCallback((pattern: HapticPattern | number | number[]) => {
    if (!isSupported()) {
      return false;
    }

    try {
      let vibrationPattern: number | number[];

      if (typeof pattern === 'string') {
        // Use predefined pattern
        vibrationPattern = HAPTIC_PATTERNS[pattern].pattern;
      } else {
        // Use custom pattern
        vibrationPattern = pattern;
      }

      navigator.vibrate(vibrationPattern);
      return true;
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      return false;
    }
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported()) {
      return false;
    }

    try {
      navigator.vibrate(0);
      return true;
    } catch (error) {
      console.warn('Failed to cancel haptic feedback:', error);
      return false;
    }
  }, [isSupported]);

  // Convenience methods for common patterns
  const success = useCallback(() => vibrate('success'), [vibrate]);
  const error = useCallback(() => vibrate('error'), [vibrate]);
  const warning = useCallback(() => vibrate('warning'), [vibrate]);
  const selection = useCallback(() => vibrate('selection'), [vibrate]);
  const light = useCallback(() => vibrate('light'), [vibrate]);
  const medium = useCallback(() => vibrate('medium'), [vibrate]);
  const heavy = useCallback(() => vibrate('heavy'), [vibrate]);

  return {
    isSupported: isSupported(),
    vibrate,
    cancel,
    success,
    error,
    warning,
    selection,
    light,
    medium,
    heavy,
  };
}
