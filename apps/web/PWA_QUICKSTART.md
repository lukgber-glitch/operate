# PWA Quick Start - Operate/CoachOS

## 🚀 Quick Reference

### Check PWA Status

```typescript
import { usePWA } from '@/hooks/usePWA'

const { isInstalled, isOnline, canInstall } = usePWA()
```

### Install the App

```typescript
const { install } = usePWA()
await install() // Returns true if successful
```

### Show Notification

```typescript
const { showNotification } = usePWA()
await showNotification('Title', { body: 'Message' })
```

### Queue Background Sync

```typescript
const { queueSync } = usePWA()
queueSync() // Triggers sync when back online
```

## 🧪 Testing PWA Features

### 1. Build for Production
```bash
cd apps/web
npm run build
npm run start
```

### 2. Open in Browser
```
http://localhost:3000
```

### 3. Test Install (Chrome/Edge)
- Look for install icon in address bar
- Or check Application → Manifest in DevTools
- Click install button in app

### 4. Test Offline
- DevTools → Network → Offline checkbox
- Navigate to different pages
- Should show cached content or offline page

### 5. View PWA Debug Info
Add `?pwa-debug=true` to any URL:
```
http://localhost:3000?pwa-debug=true
```

## 📱 Components

### InstallPrompt
Auto-appears for non-installed users:
```typescript
// Already in layout.tsx
<InstallPrompt />
```

### PWAStatus (Debug)
Shows in dev mode or with `?pwa-debug=true`:
```typescript
import { PWAStatus } from '@/components/pwa'
<PWAStatus />
```

## 🛠️ Utilities

### Platform Detection
```typescript
import { isIOS, isAndroid, isStandalone } from '@/lib/pwa-utils'

if (isIOS()) {
  // Show iOS-specific instructions
}

if (isStandalone()) {
  // App is installed
}
```

### Cache Management
```typescript
import { getCacheUsage, clearAllCaches } from '@/lib/pwa-utils'

// Check cache size
const { usage, quota, percentage } = await getCacheUsage()

// Clear all caches
await clearAllCaches()
```

### Check Capabilities
```typescript
import { getPWACapabilities } from '@/lib/pwa-utils'

const caps = getPWACapabilities()
// {
//   serviceWorker: true,
//   notification: true,
//   push: true,
//   backgroundSync: true,
//   isStandalone: false,
//   isIOS: false,
//   isAndroid: false
// }
```

## 📋 Files

| File | Purpose |
|------|---------|
| `public/manifest.json` | App metadata |
| `public/offline.html` | Static offline page |
| `public/sw-custom.js` | Custom SW features |
| `src/components/pwa/InstallPrompt.tsx` | Install UI |
| `src/components/pwa/PWAStatus.tsx` | Debug UI |
| `src/hooks/usePWA.ts` | Main PWA hook |
| `src/lib/pwa-utils.ts` | Helper functions |
| `next.config.js` | PWA config |

## 🎨 Icon Checklist

Place icons in `public/icons/`:
- [ ] icon-72x72.png
- [ ] icon-96x96.png
- [ ] icon-128x128.png
- [ ] icon-144x144.png
- [ ] icon-152x152.png
- [ ] icon-192x192.png (required)
- [ ] icon-384x384.png
- [ ] icon-512x512.png (required)

Generate with:
```bash
npx pwa-asset-generator logo.svg public/icons
```

## 🔍 Debugging

### Service Worker Not Registering
```typescript
// Check in DevTools Console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', !!reg)
})
```

### Clear Everything
```typescript
// Unregister SW
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => reg.unregister()))

// Clear cache
import { clearAllCaches } from '@/lib/pwa-utils'
await clearAllCaches()

// Clear storage
localStorage.clear()
sessionStorage.clear()
```

### Force Update
```typescript
const { checkForUpdates } = usePWA()
await checkForUpdates()
```

## 🌐 Production URLs

- App: https://operate.guru
- Manifest: https://operate.guru/manifest.json
- SW: https://operate.guru/sw.js

## 📚 More Info

See [PWA_GUIDE.md](./PWA_GUIDE.md) for comprehensive documentation.
