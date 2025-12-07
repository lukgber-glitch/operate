'use client';

import { Cookie, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'cookie-consent';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always true, cannot be disabled
  functional: false,
  analytics: false,
  marketing: false,
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      preferences: prefs,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
    setShowCustomize(false);

    // Apply cookie preferences (would integrate with actual analytics/marketing tools)
    if (window.gtag && !prefs.analytics) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const rejectNonEssential = () => {
    savePreferences(defaultPreferences);
  };

  const openCustomize = () => {
    setShowCustomize(true);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner && !showCustomize) return null;

  return (
    <>
      {/* Main Cookie Banner */}
      {showBanner && !showCustomize && (
        <div
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg animate-slide-in-up"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Icon and Message */}
              <div className="flex items-start gap-3 flex-1">
                <div className="rounded-full bg-[#06BF9D]/10 p-2 flex-shrink-0">
                  <Cookie className="h-5 w-5 text-[#06BF9D]" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold mb-1">We use cookies</h2>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to improve your experience, analyze site usage, and assist in our
                    marketing efforts. You can customize your preferences or accept all cookies.{' '}
                    <a
                      href="/legal/cookies"
                      className="text-[#06BF9D] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn more
                    </a>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rejectNonEssential}
                  className="flex-1 md:flex-none"
                >
                  Reject Non-Essential
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCustomize}
                  className="flex-1 md:flex-none"
                >
                  <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                  Customize
                </Button>
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="flex-1 md:flex-none bg-[#06BF9D] hover:bg-[#05a889] text-white"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Choose which types of cookies you want to allow. Essential cookies are required
              for the site to function and cannot be disabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/50">
              <Checkbox
                id="necessary"
                checked={true}
                disabled={true}
                aria-describedby="necessary-label"
              />
              <div className="flex-1">
                <label
                  id="necessary-label"
                  htmlFor="necessary"
                  className="text-sm font-medium cursor-not-allowed"
                >
                  Necessary Cookies
                  <span className="ml-2 text-xs text-muted-foreground">(Required)</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Essential for site functionality, including authentication and security.
                </p>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start space-x-3 p-3 rounded-lg border">
              <Checkbox
                id="functional"
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, functional: checked as boolean }))
                }
                aria-describedby="functional-label"
              />
              <div className="flex-1">
                <label
                  id="functional-label"
                  htmlFor="functional"
                  className="text-sm font-medium cursor-pointer"
                >
                  Functional Cookies
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable enhanced features like personalized settings and preferences.
                </p>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start space-x-3 p-3 rounded-lg border">
              <Checkbox
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, analytics: checked as boolean }))
                }
                aria-describedby="analytics-label"
              />
              <div className="flex-1">
                <label
                  id="analytics-label"
                  htmlFor="analytics"
                  className="text-sm font-medium cursor-pointer"
                >
                  Analytics Cookies
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Help us understand how you use our site to improve your experience.
                </p>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start space-x-3 p-3 rounded-lg border">
              <Checkbox
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, marketing: checked as boolean }))
                }
                aria-describedby="marketing-label"
              />
              <div className="flex-1">
                <label
                  id="marketing-label"
                  htmlFor="marketing"
                  className="text-sm font-medium cursor-pointer"
                >
                  Marketing Cookies
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Used to show you relevant ads and measure campaign effectiveness.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCustomize(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveCustomPreferences}
              className="bg-[#06BF9D] hover:bg-[#05a889] text-white"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
