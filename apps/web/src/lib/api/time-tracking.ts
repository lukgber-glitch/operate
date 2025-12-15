import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface TimeEntry {
  id: string;
  projectId: string | null;
  clientId: string | null;
  userId: string;
  description: string;
  startTime: string;
  endTime: string | null;
  duration: number; // in seconds
  billable: boolean;
  billed: boolean;
  hourlyRate: number | null;
  amount: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;

  // Relations
  project?: Project;
  client?: { id: string; name: string };
  user?: { id: string; name: string; email: string };
}

export interface Project {
  id: string;
  name: string;
  clientId: string | null;
  color: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  budgetHours: number | null;
  budgetAmount: number | null;
  hourlyRate: number | null;
  billable: boolean;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  client?: { id: string; name: string };
  timeEntries?: TimeEntry[];

  // Computed
  totalHours?: number;
  totalAmount?: number;
  usedBudgetPercentage?: number;
  profitability?: number;
}

export interface TimeSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  billableToday: number;
  billableThisWeek: number;
  billableThisMonth: number;
  nonBillableToday: number;
  nonBillableThisWeek: number;
  nonBillableThisMonth: number;
  todayByProject: Array<{ projectId: string; projectName: string; duration: number }>;
  weekByDay: Array<{ date: string; duration: number; billable: number; nonBillable: number }>;
}

export interface RunningTimer {
  id: string;
  projectId: string | null;
  description: string;
  startTime: string;
  elapsedSeconds: number;
  project?: { id: string; name: string; color: string };
}

export interface TimeEntryFilters {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  clientId?: string;
  billable?: boolean;
  billed?: boolean;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface ProjectFilters {
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  clientId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTimeEntryRequest {
  projectId?: string | null;
  clientId?: string | null;
  description: string;
  startTime: string;
  endTime?: string;
  billable?: boolean;
  hourlyRate?: number | null;
  tags?: string[];
}

export interface UpdateTimeEntryRequest {
  projectId?: string | null;
  clientId?: string | null;
  description?: string;
  startTime?: string;
  endTime?: string;
  billable?: boolean;
  billed?: boolean;
  hourlyRate?: number | null;
  tags?: string[];
}

export interface CreateProjectRequest {
  name: string;
  clientId?: string | null;
  color?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  budgetHours?: number | null;
  budgetAmount?: number | null;
  hourlyRate?: number | null;
  billable?: boolean;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

export interface StartTimerRequest {
  projectId?: string | null;
  description?: string;
}

export interface StopTimerRequest {
  description?: string;
  billable?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// API Functions
// ============================================================================

export const timeTrackingApi = {
  // ============================================================================
  // Time Entries
  // ============================================================================

  async getTimeEntries(filters?: TimeEntryFilters): Promise<PaginatedResponse<TimeEntry>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.billable !== undefined) params.append('billable', String(filters.billable));
    if (filters?.billed !== undefined) params.append('billed', String(filters.billed));
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<PaginatedResponse<TimeEntry>>(`/time-tracking/entries?${params}`);
    return response.data;
  },

  async getTimeEntry(id: string): Promise<TimeEntry> {
    const response = await apiClient.get<TimeEntry>(`/time-tracking/entries/${id}`);
    return response.data;
  },

  async createTimeEntry(data: CreateTimeEntryRequest): Promise<TimeEntry> {
    const response = await apiClient.post<TimeEntry>('/time-tracking/entries', data);
    return response.data;
  },

  async updateTimeEntry(id: string, data: UpdateTimeEntryRequest): Promise<TimeEntry> {
    const response = await apiClient.patch<TimeEntry>(`/time-tracking/entries/${id}`, data);
    return response.data;
  },

  async deleteTimeEntry(id: string): Promise<void> {
    await apiClient.delete(`/time-tracking/entries/${id}`);
  },

  async bulkMarkAsBillable(ids: string[]): Promise<{ updated: number }> {
    const response = await apiClient.post<{ updated: number }>('/time-tracking/entries/bulk/mark-billable', { ids });
    return response.data;
  },

  async bulkMarkAsBilled(ids: string[]): Promise<{ updated: number }> {
    const response = await apiClient.post<{ updated: number }>('/time-tracking/entries/bulk/mark-billed', { ids });
    return response.data;
  },

  // ============================================================================
  // Timer
  // ============================================================================

  async getRunningTimer(): Promise<RunningTimer | null> {
    try {
      const response = await apiClient.get<RunningTimer>('/time-tracking/timer');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async startTimer(data?: StartTimerRequest): Promise<RunningTimer> {
    const response = await apiClient.post<RunningTimer>('/time-tracking/timer/start', data || {});
    return response.data;
  },

  async stopTimer(data?: StopTimerRequest): Promise<TimeEntry> {
    const response = await apiClient.post<TimeEntry>('/time-tracking/timer/stop', data || {});
    return response.data;
  },

  async updateRunningTimer(data: Partial<StartTimerRequest>): Promise<RunningTimer> {
    const response = await apiClient.patch<RunningTimer>('/time-tracking/timer', data);
    return response.data;
  },

  async discardTimer(): Promise<void> {
    await apiClient.delete('/time-tracking/timer');
  },

  // ============================================================================
  // Projects
  // ============================================================================

  async getProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<PaginatedResponse<Project>>(`/time-tracking/projects?${params}`);
    return response.data;
  },

  async getProject(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/time-tracking/projects/${id}`);
    return response.data;
  },

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<Project>('/time-tracking/projects', data);
    return response.data;
  },

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.patch<Project>(`/time-tracking/projects/${id}`, data);
    return response.data;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/time-tracking/projects/${id}`);
  },

  async archiveProject(id: string): Promise<Project> {
    const response = await apiClient.post<Project>(`/time-tracking/projects/${id}/archive`);
    return response.data;
  },

  // ============================================================================
  // Summary & Stats
  // ============================================================================

  async getSummary(filters?: { startDate?: string; endDate?: string }): Promise<TimeSummary> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get<TimeSummary>(`/time-tracking/summary?${params}`);
    return response.data;
  },

  async exportTimeEntries(filters?: TimeEntryFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.clientId) params.append('clientId', filters.clientId);

    const response = await apiClient.get<Blob>(`/time-tracking/entries/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
