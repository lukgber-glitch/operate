# Service Worker Implementation

## Overview

The Operate/CoachOS web application implements a Progressive Web App (PWA) with advanced caching strategies, offline support, and automatic update notifications using `@ducanh2912/next-pwa`.

## Architecture

### Components

1. **next-pwa Integration** (`next.config.js`)
   - Automated service worker generation
   - Workbox-powered caching strategies
   - Production-only activation

2. **Service Worker Update Component** (`src/components/service-worker-update.tsx`)
   - Detects new versions
   - Prompts user to update
   - Handles seamless updates

3. **Offline Page** (`src/app/offline/page.tsx`)
   - Fallback UI when offline
   - Auto-reload when connection restored
   - User-friendly guidance

4. **Service Worker Hook** (`src/hooks/use-service-worker.ts`)
   - React hook for SW state management
   - Online/offline detection
   - Update availability checking

5. **Custom Service Worker** (`public/sw-custom.js`)
   - Push notification handling (foundation)
   - Background sync preparation
   - Enhanced cache management

## Caching Strategies

### 1. CacheFirst (Long-term static assets)
- **Google Fonts**: 365 days
- Used for resources that rarely change

### 2. StaleWhileRevalidate (Frequently updated static assets)
- **Font files**: 7 days
- **Images** (jpg, png, svg, webp): 24 hours
- **Next.js images**: 24 hours
- **JavaScript files**: 24 hours
- **CSS files**: 24 hours
- Serves cached version immediately, updates in background

### 3. NetworkFirst (Dynamic content)
- **API calls**: 24 hours cache, 10s timeout
- **Other routes**: 24 hours cache, 10s timeout
- Tries network first, falls back to cache if offline

## Features

### 1. Offline Support
- App shell cached for instant loading
- Offline fallback page at `/offline`
- Auto-reload when connection restored
- Previously loaded pages remain accessible

### 2. Update Management
- Automatic update checking every hour
- User-friendly update notification
- Seamless activation of new versions
- No data loss during updates

### 3. Background Sync (Foundation)
- Infrastructure ready for offline actions
- Prepared for invoice/receipt queuing
- Future: Auto-sync when back online

### 4. Performance Optimization
- Cache-first for static assets
- Network-first for dynamic content
- Optimized cache sizes and TTLs
- Automatic stale cache cleanup

## Usage

### For Users

**Install as PWA:**
1. Visit the app in Chrome/Edge
2. Click "Install" prompt or menu option
3. App appears as native application

**Offline Usage:**
1. Load pages while online
2. Pages remain accessible offline
3. Automatic reload when back online

**Updates:**
1. Update notification appears automatically
2. Click "Update" to get latest version
3. App refreshes with new features

### For Developers

**Check Service Worker Status:**
```typescript
import { useServiceWorker } from '@/hooks/use-service-worker'

function MyComponent() {
  const { isSupported, isOnline, isUpdateAvailable } = useServiceWorker()

  return (
    <div>
      <p>SW Supported: {isSupported ? 'Yes' : 'No'}</p>
      <p>Online: {isOnline ? 'Yes' : 'No'}</p>
      <p>Update Available: {isUpdateAvailable ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

**Trigger Manual Update:**
```typescript
const { checkForUpdates, updateServiceWorker } = useServiceWorker()

// Check for updates
await checkForUpdates()

// Apply update immediately
updateServiceWorker()
```

**Add Custom Caching:**
Edit `next.config.js` and add to `runtimeCaching` array:
```javascript
{
  urlPattern: /^https:\/\/your-api\.com\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'your-api-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 // 1 hour
    }
  }
}
```

## Configuration

### Environment Variables
```env
NODE_ENV=production  # Service worker only active in production
```

### next.config.js Settings
```javascript
withPWA({
  dest: 'public',                    // SW output directory
  disable: NODE_ENV === 'development', // Disable in dev
  register: true,                     // Auto-register SW
  skipWaiting: true,                  // Activate new SW immediately
  scope: '/',                         // SW scope
  sw: 'sw.js',                        // SW filename
  fallbacks: {
    document: '/offline',             // Offline fallback page
  },
})
```

## Testing

### Test Offline Mode
1. Open DevTools > Application > Service Workers
2. Check "Offline" checkbox
3. Navigate through app
4. Verify cached pages load
5. Verify `/offline` page shows for new pages

### Test Update Flow
1. Build and deploy version 1
2. Make changes and build version 2
3. Deploy version 2
4. Keep version 1 open in browser
5. Wait for update notification
6. Click "Update" and verify new version loads

### Test Caching
1. Open DevTools > Application > Cache Storage
2. Browse through app
3. Verify caches are created:
   - `google-fonts`
   - `static-image-assets`
   - `api-cache`
   - etc.
4. Check cache contents match strategy

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11.3+)
- Opera: Full support

## Future Enhancements

### Planned Features
1. **Background Sync**
   - Queue offline invoice creation
   - Queue receipt uploads
   - Auto-sync when online

2. **Push Notifications**
   - Tax deadline reminders
   - Invoice payment notifications
   - System alerts

3. **Periodic Background Sync**
   - Auto-refresh dashboard data
   - Update cached reports
   - Sync tax calculations

4. **Advanced Caching**
   - Predictive prefetching
   - ML-based cache optimization
   - User-specific cache strategies

## Troubleshooting

### Service Worker Not Registering
- Check: Only works in production (`NODE_ENV=production`)
- Check: HTTPS required (or localhost)
- Check: Browser console for errors

### Offline Page Not Showing
- Check: Service worker activated
- Check: Offline fallback configured in `next.config.js`
- Check: `/offline` route exists

### Updates Not Detected
- Check: Service worker checking for updates every hour
- Force check: Use `checkForUpdates()` from hook
- Clear cache: DevTools > Application > Clear Storage

### Caches Growing Too Large
- Check: Cache expiration settings
- Check: maxEntries limits
- Run: Manual cache cleanup in DevTools

## Resources

- [Next PWA Documentation](https://ducanh-next-pwa.vercel.app/)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Checklist](https://web.dev/pwa-checklist/)
