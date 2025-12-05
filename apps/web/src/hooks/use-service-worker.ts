'use client'

import { useEffect, useState } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isOnline: true,
    isUpdateAvailable: false,
    registration: null,
  })

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    setState(prev => ({ ...prev, isSupported: true, isOnline: navigator.onLine }))

    // Handle online/offline events
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Get service worker registration
    navigator.serviceWorker.ready.then(registration => {
      setState(prev => ({ ...prev, registration }))

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, isUpdateAvailable: true }))
            }
          })
        }
      })
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateServiceWorker = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setState(prev => ({ ...prev, isUpdateAvailable: false }))
    }
  }

  const checkForUpdates = async () => {
    if (state.registration) {
      await state.registration.update()
    }
  }

  return {
    ...state,
    updateServiceWorker,
    checkForUpdates,
  }
}
