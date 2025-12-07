# Native Capabilities - Capacitor Integration

This document describes the native capabilities integrated into the Operate web app using Capacitor.

## Installed Plugins

All essential Capacitor plugins are installed and configured:

- **@capacitor/app** (v7.1.0) - App lifecycle and back button handling
- **@capacitor/haptics** (v7.0.2) - Haptic feedback (vibrations)
- **@capacitor/keyboard** (v7.0.3) - Keyboard show/hide events
- **@capacitor/status-bar** (v7.0.3) - Status bar styling
- **@capacitor/splash-screen** (v7.0.3) - Splash screen control
- **@capacitor/network** (v7.0.2) - Network status monitoring
- **@capacitor/push-notifications** (v7.0.3) - Push notifications
- **@capgo/capacitor-native-biometric** (v7.6.0) - Biometric auth

## Architecture

### 1. Native Capabilities Hook

**File:** `src/hooks/useNativeCapabilities.ts`

Provides a React hook for accessing native features with automatic web fallback:

```typescript
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';

function MyComponent() {
  const {
    isNative,        // true if running in native app
    isPWA,           // true if running as PWA
    isBrowser,       // true if running in browser
    platform,        // 'ios' | 'android' | 'web'
    hapticImpact,    // Haptic feedback function
    hapticNotification,
    hapticSelection,
    isOnline,        // Network status
    networkStatus,   // Detailed network info
    keyboardVisible, // Keyboard state (native only)
    keyboardHeight,  // Keyboard height in pixels
    isAppActive,     // App foreground/background state
  } = useNativeCapabilities();

  // Use haptics on button click
  const handleClick = async () => {
    await hapticImpact(ImpactStyle.Medium);
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### 2. Native Provider

**File:** `src/providers/NativeProvider.tsx`

Context provider that:
- Initializes native plugins on app start
- Manages splash screen
- Sets up status bar styling (theme-aware)
- Handles deep links
- Manages back button (Android)
- Provides push notification registration

Already integrated into `src/providers/index.tsx`:

```typescript
<QueryProvider>
  <ThemeProvider>
    <NativeProvider>
      {children}
    </NativeProvider>
  </ThemeProvider>
</QueryProvider>
```

### 3. Capacitor Configuration

**File:** `capacitor.config.ts`

Configured with:

```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    launchAutoHide: false,  // Manually hidden in NativeProvider
    backgroundColor: '#ffffff',
  },
  StatusBar: {
    style: 'LIGHT',
    backgroundColor: '#ffffff',
  },
  Keyboard: {
    resize: 'body',
    style: 'DARK',
    resizeOnFullScreen: true,
  },
  PushNotifications: {
    presentationOptions: ['badge', 'sound', 'alert'],
  },
}
```

## Features

### Haptic Feedback

Three types of haptic feedback with web fallback (vibration API):

```typescript
// Impact feedback (light, medium, heavy)
await hapticImpact(ImpactStyle.Medium);

// Notification feedback (success, warning, error)
await hapticNotification(NotificationType.Success);

// Selection feedback (for swipes, picker changes)
await hapticSelection();
```

### Network Status

Real-time network monitoring with web fallback:

```typescript
if (!isOnline) {
  // Show offline UI
  // Queue actions for later
}

if (networkStatus?.connectionType === 'wifi') {
  // Proceed with large download
}
```

### Keyboard Handling

Automatically tracks keyboard visibility and height (native only):

```typescript
<div
  style={{
    paddingBottom: keyboardVisible ? keyboardHeight : 0,
  }}
>
  <input type="text" />
</div>
```

### App Lifecycle

Tracks when app is active/inactive:

```typescript
useEffect(() => {
  if (isAppActive) {
    // Refresh data
  } else {
    // Pause timers, save state
  }
}, [isAppActive]);
```

### Push Notifications

Register for push notifications (native only):

```typescript
import { useNative } from '@/providers/NativeProvider';

function NotificationSettings() {
  const { pushToken, registerPushNotifications } = useNative();

  const enableNotifications = async () => {
    await registerPushNotifications();
    // pushToken will be available after registration
  };

  return (
    <button onClick={enableNotifications}>
      Enable Notifications
    </button>
  );
}
```

### Deep Links

Deep links are automatically handled by NativeProvider:

```typescript
// App will open to the specified route
operate://dashboard
operate://chat
operate://settings
```

### Back Button (Android)

Automatically handled:
- If can go back: Uses `window.history.back()`
- If at root: Exits the app

### Status Bar

Automatically syncs with app theme:
- Light theme: Light status bar
- Dark theme: Dark status bar

## Web Fallback

All features gracefully degrade on web:

| Feature | Native | Web Fallback |
|---------|--------|--------------|
| Haptics | Capacitor Haptics | Vibration API |
| Network | Capacitor Network | navigator.onLine |
| Keyboard | Capacitor Keyboard | N/A (always hidden) |
| App State | Capacitor App | Page Visibility API |
| Push Notifications | FCM/APNS | Not available |
| Deep Links | Custom URL Scheme | Regular URLs |
| Back Button | Hardware back | Browser back |

## Example Usage

See `src/hooks/useNativeCapabilities.example.tsx` for comprehensive examples including:

- Haptic feedback on form validation
- Network-aware API calls
- Keyboard-aware UI adjustments
- Offline mode handling
- Push notification setup

## Testing

### On Web
```bash
pnpm dev
# Navigate to http://localhost:3000
# All features will use web fallbacks
```

### On iOS
```bash
pnpm build
pnpm cap:sync:ios
pnpm cap:open:ios
# Build and run in Xcode
```

### On Android
```bash
pnpm build
pnpm cap:sync:android
pnpm cap:open:android
# Build and run in Android Studio
```

## Platform Detection

The hook automatically detects the environment:

```typescript
const { isNative, isPWA, isBrowser, platform } = useNativeCapabilities();

// isNative: true on iOS/Android
// isPWA: true when installed as PWA
// isBrowser: true when in regular browser
// platform: 'ios' | 'android' | 'web'
```

## Build Status

✅ All plugins installed successfully
✅ TypeScript compilation successful
✅ Next.js build successful (0 errors)
✅ Native capabilities hook created
✅ Native provider integrated
✅ Capacitor config updated
✅ Web fallbacks implemented

## Next Steps

1. **Test on devices** - Run on actual iOS/Android devices
2. **Configure push notifications** - Set up FCM/APNS
3. **Add app icons** - Create iOS and Android app icons
4. **Add splash screens** - Create platform-specific splash screens
5. **Configure signing** - Set up code signing for production builds

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor App Plugin](https://capacitorjs.com/docs/apis/app)
- [Capacitor Haptics Plugin](https://capacitorjs.com/docs/apis/haptics)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
