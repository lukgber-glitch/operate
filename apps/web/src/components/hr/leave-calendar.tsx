'use client';

import { memo, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeaveRequest } from '@/lib/api/employees';
import { cn } from '@/lib/utils';

interface LeaveCalendarProps {
  requests: LeaveRequest[];
}

// Status colors - stable reference outside component
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
} as const;

// Date formatter - cached instance for performance
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

// Memoized date formatting function
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${dateFormatter.format(start)} - ${dateFormatter.format(end)}`;
};

function LeaveCalendarComponent({ requests }: LeaveCalendarProps) {
  // Memoize approved requests to prevent unnecessary recalculation
  const approvedRequests = useMemo(
    () => requests.filter((r) => r.status === 'APPROVED'),
    [requests]
  );

  // Memoize upcoming leave (sorted by date)
  const sortedRequests = useMemo(() => {
    const now = new Date();
    return [...approvedRequests]
      .filter(r => new Date(r.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [approvedRequests]);

  if (approvedRequests.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">No approved leave found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Leave</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedRequests.map((request) => (
            <LeaveRequestItem key={request.id} request={request} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Memoized leave request item component
const LeaveRequestItem = memo(function LeaveRequestItem({ request }: { request: LeaveRequest }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{request.leaveType?.name}</span>
          <Badge
            variant="secondary"
            className={cn(statusColors[request.status])}
          >
            {request.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDateRange(request.startDate, request.endDate)}
        </p>
        {request.reason && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {request.reason}
          </p>
        )}
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{request.days} days</div>
      </div>
    </div>
  );
});

// Memoized export
export const LeaveCalendar = memo(LeaveCalendarComponent);
