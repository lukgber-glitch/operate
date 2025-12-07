'use client';

import { AlertCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'ai-disclaimer-dismissed';
const DISMISSAL_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export function AIDisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);

    if (!dismissedAt) {
      setIsVisible(true);
      return;
    }

    const dismissalTime = parseInt(dismissedAt, 10);
    const now = Date.now();

    // Show again if 30 days have passed
    if (now - dismissalTime > DISMISSAL_DURATION) {
      setIsVisible(true);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 animate-slide-in-down"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            AI responses are for <strong>informational purposes only</strong> and do not constitute
            professional financial, tax, or legal advice. Always consult qualified professionals
            for important decisions.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-8 w-8 flex-shrink-0 text-amber-600 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-500 dark:hover:text-amber-300 dark:hover:bg-amber-900/50"
          aria-label="Dismiss AI disclaimer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
