'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LeaveRequest } from '@/lib/api/employees';
import { cn } from '@/lib/utils';

interface LeaveCalendarProps {
  requests: LeaveRequest[];
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export function LeaveCalendar({ requests }: LeaveCalendarProps) {
  const approvedRequests = requests.filter((r) => r.status === 'APPROVED');

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
          {approvedRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
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
                  {new Date(request.startDate).toLocaleDateString()} -{' '}
                  {new Date(request.endDate).toLocaleDateString()}
                </p>
                {request.reason && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.reason}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{request.days} days</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
