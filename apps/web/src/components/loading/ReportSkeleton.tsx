'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton for report stat card
 */
export function ReportStatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[100px] mb-2" />
        <Skeleton className="h-3 w-[80px]" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for report stat cards grid
 */
interface ReportStatsSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function ReportStatsSkeleton({ count = 4, columns = 4 }: ReportStatsSkeletonProps) {
  const gridClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-4 ${gridClass[columns]}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ReportStatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for chart area
 */
interface ChartSkeletonProps {
  height?: number;
  showHeader?: boolean;
}

export function ReportChartSkeleton({ height = 350, showHeader = true }: ChartSkeletonProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-5 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
      )}
      <CardContent>
        <div
          className="flex items-center justify-center rounded-lg border bg-muted/30"
          style={{ height: `${height}px` }}
        >
          <div className="space-y-4 text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-3 w-[140px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for report table
 */
interface ReportTableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function ReportTableSkeleton({ rows = 6, columns = 5 }: ReportTableSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[250px]" />
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="pb-3 text-left">
                    <Skeleton className="h-4 w-[80px]" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="py-3">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for financial report
 */
export function FinancialReportSkeleton() {
  return (
    <div className="space-y-6">
      <ReportStatsSkeleton count={4} />
      <ReportChartSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[120px] mb-2" />
            <Skeleton className="h-4 w-[180px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-[140px] mb-2" />
            <Skeleton className="h-4 w-[100px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[160px] mb-2" />
            <Skeleton className="h-4 w-[140px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-[140px] mb-2" />
            <Skeleton className="h-4 w-[100px]" />
          </CardContent>
        </Card>
      </div>
      <ReportTableSkeleton rows={5} columns={5} />
    </div>
  );
}

/**
 * Skeleton for tax report
 */
export function TaxReportSkeleton() {
  return (
    <div className="space-y-6">
      <ReportStatsSkeleton count={4} />
      <ReportChartSkeleton height={300} />
      {/* Deadlines */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[250px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start justify-between rounded-lg border p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-4 w-4 mt-1" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[300px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
              <Skeleton className="h-6 w-[80px] rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <ReportTableSkeleton rows={4} columns={3} />
    </div>
  );
}

/**
 * Skeleton for client metrics report
 */
export function ClientMetricsSkeleton() {
  return (
    <div className="space-y-6">
      <ReportStatsSkeleton count={4} />
      {/* Top clients */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[280px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-[180px] mb-1" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[70px] rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <ReportChartSkeleton height={300} />
      {/* Payment behavior */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[160px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-[140px] mb-1" />
                  <Skeleton className="h-3 w-[180px]" />
                </div>
              </div>
              <Skeleton className="h-8 w-[60px]" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Skeleton for document stats report
 */
export function DocumentStatsSkeleton() {
  return (
    <div className="space-y-6">
      <ReportStatsSkeleton count={4} />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <ReportChartSkeleton height={300} />
      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[180px] mb-2" />
          <Skeleton className="h-4 w-[220px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-[50px]" />
                  <Skeleton className="h-5 w-[60px] rounded-full" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <ReportTableSkeleton rows={6} columns={4} />
    </div>
  );
}

/**
 * Complete reports page skeleton
 */
export function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <Skeleton className="h-10 w-[180px] rounded-md" />
      </div>

      {/* Export actions */}
      <Card className="rounded-[16px]">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Skeleton className="h-4 w-[120px] mb-2" />
              <Skeleton className="h-3 w-[250px]" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-[70px] rounded-md" />
              <Skeleton className="h-8 w-[70px] rounded-md" />
              <Skeleton className="h-8 w-[70px] rounded-md" />
              <Skeleton className="h-8 w-[70px] rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-4 h-10 bg-muted rounded-md p-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-full rounded-sm" />
          ))}
        </div>

        {/* Default financial skeleton */}
        <FinancialReportSkeleton />
      </div>
    </div>
  );
}
