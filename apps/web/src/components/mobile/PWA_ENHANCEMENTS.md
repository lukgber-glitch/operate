# PWA Mobile Enhancements

This document describes the PWA enhancements implemented for better mobile experience.

## Overview

The following enhancements have been added to improve the mobile and PWA experience:

1. **Enhanced Manifest** - Better app metadata and shortcuts
2. **Share Target API** - Accept shared files and content
3. **Mobile Components** - Touch-optimized UI components
4. **Haptic Feedback** - Tactile feedback for interactions
5. **Offline Support** - Improved offline indicators and handling
6. **Touch Optimizations** - Better touch interactions and performance

## 1. Enhanced Manifest (`/manifest.json`)

### Features

- **Updated Branding**: "Operate - Business Autopilot"
- **App Shortcuts**: Quick access to common actions
  - New Invoice
  - Log Expense
  - Chat
  - Dashboard
- **Share Target**: Accept shared files (receipts, documents)
- **Screenshots**: Desktop and mobile screenshots for install prompt

### Start URL

The app now starts at `/dashboard` instead of `/` for better UX.

## 2. Share Target Handler (`/share-target`)

Allows users to share content with the app from other apps:

- **Images/PDFs** → Routes to expense scanner
- **URLs** → Routes to documents
- **Text** → Routes to chat

### Usage

When users share a file from their camera or file manager, it will be routed to the appropriate page in the app.

## 3. Mobile Components

### PullToRefresh

Allows users to pull down to refresh content.

```tsx
import { PullToRefresh } from '@/components/mobile';

<PullToRefresh onRefresh={async () => {
  await fetchNewData();
}}>
  {/* Your content */}
</PullToRefresh>
```

**Props:**
- `onRefresh`: Async function to call on refresh
- `threshold`: Distance to trigger refresh (default: 80px)
- `disabled`: Disable pull-to-refresh

### SwipeActions

Reveal actions by swiping list items left or right.

```tsx
import { SwipeActions, SwipeActionIcons } from '@/components/mobile';

const rightActions = [
  {
    id: 'delete',
    label: 'Delete',
    icon: SwipeActionIcons.Delete,
    color: 'red',
    onAction: () => handleDelete(),
  },
];

<SwipeActions rightActions={rightActions}>
  <div>List item content</div>
</SwipeActions>
```

**Props:**
- `leftActions`: Actions revealed when swiping right
- `rightActions`: Actions revealed when swiping left
- `threshold`: Distance to trigger action (default: 80px)

### BottomSheet

Mobile-friendly modal that slides up from the bottom.

```tsx
import { BottomSheet } from '@/components/mobile';

<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Details"
  snapPoints={['peek', 'half', 'full']}
  initialSnap="peek"
>
  {/* Content */}
</BottomSheet>
```

**Props:**
- `snapPoints`: Array of snap positions
- `initialSnap`: Starting position
- `showHandle`: Show drag handle
- `showClose`: Show close button
- `backdrop`: Show backdrop overlay

**Snap Points:**
- `peek`: 20% of screen
- `half`: 50% of screen
- `full`: 90% of screen
- `closed`: 0% (closed)

### FloatingActionButton

Floating action button for quick actions.

```tsx
import { FloatingActionButton } from '@/components/mobile';

const actions = [
  {
    id: 'new-invoice',
    label: 'New Invoice',
    icon: <FileText />,
    onClick: () => navigate('/invoices/new'),
  },
];

<FloatingActionButton
  actions={actions}
  position="bottom-right"
  size="md"
/>
```

**Props:**
- `actions`: Array of quick actions
- `mainAction`: Action when no sub-actions
- `position`: 'bottom-right' | 'bottom-left' | 'bottom-center'
- `size`: 'sm' | 'md' | 'lg'

## 4. Haptic Feedback (`use-haptic`)

Provides tactile feedback for user interactions.

```tsx
import { useHaptic } from '@/hooks/use-haptic';

const haptic = useHaptic();

// Use predefined patterns
haptic.success();  // Success - double tap
haptic.error();    // Error - strong double pulse
haptic.warning();  // Warning - triple tap
haptic.selection(); // Selection - light tap

// Or use custom patterns
haptic.vibrate([10, 50, 10]); // Custom pattern
```

**Available Patterns:**
- `success`: Double tap
- `error`: Strong double pulse
- `warning`: Triple tap
- `selection`: Light tap
- `light`: 10ms
- `medium`: 30ms
- `heavy`: 50ms

## 5. Offline Indicator

Automatically shows when user goes offline.

The `OfflineIndicator` component is added to the root layout and will:
- Show a banner when offline
- Display pending sync count
- Auto-dismiss when back online
- Show reconnection message

No setup required - it's automatically included.

## 6. Touch Optimizations

Added CSS optimizations for better touch interactions:

- **Touch Action**: Prevents double-tap zoom on interactive elements
- **Tap Targets**: Minimum 44x44px for buttons on mobile
- **Active States**: Visual feedback on touch
- **Safe Areas**: Supports iOS safe area insets
- **Smooth Scrolling**: -webkit-overflow-scrolling for iOS

## Updated Metadata

### Viewport

```tsx
viewport: {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Support notches
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
}
```

### Format Detection

Disabled automatic detection for better control:

```tsx
formatDetection: {
  telephone: false,
  date: false,
  address: false,
  email: false,
}
```

## Service Worker

The service worker is automatically generated by Next.js with Workbox and includes:

- **Cache First**: Static assets (images, fonts, styles)
- **Network First**: API calls with fallback
- **Stale While Revalidate**: JavaScript, CSS
- **Offline Fallback**: Custom offline page

## Testing

### Test PWA Features

1. **Install Prompt**: Wait 3 seconds after page load (non-auth pages)
2. **Pull to Refresh**: Pull down on any scrollable container
3. **Swipe Actions**: Swipe left/right on list items
4. **Bottom Sheet**: Drag handle to change snap points
5. **Haptic Feedback**: Test on mobile device (not in browser)
6. **Offline Mode**: Turn off network in DevTools

### Mobile Testing

Test on actual devices for best results:

- iOS Safari
- Android Chrome
- PWA installed mode

## Browser Support

- **iOS Safari**: 13+
- **Android Chrome**: 80+
- **Desktop Chrome**: Latest
- **Desktop Safari**: Latest
- **Firefox**: Latest

## Performance

All components use:

- Passive event listeners where possible
- RequestAnimationFrame for smooth animations
- Will-change for transform properties
- Optimized re-renders with proper dependencies

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Focus management in modals
- Reduced motion support

## Future Enhancements

Potential additions:

- Background sync for offline actions
- Push notifications
- Periodic background sync
- Badge API for unread counts
- Web Share API (already added as Share Target)
- Installation analytics
