/**
 * Austrian Tax API Client (FinanzOnline)
 * Handles Austrian UVA (Umsatzsteuervoranmeldung) submissions
 */

import { api } from './client';

// ========================================
// Austrian FinanzOnline Types
// ========================================

export interface FinanzOnlineSubmission {
  organizationId: string;
  period: string;
  periodType: 'monthly' | 'quarterly' | 'yearly';
  uva: {
    kz000: number; // Total revenue (Gesamtbetrag der Bemessungsgrundlagen)
    kz022: number; // Revenue 20% VAT (davon steuerpflichtig mit 20%)
    kz029: number; // Revenue 10% VAT (davon steuerpflichtig mit 10%)
    kz006: number; // Revenue 13% VAT (davon steuerpflichtig mit 13%)
    kz072: number; // Input VAT (Vorsteuer)
    kz083: number; // Net VAT payable (Zahllast/Überschuss)
  };
}

export interface FinanzOnlineResult {
  success: boolean;
  submissionId?: string;
  referenceNumber?: string;
  timestamp: string;
  errors?: { code: string; message: string }[];
}

export interface UidVerificationResult {
  valid: boolean;
  uid: string;
  name?: string;
  address?: string;
  verifiedAt: string;
}

export interface UvaPreview {
  organizationId?: string;
  period: string;
  periodLabel: string;
  kennzahlen: {
    kz000: number;
    kz022: number;
    kz029: number;
    kz006: number;
    kz072: number;
    kz083: number;
  };
  details: {
    outputVat20: { invoices: any[]; total: number };
    outputVat13: { invoices: any[]; total: number };
    outputVat10: { invoices: any[]; total: number };
    inputVat: { expenses: any[]; total: number };
  };
  netVat: number;
  dueDate: string;
}

export interface UvaStatus {
  submissionId: string;
  status: 'pending' | 'accepted' | 'rejected';
  referenceNumber?: string;
  submittedAt: string;
}

// ========================================
// Austrian FinanzOnline API
// ========================================

export const finanzOnlineApi = {
  /**
   * Submit UVA (Umsatzsteuervoranmeldung) to FinanzOnline
   */
  submitUva: async (data: FinanzOnlineSubmission): Promise<FinanzOnlineResult> => {
    const response = await api.post<FinanzOnlineResult>(
      '/tax/finanz-online/submit',
      data
    );
    return response.data;
  },

  /**
   * Get UVA submission status
   */
  getUvaStatus: async (orgId: string, submissionId: string): Promise<UvaStatus> => {
    const response = await api.get<UvaStatus>(
      `/tax/finanz-online/${submissionId}/status`,
      {
        params: { organizationId: orgId },
      }
    );
    return response.data;
  },

  /**
   * Verify Austrian UID number (ATU12345678)
   */
  verifyUid: async (uid: string): Promise<UidVerificationResult> => {
    const response = await api.get<UidVerificationResult>(
      '/tax/finanz-online/verify-uid',
      {
        params: { uid },
      }
    );
    return response.data;
  },

  /**
   * Get UVA preview with auto-calculated data from invoices
   */
  getUvaPreview: async (orgId: string, period: string): Promise<UvaPreview> => {
    const response = await api.get<UvaPreview>(
      '/tax/finanz-online/preview',
      {
        params: { organizationId: orgId, period },
      }
    );
    return response.data;
  },

  /**
   * Download submission receipt as PDF
   */
  downloadReceipt: async (submissionId: string): Promise<Blob> => {
    const response = await api.get<Blob>(
      `/tax/finanz-online/receipt/${submissionId}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

export default finanzOnlineApi;
