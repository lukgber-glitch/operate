/**
 * CRM API Client
 * Handles all CRM-related API calls
 */

import { api } from './client';

export type ClientType = 'CUSTOMER' | 'LEAD' | 'PROSPECT' | 'PARTNER' | 'VENDOR';
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CHURNED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CommunicationType = 'EMAIL' | 'PHONE' | 'MEETING' | 'NOTE' | 'TASK';
export type CommunicationDirection = 'INBOUND' | 'OUTBOUND';

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  email: string;
  phone?: string;
  vatId?: string;
  taxId?: string;
  website?: string;
  industry?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  paymentTerms?: number;
  creditLimit?: number;
  tags?: string[];
  notes?: string;
  totalRevenue: number;
  totalInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  avgPaymentDays: number;
  riskLevel: RiskLevel;
  lastContactDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  id: string;
  clientId: string;
  contactId?: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  content?: string;
  date: string;
  linkedEntityType?: 'INVOICE' | 'PAYMENT' | 'QUOTE';
  linkedEntityId?: string;
  createdBy: string;
  createdAt: string;
}

export interface ClientMetrics {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  payment: {
    avgDays: number;
    onTimeRate: number;
  };
  risk: {
    level: RiskLevel;
    factors: string[];
  };
}

export interface ClientFilters {
  search?: string;
  type?: ClientType;
  status?: ClientStatus;
  riskLevel?: RiskLevel;
  sortBy?: 'name' | 'revenue' | 'lastContact' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateClientDto {
  name: string;
  type: ClientType;
  email: string;
  phone?: string;
  vatId?: string;
  taxId?: string;
  website?: string;
  industry?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  paymentTerms?: number;
  creditLimit?: number;
  tags?: string[];
  notes?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {
  status?: ClientStatus;
}

export interface CreateContactDto {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateContactDto extends Partial<Omit<CreateContactDto, 'clientId'>> {}

export interface CreateCommunicationDto {
  clientId: string;
  contactId?: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  content?: string;
  date: string;
  linkedEntityType?: 'INVOICE' | 'PAYMENT' | 'QUOTE';
  linkedEntityId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Client API
export const getClients = async (filters?: ClientFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  return api.get<PaginatedResponse<Client>>(
    `/crm/clients${queryString ? `?${queryString}` : ''}`
  );
};

export const getClient = async (id: string) => {
  return api.get<Client>(`/crm/clients/${id}`);
};

export const createClient = async (data: CreateClientDto) => {
  return api.post<Client>('/crm/clients', data);
};

export const updateClient = async (id: string, data: UpdateClientDto) => {
  return api.patch<Client>(`/crm/clients/${id}`, data);
};

export const deleteClient = async (id: string) => {
  return api.delete<void>(`/crm/clients/${id}`);
};

// Contact API
export const getContacts = async (clientId: string) => {
  return api.get<Contact[]>(`/crm/clients/${clientId}/contacts`);
};

export const createContact = async (data: CreateContactDto) => {
  return api.post<Contact>('/crm/contacts', data);
};

export const updateContact = async (id: string, data: UpdateContactDto) => {
  return api.patch<Contact>(`/crm/contacts/${id}`, data);
};

export const deleteContact = async (id: string) => {
  return api.delete<void>(`/crm/contacts/${id}`);
};

// Communication API
export const getCommunications = async (clientId: string) => {
  return api.get<Communication[]>(`/crm/clients/${clientId}/communications`);
};

export const createCommunication = async (data: CreateCommunicationDto) => {
  return api.post<Communication>('/crm/communications', data);
};

// Metrics API
export const getClientMetrics = async (clientId: string) => {
  return api.get<ClientMetrics>(`/crm/clients/${clientId}/metrics`);
};
