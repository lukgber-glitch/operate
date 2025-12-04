import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CardSkeletonProps {
  showHeader?: boolean;
  lines?: number;
}

/**
 * Skeleton loader for stat cards and info cards
 */
export function CardSkeleton({ showHeader = true, lines = 3 }: CardSkeletonProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-5 w-[140px]" />
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-4 ${i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'}`}
          />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for stat cards with metric display
 */
export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[120px] mb-2" />
        <Skeleton className="h-3 w-[160px]" />
      </CardContent>
    </Card>
  );
}

/**
 * Grid of card skeletons
 */
interface CardSkeletonGridProps {
  count?: number;
  variant?: 'default' | 'stat';
}

export function CardSkeletonGrid({ count = 4, variant = 'stat' }: CardSkeletonGridProps) {
  const SkeletonComponent = variant === 'stat' ? StatCardSkeleton : CardSkeleton;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
