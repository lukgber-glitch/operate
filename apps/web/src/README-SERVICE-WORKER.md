# Service Worker Quick Reference

## For Developers Working with Operate/CoachOS PWA

### Quick Start

The app now has full PWA support with service workers. Here's what you need to know:

---

## How to Use

### Check Online/Offline Status

```tsx
import { OnlineStatus } from '@/components/online-status'

export function MyPage() {
  return (
    <div>
      <OnlineStatus /> {/* Shows only when offline */}
      {/* or */}
      <OnlineStatus showWhenOnline={true} /> {/* Always visible */}
    </div>
  )
}
```

### Access Service Worker State

```tsx
import { useServiceWorker } from '@/hooks/use-service-worker'

export function MyComponent() {
  const {
    isSupported,        // Is SW supported in browser?
    isOnline,           // Is the user online?
    isUpdateAvailable,  // Is a new version ready?
    updateServiceWorker, // Function to trigger update
    checkForUpdates     // Function to check for updates manually
  } = useServiceWorker()

  return (
    <div>
      {!isOnline && <p>You're offline!</p>}
      {isUpdateAvailable && (
        <button onClick={updateServiceWorker}>
          Update App
        </button>
      )}
    </div>
  )
}
```

---

## Important Notes

### Development Mode
- Service worker is **DISABLED** in development
- Only activates in production builds
- To test: `pnpm build && pnpm start`

### Caching Behavior

#### Automatic Caching
- **Static assets** (JS, CSS, images): Cached automatically
- **API calls**: Network-first with 24h cache fallback
- **Fonts**: Long-term cache (Google Fonts: 365 days)

#### Cache Strategies
- **Cache-First**: Google Fonts (rarely change)
- **Stale-While-Revalidate**: Images, CSS, JS (serve cached, update in background)
- **Network-First**: API calls, dynamic content (try network, fallback to cache)

### Offline Behavior
- Cached pages: Work normally
- New pages: Show `/offline` page
- Auto-reload when connection restored

---

## Common Tasks

### Force Service Worker Update
```typescript
const { checkForUpdates } = useServiceWorker()

// In your component
await checkForUpdates()
```

### Clear All Caches (DevTools)
```
1. Open DevTools > Application
2. Clear Storage > Clear site data
3. Refresh page
```

### Test Offline Mode
```
1. Build: pnpm build
2. Start: pnpm start
3. DevTools > Network > Set to "Offline"
4. Navigate around
```

---

## Files You Might Need

### Modify Caching Strategy
Edit: `apps/web/next.config.js`

### Customize Offline Page
Edit: `apps/web/src/app/offline/page.tsx`

### Add Custom SW Logic
Edit: `apps/web/public/sw-custom.js`

### Modify Update Notification
Edit: `apps/web/src/components/service-worker-update.tsx`

---

## Debugging

### View Service Worker
```
DevTools > Application > Service Workers
```

### View Caches
```
DevTools > Application > Cache Storage
```

### View Console Logs
Service worker logs appear in:
```
DevTools > Console (with SW context selected)
```

---

## Common Issues

### SW Not Registering
- Check: Must be production build
- Check: HTTPS required (or localhost)
- Check: Clear cache and hard refresh

### Caches Not Updating
- Check: Cache TTL in `next.config.js`
- Fix: Clear cache storage manually
- Fix: Force service worker update

### Offline Page Not Showing
- Check: Service worker activated
- Check: `/offline` route exists
- Check: `fallbacks.document` in config

---

## Best Practices

### DO ✓
- Use the provided React hooks
- Test in production mode
- Clear caches during development
- Use proper cache strategies
- Document any custom SW logic

### DON'T ✗
- Don't rely on SW in development
- Don't modify generated `sw.js`
- Don't cache sensitive data
- Don't set infinite cache TTLs
- Don't bypass the update flow

---

## Need More Info?

- **Full Documentation**: `apps/web/docs/SERVICE_WORKER.md`
- **Implementation Details**: `apps/web/PWA_IMPLEMENTATION.md`
- **Task Summary**: `apps/web/SERVICE_WORKER_SUMMARY.md`

---

## Quick Reference

| What | Where |
|------|-------|
| Config | `next.config.js` |
| Offline Page | `src/app/offline/page.tsx` |
| Update Component | `src/components/service-worker-update.tsx` |
| Status Component | `src/components/online-status.tsx` |
| Hook | `src/hooks/use-service-worker.ts` |
| Custom SW | `public/sw-custom.js` |
| Types | `src/types/service-worker.d.ts` |

---

**Last Updated**: 2025-12-02
**Agent**: PRISM
**Task**: W17-T2
