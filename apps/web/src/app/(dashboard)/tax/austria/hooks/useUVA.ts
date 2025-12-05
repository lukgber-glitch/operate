'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';

/**
 * Tax period for Austrian UVA
 */
export interface UVAPeriod {
  year: number;
  month?: number;
  quarter?: number;
}

/**
 * Period type for UVA filing
 */
export enum UVAFilingPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

/**
 * Filing status enum
 */
export enum UVAFilingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

/**
 * Austrian UVA data structure
 * All monetary amounts are in cents
 */
export interface UVAData {
  period: UVAPeriod;
  uid: string; // Austrian UID (ATU12345678)

  // Revenue figures (in cents) - Austrian rates
  domesticRevenue20: number; // 20% standard rate
  domesticRevenue13: number; // 13% reduced rate
  domesticRevenue10: number; // 10% special rate
  domesticRevenue0: number;  // 0% rate
  taxFreeRevenue: number;
  euDeliveries: number;
  euAcquisitions20: number;
  euAcquisitions13: number;
  euAcquisitions10: number;
  reverseChargeRevenue: number;

  // Input tax (in cents)
  inputTax: number;
  importVat: number;
  euAcquisitionsInputTax: number;

  // Special cases
  specialPrepayment?: number;
  previousYearRefund?: number;

  // Calculated fields
  outputVat?: number;
  totalInputTax?: number;
  vatPayable?: number;
}

/**
 * VAT calculation from invoices (Austrian)
 */
export interface UVACalculation {
  period: UVAPeriod;
  domesticRevenue20: number;
  domesticRevenue13: number;
  domesticRevenue10: number;
  domesticRevenue0: number;
  taxFreeRevenue: number;
  euDeliveries: number;
  euAcquisitions20: number;
  euAcquisitions13: number;
  euAcquisitions10: number;
  reverseChargeRevenue: number;
  inputTax: number;
  importVat: number;
  euAcquisitionsInputTax: number;
  outputVat: number;
  totalInputTax: number;
  vatPayable: number;
  invoiceCount: number;
  expenseCount: number;
}

/**
 * UVA filing record
 */
export interface UVAFiling {
  id: string;
  organisationId: string;
  type: string;
  year: number;
  period: number;
  periodType: UVAFilingPeriod;
  status: UVAFilingStatus;
  submissionId?: string;
  submittedAt?: Date;
  responseAt?: Date;
  data: UVAData;
  response?: any;
  errors?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Submission result
 */
export interface UVASubmissionResult {
  success: boolean;
  id: string;
  referenceNumber?: string;
  status: UVAFilingStatus;
  errors?: string[];
  warnings?: string[];
}

/**
 * Validation result
 */
export interface UVAValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

/**
 * FinanzOnline credentials
 */
export interface FinanzOnlineCredentials {
  teilnehmerId: string;    // Participant ID
  benutzerId: string;      // User ID
  pin: string;             // PIN
}

interface UseUVAState {
  isLoading: boolean;
  error: string | null;
  filings: UVAFiling[];
  currentFiling: UVAFiling | null;
  calculation: UVACalculation | null;
  validationResult: UVAValidationResult | null;
}

const API_BASE = '/api/tax/austria/uva';

export function useUVA() {
  const { toast } = useToast();
  const [state, setState] = useState<UseUVAState>({
    isLoading: false,
    error: null,
    filings: [],
    currentFiling: null,
    calculation: null,
    validationResult: null,
  });

  /**
   * Calculate VAT from invoices for a period
   */
  const calculateVAT = useCallback(async (period: UVAPeriod) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({
        year: period.year.toString(),
        ...(period.month && { month: period.month.toString() }),
        ...(period.quarter && { quarter: period.quarter.toString() }),
      });

      const response = await fetch(`${API_BASE}/prepare?${params}`);
      if (!response.ok) throw new Error('Failed to calculate VAT');

      const calculation: UVACalculation = await response.json();
      setState(prev => ({ ...prev, calculation, isLoading: false }));
      return calculation;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Get filing history
   */
  const getFilings = useCallback(async (year?: number, status?: UVAFilingStatus) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (status) params.append('status', status);

      const response = await fetch(`${API_BASE}/history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch filings');

      const filings: UVAFiling[] = await response.json();
      setState(prev => ({ ...prev, filings, isLoading: false }));
      return filings;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Get a single filing
   */
  const getFiling = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/history/${id}`);
      if (!response.ok) throw new Error('Failed to fetch filing');

      const filing: UVAFiling = await response.json();
      setState(prev => ({ ...prev, currentFiling: filing, isLoading: false }));
      return filing;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Create or update draft filing
   */
  const saveDraft = useCallback(async (data: UVAData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save draft');

      const filing: UVAFiling = await response.json();
      setState(prev => ({
        ...prev,
        currentFiling: filing,
        isLoading: false
      }));

      toast({
        title: 'Erfolg',
        description: 'Entwurf erfolgreich gespeichert',
      });

      return filing;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Validate UVA data
   */
  const validate = useCallback(async (data: UVAData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Validation failed');

      const result: UVAValidationResult = await response.json();
      setState(prev => ({ ...prev, validationResult: result, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Submit filing to FinanzOnline
   */
  const submit = useCallback(async (
    data: UVAData,
    credentials: FinanzOnlineCredentials,
    testMode = false
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, credentials, testMode }),
      });
      if (!response.ok) throw new Error('Submission failed');

      const result: UVASubmissionResult = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));

      if (result.success) {
        toast({
          title: 'Erfolg',
          description: `UVA erfolgreich übermittelt. Referenznummer: ${result.referenceNumber}`,
        });
      } else {
        toast({
          title: 'Übermittlung fehlgeschlagen',
          description: result.errors?.join(', ') || 'Unbekannter Fehler',
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Check submission status
   */
  const getSubmissionStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/status/${id}`);
      if (!response.ok) throw new Error('Failed to fetch status');

      const filing: UVAFiling = await response.json();
      setState(prev => ({ ...prev, currentFiling: filing }));
      return filing;
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    ...state,
    calculateVAT,
    getFilings,
    getFiling,
    saveDraft,
    validate,
    submit,
    getSubmissionStatus,
  };
}
