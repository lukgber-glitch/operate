/**
 * Generic loading skeleton component
 * Used as fallback for lazy-loaded components
 */

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  height?: string | number;
  variant?: 'card' | 'text' | 'circle' | 'rectangle';
}

export function LoadingSkeleton({
  className,
  height = 200,
  variant = 'rectangle'
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-800';

  const variantClasses = {
    card: 'rounded-lg',
    text: 'rounded h-4',
    circle: 'rounded-full',
    rectangle: 'rounded',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      aria-label="Loading..."
      role="status"
    />
  );
}

// Skeleton for text content
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          variant="text"
          className={cn(
            i === lines - 1 && 'w-2/3' // Last line shorter
          )}
        />
      ))}
    </div>
  );
}

// Skeleton for card content
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-4">
      <div className="space-y-2">
        <LoadingSkeleton variant="text" className="w-1/3" />
        <LoadingSkeleton variant="text" className="w-1/2" />
      </div>
      <LoadingSkeleton height={150} variant="card" />
      <TextSkeleton lines={2} />
    </div>
  );
}
