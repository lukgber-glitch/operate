'use client';

import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center gap-6 text-center max-w-md">
        <div className="rounded-full bg-primary/10 p-6">
          <WifiOff className="h-16 w-16 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">You&apos;re Offline</h1>
          <p className="text-lg text-muted-foreground">
            It looks like you&apos;ve lost your internet connection. Some features may not be available.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 w-full space-y-4">
          <h2 className="text-xl font-semibold">What you can do:</h2>
          <ul className="text-left space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>View previously loaded pages and data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Check your internet connection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Try again when you&apos;re back online</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>

        <p className="text-sm text-muted-foreground">
          This page will automatically refresh when your connection is restored.
        </p>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('online', function() {
              window.location.reload();
            });
          `,
        }}
      />
    </div>
  )
}
