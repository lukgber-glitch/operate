import { cn } from '@/lib/utils';

/**
 * Skeleton - Base skeleton loading component
 *
 * Usage:
 * - Provides animated pulse effect
 * - Can be composed for complex layouts
 * - Customizable via className
 *
 * @example
 * <Skeleton className="h-4 w-full" />
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
