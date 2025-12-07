'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Database, CheckCircle2 } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cacheInfo, setCacheInfo] = useState<{
    hasCachedData: boolean;
    cacheCount: number;
  }>({ hasCachedData: false, cacheCount: 0 });

  useEffect(() => {
    // Check online status
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for cached data
    const checkCacheStorage = async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const totalCount = cacheNames.length;
          setCacheInfo({
            hasCachedData: totalCount > 0,
            cacheCount: totalCount,
          });
        } catch (error) {
          console.error('Error checking cache:', error);
        }
      }
    };

    checkCacheStorage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center gap-6 text-center max-w-md">
        <div className="rounded-full bg-primary/10 p-6 relative">
          <WifiOff className="h-16 w-16 text-primary" />
          {isOnline && (
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-2">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            {isOnline ? 'Back Online!' : "You're Offline"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isOnline
              ? 'Your connection has been restored. Reloading...'
              : "It looks like you've lost your internet connection. Some features may not be available."}
          </p>
        </div>

        {cacheInfo.hasCachedData && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4 w-full">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Cached Data Available
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You can still view {cacheInfo.cacheCount} previously loaded page
                  {cacheInfo.cacheCount !== 1 ? 's' : ''} while offline.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-card p-6 w-full space-y-4">
          <h2 className="text-xl font-semibold">What you can do:</h2>
          <ul className="text-left space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>View previously loaded pages and data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Access cached insights and reports</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Check your internet connection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Your work will sync when you&apos;re back online</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleRetry}
          disabled={isOnline}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          {isOnline ? 'Reloading...' : 'Try Again'}
          {retryCount > 0 && ` (${retryCount})`}
        </button>

        <p className="text-sm text-muted-foreground">
          This page will automatically refresh when your connection is restored.
        </p>
      </div>
    </div>
  );
}
