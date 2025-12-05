/**
 * Clients API Client
 * Comprehensive API client for client management operations
 */

import { api } from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ClientType = 'INDIVIDUAL' | 'COMPANY' | 'CUSTOMER' | 'LEAD' | 'PROSPECT' | 'PARTNER' | 'VENDOR';
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'PROSPECT' | 'CHURNED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AddressType = 'BILLING' | 'SHIPPING' | 'BOTH';

export interface Client {
  id: string;
  orgId: string;
  clientNumber?: string;
  type: ClientType;
  status: ClientStatus;
  name: string;
  displayName?: string;
  legalName?: string;
  companyName?: string;
  vatId?: string;
  taxId?: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  currency: string;
  paymentTerms: number;
  creditLimit?: number;
  discount?: number;
  isVip: boolean;
  riskLevel: RiskLevel;
  riskScore?: number;
  lastRiskAssessment?: string;
  totalRevenue: number;
  outstandingBalance: number;
  totalInvoices: number;
  totalPaidInvoices: number;
  averagePaymentDays?: number;
  lastInvoiceDate?: string;
  lastPaymentDate?: string;
  lastContactDate?: string;
  preferredLanguage?: string;
  notes?: string;
  internalNotes?: string;
  tags: string[];
  metadata?: Record<string, any>;
  source?: string;
  referredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFilters {
  search?: string;
  status?: ClientStatus;
  type?: ClientType;
  riskLevel?: RiskLevel;
  tags?: string[];
  isVip?: boolean;
  cursor?: string;
  sortBy?: 'name' | 'clientNumber' | 'createdAt' | 'totalRevenue' | 'lastPaymentDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeContacts?: boolean;
  includeAddresses?: boolean;
  includeActivity?: boolean;
}

export interface CreateClientDto {
  type: ClientType;
  name: string;
  displayName?: string;
  legalName?: string;
  companyName?: string;
  vatId?: string;
  taxId?: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  currency?: string;
  paymentTerms?: number;
  creditLimit?: number;
  discount?: number;
  isVip?: boolean;
  preferredLanguage?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  source?: string;
  referredBy?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {
  status?: ClientStatus;
  riskLevel?: RiskLevel;
  riskScore?: number;
}

export interface BulkUpdateDto {
  clientIds: string[];
  updates: UpdateClientDto;
}

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
 * Get paginated list of clients with optional filters
 */
export const getClients = async (
  filters?: ClientFilters
): Promise<ApiResponse<PaginatedResponse<Client>>> => {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
  if (filters?.isVip !== undefined) params.append('isVip', filters.isVip.toString());
  if (filters?.tags?.length) {
    filters.tags.forEach((tag) => params.append('tags', tag));
  }
  if (filters?.cursor) params.append('cursor', filters.cursor);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
  if (filters?.includeContacts) params.append('includeContacts', 'true');
  if (filters?.includeAddresses) params.append('includeAddresses', 'true');
  if (filters?.includeActivity) params.append('includeActivity', 'true');

  const queryString = params.toString();
  return api.get<PaginatedResponse<Client>>(
    `/crm/clients${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get a single client by ID
 */
export const getClient = async (id: string): Promise<ApiResponse<Client>> => {
  return api.get<Client>(`/crm/clients/${id}`);
};

/**
 * Create a new client
 */
export const createClient = async (data: CreateClientDto): Promise<ApiResponse<Client>> => {
  return api.post<Client>('/crm/clients', data);
};

/**
 * Update an existing client
 */
export const updateClient = async (
  id: string,
  data: UpdateClientDto
): Promise<ApiResponse<Client>> => {
  return api.patch<Client>(`/crm/clients/${id}`, data);
};

/**
 * Delete a client
 */
export const deleteClient = async (id: string): Promise<ApiResponse<void>> => {
  return api.delete<void>(`/crm/clients/${id}`);
};

/**
 * Bulk update multiple clients
 */
export const bulkUpdateClients = async (
  data: BulkUpdateDto
): Promise<ApiResponse<{ updatedCount: number }>> => {
  return api.patch<{ updatedCount: number }>('/crm/clients/bulk', data);
};

/**
 * Export clients to CSV
 */
export const exportClients = async (filters?: ClientFilters): Promise<Blob> => {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
  if (filters?.isVip !== undefined) params.append('isVip', filters.isVip.toString());

  const queryString = params.toString();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  const response = await fetch(
    `${baseUrl}/crm/clients/export${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: {
        Accept: 'text/csv',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to export clients');
  }

  return response.blob();
};
