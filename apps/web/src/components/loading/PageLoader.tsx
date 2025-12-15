import { Skeleton } from '@/components/ui/skeleton';
import { GuruLoader } from '@/components/ui/guru-loader';
import { CardSkeletonGrid } from './CardSkeleton';
import { TableSkeleton } from './TableSkeleton';

/**
 * Full page loading state with animated guru logo
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="mx-auto">
          <GuruLoader size={80} />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Inline loading spinner - uses guru logo
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 60,
  };

  return (
    <div className={className}>
      <GuruLoader size={sizeMap[size]} />
    </div>
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
