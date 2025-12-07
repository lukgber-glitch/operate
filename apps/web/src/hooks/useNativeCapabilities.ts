import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Network, ConnectionStatus } from '@capacitor/network';

export type Platform = 'web' | 'ios' | 'android';

export interface NativeCapabilities {
  // Platform detection
  isNative: boolean;
  isPWA: boolean;
  isBrowser: boolean;
  platform: Platform;

  // Haptic feedback
  hapticImpact: (style?: ImpactStyle) => Promise<void>;
  hapticNotification: (type?: NotificationType) => Promise<void>;
  hapticSelection: () => Promise<void>;

  // Network status
  networkStatus: ConnectionStatus | null;
  isOnline: boolean;

  // Keyboard
  keyboardVisible: boolean;
  keyboardHeight: number;

  // App state
  isAppActive: boolean;
}

/**
 * Hook to access native capabilities with web fallback
 * Detects if running in native app, PWA, or browser
 */
export function useNativeCapabilities(): NativeCapabilities {
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isAppActive, setIsAppActive] = useState(true);

  // Platform detection
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform() as Platform;
  const isPWA = !isNative && typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
     (window.navigator as any).standalone === true);
  const isBrowser = !isNative && !isPWA;

  // Haptic feedback with web fallback
  const hapticImpact = useCallback(async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isNative) {
      // Web fallback - use vibration API if available
      if ('vibrate' in navigator) {
        const duration = style === ImpactStyle.Light ? 10 :
                        style === ImpactStyle.Medium ? 20 : 30;
        navigator.vibrate(duration);
      }
      return;
    }

    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [isNative]);

  const hapticNotification = useCallback(async (type: NotificationType = NotificationType.Success) => {
    if (!isNative) {
      // Web fallback
      if ('vibrate' in navigator) {
        const pattern = type === NotificationType.Success ? [10, 50, 10] :
                       type === NotificationType.Warning ? [20, 100, 20] :
                       [30, 50, 30, 50, 30];
        navigator.vibrate(pattern);
      }
      return;
    }

    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.warn('Haptic notification failed:', error);
    }
  }, [isNative]);

  const hapticSelection = useCallback(async () => {
    if (!isNative) {
      // Web fallback
      if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }
      return;
    }

    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (error) {
      console.warn('Haptic selection failed:', error);
    }
  }, [isNative]);

  // Network status monitoring
  useEffect(() => {
    if (!isNative) {
      // Web fallback - use navigator.onLine
      const updateOnlineStatus = () => {
        setNetworkStatus({
          connected: navigator.onLine,
          connectionType: navigator.onLine ? 'wifi' : 'none',
        });
      };

      updateOnlineStatus();
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }

    // Native network status
    let isMounted = true;

    const initNetworkStatus = async () => {
      try {
        const status = await Network.getStatus();
        if (isMounted) {
          setNetworkStatus(status);
        }

        Network.addListener('networkStatusChange', (status) => {
          if (isMounted) {
            setNetworkStatus(status);
          }
        });
      } catch (error) {
        console.warn('Failed to initialize network status:', error);
      }
    };

    initNetworkStatus();

    return () => {
      isMounted = false;
      Network.removeAllListeners();
    };
  }, [isNative]);

  // Keyboard monitoring (native only)
  useEffect(() => {
    if (!isNative) return;

    let isMounted = true;

    const handleKeyboardShow = (info: KeyboardInfo) => {
      if (isMounted) {
        setKeyboardVisible(true);
        setKeyboardHeight(info.keyboardHeight);
      }
    };

    const handleKeyboardHide = () => {
      if (isMounted) {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    Keyboard.addListener('keyboardWillShow', handleKeyboardShow);
    Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    Keyboard.addListener('keyboardWillHide', handleKeyboardHide);
    Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return () => {
      isMounted = false;
      Keyboard.removeAllListeners();
    };
  }, [isNative]);

  // App lifecycle monitoring (native only)
  useEffect(() => {
    if (!isNative) {
      // Web fallback - use Page Visibility API
      const handleVisibilityChange = () => {
        setIsAppActive(!document.hidden);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    let isMounted = true;

    const handleAppStateChange = (state: { isActive: boolean }) => {
      if (isMounted) {
        setIsAppActive(state.isActive);
      }
    };

    App.addListener('appStateChange', handleAppStateChange);

    return () => {
      isMounted = false;
      App.removeAllListeners();
    };
  }, [isNative]);

  return {
    isNative,
    isPWA,
    isBrowser,
    platform,
    hapticImpact,
    hapticNotification,
    hapticSelection,
    networkStatus,
    isOnline: networkStatus?.connected ?? true,
    keyboardVisible,
    keyboardHeight,
    isAppActive,
  };
}
