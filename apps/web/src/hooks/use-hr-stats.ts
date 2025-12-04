'use client';

import { useState, useCallback } from 'react';
import { employeeApi, type Employee, type LeaveRequest } from '@/lib/api/employees';

export interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  pendingLeaveRequests: number;
  teamOnLeave: number;
  myLeaveBalance?: number;
}

export function useHRStats() {
  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveEmployees: 0,
    pendingLeaveRequests: 0,
    teamOnLeave: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch employees to calculate stats
      const employeesResponse = await employeeApi.getEmployees({ limit: 1000 });
      const employees = employeesResponse.data;

      const totalEmployees = employees.length;
      const activeEmployees = employees.filter((e: Employee) => e.status === 'ACTIVE').length;
      const onLeaveEmployees = employees.filter((e: Employee) => e.status === 'ON_LEAVE').length;

      // Fetch pending leave requests
      let pendingLeaveRequests = 0;
      let teamOnLeave = 0;
      
      try {
        const pendingResponse = await employeeApi.getPendingLeaveRequests();
        pendingLeaveRequests = pendingResponse.data?.length || 0;
        
        // Count team members currently on leave (approved requests with current date in range)
        const today = new Date();
        teamOnLeave = pendingResponse.data?.filter((req: LeaveRequest) => {
          if (req.status !== 'APPROVED') return false;
          const start = new Date(req.startDate);
          const end = new Date(req.endDate);
          return start <= today && end >= today;
        }).length || 0;
      } catch (err) {
        console.warn('Could not fetch leave requests:', err);
      }

      setStats({
        totalEmployees,
        activeEmployees,
        onLeaveEmployees,
        pendingLeaveRequests,
        teamOnLeave,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch HR stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}
