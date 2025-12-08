'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

interface NativeContextValue {
  isNativeReady: boolean;
  pushToken: string | null;
  registerPushNotifications: () => Promise<void>;
}

const NativeContext = createContext<NativeContextValue>({
  isNativeReady: false,
  pushToken: null,
  registerPushNotifications: async () => {},
});

export function useNative() {
  return useContext(NativeContext);
}

interface NativeProviderProps {
  children: React.ReactNode;
}

export function NativeProvider({ children }: NativeProviderProps) {
  const [isNativeReady, setIsNativeReady] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();

  const isNative = Capacitor.isNativePlatform();

  // Initialize native plugins
  useEffect(() => {
    if (!isNative) {
      setIsNativeReady(true);
      return;
    }

    const initializeNativePlugins = async () => {
      try {
        // Hide splash screen
        await SplashScreen.hide();

        // Set status bar style based on theme
        await initializeStatusBar();

        // Set up deep link handling
        await setupDeepLinks();

        // Set up back button handling (Android)
        await setupBackButton();

        setIsNativeReady(true);
      } catch (error) {        setIsNativeReady(true); // Continue anyway
      }
    };

    initializeNativePlugins();
  }, [isNative]);

  // Update status bar when theme changes
  useEffect(() => {
    if (!isNative) return;

    const updateStatusBar = async () => {
      try {
        await StatusBar.setStyle({
          style: theme === 'dark' ? Style.Dark : Style.Light,
        });
      } catch (error) {      }
    };

    updateStatusBar();
  }, [theme, isNative]);

  const initializeStatusBar = async () => {
    try {
      // Set status bar color to match app theme
      await StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#000000' : '#ffffff' });
      await StatusBar.setStyle({
        style: theme === 'dark' ? Style.Dark : Style.Light,
      });

      // Show status bar (in case it was hidden)
      await StatusBar.show();
    } catch (error) {    }
  };

  const setupDeepLinks = async () => {
    try {
      App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        // Handle deep links
        const url = new URL(event.url);
        const pathname = url.pathname;

        if (pathname) {
          // Navigate to the path
          router.push(pathname);
        }
      });
    } catch (error) {    }
  };

  const setupBackButton = async () => {
    try {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          // On Android, exit app if can't go back
          App.exitApp();
        } else {
          // Let the browser handle back navigation
          window.history.back();
        }
      });
    } catch (error) {    }
  };

  const registerPushNotifications = async () => {
    if (!isNative) {      return;
    }

    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();

      if (permResult.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();

        // Add listeners
        PushNotifications.addListener('registration', (token: Token) => {          setPushToken(token.value);

          // TODO: Send token to backend
          // await fetch('/api/user/push-token', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ token: token.value }),
          // });
        });

        PushNotifications.addListener('registrationError', (error: any) => {        });

        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {          // Handle notification when app is in foreground
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {          // Handle notification tap
          const data = notification.notification.data;
          if (data?.route) {
            router.push(data.route);
          }
        });
      } else {      }
    } catch (error) {    }
  };

  const contextValue: NativeContextValue = {
    isNativeReady,
    pushToken,
    registerPushNotifications,
  };

  return (
    <NativeContext.Provider value={contextValue}>
      {children}
    </NativeContext.Provider>
  );
}
