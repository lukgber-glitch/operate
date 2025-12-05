import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeletonGrid } from './CardSkeleton';
import { TableSkeleton } from './TableSkeleton';

/**
 * Full page loading state with spinner
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Inline loading spinner
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
  };

  return (
    <div
      className={`animate-spin rounded-full border-b-primary ${sizeClasses[size]} ${className}`}
    />
  );
}

/**
 * Page skeleton with header and stats
 */
export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      {/* Stats cards */}
      <CardSkeletonGrid count={4} variant="stat" />

      {/* Table section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-[150px]" />
        <TableSkeleton rows={8} columns={5} />
      </div>
    </div>
  );
}

/**
 * Form page skeleton
 */
export function FormPageSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
    </div>
  );
}
