'use client';

import { useState, useCallback } from 'react';
import { employeeApi, type LeaveBalance, type LeaveRequest } from '@/lib/api/employees';

export interface LeaveOverviewStats {
  myLeaveBalance: number;
  pendingRequests: number;
  teamOnLeave: number;
  balanceDetails: LeaveBalance[];
  recentRequests: LeaveRequest[];
}

export function useLeaveOverview(employeeId?: string) {
  const [stats, setStats] = useState<LeaveOverviewStats>({
    myLeaveBalance: 0,
    pendingRequests: 0,
    teamOnLeave: 0,
    balanceDetails: [],
    recentRequests: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let myLeaveBalance = 0;
      let balanceDetails: LeaveBalance[] = [];
      let recentRequests: LeaveRequest[] = [];

      // Fetch my leave balance if employeeId is provided
      if (employeeId) {
        try {
          balanceDetails = await employeeApi.getEmployeeLeaveBalances(employeeId);
          myLeaveBalance = balanceDetails.reduce(
            (sum, balance) => sum + balance.remainingDays,
            0
          );

          // Fetch recent requests for this employee
          recentRequests = await employeeApi.getEmployeeLeaveRequests(employeeId);
        } catch (err) {
          console.warn('Could not fetch employee leave data:', err);
        }
      }

      // Fetch org-wide stats
      let pendingRequests = 0;
      let teamOnLeave = 0;

      try {
        const pendingResponse = await employeeApi.getPendingLeaveRequests();
        pendingRequests = pendingResponse.data?.length || 0;

        // Count team members currently on leave
        const today = new Date();
        teamOnLeave = pendingResponse.data?.filter((req: LeaveRequest) => {
          if (req.status !== 'APPROVED') return false;
          const start = new Date(req.startDate);
          const end = new Date(req.endDate);
          return start <= today && end >= today;
        }).length || 0;
      } catch (err) {
        console.warn('Could not fetch pending leave requests:', err);
      }

      setStats({
        myLeaveBalance,
        pendingRequests,
        teamOnLeave,
        balanceDetails,
        recentRequests,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch leave overview');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  return {
    stats,
    isLoading,
    error,
    fetchOverview,
  };
}
