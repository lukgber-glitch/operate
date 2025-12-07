# Capacitor Mobile App Setup

This document explains how to build and deploy the Operate app for iOS and Android using Capacitor.

## Overview

Capacitor has been initialized and configured for the Operate Next.js app. The configuration allows the web app to run natively on iOS and Android devices.

## Prerequisites

### For iOS Development
- macOS with Xcode 14+ installed
- Xcode Command Line Tools
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer account (for distribution)

### For Android Development
- Android Studio
- Android SDK (API Level 33+)
- Java Development Kit (JDK 17+)
- Gradle (installed via Android Studio)

## Configuration

The Capacitor configuration is in `capacitor.config.ts`:

```typescript
{
  appId: 'guru.operate.app',
  appName: 'Operate',
  webDir: '.next',  // Next.js build output
  server: {
    url: 'http://localhost:3000',  // Dev mode only
    cleartext: true  // Dev mode only
  }
}
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `pnpm cap:add:ios` | `cap add ios` | Add iOS platform (requires macOS) |
| `pnpm cap:add:android` | `cap add android` | Add Android platform |
| `pnpm cap:sync` | `cap sync` | Sync web assets to native projects |
| `pnpm cap:sync:ios` | `cap sync ios` | Sync only iOS |
| `pnpm cap:sync:android` | `cap sync android` | Sync only Android |
| `pnpm cap:open:ios` | `cap open ios` | Open iOS project in Xcode |
| `pnpm cap:open:android` | `cap open android` | Open Android project in Android Studio |
| `pnpm cap:copy` | `cap copy` | Copy web assets without updating native dependencies |
| `pnpm cap:update` | `cap update` | Update Capacitor dependencies |

## Setup Steps

### 1. Build the Web App

Always build the web app before syncing to native platforms:

```bash
pnpm build
```

### 2. Add Native Platforms

#### iOS (macOS only)
```bash
pnpm cap:add:ios
```

#### Android
```bash
pnpm cap:add:android
```

This will create `ios/` and `android/` directories with native project files.

### 3. Sync Web Assets

After building, sync the assets to native projects:

```bash
pnpm cap:sync
```

Or sync individual platforms:
```bash
pnpm cap:sync:ios
pnpm cap:sync:android
```

### 4. Open in Native IDE

#### iOS - Xcode
```bash
pnpm cap:open:ios
```

Then in Xcode:
1. Select a development team
2. Configure signing certificates
3. Choose a simulator or connected device
4. Click Run

#### Android - Android Studio
```bash
pnpm cap:open:android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Configure signing keys (for release builds)
3. Choose an emulator or connected device
4. Click Run

## Development Workflow

### Testing on Device During Development

You can test the live development server on a real device:

1. Start the dev server:
```bash
pnpm dev
```

2. Update `capacitor.config.ts` with your local IP:
```typescript
server: {
  url: 'http://192.168.1.x:3000',  // Replace with your IP
  cleartext: true
}
```

3. Sync and run:
```bash
pnpm cap:sync
pnpm cap:open:ios  # or android
```

### Regular Development Workflow

1. Make changes to web code
2. Test in browser (`pnpm dev`)
3. Build for production (`pnpm build`)
4. Sync to native platforms (`pnpm cap:sync`)
5. Test in native IDE

## Production Build

### iOS Production Build

1. Build web app:
```bash
pnpm build
```

2. Remove development server config from `capacitor.config.ts`:
```typescript
server: {
  url: undefined,  // Production doesn't use dev server
}
```

3. Sync to iOS:
```bash
pnpm cap:sync:ios
```

4. Open in Xcode:
```bash
pnpm cap:open:ios
```

5. In Xcode:
   - Select "Any iOS Device" as target
   - Product → Archive
   - Follow distribution workflow

### Android Production Build

1. Build web app:
```bash
pnpm build
```

2. Remove development server config from `capacitor.config.ts`

3. Sync to Android:
```bash
pnpm cap:sync:android
```

4. Open in Android Studio:
```bash
pnpm cap:open:android
```

5. In Android Studio:
   - Build → Generate Signed Bundle / APK
   - Follow the signing wizard
   - Choose release variant

## Common Plugins

You may need to install these Capacitor plugins:

```bash
# Status Bar
pnpm add @capacitor/status-bar

# Splash Screen
pnpm add @capacitor/splash-screen

# Keyboard
pnpm add @capacitor/keyboard

# App (deep linking, state management)
pnpm add @capacitor/app

# Browser (in-app browser)
pnpm add @capacitor/browser

# Haptics (vibration feedback)
pnpm add @capacitor/haptics

# Network (connectivity status)
pnpm add @capacitor/network
```

After installing plugins, run `pnpm cap:sync` to update native projects.

## Troubleshooting

### iOS

**Build fails with CocoaPods error**
```bash
cd ios/App
pod install --repo-update
```

**Certificate/Signing errors**
- Ensure you're logged into Xcode with an Apple Developer account
- Check signing settings in Xcode project settings

### Android

**Gradle sync fails**
- Check that JDK 17+ is installed
- Invalidate caches in Android Studio (File → Invalidate Caches)
- Check `android/build.gradle` for version compatibility

**App crashes on launch**
- Check Android logs in Android Studio
- Ensure web build completed successfully
- Verify `capacitor.config.ts` webDir points to `.next`

### General

**Changes not appearing in app**
1. Rebuild web app: `pnpm build`
2. Sync to native: `pnpm cap:sync`
3. Clean native build (Xcode: Product → Clean, Android Studio: Build → Clean Project)
4. Rebuild native app

## Environment Variables

For production builds, ensure environment variables are set:

```bash
# Web app environment
NEXT_PUBLIC_API_URL=https://operate.guru/api/v1
NEXT_PUBLIC_WS_URL=wss://operate.guru

# Build the app
pnpm build

# Sync to native
pnpm cap:sync
```

## SSL Certificate Pinning

The app includes SSL certificate pinning for production security. See `src/lib/security/ssl-pinning.ts` for configuration.

Before deploying to production:
1. Generate actual certificate pins from operate.guru SSL certificate
2. Update `CERTIFICATE_PINS` in `ssl-pinning.ts`
3. Rebuild and sync

## Next Steps

1. Add desired Capacitor plugins
2. Configure app icons and splash screens
3. Set up push notifications (if needed)
4. Configure deep linking
5. Test on real devices
6. Submit to App Store / Google Play

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Next.js with Capacitor](https://capacitorjs.com/docs/guides/nextjs)
- [iOS App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
