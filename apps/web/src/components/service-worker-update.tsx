'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export function ServiceWorkerUpdate() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Only run in browser and in production
    if (
      typeof window === 'undefined' ||
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return
    }

    // Check for service worker updates
    const checkForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        setRegistration(reg)

        // Check for updates every hour
        setInterval(() => {
          reg.update()
        }, 60 * 60 * 1000)

        // Listen for new service worker controlling the page
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // New service worker is waiting to activate
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true)
              }
            })
          }
        })

        // Listen for controller change (new SW activated)
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        })
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    }

    checkForUpdates()
  }, [])

  const handleUpdate = () => {
    if (!registration?.waiting) return

    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    setShowUpdate(false)
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-lg max-w-md">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">New version available!</p>
          <p className="text-xs text-muted-foreground">
            A new version of the app is ready. Update now to get the latest features and improvements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <RefreshCw className="h-4 w-4" />
            Update
          </button>

          <button
            onClick={handleDismiss}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
