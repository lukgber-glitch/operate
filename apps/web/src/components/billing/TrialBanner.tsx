'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TrialBannerProps {
  daysRemaining: number;
  totalTrialDays?: number;
  isUrgent?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Persistent banner showing trial status with progress bar
 * Includes pulsing animation for urgent state (<=3 days)
 */
export function TrialBanner({
  daysRemaining,
  totalTrialDays = 14,
  isUrgent = false,
  onDismiss,
  className,
}: TrialBannerProps) {
  const router = useRouter();
  const bannerRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  // Calculate progress (inverse - starts at 100% and decreases)
  const daysElapsed = totalTrialDays - daysRemaining;
  const progressPercent = (daysElapsed / totalTrialDays) * 100;

  useEffect(() => {
    if (isUrgent && pulseRef.current) {
      // Pulse animation for urgent state
      gsap.to(pulseRef.current, {
        scale: 1.02,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    }

    return () => {
      gsap.killTweensOf(pulseRef.current);
    };
  }, [isUrgent]);

  const handleUpgrade = () => {
    router.push('/settings?tab=billing');
  };

  return (
    <div
      ref={bannerRef}
      className={cn(
        'relative mb-4 overflow-hidden rounded-xl border shadow-sm transition-all',
        isUrgent
          ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:border-orange-800 dark:from-orange-950 dark:to-amber-950'
          : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950',
        className
      )}
    >
      <div ref={pulseRef} className="relative">
        {/* Progress bar at top */}
        <Progress
          value={progressPercent}
          className={cn(
            'h-1 rounded-none',
            isUrgent
              ? 'bg-orange-100 dark:bg-orange-900'
              : 'bg-blue-100 dark:bg-blue-900'
          )}
          indicatorClassName={cn(
            isUrgent
              ? 'bg-gradient-to-r from-orange-400 to-red-500'
              : 'bg-gradient-to-r from-blue-400 to-indigo-500'
          )}
        />

        <div className="flex items-center justify-between gap-4 p-4">
          {/* Left: Icon + Message */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                isUrgent
                  ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
              )}
            >
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p
                className={cn(
                  'font-semibold',
                  isUrgent
                    ? 'text-orange-900 dark:text-orange-100'
                    : 'text-blue-900 dark:text-blue-100'
                )}
              >
                {isUrgent ? (
                  <>
                    <span className="text-lg">Only {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left</span> in your Pro trial!
                  </>
                ) : (
                  <>
                    <span className="text-lg">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</span> in your Pro trial
                  </>
                )}
              </p>
              <p
                className={cn(
                  'text-sm',
                  isUrgent
                    ? 'text-orange-700 dark:text-orange-300'
                    : 'text-blue-700 dark:text-blue-300'
                )}
              >
                {isUrgent
                  ? 'Upgrade now to keep all your Pro features'
                  : 'Enjoying Pro features? Upgrade to keep them forever'}
              </p>
            </div>
          </div>

          {/* Right: CTA + Dismiss */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpgrade}
              variant="primary"
              className={cn(
                'group shadow-md transition-all hover:shadow-lg',
                isUrgent &&
                  'animate-pulse bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              )}
            >
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  isUrgent
                    ? 'text-orange-600 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900'
                    : 'text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900'
                )}
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
