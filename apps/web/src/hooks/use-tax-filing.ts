'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';

/**
 * Tax period for VAT returns
 */
export interface TaxPeriod {
  year: number;
  month?: number;
  quarter?: number;
}

/**
 * Period type for VAT filing
 */
export enum VATFilingPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

/**
 * Filing status enum
 */
export enum ElsterFilingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

/**
 * UStVA data structure
 * All monetary amounts are in cents
 */
export interface UStVAData {
  period: TaxPeriod;
  taxNumber: string;
  vatId?: string;

  // Revenue figures (in cents)
  domesticRevenue19: number;
  domesticRevenue7: number;
  taxFreeRevenue: number;
  euDeliveries: number;
  euAcquisitions19: number;
  euAcquisitions7: number;
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
 * VAT calculation from invoices
 */
export interface VATCalculation {
  period: TaxPeriod;
  domesticRevenue19: number;
  domesticRevenue7: number;
  taxFreeRevenue: number;
  euDeliveries: number;
  euAcquisitions19: number;
  euAcquisitions7: number;
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
 * ELSTER filing record
 */
export interface ElsterFiling {
  id: string;
  organisationId: string;
  type: string;
  year: number;
  period: number;
  periodType: VATFilingPeriod;
  status: ElsterFilingStatus;
  submissionId?: string;
  submittedAt?: Date;
  responseAt?: Date;
  data: UStVAData;
  response?: any;
  errors?: any;
  certificateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Submission result
 */
export interface SubmissionResult {
  success: boolean;
  id: string;
  transferTicket?: string;
  status: ElsterFilingStatus;
  errors?: string[];
  warnings?: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

/**
 * Certificate info
 */
export interface CertificateInfo {
  id: string;
  name: string;
  validUntil: Date;
  isValid: boolean;
}

interface UseTaxFilingState {
  isLoading: boolean;
  error: string | null;
  filings: ElsterFiling[];
  currentFiling: ElsterFiling | null;
  calculation: VATCalculation | null;
  validationResult: ValidationResult | null;
  certificates: CertificateInfo[];
}

const API_BASE = '/api/tax/elster';

export function useTaxFiling() {
  const { toast } = useToast();
  const [state, setState] = useState<UseTaxFilingState>({
    isLoading: false,
    error: null,
    filings: [],
    currentFiling: null,
    calculation: null,
    validationResult: null,
    certificates: [],
  });

  /**
   * Calculate VAT from invoices for a period
   */
  const calculateVAT = useCallback(async (period: TaxPeriod) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({
        year: period.year.toString(),
        ...(period.month && { month: period.month.toString() }),
        ...(period.quarter && { quarter: period.quarter.toString() }),
      });

      const response = await fetch(`${API_BASE}/calculate?${params}`);
      if (!response.ok) throw new Error('Failed to calculate VAT');

      const calculation: VATCalculation = await response.json();
      setState(prev => ({ ...prev, calculation, isLoading: false }));
      return calculation;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Get filing history
   */
  const getFilings = useCallback(async (year?: number, status?: ElsterFilingStatus) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (status) params.append('status', status);

      const response = await fetch(`${API_BASE}/filings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch filings');

      const filings: ElsterFiling[] = await response.json();
      setState(prev => ({ ...prev, filings, isLoading: false }));
      return filings;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Error',
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
      const response = await fetch(`${API_BASE}/filings/${id}`);
      if (!response.ok) throw new Error('Failed to fetch filing');

      const filing: ElsterFiling = await response.json();
      setState(prev => ({ ...prev, currentFiling: filing, isLoading: false }));
      return filing;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Create or update draft filing
   */
  const saveDraft = useCallback(async (data: UStVAData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save draft');

      const filing: ElsterFiling = await response.json();
      setState(prev => ({
        ...prev,
        currentFiling: filing,
        isLoading: false
      }));

      toast({
        title: 'Success',
        description: 'Draft saved successfully',
      });

      return filing;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Validate UStVA data
   */
  const validate = useCallback(async (data: UStVAData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Validation failed');

      const result: ValidationResult = await response.json();
      setState(prev => ({ ...prev, validationResult: result, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Submit filing to ELSTER
   */
  const submit = useCallback(async (
    data: UStVAData,
    certificateId: string,
    testMode = false
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, certificateId, testMode }),
      });
      if (!response.ok) throw new Error('Submission failed');

      const result: SubmissionResult = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));

      if (result.success) {
        toast({
          title: 'Success',
          description: `Filing submitted successfully. Transfer ticket: ${result.transferTicket}`,
        });
      } else {
        toast({
          title: 'Submission Failed',
          description: result.errors?.join(', ') || 'Unknown error',
          variant: 'destructive',
        });
      }

      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Get available certificates
   */
  const getCertificates = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/certificates`);
      if (!response.ok) throw new Error('Failed to fetch certificates');

      const certificates: CertificateInfo[] = await response.json();
      setState(prev => ({ ...prev, certificates, isLoading: false }));
      return certificates;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: 'Error',
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
      const response = await fetch(`${API_BASE}/filings/${id}/status`);
      if (!response.ok) throw new Error('Failed to fetch status');

      const filing: ElsterFiling = await response.json();
      setState(prev => ({ ...prev, currentFiling: filing }));
      return filing;
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
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
    getCertificates,
    getSubmissionStatus,
  };
}
