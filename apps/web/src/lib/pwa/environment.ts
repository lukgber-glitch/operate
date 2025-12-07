/**
 * PWA Environment Detection Utilities
 *
 * Helps detect the runtime environment and whether PWA features should be enabled
 */

/**
 * Check if running inside a Capacitor native app
 */
export function isCapacitor(): boolean {
  // Check if Capacitor is available
  if (typeof window === 'undefined') return false;

  return !!(window as any).Capacitor;
}

/**
 * Check if running as a PWA (installed web app)
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check iOS standalone mode
  const isIOSStandalone = (window.navigator as any).standalone === true;

  return isStandalone || isIOSStandalone;
}

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return 'serviceWorker' in navigator;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if PWA features should be enabled
 */
export function shouldEnablePWA(): boolean {
  // Don't enable PWA in development
  if (isDevelopment()) return false;

  // Don't enable PWA in Capacitor (native app handles offline)
  if (isCapacitor()) return false;

  // Enable PWA for web users
  return isServiceWorkerSupported();
}

/**
 * Get the current environment type
 */
export type EnvironmentType = 'native' | 'pwa' | 'web' | 'development';

export function getEnvironmentType(): EnvironmentType {
  if (isDevelopment()) return 'development';
  if (isCapacitor()) return 'native';
  if (isPWA()) return 'pwa';
  return 'web';
}

/**
 * Get platform information
 */
export function getPlatformInfo() {
  if (typeof window === 'undefined') {
    return {
      platform: 'server',
      isCapacitor: false,
      isPWA: false,
      environmentType: 'development' as EnvironmentType,
    };
  }

  return {
    platform: (window as any).Capacitor?.getPlatform?.() || 'web',
    isCapacitor: isCapacitor(),
    isPWA: isPWA(),
    environmentType: getEnvironmentType(),
    supportsServiceWorker: isServiceWorkerSupported(),
  };
}

/**
 * Log environment information (useful for debugging)
 */
export function logEnvironmentInfo() {
  if (typeof window === 'undefined') return;

  const info = getPlatformInfo();

  console.group('🌐 Environment Information');
  console.log('Platform:', info.platform);
  console.log('Environment:', info.environmentType);
  console.log('Is Capacitor:', info.isCapacitor);
  console.log('Is PWA:', info.isPWA);
  console.log('Service Worker Support:', info.supportsServiceWorker);
  console.log('PWA Enabled:', shouldEnablePWA());
  console.groupEnd();
}
