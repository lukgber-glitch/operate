import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentUploadSkeleton } from '@/components/loading';

/**
 * Loading state for the document upload page
 */
export default function DocumentUploadLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[350px] mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <DocumentUploadSkeleton />

          {/* Document Details Form Skeleton */}
          <Card className="rounded-[24px]">
            <CardHeader>
              <Skeleton className="h-5 w-[150px] mb-2" />
              <Skeleton className="h-4 w-[280px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Allowed File Types */}
          <Card className="rounded-[24px]">
            <CardHeader>
              <Skeleton className="h-5 w-[140px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-0.5" />
                  <div>
                    <Skeleton className="h-4 w-[120px] mb-1" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card className="rounded-[24px]">
            <CardHeader>
              <Skeleton className="h-5 w-[120px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Skeleton className="h-4 w-4 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-full mb-2" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-[60px] rounded-full" />
                        <Skeleton className="h-3 w-[40px]" />
                      </div>
                      <Skeleton className="h-3 w-[100px] mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
