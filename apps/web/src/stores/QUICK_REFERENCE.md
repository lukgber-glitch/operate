# Offline Queue - Quick Reference

Quick start: Import hook → Add indicator → Send messages

## Quick Start
```tsx
import { useOfflineChat } from '@/hooks/useOfflineChat';
import { OfflineIndicator } from '@/components/chat/OfflineIndicator';

const { sendMessage } = useOfflineChat();
<OfflineIndicator />
await sendMessage({ conversationId, content, attachments });
```

## Three Hooks
1. `useOfflineChat()` - Simplest (chat messages)
2. `useOfflineQueue()` - Full featured (queue management)
3. `useOfflineStatus()` - Lightweight (status only)

## Two Components
1. `<OfflineIndicator />` - Full display
2. `<OfflineBadge />` - Compact badge

## Testing Offline
DevTools → Network tab → "Offline" → Send → "Online" → Watch sync

## Documentation
- `INTEGRATION_GUIDE.md` - Quick integration
- `README_OFFLINE_QUEUE.md` - Complete docs
- `ChatWithOffline.example.tsx` - Working example
