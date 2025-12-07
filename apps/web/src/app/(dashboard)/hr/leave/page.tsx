'use client';

import { Calendar, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useLeaveOverview } from '@/hooks/use-leave-overview';

export default function LeavePage() {
  const { toast } = useToast();
  
  // TODO: Get actual employee ID from auth context
  // For now, we'll pass undefined to get org-wide stats only
  const { stats, isLoading, error, fetchOverview } = useLeaveOverview();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeadlineOutside subtitle="Manage leave requests and approvals">
        Leave Management
      </HeadlineOutside>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Leave Balance
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.myLeaveBalance} days
            </div>
            <p className="text-xs text-muted-foreground">
              Remaining annual leave
            </p>
            {stats.balanceDetails.length > 1 && (
              <div className="mt-2 space-y-1">
                {stats.balanceDetails.map((balance) => (
                  <div
                    key={balance.id}
                    className="flex justify-between text-xs text-muted-foreground"
                  >
                    <span>{balance.leaveType?.name || 'Leave'}</span>
                    <span>{balance.remainingDays} days</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team on Leave</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamOnLeave}</div>
            <p className="text-xs text-muted-foreground">
              Currently out of office
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Leave Requests</CardTitle>
            <CardDescription>
              View and manage your leave requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentRequests.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground">
                  {stats.recentRequests.length} recent request(s)
                </p>
                <div className="space-y-2">
                  {stats.recentRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex justify-between items-center p-2 rounded-md bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(request.startDate).toLocaleDateString()} -{' '}
                          {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.days} day(s) • {request.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                No recent requests
              </p>
            )}
            <Button asChild className="w-full">
              <Link href="/hr/leave/requests">View All Requests</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              Review and approve team leave requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pendingRequests > 0 ? (
              <p className="text-sm text-muted-foreground mb-4">
                {stats.pendingRequests} request(s) need your attention
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                No pending approvals
              </p>
            )}
            <Button asChild className="w-full" variant="outline">
              <Link href="/hr/leave/approvals">Review Approvals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
