'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton for document grid item
 */
export function DocumentCardSkeleton() {
  return (
    <Card className="rounded-[16px]">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for document list row
 */
export function DocumentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0">
      <Skeleton className="h-10 w-10 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

/**
 * Skeleton for document grid
 */
interface DocumentGridSkeletonProps {
  count?: number;
}

export function DocumentGridSkeleton({ count = 8 }: DocumentGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for document list
 */
interface DocumentListSkeletonProps {
  rows?: number;
}

export function DocumentListSkeleton({ rows = 5 }: DocumentListSkeletonProps) {
  return (
    <Card className="rounded-[16px]">
      <CardContent className="p-0">
        <div className="divide-y">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 bg-muted/50">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <DocumentRowSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for folder sidebar
 */
export function FolderSidebarSkeleton() {
  return (
    <Card className="rounded-[16px]">
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-[1px] w-full my-2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Complete documents page skeleton
 */
export function DocumentsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[120px] rounded-md" />
          <Skeleton className="h-10 w-[160px] rounded-md" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <FolderSidebarSkeleton />
        </aside>

        {/* Main */}
        <div className="flex-1 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[140px] rounded-md" />
              <Skeleton className="h-10 w-[130px] rounded-md" />
              <Skeleton className="h-10 w-[80px] rounded-md" />
            </div>
          </div>

          {/* Count */}
          <Skeleton className="h-4 w-[200px]" />

          {/* Grid */}
          <DocumentGridSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for document upload area
 */
export function DocumentUploadSkeleton() {
  return (
    <Card className="rounded-[16px]">
      <CardContent className="p-6">
        <div className="border-2 border-dashed rounded-lg p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-5 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for upload progress item
 */
export function UploadProgressSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton className="h-4 w-4 rounded-full" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}
