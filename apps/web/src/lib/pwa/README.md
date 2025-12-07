# PWA Utilities

This directory contains utilities for working with Progressive Web App (PWA) features in the Operate web application.

## Files

- **`environment.ts`** - Environment and platform detection utilities
- **`index.ts`** - Barrel export file

## Usage

### Detecting Environment

```typescript
import {
  isCapacitor,
  isPWA,
  shouldEnablePWA,
  getEnvironmentType,
  getPlatformInfo
} from '@/lib/pwa';

// Check if running in Capacitor native app
if (isCapacitor()) {
  console.log('Running in native app');
}

// Check if installed as PWA
if (isPWA()) {
  console.log('Running as installed PWA');
}

// Check if PWA features should be enabled
if (shouldEnablePWA()) {
  console.log('PWA features are enabled');
}

// Get environment type
const envType = getEnvironmentType(); // 'native' | 'pwa' | 'web' | 'development'

// Get full platform info
const info = getPlatformInfo();
console.log(info);
// {
//   platform: 'web' | 'ios' | 'android',
//   isCapacitor: false,
//   isPWA: false,
//   environmentType: 'web',
//   supportsServiceWorker: true
// }
```

### Debug Logging

```typescript
import { logEnvironmentInfo } from '@/lib/pwa';

// Log environment information to console
// Useful for debugging PWA/Capacitor issues
logEnvironmentInfo();
```

## Environment Types

| Type | Description | Service Worker | Use Case |
|------|-------------|----------------|----------|
| `development` | Local development | Disabled | Development |
| `native` | Capacitor iOS/Android | Disabled | Mobile app |
| `pwa` | Installed web app | Enabled | Installed PWA |
| `web` | Browser | Enabled | Website |

## Platform Detection

### Capacitor

```typescript
if (isCapacitor()) {
  // Use native APIs
  import { Camera } from '@capacitor/camera';
  // ...
}
```

### PWA

```typescript
if (isPWA()) {
  // Show PWA-specific UI
  // e.g., "Add to home screen" prompt
}
```

### Service Worker

```typescript
if (shouldEnablePWA()) {
  // Service worker is active
  // Safe to use cache APIs
}
```

## Best Practices

1. **Always check environment before using platform-specific APIs**
   ```typescript
   // Good
   if (isCapacitor()) {
     const { Camera } = await import('@capacitor/camera');
     // Use Camera API
   }

   // Bad - will fail in browser
   const { Camera } = await import('@capacitor/camera');
   ```

2. **Use feature detection for optional features**
   ```typescript
   if ('serviceWorker' in navigator) {
     // Use service worker
   }
   ```

3. **Graceful degradation**
   ```typescript
   async function takePhoto() {
     if (isCapacitor()) {
       // Use native camera
       const { Camera } = await import('@capacitor/camera');
       return Camera.getPhoto();
     } else {
       // Fall back to web API
       return navigator.mediaDevices.getUserMedia({ video: true });
     }
   }
   ```

## Service Worker Behavior

The service worker is automatically configured based on environment:

- **Development**: Disabled (faster development)
- **Capacitor**: Disabled (native handles offline)
- **Web/PWA**: Enabled (provides offline capabilities)

Configuration is in `next.config.js`:
```javascript
disable: process.env.NODE_ENV === 'development' ||
         process.env.NEXT_PUBLIC_IS_CAPACITOR === 'true'
```

## Related Documentation

- [PWA Configuration](../../../PWA_CONFIGURATION.md) - Full PWA setup guide
- [Capacitor Integration](../../../capacitor.config.ts) - Native app config
- [Service Worker](../../../next.config.js) - SW configuration

## Troubleshooting

### Service Worker Not Working

```typescript
import { shouldEnablePWA, logEnvironmentInfo } from '@/lib/pwa';

// Debug why SW isn't working
logEnvironmentInfo();
console.log('Should enable PWA?', shouldEnablePWA());
```

### Wrong Environment Detected

Check environment variables:
```bash
# For native builds
NEXT_PUBLIC_IS_CAPACITOR=true pnpm build

# For web builds (default)
pnpm build
```

### Platform-Specific Issues

```typescript
const info = getPlatformInfo();
console.log('Debug info:', info);

// Send to error tracking
if (window.Sentry) {
  window.Sentry.setContext('platform', info);
}
```
