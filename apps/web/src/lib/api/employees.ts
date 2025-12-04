/**
 * Employee API Client
 * Handles all employee-related API calls
 */

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  hireDate: string;
  department?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  taxId?: string;
  taxClass?: string;
  churchTax?: boolean;
  bankName?: string;
  iban?: string;
  bic?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  employeeId: string;
  contractTypeId: string;
  contractType?: {
    id: string;
    name: string;
    countryCode: string;
  };
  jobTitle: string;
  department?: string;
  startDate: string;
  endDate?: string;
  probationEndDate?: string;
  salaryAmount: number;
  salaryCurrency: string;
  salaryPeriod: 'HOURLY' | 'MONTHLY' | 'YEARLY';
  weeklyHours: number;
  workingDays: string[];
  benefits?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType?: {
    id: string;
    name: string;
    color: string;
  };
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType?: {
    id: string;
    name: string;
    color: string;
  };
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  employeeId: string;
  documentTypeId?: string;
  documentType?: {
    id: string;
    name: string;
  };
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface EmployeeFilters {
  search?: string;
  status?: string;
  department?: string;
  countryCode?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  hireDate: string;
  department?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  taxId?: string;
  taxClass?: string;
  churchTax?: boolean;
  bankName?: string;
  iban?: string;
  bic?: string;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {}

export interface CreateContractRequest {
  employeeId: string;
  contractTypeId: string;
  jobTitle: string;
  department?: string;
  startDate: string;
  endDate?: string;
  probationEndDate?: string;
  salaryAmount: number;
  salaryCurrency: string;
  salaryPeriod: 'HOURLY' | 'MONTHLY' | 'YEARLY';
  weeklyHours: number;
  workingDays: string[];
  benefits?: Record<string, any>;
}

export interface CreateLeaveRequestRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

class EmployeeApi {
  // Employee CRUD
  async getEmployees(filters?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<PaginatedResponse<Employee>>(
      `/employees?${params.toString()}`
    );
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}`);
  }

  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    return this.request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.request<void>(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Contracts
  async getEmployeeContracts(employeeId: string): Promise<Contract[]> {
    return this.request<Contract[]>(`/employees/${employeeId}/contracts`);
  }

  async createContract(data: CreateContractRequest): Promise<Contract> {
    return this.request<Contract>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContract(id: string, data: Partial<CreateContractRequest>): Promise<Contract> {
    return this.request<Contract>(`/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteContract(id: string): Promise<void> {
    return this.request<void>(`/contracts/${id}`, {
      method: 'DELETE',
    });
  }

  // Leave Management
  async getEmployeeLeaveBalances(employeeId: string): Promise<LeaveBalance[]> {
    return this.request<LeaveBalance[]>(`/employees/${employeeId}/leave-balances`);
  }

  async getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>(`/employees/${employeeId}/leave-requests`);
  }

  async createLeaveRequest(employeeId: string, data: CreateLeaveRequestRequest): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/employees/${employeeId}/leave-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveLeaveRequest(id: string): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/leave-requests/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectLeaveRequest(id: string, reason: string): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/leave-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async cancelLeaveRequest(id: string): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/leave-requests/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Documents
  async getEmployeeDocuments(employeeId: string): Promise<Document[]> {
    return this.request<Document[]>(`/employees/${employeeId}/documents`);
  }

  async uploadDocument(
    employeeId: string,
    file: File,
    documentTypeId?: string
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (documentTypeId) {
      formData.append('documentTypeId', documentTypeId);
    }

    const response = await fetch(`${this.baseUrl}/employees/${employeeId}/documents`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request<void>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }
}

export const employeeApi = new EmployeeApi();
class EmployeeApi {
  private baseUrl = '/api/v1';

  /**
   * Get organisation ID from JWT token payload
   * The orgId is stored in the JWT which is in HTTP-only cookies
   * For now, we'll use a placeholder - this should be replaced with actual orgId from context
   */
  private getOrgId(): string {
    // TODO: Get orgId from auth context/state
    // For now, we'll try to get it from a global window object set by auth
    if (typeof window !== 'undefined' && (window as any).__orgId) {
      return (window as any).__orgId;
    }
    // Fallback to a default orgId for development
    // In production, this should throw an error if orgId is not available
    return 'default-org-id';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const orgId = this.getOrgId();
    const url = endpoint.startsWith('/organisations/')
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/organisations/${orgId}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
  // Employee CRUD
  async getEmployees(filters?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<PaginatedResponse<Employee>>(
      `/employees?${params.toString()}`
    );
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}`);
  }

  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    return this.request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.request<void>(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Contracts
  async getEmployeeContracts(employeeId: string): Promise<Contract[]> {
    return this.request<Contract[]>(`/employees/${employeeId}/contracts`);
  }

  async createContract(data: CreateContractRequest): Promise<Contract> {
    return this.request<Contract>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContract(id: string, data: Partial<CreateContractRequest>): Promise<Contract> {
    return this.request<Contract>(`/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteContract(id: string): Promise<void> {
    return this.request<void>(`/contracts/${id}`, {
      method: 'DELETE',
    });
  }

  // Leave Management
  async getEmployeeLeaveBalances(employeeId: string): Promise<LeaveBalance[]> {
    return this.request<LeaveBalance[]>(`/employees/${employeeId}/leave-balances`);
  }

  async getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>(`/employees/${employeeId}/leave-requests`);
  }

  async createLeaveRequest(employeeId: string, data: CreateLeaveRequestRequest): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/employees/${employeeId}/leave-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveLeaveRequest(id: string): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/leave-requests/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectLeaveRequest(id: string, reason: string): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/leave-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async cancelLeaveRequest(id: string): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/leave-requests/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Documents
  async getEmployeeDocuments(employeeId: string): Promise<Document[]> {
    return this.request<Document[]>(`/employees/${employeeId}/documents`);
  }

  async uploadDocument(
    employeeId: string,
    file: File,
    documentTypeId?: string
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (documentTypeId) {
      formData.append('documentTypeId', documentTypeId);
    }

    const response = await fetch(`${this.baseUrl}/employees/${employeeId}/documents`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request<void>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }
}

export const employeeApi = new EmployeeApi();
