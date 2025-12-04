'use client';

import { useState, useCallback, useEffect } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';
import { apiClient } from '@/lib/api/client';

// Receipt Scan Types
export interface ReceiptScan {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  receiptUrl: string;
  extractedData?: ExtractedReceiptData;
  confidence?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedReceiptData {
  merchantName?: string;
  merchantAddress?: string;
  date?: string;
  totalAmount?: number;
  taxAmount?: number;
  currency?: string;
  category?: string;
  lineItems?: LineItem[];
  confidence?: {
    merchantName?: number;
    date?: number;
    totalAmount?: number;
    taxAmount?: number;
    overall?: number;
  };
}

export interface LineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface ScanHistoryFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ConfirmScanRequest {
  merchantName: string;
  date: string;
  totalAmount: number;
  taxAmount?: number;
  currency: string;
  category?: string;
  notes?: string;
  lineItems?: LineItem[];
}

// Upload Receipt Hook
export function useReceiptUpload() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadReceipt = useCallback(async (file: File): Promise<ReceiptScan | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit.');
      }

      // Create form data
      const formData = new FormData();
      formData.append('receipt', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiClient.post<ReceiptScan>('/api/finance/receipts/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: 'Success',
        description: 'Receipt uploaded successfully. Processing...',
      });

      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);

  return {
    uploadReceipt,
    isUploading,
    uploadProgress,
    error,
    reset,
  };
}

// Get Receipt Scan Hook (with polling)
export function useReceiptScan(scanId: string | null, enablePolling: boolean = true) {
  const { toast } = useToast();
  const [scan, setScan] = useState<ReceiptScan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScan = useCallback(async () => {
    if (!scanId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<ReceiptScan>(`/api/finance/receipts/scan/${scanId}`);
      setScan(data);

      // Show error toast if scan failed
      if (data.status === 'FAILED' && data.error) {
        toast({
          title: 'Scan Failed',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [scanId, toast]);

  // Initial fetch
  useEffect(() => {
    if (scanId) {
      fetchScan();
    }
  }, [scanId, fetchScan]);

  // Polling for processing status
  useEffect(() => {
    if (!enablePolling || !scanId || !scan) return;

    // Only poll if status is PENDING or PROCESSING
    if (scan.status !== 'PENDING' && scan.status !== 'PROCESSING') {
      return;
    }

    const pollInterval = setInterval(() => {
      fetchScan();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [enablePolling, scanId, scan, fetchScan]);

  return {
    scan,
    isLoading,
    error,
    refetch: fetchScan,
  };
}

// Confirm Scan Hook
export function useConfirmScan() {
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmScan = useCallback(async (scanId: string, data: ConfirmScanRequest) => {
    setIsConfirming(true);
    setError(null);

    try {
      const expense = await apiClient.post(`/api/finance/receipts/scan/${scanId}/confirm`, data);

      toast({
        title: 'Success',
        description: 'Receipt confirmed and expense created successfully',
      });

      return expense;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsConfirming(false);
    }
  }, [toast]);

  return {
    confirmScan,
    isConfirming,
    error,
  };
}

// Reject Scan Hook
export function useRejectScan() {
  const { toast } = useToast();
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejectScan = useCallback(async (scanId: string, reason?: string) => {
    setIsRejecting(true);
    setError(null);

    try {
      await apiClient.post(`/api/finance/receipts/scan/${scanId}/reject`, { reason });

      toast({
        title: 'Success',
        description: 'Receipt scan rejected',
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsRejecting(false);
    }
  }, [toast]);

  return {
    rejectScan,
    isRejecting,
    error,
  };
}

// Scan History Hook
export function useScanHistory(initialFilters?: ScanHistoryFilters) {
  const { toast } = useToast();
  const [scans, setScans] = useState<ReceiptScan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScanHistoryFilters>(initialFilters || {});

  const fetchHistory = useCallback(async (customFilters?: ScanHistoryFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const mergedFilters = { ...filters, ...customFilters };
      const queryParams = new URLSearchParams();

      Object.entries(mergedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await apiClient.get<{
        data: ReceiptScan[];
        total: number;
        page: number;
        pageSize: number;
      }>(`/api/finance/receipts/scan?${queryParams.toString()}`);

      setScans(response.data);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.pageSize);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  return {
    scans,
    total,
    page,
    pageSize,
    isLoading,
    error,
    filters,
    setFilters,
    fetchHistory,
  };
}
