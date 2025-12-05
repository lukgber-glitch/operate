/**
 * Extracted Invoices API Client
 * API functions for managing AI-extracted invoice data
 */

import { api } from './client';
import type {
  ExtractedInvoice,
  ListExtractedInvoicesParams,
  ListExtractedInvoicesResponse,
  UpdateExtractedInvoiceDto,
  BulkApproveDto,
  BulkRejectDto,
  CreateInvoiceFromExtractionDto,
  ExtractionStatistics,
} from '@/types/extracted-invoice';

const BASE_PATH = '/integrations/email-sync/extractions';

/**
 * List extracted invoices with filters
 */
export async function listExtractedInvoices(
  params?: ListExtractedInvoicesParams
): Promise<ListExtractedInvoicesResponse> {
  const response = await api.get<ListExtractedInvoicesResponse>(BASE_PATH, {
    params: params as Record<string, any>,
  });
  return response.data;
}

/**
 * Get a single extracted invoice by ID
 */
export async function getExtractedInvoice(id: string): Promise<ExtractedInvoice> {
  const response = await api.get<ExtractedInvoice>(`${BASE_PATH}/${id}`);
  return response.data;
}

/**
 * Update extracted invoice data (corrections)
 */
export async function updateExtractedInvoice(
  id: string,
  data: UpdateExtractedInvoiceDto
): Promise<ExtractedInvoice> {
  const response = await api.patch<ExtractedInvoice>(`${BASE_PATH}/${id}`, data);
  return response.data;
}

/**
 * Approve an extracted invoice
 */
export async function approveExtraction(
  id: string,
  notes?: string
): Promise<ExtractedInvoice> {
  const response = await api.post<ExtractedInvoice>(`${BASE_PATH}/${id}/approve`, {
    reviewNotes: notes,
  });
  return response.data;
}

/**
 * Reject an extracted invoice
 */
export async function rejectExtraction(
  id: string,
  reason?: string
): Promise<ExtractedInvoice> {
  const response = await api.post<ExtractedInvoice>(`${BASE_PATH}/${id}/reject`, {
    reviewNotes: reason,
  });
  return response.data;
}

/**
 * Bulk approve multiple extractions
 */
export async function bulkApproveExtractions(
  data: BulkApproveDto
): Promise<{ approved: number; failed: number; results: ExtractedInvoice[] }> {
  const response = await api.post<{
    approved: number;
    failed: number;
    results: ExtractedInvoice[];
  }>(`${BASE_PATH}/bulk-approve`, data);
  return response.data;
}

/**
 * Bulk reject multiple extractions
 */
export async function bulkRejectExtractions(
  data: BulkRejectDto
): Promise<{ rejected: number; failed: number }> {
  const response = await api.post<{ rejected: number; failed: number }>(
    `${BASE_PATH}/bulk-reject`,
    data
  );
  return response.data;
}

/**
 * Create actual invoice from approved extraction
 */
export async function createInvoiceFromExtraction(
  data: CreateInvoiceFromExtractionDto
): Promise<{ invoiceId: string; extraction: ExtractedInvoice }> {
  const response = await api.post<{
    invoiceId: string;
    extraction: ExtractedInvoice;
  }>(`${BASE_PATH}/create-invoice`, data);
  return response.data;
}

/**
 * Get attachment/document for an extraction
 */
export async function getExtractionAttachment(id: string): Promise<Blob> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  const response = await fetch(`${baseUrl}${BASE_PATH}/${id}/attachment`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attachment');
  }

  return response.blob();
}

/**
 * Get extraction statistics
 */
export async function getExtractionStatistics(): Promise<ExtractionStatistics> {
  const response = await api.get<ExtractionStatistics>(`${BASE_PATH}/statistics`);
  return response.data;
}

/**
 * Delete an extraction
 */
export async function deleteExtraction(id: string): Promise<void> {
  await api.delete(`${BASE_PATH}/${id}`);
}

/**
 * Retry failed extraction
 */
export async function retryExtraction(id: string): Promise<ExtractedInvoice> {
  const response = await api.post<ExtractedInvoice>(`${BASE_PATH}/${id}/retry`);
  return response.data;
}
