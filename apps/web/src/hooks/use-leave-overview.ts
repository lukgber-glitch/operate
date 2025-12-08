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
        } catch (err) {        }
      }

      // Fetch org-wide stats
      let pendingRequests = 0;
      let teamOnLeave = 0;

      try {
        // Derive leave stats from employee data
        // TODO: Implement dedicated leave request API endpoint when backend is ready
        const employeesResponse = await employeeApi.getEmployees({ limit: 1000 });
        teamOnLeave = employeesResponse.data.filter(e => e.status === 'ON_LEAVE').length;
        // pendingRequests would need a dedicated endpoint - stub for now
        pendingRequests = 0;
      } catch (err) {      }

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
