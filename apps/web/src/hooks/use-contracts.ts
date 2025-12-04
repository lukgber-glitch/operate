'use client';

import { useState, useCallback } from 'react';

import {
  employeeApi,
  type Contract,
  type CreateContractRequest
} from '@/lib/api/employees';

export function useContracts(employeeId: string) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await employeeApi.getEmployeeContracts(employeeId);
      setContracts(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch contracts');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const createContract = useCallback(async (data: CreateContractRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const contract = await employeeApi.createContract(data);
      setContracts(prev => [contract, ...prev]);
      return contract;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create contract');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateContract = useCallback(async (id: string, data: Partial<CreateContractRequest>) => {
    setIsLoading(true);
    setError(null);
    try {
      const contract = await employeeApi.updateContract(id, data);
      setContracts(prev => prev.map(c => c.id === id ? contract : c));
      return contract;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update contract');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteContract = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await employeeApi.deleteContract(employeeId, id);
      setContracts(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete contract');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    contracts,
    isLoading,
    error,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
  };
}
