/**
 * Tax API Client
 * Handles all tax-related API calls including ELSTER VAT submissions
 */

import { api } from './client';
import type {
  VatReturnPreview,
  VatReturnSubmission,
  ElsterSubmissionResult,
  VatReturnStatus,
  ValidationResult,
  VatReturnHistory,
} from '@/types/tax';

export interface VatReturnPreviewParams {
  organizationId: string;
  period: string; // "2025-Q1" or "2025-01"
}

export interface VatReturnHistoryParams {
  organizationId: string;
  year?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const taxApi = {
  /**
   * Get VAT return preview for a specific period
   * Calculates VAT from invoices and expenses
   */
  getVatReturnPreview: async (
    orgId: string,
    period: string
  ): Promise<VatReturnPreview> => {
    const response = await api.get<VatReturnPreview>(
      `/tax/vat-return/preview`,
      {
        params: {
          organizationId: orgId,
          period,
        },
      }
    );
    return response.data;
  },

  /**
   * Submit VAT return to ELSTER
   */
  submitVatReturn: async (
    data: VatReturnSubmission
  ): Promise<ElsterSubmissionResult> => {
    const response = await api.post<ElsterSubmissionResult>(
      '/tax/elster/submit',
      data
    );
    return response.data;
  },

  /**
   * Get submission status
   */
  getVatReturnStatus: async (
    orgId: string,
    submissionId: string
  ): Promise<VatReturnStatus> => {
    const response = await api.get<VatReturnStatus>(
      `/tax/vat-return/${submissionId}/status`,
      {
        params: {
          organizationId: orgId,
        },
      }
    );
    return response.data;
  },

  /**
   * Download VAT receipt as PDF
   */
  downloadVatReceipt: async (submissionId: string): Promise<Blob> => {
    const response = await api.get<Blob>(
      `/tax/elster/receipt/${submissionId}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Get submission history
   */
  getSubmissionHistory: async (
    params: VatReturnHistoryParams
  ): Promise<VatReturnHistory> => {
    const response = await api.get<VatReturnHistory>(
      '/tax/vat-return/history',
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Validate VAT return before submission
   */
  validateVatReturn: async (
    data: VatReturnSubmission
  ): Promise<ValidationResult> => {
    const response = await api.post<ValidationResult>(
      '/tax/elster/validate',
      data
    );
    return response.data;
  },

  /**
   * Get draft VAT return (if exists)
   */
  getDraftVatReturn: async (
    orgId: string,
    period: string
  ): Promise<VatReturnSubmission | null> => {
    try {
      const response = await api.get<VatReturnSubmission>(
        '/tax/vat-return/draft',
        {
          params: {
            organizationId: orgId,
            period,
          },
        }
      );
      return response.data;
    } catch (error) {
      // Return null if no draft exists
      return null;
    }
  },

  /**
   * Save VAT return as draft
   */
  saveDraftVatReturn: async (
    data: VatReturnSubmission
  ): Promise<VatReturnSubmission> => {
    const response = await api.post<VatReturnSubmission>(
      '/tax/vat-return/draft',
      data
    );
    return response.data;
  },

  /**
   * Delete draft VAT return
   */
  deleteDraftVatReturn: async (
    orgId: string,
    period: string
  ): Promise<void> => {
    await api.delete(
      `/tax/vat-return/draft`,
      {
        params: {
          organizationId: orgId,
          period,
        },
      } as any
    );
  },
};

// Re-export types for convenience
export type {
  VatReturnPreview,
  VatReturnSubmission,
  ElsterSubmissionResult,
  VatReturnStatus,
  ValidationResult,
  VatReturnHistory,
} from '@/types/tax';
