'use client';

import { useEffect } from 'react';
import { useRunningTimer } from './use-time-tracking';

/**
 * Hook to warn users before closing the tab/browser when a timer is running
 */
export function useTimerWarning() {
  const { isRunning } = useRunningTimer();

  useEffect(() => {
    if (!isRunning) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browsers require returnValue to be set
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning]);
}
