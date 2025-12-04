# Offline Data Layer - Quick Reference

One-page cheat sheet for common offline operations.

---

## Setup (One Time)

```tsx
// Wrap app with provider
import { OfflineProvider } from '@/contexts/OfflineContext'

<OfflineProvider autoSync={true}>
  {children}
</OfflineProvider>
```

---

## Query Data Offline

```tsx
import { useOfflineQuery } from '@/hooks/useOfflineQuery'

const { data, isLoading, isCached, refetch } = useOfflineQuery({
  entityType: 'invoices',
  queryKey: 'my-invoices',
  fetchFn: () => api.getInvoices(),
  cacheFirst: true, // Show cache first
  staleTime: 5 * 60 * 1000, // 5 min
})
```

---

## Create/Update/Delete Offline

```tsx
import { useOfflineMutation } from '@/hooks/useOfflineMutation'

// Create
const { mutate, isPending } = useOfflineMutation({
  entityType: 'invoices',
  mutationFn: api.createInvoice,
  optimisticUpdate: (vars) => ({
    id: `temp_${Date.now()}`,
    ...vars,
  }),
})

// Update
const { mutate } = useOfflineUpdate(
  'invoices',
  api.updateInvoice
)

// Delete
const { mutate } = useOfflineDelete(
  'invoices',
  api.deleteInvoice
)
```

---

## Check Online Status

```tsx
import { useOffline } from '@/contexts/OfflineContext'

const { isOnline, pendingSyncCount } = useOffline()

{!isOnline && <div>You're offline</div>}
{pendingSyncCount > 0 && <div>{pendingSyncCount} pending</div>}
```

---

## Manual Sync

```tsx
import { useSync } from '@/contexts/OfflineContext'

const { syncNow, isSyncing, syncProgress } = useSync()

<button onClick={syncNow} disabled={isSyncing}>
  Sync Now {isSyncing && `${syncProgress}%`}
</button>
```

---

## Common Patterns

### Show Offline Banner
```tsx
const { isOnline } = useOffline()

{!isOnline && (
  <Alert>You're offline. Changes will sync when online.</Alert>
)}
```

### Show Cache Indicator
```tsx
const { isCached, lastSyncedAt } = useOfflineQuery({...})

{isCached && (
  <span>Cached (synced: {lastSyncedAt?.toLocaleString()})</span>
)}
```

### Show Pending Changes
```tsx
const { isPending } = useOfflineMutation({...})

{isPending && (
  <Badge>Queued for sync</Badge>
)}
```

---

## Utilities

```tsx
import {
  getDBStats,
  getPendingSyncItems,
  clearAllData,
  isIndexedDBSupported,
} from '@/lib/offline'

// Get database stats
const stats = await getDBStats()
// { invoices: 10, expenses: 5, contacts: 3, ... }

// Get pending syncs
const pending = await getPendingSyncItems()

// Check support
if (isIndexedDBSupported()) {
  // Use offline features
}

// Clear all data (careful!)
await clearAllData()
```

---

## Conflict Resolution

```tsx
<OfflineProvider
  defaultStrategy="server-wins" // or "client-wins", "merge", "manual"
>
  {children}
</OfflineProvider>
```

**Strategies**:
- `server-wins`: Server data wins (default for financial)
- `client-wins`: Client data wins
- `last-write-wins`: Most recent wins
- `merge`: Smart field merging
- `manual`: User resolves

---

## Testing

1. Build production:
   ```bash
   pnpm build && pnpm start
   ```

2. Open DevTools > Network > "Offline"

3. Create/update data

4. Check DevTools > Application > IndexedDB

5. Go back online, verify sync

---

## File Locations

| What | Where |
|------|-------|
| Database | `src/lib/offline/db.ts` |
| Sync Queue | `src/lib/offline/sync-queue.ts` |
| Conflicts | `src/lib/offline/conflict-resolver.ts` |
| Query Hook | `src/hooks/useOfflineQuery.ts` |
| Mutation Hook | `src/hooks/useOfflineMutation.ts` |
| Context | `src/contexts/OfflineContext.tsx` |
| Service Worker | `public/sw-custom.js` |

---

## Troubleshooting

**Data not caching?**
```tsx
// Check IndexedDB support
import { isIndexedDBSupported } from '@/lib/offline'
console.log(isIndexedDBSupported())

// Check DevTools > Application > IndexedDB > operate-offline-db
```

**Sync not working?**
```tsx
// Check pending items
const pending = await getPendingSyncItems()
console.log('Pending:', pending)

// Force sync
const { syncNow } = useSync()
await syncNow()
```

**Service worker issues?**
```tsx
// Unregister in DevTools > Application > Service Workers
// Hard refresh page (Ctrl+Shift+R)

// Or programmatically:
const { updateServiceWorker } = useServiceWorker()
updateServiceWorker()
```

---

## Common Gotchas

❌ **Don't** forget to enable service workers in production build
✅ **Do** test with `pnpm build && pnpm start`

❌ **Don't** store sensitive data without encryption
✅ **Do** clear data on logout

❌ **Don't** assume sync will work immediately
✅ **Do** show pending state to users

❌ **Don't** cache everything
✅ **Do** cache only critical data

---

## Performance Tips

- Use `cacheFirst: true` for static data
- Set appropriate `staleTime` (5-15 min)
- Use optimistic updates for instant feedback
- Batch syncs instead of one-by-one
- Clean up old completed syncs

---

## Need More Help?

- [Full Documentation](./README.md)
- [Example Usage](./EXAMPLE_USAGE.md)
- [Implementation Summary](../../OFFLINE_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated**: 2025-12-02
