'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrialCountdownProps {
  daysRemaining: number;
  isUrgent?: boolean;
  className?: string;
}

/**
 * Visual countdown timer showing days/hours remaining in trial
 * Uses GSAP for smooth number transitions
 */
export function TrialCountdown({
  daysRemaining,
  isUrgent = false,
  className,
}: TrialCountdownProps) {
  const daysRef = useRef<HTMLSpanElement>(null);
  const hoursRef = useRef<HTMLSpanElement>(null);

  // Calculate hours remaining in the current day
  const now = new Date();
  const hoursRemaining = 23 - now.getHours();

  useEffect(() => {
    // Animate number changes with GSAP
    if (daysRef.current) {
      gsap.fromTo(
        daysRef.current,
        { scale: 1.2, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [daysRemaining]);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all',
        isUrgent
          ? 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        className
      )}
    >
      <Clock
        className={cn(
          'h-4 w-4',
          isUrgent && 'animate-pulse'
        )}
      />
      <div className="flex items-baseline gap-1">
        <span
          ref={daysRef}
          className="text-2xl font-bold tabular-nums"
        >
          {daysRemaining}
        </span>
        <span className="text-sm">
          {daysRemaining === 1 ? 'day' : 'days'}
        </span>
        {daysRemaining > 0 && (
          <>
            <span className="mx-1 text-sm opacity-60">&</span>
            <span
              ref={hoursRef}
              className="text-lg font-semibold tabular-nums"
            >
              {hoursRemaining}
            </span>
            <span className="text-sm">
              {hoursRemaining === 1 ? 'hour' : 'hours'}
            </span>
          </>
        )}
        <span className="ml-1 text-sm opacity-80">left</span>
      </div>
    </div>
  );
}
