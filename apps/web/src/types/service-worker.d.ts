// Service Worker Type Definitions for Operate/CoachOS

interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'CACHE_URLS' | 'CLEAR_CACHE' | 'SYNC_DATA'
  payload?: any
}

interface PushNotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  actions?: NotificationAction[]
}

interface SyncEvent extends ExtendableEvent {
  readonly tag: string
}

interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string
}

interface ServiceWorkerGlobalScope {
  addEventListener(
    type: 'sync',
    listener: (event: SyncEvent) => void
  ): void
  addEventListener(
    type: 'periodicsync',
    listener: (event: PeriodicSyncEvent) => void
  ): void
}

// Extend Window interface for service worker registration
declare global {
  interface Window {
    workbox?: any
  }

  interface Navigator {
    setAppBadge?: (count?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }
}

export {}
