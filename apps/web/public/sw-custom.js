// Custom Service Worker enhancements for Operate
// This file is used alongside the generated service worker from next-pwa

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Handle sync queue registration from main app
  if (event.data && event.data.type === 'QUEUE_SYNC') {
    // Register for background sync when back online
    self.registration.sync.register('sync-data').catch(err => {
      console.error('[SW] Failed to register sync:', err)
    })
  }
})

// Handle push notifications (foundation for future features)
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData())
  }
})

async function syncOfflineData() {
  // Trigger sync in the main application via postMessage
  try {
    const allClients = await self.clients.matchAll({ type: 'window' })

    // Notify all open windows to sync their offline data
    for (const client of allClients) {
      client.postMessage({
        type: 'SYNC_REQUESTED',
        timestamp: Date.now(),
      })
    }

    console.log('[SW] Sync requested for', allClients.length, 'client(s)')
    return Promise.resolve()
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
    throw error
  }
}

// Periodic background sync (foundation for auto-refresh)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-data') {
    event.waitUntil(refreshCachedData())
  }
})

async function refreshCachedData() {
  // Trigger data refresh in the main application
  try {
    const allClients = await self.clients.matchAll({ type: 'window' })

    for (const client of allClients) {
      client.postMessage({
        type: 'REFRESH_DATA',
        timestamp: Date.now(),
      })
    }

    console.log('[SW] Refresh requested for', allClients.length, 'client(s)')
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error)
  }
}

// Enhanced cache management
self.addEventListener('activate', (event) => {
  const currentCaches = [
    'google-fonts',
    'static-font-assets',
    'static-image-assets',
    'next-image',
    'static-js-assets',
    'static-style-assets',
    'api-cache',
    'others',
    'offline-data',
  ]

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
})

// Log service worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Custom fetch handling can be added here if needed
  // For now, we rely on the Workbox strategies from next-pwa
})
