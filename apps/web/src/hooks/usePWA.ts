'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAState {
  isSupported: boolean
  isInstalled: boolean
  isStandalone: boolean
  canInstall: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  notificationPermission: NotificationPermission
}

interface PWAActions {
  install: () => Promise<boolean>
  updateServiceWorker: () => void
  checkForUpdates: () => Promise<void>
  requestNotificationPermission: () => Promise<NotificationPermission>
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>
  queueSync: () => void
}

export function usePWA(): PWAState & PWAActions {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  const [state, setState] = useState<PWAState>({
    isSupported: false,
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    isOnline: true,
    isUpdateAvailable: false,
    notificationPermission: 'default',
  })

  useEffect(() => {
    // Check browser support
    if (typeof window === 'undefined') return

    const isSupported = 'serviceWorker' in navigator
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')

    setState(prev => ({
      ...prev,
      isSupported,
      isStandalone,
      isInstalled: isStandalone,
      isOnline: navigator.onLine,
      notificationPermission: 'Notification' in window ? Notification.permission : 'denied',
    }))

    if (!isSupported) return

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setState(prev => ({ ...prev, canInstall: true }))
    }

    // Handle successful installation
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
      }))
      setDeferredPrompt(null)
    }

    // Handle online/offline
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Get service worker registration
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.ready
        .then(reg => {
          setRegistration(reg)

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, isUpdateAvailable: true }))
                }
              })
            }
          })

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'SYNC_REQUESTED') {
              // Trigger sync in your app (e.g., via event bus or state management)
              console.log('[PWA] Background sync requested')
              window.dispatchEvent(new CustomEvent('pwa-sync-requested'))
            }

            if (event.data?.type === 'REFRESH_DATA') {
              console.log('[PWA] Data refresh requested')
              window.dispatchEvent(new CustomEvent('pwa-refresh-data'))
            }
          })
        })
        .catch(error => {
          console.error('[PWA] Service worker registration failed:', error)
        })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('[PWA] Install prompt not available')
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt')
        return true
      } else {
        console.log('[PWA] User dismissed the install prompt')
        return false
      }
    } catch (error) {
      console.error('[PWA] Install error:', error)
      return false
    } finally {
      setDeferredPrompt(null)
      setState(prev => ({ ...prev, canInstall: false }))
    }
  }

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setState(prev => ({ ...prev, isUpdateAvailable: false }))
    }
  }

  const checkForUpdates = async () => {
    if (registration) {
      await registration.update()
    }
  }

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    const permission = await Notification.requestPermission()
    setState(prev => ({ ...prev, notificationPermission: permission }))
    return permission
  }

  const showNotification = async (
    title: string,
    options?: NotificationOptions
  ): Promise<void> => {
    if (!registration) {
      console.warn('[PWA] Service worker not registered')
      return
    }

    const permission = await requestNotificationPermission()

    if (permission !== 'granted') {
      console.warn('[PWA] Notification permission denied')
      return
    }

    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    })
  }

  const queueSync = () => {
    if (registration) {
      registration.active?.postMessage({ type: 'QUEUE_SYNC' })
    }
  }

  return {
    ...state,
    install,
    updateServiceWorker,
    checkForUpdates,
    requestNotificationPermission,
    showNotification,
    queueSync,
  }
}
