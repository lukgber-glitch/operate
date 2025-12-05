'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  children: React.ReactNode;
  role?: 'status' | 'alert' | 'log';
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  className?: string;
}

/**
 * LiveRegion component for announcing dynamic content changes
 * Used for notifications, form errors, loading states, etc.
 * WCAG 2.1 Level AA requirement
 */
export function LiveRegion({
  children,
  role = 'status',
  'aria-live': ariaLive = 'polite',
  'aria-atomic': ariaAtomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // Clear first to ensure re-announcement
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  const AnnouncementRegion = React.useMemo(
    () => (
      <LiveRegion aria-live="polite">
        {announcement}
      </LiveRegion>
    ),
    [announcement]
  );

  return { announce, AnnouncementRegion };
}
