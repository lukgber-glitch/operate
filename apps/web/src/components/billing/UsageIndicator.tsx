'use client';

import { cn } from '@/lib/utils';

interface UsageIndicatorProps {
  label: string;
  used: number;
  limit: number;
  percentage: number;
  className?: string;
}

/**
 * Small progress bar showing current usage
 * Color changes: green → yellow → red based on percentage
 */
export function UsageIndicator({
  label,
  used,
  limit,
  percentage,
  className,
}: UsageIndicatorProps) {
  // Determine color based on percentage
  const getColorClasses = () => {
    if (percentage >= 100) {
      return {
        bar: 'bg-red-500',
        text: 'text-red-600',
        bg: 'bg-red-50',
      };
    } else if (percentage >= 80) {
      return {
        bar: 'bg-amber-500',
        text: 'text-amber-600',
        bg: 'bg-amber-50',
      };
    } else {
      return {
        bar: 'bg-[var(--color-success)]',
        text: 'text-green-600',
        bg: 'bg-green-50',
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and Stats */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </span>
        <span className={cn('text-xs font-semibold', colors.text)}>
          {used} / {limit === -1 ? 'Unlimited' : limit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colors.bar
          )}
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>

      {/* Percentage Text */}
      {percentage >= 80 && (
        <p className={cn('text-xs', colors.text)}>
          {percentage >= 100
            ? 'Limit reached'
            : `${Math.round(percentage)}% used`}
        </p>
      )}
    </div>
  );
}
