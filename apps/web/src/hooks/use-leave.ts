'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import {
  employeeApi,
  type LeaveBalance,
  type LeaveRequest,
  type CreateLeaveRequestRequest
} from '@/lib/api/employees';

export function useLeave(employeeId: string) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await employeeApi.getEmployeeLeaveBalances(employeeId);
      setBalances(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setError(error instanceof Error ? error.message : 'Failed to fetch leave balances');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await employeeApi.getEmployeeLeaveRequests(employeeId);
      setRequests(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setError(error instanceof Error ? error.message : 'Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // Parallel fetch for both balances and requests - more efficient
  const fetchAll = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    try {
      const [balancesData, requestsData] = await Promise.all([
        employeeApi.getEmployeeLeaveBalances(employeeId),
        employeeApi.getEmployeeLeaveRequests(employeeId),
      ]);
      setBalances(balancesData);
      setRequests(requestsData);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setError(error instanceof Error ? error.message : 'Failed to fetch leave data');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const createRequest = useCallback(async (data: CreateLeaveRequestRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const request = await employeeApi.createLeaveRequest(employeeId, data);
      setRequests(prev => [request, ...prev]);
      return request;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create leave request');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const approveRequest = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const request = await employeeApi.approveLeaveRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? request : r));
      return request;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to approve leave request');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectRequest = useCallback(async (id: string, reason: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const request = await employeeApi.rejectLeaveRequest(id, reason);
      setRequests(prev => prev.map(r => r.id === id ? request : r));
      return request;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reject leave request');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelRequest = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const request = await employeeApi.cancelLeaveRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? request : r));
      return request;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to cancel leave request');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized computed values for calendar and stats
  const pendingRequests = useMemo(
    () => requests.filter(r => r.status === 'PENDING'),
    [requests]
  );

  const approvedRequests = useMemo(
    () => requests.filter(r => r.status === 'APPROVED'),
    [requests]
  );

  const totalRemainingDays = useMemo(
    () => balances.reduce((sum, b) => sum + b.remainingDays, 0),
    [balances]
  );

  const upcomingLeave = useMemo(() => {
    const now = new Date();
    return approvedRequests
      .filter(r => new Date(r.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [approvedRequests]);

  return {
    balances,
    requests,
    isLoading,
    error,
    fetchBalances,
    fetchRequests,
    fetchAll,
    createRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    // Optimized computed values
    pendingRequests,
    approvedRequests,
    totalRemainingDays,
    upcomingLeave,
  };
}
