import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'guru.operate.app',
  appName: 'Operate',
  webDir: 'out', // Static export directory (for fallback only)
  server: {
    // Production: Load from live server (keeps all Next.js features)
    // Development: Load from local dev server
    url: process.env.CAPACITOR_DEV === 'true'
      ? 'http://localhost:3000'
      : 'https://operate.guru',
    cleartext: process.env.CAPACITOR_DEV === 'true',
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
