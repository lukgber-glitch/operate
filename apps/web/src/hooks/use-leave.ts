'use client';

import { useState, useCallback } from 'react';

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

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await employeeApi.getEmployeeLeaveBalances(employeeId);
      setBalances(data);
    } catch (error) {
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
      setError(error instanceof Error ? error.message : 'Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

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

  return {
    balances,
    requests,
    isLoading,
    error,
    fetchBalances,
    fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
  };
}
