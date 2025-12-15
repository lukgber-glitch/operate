'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, CloudOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OfflineIndicatorProps {
  showPendingCount?: boolean;
}

export function OfflineIndicator({ showPendingCount = true }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);

      // Hide reconnected message after 3 seconds
      setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending actions in local storage
    const checkPendingActions = () => {
      try {
        const pending = localStorage.getItem('offline-queue');
        if (pending) {
          const queue = JSON.parse(pending);
          setPendingActions(queue.length || 0);
        }
      } catch (error) {
        console.error('Failed to check pending actions:', error);
      }
    };

    // Check initially and on visibility change
    checkPendingActions();
    const interval = setInterval(checkPendingActions, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Don't show anything if online and never went offline
  if (isOnline && !showReconnected && !wasOffline) {
    return null;
  }

  // Show reconnected message
  if (showReconnected) {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-2 md:left-auto md:right-4 md:max-w-md">
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Back online! {pendingActions > 0 && `Syncing ${pendingActions} pending action${pendingActions !== 1 ? 's' : ''}...`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show offline message
  if (!isOnline) {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-2 md:left-auto md:right-4 md:max-w-md">
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="flex items-center justify-between">
              <span>You're offline</span>
              {showPendingCount && pendingActions > 0 && (
                <span className="text-xs bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded-full">
                  {pendingActions} pending
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
