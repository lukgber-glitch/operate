import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'guru.operate.app',
  appName: 'Operate',
  webDir: '.next', // Next.js build output directory
  server: {
    // For development - allows hot reload from local dev server
    url: process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : undefined,
    cleartext: process.env.NODE_ENV === 'development',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false, // We'll hide it manually in NativeProvider
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT', // Can be LIGHT, DARK, or DEFAULT
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body' as any, // Type issue with Capacitor, works at runtime
      style: 'DARK' as any, // Type issue with Capacitor, works at runtime
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'Operate',
    contentInset: 'automatic',
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set during production builds
      keystoreAlias: undefined,
    },
    allowMixedContent: false,
  },
};

// Note: Service Worker is automatically disabled in native builds
// via NEXT_PUBLIC_IS_CAPACITOR environment variable set during native build
// See next.config.js for PWA configuration

export default config;
