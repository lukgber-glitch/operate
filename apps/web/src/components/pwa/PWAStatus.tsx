'use client'

import { useEffect, useState } from 'react'
import { usePWA } from '@/hooks/usePWA'
import { getPWACapabilities, getCacheUsage, formatBytes } from '@/lib/pwa-utils'
import { Wifi, WifiOff, Download, Bell, RefreshCw, HardDrive } from 'lucide-react'

/**
 * PWA Status Component - Debug/Dev Tool
 * Shows current PWA status and capabilities
 * Only visible in development or when explicitly enabled
 */
export function PWAStatus() {
  const {
    isSupported,
    isInstalled,
    isStandalone,
    canInstall,
    isOnline,
    isUpdateAvailable,
    notificationPermission,
    install,
    updateServiceWorker,
  } = usePWA()

  const [capabilities, setCapabilities] = useState(getPWACapabilities())
  const [cacheInfo, setCacheInfo] = useState({ usage: 0, quota: 0, percentage: 0 })
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Only show in development or when ?pwa-debug=true
    const params = new URLSearchParams(window.location.search)
    const showDebug = process.env.NODE_ENV === 'development' || params.get('pwa-debug') === 'true'
    setShowStatus(showDebug)

    if (showDebug) {
      loadCacheInfo()
    }
  }, [])

  const loadCacheInfo = async () => {
    const info = await getCacheUsage()
    setCacheInfo(info)
  }

  if (!showStatus) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="rounded-lg border bg-card p-4 shadow-lg text-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">PWA Status</h3>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          {/* Installation Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Installed:</span>
            <span className={isInstalled ? 'text-green-500' : 'text-muted-foreground'}>
              {isInstalled ? 'Yes' : 'No'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Standalone:</span>
            <span className={isStandalone ? 'text-green-500' : 'text-muted-foreground'}>
              {isStandalone ? 'Yes' : 'No'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Can Install:</span>
            <span className={canInstall ? 'text-green-500' : 'text-muted-foreground'}>
              {canInstall ? 'Yes' : 'No'}
            </span>
          </div>

          {/* Capabilities */}
          <div className="border-t pt-2 mt-2">
            <div className="text-muted-foreground mb-1">Capabilities:</div>
            <div className="grid grid-cols-2 gap-1">
              <span className={capabilities.serviceWorker ? 'text-green-500' : 'text-red-500'}>
                SW: {capabilities.serviceWorker ? '✓' : '✗'}
              </span>
              <span className={capabilities.notification ? 'text-green-500' : 'text-red-500'}>
                Notify: {capabilities.notification ? '✓' : '✗'}
              </span>
              <span className={capabilities.push ? 'text-green-500' : 'text-red-500'}>
                Push: {capabilities.push ? '✓' : '✗'}
              </span>
              <span className={capabilities.backgroundSync ? 'text-green-500' : 'text-red-500'}>
                BG Sync: {capabilities.backgroundSync ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Cache Info */}
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Cache:</span>
              <span>{cacheInfo.percentage.toFixed(1)}%</span>
            </div>
            <div className="text-muted-foreground">
              {formatBytes(cacheInfo.usage)} / {formatBytes(cacheInfo.quota)}
            </div>
          </div>

          {/* Notification Permission */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Notifications:</span>
            <span className={notificationPermission === 'granted' ? 'text-green-500' : ''}>
              {notificationPermission}
            </span>
          </div>

          {/* Actions */}
          <div className="border-t pt-2 mt-2 flex gap-2">
            {canInstall && (
              <button
                onClick={install}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-primary px-2 py-1 text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-3 w-3" />
                Install
              </button>
            )}

            {isUpdateAvailable && (
              <button
                onClick={updateServiceWorker}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
              >
                <RefreshCw className="h-3 w-3" />
                Update
              </button>
            )}

            <button
              onClick={loadCacheInfo}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-muted px-2 py-1 hover:bg-muted/80"
            >
              <HardDrive className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t text-muted-foreground">
          Platform: {capabilities.isIOS ? 'iOS' : capabilities.isAndroid ? 'Android' : 'Desktop'}
        </div>
      </div>
    </div>
  )
}
