'use client';

import { useEffect, useRef, useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';

interface UsageBannerProps {
  percentage: number;
  used: number;
  limit: number;
  resourceType: 'AI messages' | 'bank connections' | 'invoices';
  onDismiss?: () => void;
  className?: string;
}

/**
 * Soft banner that slides in from top at 80% usage
 * Shows: "You've used 80% of your AI messages this month. Upgrade for unlimited."
 * GSAP animation: slideDown from top
 */
export function UsageBanner({
  percentage,
  used,
  limit,
  resourceType,
  onDismiss,
  className,
}: UsageBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if banner was dismissed today
    const dismissalKey = `usage-banner-dismissed-${resourceType}`;
    const lastDismissed = localStorage.getItem(dismissalKey);
    const today = new Date().toDateString();

    if (lastDismissed === today) {
      setIsDismissed(true);
      return;
    }

    // Animate banner slide-in from top
    if (bannerRef.current && !isDismissed) {
      gsap.fromTo(
        bannerRef.current,
        {
          y: -100,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
        }
      );
    }
  }, [isDismissed, resourceType]);

  const handleDismiss = () => {
    if (bannerRef.current) {
      // Animate slide-out
      gsap.to(bannerRef.current, {
        y: -100,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setIsDismissed(true);
          // Store dismissal in localStorage
          const dismissalKey = `usage-banner-dismissed-${resourceType}`;
          const today = new Date().toDateString();
          localStorage.setItem(dismissalKey, today);
          onDismiss?.();
        },
      });
    }
  };

  const handleUpgrade = () => {
    router.push('/settings/billing');
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      ref={bannerRef}
      className={cn(
        'mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-md',
        'dark:border-amber-800 dark:bg-amber-950',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            You've used {Math.round(percentage)}% of your {resourceType} this month
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {used} of {limit} {resourceType} used. Upgrade for unlimited access and
            unlock more features.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleUpgrade}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Upgrade
          </Button>
          <button
            onClick={handleDismiss}
            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            aria-label="Dismiss banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
