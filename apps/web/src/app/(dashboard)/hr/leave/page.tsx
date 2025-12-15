'use client';

import { Calendar, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
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
      <div>
        <h1 className="text-2xl text-white font-semibold tracking-tight">Leave Management</h1>
        <p className="text-white/70">Manage leave requests and approvals</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">
              My Leave Balance
            </div>
            <Calendar className="h-4 w-4 text-white/70" />
          </div>
          <div>
            <div className="text-2xl text-white font-bold">
              {stats.myLeaveBalance} days
            </div>
            <p className="text-xs text-white/70">
              Remaining annual leave
            </p>
            {stats.balanceDetails.length > 1 && (
              <div className="mt-2 space-y-1">
                {stats.balanceDetails.map((balance) => (
                  <div
                    key={balance.id}
                    className="flex justify-between text-xs text-white/70"
                  >
                    <span>{balance.leaveType?.name || 'Leave'}</span>
                    <span>{balance.remainingDays} days</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">
              Pending Requests
            </div>
            <Clock className="h-4 w-4 text-white/70" />
          </div>
          <div>
            <div className="text-2xl text-white font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-white/70">
              Awaiting approval
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Team on Leave</div>
            <Users className="h-4 w-4 text-white/70" />
          </div>
          <div>
            <div className="text-2xl text-white font-bold">{stats.teamOnLeave}</div>
            <p className="text-xs text-white/70">
              Currently out of office
            </p>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-4">
            <div className="text-lg font-semibold">My Leave Requests</div>
            <p className="text-sm text-white/70">
              View and manage your leave requests
            </p>
          </div>
          <div>
            {stats.recentRequests.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-white/70">
                  {stats.recentRequests.length} recent request(s)
                </p>
                <div className="space-y-2">
                  {stats.recentRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex justify-between items-center p-2 rounded-md bg-white/5"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(request.startDate).toLocaleDateString()} -{' '}
                          {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-white/70">
                          {request.days} day(s) • {request.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/70 mb-4">
                No recent requests
              </p>
            )}
            <Button asChild className="w-full">
              <Link href="/hr/leave/requests">View All Requests</Link>
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4">
            <div className="text-lg font-semibold">Pending Approvals</div>
            <p className="text-sm text-white/70">
              Review and approve team leave requests
            </p>
          </div>
          <div>
            {stats.pendingRequests > 0 ? (
              <p className="text-sm text-white/70 mb-4">
                {stats.pendingRequests} request(s) need your attention
              </p>
            ) : (
              <p className="text-sm text-white/70 mb-4">
                No pending approvals
              </p>
            )}
            <Button asChild className="w-full" variant="outline">
              <Link href="/hr/leave/approvals">Review Approvals</Link>
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
