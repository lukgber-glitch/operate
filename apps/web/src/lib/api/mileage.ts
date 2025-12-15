/**
 * Mileage API Client
 * Handles all mileage tracking-related API calls
 */

// Mileage Types
export interface MileageEntry {
  id: string;
  date: string;
  purpose: string;
  startLocation: string;
  endLocation: string;
  distance: number; // in km
  distanceUnit: 'km' | 'miles';
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'ELECTRIC';
  roundTrip: boolean;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  rate: number; // rate per km/mile
  amount: number; // calculated reimbursement
  currency: string;
  reimbursed: boolean;
  reimbursedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MileageFilters {
  search?: string;
  vehicleType?: string;
  reimbursed?: boolean;
  clientId?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMileageRequest {
  date: string;
  purpose: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  distanceUnit: 'km' | 'miles';
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'ELECTRIC';
  roundTrip?: boolean;
  clientId?: string;
  projectId?: string;
  notes?: string;
  // Rate will be auto-calculated based on country and vehicle type
}

export interface UpdateMileageRequest extends Partial<CreateMileageRequest> {}

export interface MileageSummary {
  totalDistance: number;
  totalAmount: number;
  totalEntries: number;
  reimbursedAmount: number;
  pendingAmount: number;
  thisMonth: {
    distance: number;
    amount: number;
    entries: number;
  };
  thisYear: {
    distance: number;
    amount: number;
    entries: number;
  };
  byVehicleType: Array<{
    type: string;
    distance: number;
    amount: number;
    entries: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    distance: number;
    amount: number;
    entries: number;
  }>;
  currency: string;
  distanceUnit: 'km' | 'miles';
}

export interface MileageRate {
  id: string;
  countryCode: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'ELECTRIC';
  rate: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  description?: string;
}

export interface MileageTaxReport {
  year: number;
  totalTrips: number;
  totalDistance: number;
  totalDeductible: number;
  currency: string;
  distanceUnit: 'km' | 'miles';
  entries: Array<{
    date: string;
    purpose: string;
    from: string;
    to: string;
    distance: number;
    vehicleType: string;
    rate: number;
    amount: number;
  }>;
  byVehicleType: Array<{
    type: string;
    trips: number;
    distance: number;
    amount: number;
  }>;
  byMonth: Array<{
    month: string;
    trips: number;
    distance: number;
    amount: number;
  }>;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class MileageApi {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  private getOrgId(): string {
    if (typeof window !== 'undefined') {
      if ((window as any).__orgId) {
        return (window as any).__orgId;
      }

      const authCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('op_auth='));

      if (authCookie) {
        try {
          const authValue = decodeURIComponent(authCookie.split('=')[1] || '');
          const authData = JSON.parse(authValue);

          if (authData.a) {
            const payload = JSON.parse(atob(authData.a.split('.')[1]));
            if (payload.orgId) {
              return payload.orgId;
            }
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[MileageAPI] Failed to parse auth cookie:', e);
          }
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('[MileageAPI] Organisation ID not available');
    }
    return '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const orgId = this.getOrgId();
    const url = `${this.baseUrl}/organisations/${orgId}${endpoint}`;

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

  // Mileage Entry CRUD
  async getMileageEntries(filters?: MileageFilters): Promise<PaginatedResponse<MileageEntry>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<PaginatedResponse<MileageEntry>>(
      `/mileage?${params.toString()}`
    );
  }

  async getMileageEntry(id: string): Promise<MileageEntry> {
    return this.request<MileageEntry>(`/mileage/${id}`);
  }

  async createMileageEntry(data: CreateMileageRequest): Promise<MileageEntry> {
    return this.request<MileageEntry>('/mileage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMileageEntry(id: string, data: UpdateMileageRequest): Promise<MileageEntry> {
    return this.request<MileageEntry>(`/mileage/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMileageEntry(id: string): Promise<void> {
    return this.request<void>(`/mileage/${id}`, {
      method: 'DELETE',
    });
  }

  async markAsReimbursed(id: string): Promise<MileageEntry> {
    return this.request<MileageEntry>(`/mileage/${id}/reimburse`, {
      method: 'POST',
    });
  }

  async bulkMarkAsReimbursed(ids: string[]): Promise<MileageEntry[]> {
    return this.request<MileageEntry[]>('/mileage/bulk-reimburse', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async duplicateEntry(id: string): Promise<MileageEntry> {
    return this.request<MileageEntry>(`/mileage/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Summary and Statistics
  async getMileageSummary(dateFrom?: string, dateTo?: string): Promise<MileageSummary> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    return this.request<MileageSummary>(
      `/mileage/summary?${params.toString()}`
    );
  }

  // Mileage Rates
  async getMileageRates(countryCode?: string): Promise<MileageRate[]> {
    const params = new URLSearchParams();
    if (countryCode) params.append('countryCode', countryCode);

    return this.request<MileageRate[]>(
      `/mileage/rates?${params.toString()}`
    );
  }

  async getCurrentRate(countryCode: string, vehicleType: string): Promise<MileageRate> {
    return this.request<MileageRate>(
      `/mileage/rates/current?countryCode=${countryCode}&vehicleType=${vehicleType}`
    );
  }

  // Tax Reports
  async getTaxReport(year: number): Promise<MileageTaxReport> {
    return this.request<MileageTaxReport>(`/mileage/tax-report/${year}`);
  }

  async exportTaxReport(year: number, format: 'pdf' | 'csv'): Promise<Blob> {
    const orgId = this.getOrgId();
    const url = `${this.baseUrl}/organisations/${orgId}/mileage/tax-report/${year}/export?format=${format}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }
}

export const mileageApi = new MileageApi();
