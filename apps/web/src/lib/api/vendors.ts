/**
 * Vendors API Client
 * API client for vendor (supplier/AP) management operations
 */

import { api } from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type TaxIdType = 'VAT_EU' | 'VAT_DE' | 'VAT_AT' | 'EIN_US' | 'OTHER';

export interface Vendor {
  id: string;
  organisationId: string;
  name: string;
  displayName?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  taxIdType: TaxIdType;
  paymentTerms: number;
  preferredPaymentMethod?: string;
  bankAccountName?: string;
  bankIban?: string;
  bankBic?: string;
  defaultCategoryId?: string;
  defaultTaxDeductible: boolean;
  status: VendorStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields (from backend)
  _count?: {
    bills: number;
  };
  totalBills?: number;
  totalOutstanding?: number;
  totalPaid?: number;
}

export interface VendorFilters {
  search?: string;
  status?: VendorStatus;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'totalBills';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateVendorDto {
  name: string;
  displayName?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  taxIdType?: TaxIdType;
  paymentTerms?: number;
  preferredPaymentMethod?: string;
  bankAccountName?: string;
  bankIban?: string;
  bankBic?: string;
  defaultCategoryId?: string;
  defaultTaxDeductible?: boolean;
  status?: VendorStatus;
  notes?: string;
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get paginated list of vendors with optional filters
 */
export const getVendors = async (
  filters?: VendorFilters
): Promise<ApiResponse<PaginatedResponse<Vendor>>> => {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const queryString = params.toString();
  return api.get<PaginatedResponse<Vendor>>(
    `/crm/vendors${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get a single vendor by ID
 */
export const getVendor = async (id: string): Promise<ApiResponse<Vendor>> => {
  return api.get<Vendor>(`/crm/vendors/${id}`);
};

/**
 * Create a new vendor
 */
export const createVendor = async (data: CreateVendorDto): Promise<ApiResponse<Vendor>> => {
  return api.post<Vendor>('/crm/vendors', data);
};

/**
 * Update an existing vendor
 */
export const updateVendor = async (
  id: string,
  data: UpdateVendorDto
): Promise<ApiResponse<Vendor>> => {
  return api.patch<Vendor>(`/crm/vendors/${id}`, data);
};

/**
 * Delete a vendor
 */
export const deleteVendor = async (id: string): Promise<ApiResponse<void>> => {
  return api.delete<void>(`/crm/vendors/${id}`);
};

/**
 * Get vendor statistics (bills, outstanding amounts)
 */
export const getVendorStats = async (id: string): Promise<ApiResponse<{
  totalBills: number;
  totalOutstanding: number;
  totalPaid: number;
  averagePaymentDays?: number;
  lastBillDate?: string;
  lastPaymentDate?: string;
}>> => {
  return api.get(`/crm/vendors/${id}/stats`);
};
