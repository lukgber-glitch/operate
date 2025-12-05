/**
 * Offline Indicator Component
 * Displays connection status and queued message count
 */

'use client';

import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { WifiOff, Wifi, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export function OfflineIndicator({
  className,
  showWhenOnline = false,
}: OfflineIndicatorProps) {
  const {
    isOnline,
    queuedCount,
    isSyncing,
    hasErrors,
    errorCount,
  } = useOfflineQueue();

  // Don't show anything if online and no queue
  if (isOnline && queuedCount === 0 && !showWhenOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
        {
          'bg-red-50 text-red-700 border border-red-200': !isOnline,
          'bg-yellow-50 text-yellow-700 border border-yellow-200':
            isOnline && queuedCount > 0,
          'bg-green-50 text-green-700 border border-green-200':
            isOnline && queuedCount === 0,
        },
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {!isOnline && <WifiOff className="h-4 w-4" />}
        {isOnline && isSyncing && <Loader2 className="h-4 w-4 animate-spin" />}
        {isOnline && !isSyncing && queuedCount > 0 && (
          <AlertCircle className="h-4 w-4" />
        )}
        {isOnline && queuedCount === 0 && <Wifi className="h-4 w-4" />}
      </div>

      {/* Status Text */}
      <div className="flex-1 min-w-0">
        {!isOnline && <span>Offline</span>}
        {isOnline && isSyncing && <span>Syncing messages...</span>}
        {isOnline && !isSyncing && queuedCount > 0 && (
          <span>
            {queuedCount} message{queuedCount !== 1 ? 's' : ''} queued
          </span>
        )}
        {isOnline && queuedCount === 0 && showWhenOnline && <span>Online</span>}
      </div>

      {/* Error Badge */}
      {hasErrors && (
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Offline Badge
 * Small badge for navbar/toolbar
 */
export function OfflineBadge({ className }: { className?: string }) {
  const { isOnline, queuedCount } = useOfflineQueue();

  if (isOnline && queuedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        {
          'bg-red-100 text-red-700': !isOnline,
          'bg-yellow-100 text-yellow-700': isOnline && queuedCount > 0,
        },
        className
      )}
    >
      {!isOnline && (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
      {isOnline && queuedCount > 0 && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>{queuedCount} queued</span>
        </>
      )}
    </div>
  );
}
