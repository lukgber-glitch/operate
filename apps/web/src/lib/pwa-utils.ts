/**
 * PWA Utilities for Operate/CoachOS
 * Helper functions for Progressive Web App features
 */

export interface PWAConfig {
  enableNotifications: boolean
  enableBackgroundSync: boolean
  enablePeriodicSync: boolean
  syncInterval?: number
}

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Check if the device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * Check if the device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false

  return /Android/.test(navigator.userAgent)
}

/**
 * Get the install prompt status from localStorage
 */
export function getInstallPromptStatus(): {
  dismissed: boolean
  lastDismissed: Date | null
} {
  if (typeof window === 'undefined') {
    return { dismissed: false, lastDismissed: null }
  }

  const dismissed = localStorage.getItem('pwa-install-dismissed')

  if (!dismissed) {
    return { dismissed: false, lastDismissed: null }
  }

  return {
    dismissed: true,
    lastDismissed: new Date(dismissed),
  }
}

/**
 * Check if enough time has passed since the install prompt was dismissed
 * @param days - Number of days to wait before showing again (default: 30)
 */
export function shouldShowInstallPrompt(days: number = 30): boolean {
  const status = getInstallPromptStatus()

  if (!status.dismissed || !status.lastDismissed) {
    return true
  }

  const daysSinceDismissal =
    (Date.now() - status.lastDismissed.getTime()) / (1000 * 60 * 60 * 24)

  return daysSinceDismissal >= days
}

/**
 * Register for background sync
 */
export async function registerBackgroundSync(tag: string = 'sync-data'): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready

    if ('sync' in registration) {
      // Background Sync API - not in standard TS types
      const reg = registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> }
      }
      await reg.sync.register(tag)
      console.log(`[PWA] Background sync registered: ${tag}`)
      return true
    }

    return false
  } catch (error) {
    console.error('[PWA] Failed to register background sync:', error)
    return false
  }
}

/**
 * Register for periodic background sync
 */
export async function registerPeriodicSync(
  tag: string = 'refresh-data',
  minInterval: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready

    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any,
      })

      if (status.state === 'granted') {
        await (registration as any).periodicSync.register(tag, {
          minInterval,
        })
        console.log(`[PWA] Periodic sync registered: ${tag}`)
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[PWA] Failed to register periodic sync:', error)
    return false
  }
}

/**
 * Request notification permission and return the result
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  return await Notification.requestPermission()
}

/**
 * Show a notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  const permission = await requestNotificationPermission()

  if (permission !== 'granted') {
    console.warn('[PWA] Notification permission denied')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready

    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    })
  } catch (error) {
    console.error('[PWA] Failed to show notification:', error)
  }
}

/**
 * Clear all caches (useful for debugging)
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log(`[PWA] Cleared ${cacheNames.length} cache(s)`)
  } catch (error) {
    console.error('[PWA] Failed to clear caches:', error)
  }
}

/**
 * Get cache storage usage
 */
export async function getCacheUsage(): Promise<{
  usage: number
  quota: number
  percentage: number
}> {
  if (typeof window === 'undefined' || !('navigator' in window) || !navigator.storage) {
    return { usage: 0, quota: 0, percentage: 0 }
  }

  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percentage = quota > 0 ? (usage / quota) * 100 : 0

    return { usage, quota, percentage }
  } catch (error) {
    console.error('[PWA] Failed to get cache usage:', error)
    return { usage: 0, quota: 0, percentage: 0 }
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Add to home screen instructions for iOS
 */
export function getIOSInstallInstructions(): string[] {
  return [
    'Tap the Share button in Safari',
    'Scroll down and tap "Add to Home Screen"',
    'Tap "Add" in the top right corner',
  ]
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator
}

/**
 * Check if notification is supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Check if push notification is supported
 */
export function isPushSupported(): boolean {
  return isServiceWorkerSupported() && 'PushManager' in window
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return typeof window !== 'undefined' && 'sync' in (ServiceWorkerRegistration.prototype || {})
}

/**
 * Check if periodic background sync is supported
 */
export function isPeriodicSyncSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'periodicSync' in (ServiceWorkerRegistration.prototype || {})
  )
}

/**
 * Get PWA capabilities
 */
export function getPWACapabilities() {
  return {
    serviceWorker: isServiceWorkerSupported(),
    notification: isNotificationSupported(),
    push: isPushSupported(),
    backgroundSync: isBackgroundSyncSupported(),
    periodicSync: isPeriodicSyncSupported(),
    isStandalone: isStandalone(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
  }
}
