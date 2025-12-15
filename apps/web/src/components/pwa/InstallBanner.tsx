'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Zap, CloudOff, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Install Banner Component
 *
 * A more prominent install prompt that appears at the top of the page
 * for mobile users who haven't installed the app yet.
 *
 * This is different from InstallPrompt which is a bottom banner.
 * Use this for key pages like dashboard or after onboarding.
 */
export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(mobile);
    };

    checkMobile();

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-banner-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissal = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissal < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install');
    } else {
      console.log('[PWA] User dismissed the install');
      localStorage.setItem('pwa-install-banner-dismissed', new Date().toISOString());
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-banner-dismissed', new Date().toISOString());
  };

  // Don't show if not mobile, already installed, or no prompt available
  if (!isMobile || isInstalled || !showBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 animate-in slide-in-from-top-2">
      <Card className="rounded-none border-x-0 border-t-0 shadow-md">
        <div className="relative p-4">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="pr-8">
            {/* Icon and title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 rounded-full bg-primary/10 p-2.5">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Install Operate</h3>
                <p className="text-xs text-muted-foreground">
                  Get the full app experience
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CloudOff className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span>Offline access</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Zap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Faster loading</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Bell className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                <span>Notifications</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Smartphone className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
                <span>Native feel</span>
              </div>
            </div>

            {/* Install button */}
            <Button
              onClick={handleInstall}
              className="w-full gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Install App
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
