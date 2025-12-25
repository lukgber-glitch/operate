'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/client';

// Types
export interface AutopilotConfig {
  enabled: boolean;
  features: {
    autoCategorizeTransactions: boolean;
    autoCreateInvoices: boolean;
    autoSendReminders: boolean;
    autoReconcile: boolean;
    autoExtractReceipts: boolean;
    autoPayBills: boolean;
    autoFileExpenses: boolean;
  };
  confidenceThreshold: number; // 0-100
  maxAutoPayAmount: number;
  dailySummary: {
    enabled: boolean;
    time: string; // HH:mm format
  };
}

export type AutopilotActionType =
  | 'CATEGORIZE_TRANSACTION'
  | 'CREATE_INVOICE'
  | 'SEND_REMINDER'
  | 'RECONCILE_TRANSACTION'
  | 'EXTRACT_RECEIPT'
  | 'PAY_BILL'
  | 'FILE_EXPENSE';

export type AutopilotActionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'FAILED';

export interface AutopilotAction {
  id: string;
  type: AutopilotActionType;
  status: AutopilotActionStatus;
  description: string;
  confidence: number; // 0-100
  entityType?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  createdAt: string;
  executedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface AutopilotStats {
  today: {
    actionsCompleted: number;
    pendingApproval: number;
    timeSavedMinutes: number;
    successRate: number;
  };
  thisWeek: {
    actionsCompleted: number;
    timeSavedMinutes: number;
  };
  thisMonth: {
    actionsCompleted: number;
    timeSavedMinutes: number;
  };
}

export interface AutopilotWeeklyData {
  day: string;
  actions: {
    type: AutopilotActionType;
    count: number;
  }[];
}

export interface AutopilotActionFilters {
  type?: AutopilotActionType;
  status?: AutopilotActionStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

class AutopilotApi {
  /**
   * Make API request using apiClient for CSRF support
   * Backend autopilot endpoints are at /autopilot/* (not /organisations/{id}/autopilot/*)
   */
  private async request<T>(
    endpoint: string,
    options: { method?: string; body?: any } = {}
  ): Promise<T> {
    const url = `/autopilot${endpoint}`;

    if (options.method === 'POST') {
      const { data } = await api.post<T>(url, options.body);
      return data;
    } else if (options.method === 'PATCH') {
      const { data } = await api.patch<T>(url, options.body);
      return data;
    } else if (options.method === 'DELETE') {
      const { data } = await api.delete<T>(url);
      return data;
    } else {
      const { data } = await api.get<T>(url);
      return data;
    }
  }

  async getConfig(): Promise<AutopilotConfig> {
    return this.request<AutopilotConfig>('/config');
  }

  async updateConfig(config: Partial<AutopilotConfig>): Promise<AutopilotConfig> {
    return this.request<AutopilotConfig>('/config', {
      method: 'PATCH',
      body: JSON.stringify(config),
    });
  }

  async enableAutopilot(): Promise<AutopilotConfig> {
    return this.request<AutopilotConfig>('/enable', {
      method: 'POST',
    });
  }

  async disableAutopilot(): Promise<AutopilotConfig> {
    return this.request<AutopilotConfig>('/disable', {
      method: 'POST',
    });
  }

  async getActions(filters?: AutopilotActionFilters): Promise<{
    data: AutopilotAction[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<{
      data: AutopilotAction[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/actions?${params.toString()}`);
  }

  async getPendingApprovals(): Promise<AutopilotAction[]> {
    return this.request<AutopilotAction[]>('/actions/pending');
  }

  async approveAction(actionId: string): Promise<AutopilotAction> {
    return this.request<AutopilotAction>(`/actions/${actionId}/approve`, {
      method: 'POST',
    });
  }

  async rejectAction(actionId: string, reason?: string): Promise<AutopilotAction> {
    return this.request<AutopilotAction>(`/actions/${actionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getStats(): Promise<AutopilotStats> {
    return this.request<AutopilotStats>('/stats');
  }

  async getWeeklyData(): Promise<AutopilotWeeklyData[]> {
    return this.request<AutopilotWeeklyData[]>('/stats/weekly');
  }

  async getSummary(date: string): Promise<{
    date: string;
    actions: AutopilotAction[];
    stats: {
      completed: number;
      failed: number;
      timeSaved: number;
    };
  }> {
    return this.request(`/summary?date=${date}`);
  }
}

const autopilotApi = new AutopilotApi();

// Hooks
export function useAutopilotConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState<AutopilotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await autopilotApi.getConfig();
      setConfig(data);
    } catch (error) {
      // Silently handle 404 - autopilot may not be configured yet
      console.debug('Autopilot config not available:', error instanceof Error ? error.message : 'Unknown error');
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (updates: Partial<AutopilotConfig>) => {
    setIsLoading(true);
    try {
      const data = await autopilotApi.updateConfig(updates);
      setConfig(data);
      toast({
        title: 'Success',
        description: 'Autopilot configuration updated',
      });
      return data;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update config',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { config, isLoading, fetchConfig, updateConfig };
}

export function useAutopilotActions(filters?: AutopilotActionFilters) {
  const { toast } = useToast();
  const [actions, setActions] = useState<AutopilotAction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActions = useCallback(async (customFilters?: AutopilotActionFilters) => {
    setIsLoading(true);
    try {
      const data = await autopilotApi.getActions({ ...filters, ...customFilters });
      setActions(data.data);
      setTotal(data.total);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch actions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  return { actions, total, isLoading, fetchActions };
}

export function usePendingApprovals() {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<AutopilotAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await autopilotApi.getPendingApprovals();
      setApprovals(data);
    } catch (error) {
      // Silently handle 404 - autopilot may not be configured yet
      console.debug('Pending approvals not available:', error instanceof Error ? error.message : 'Unknown error');
      setApprovals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { approvals, isLoading, fetchApprovals };
}

export function useApproveAction() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const approveAction = useCallback(async (actionId: string) => {
    setIsLoading(true);
    try {
      const action = await autopilotApi.approveAction(actionId);
      toast({
        title: 'Action Approved',
        description: 'The autopilot action has been approved and executed',
      });
      return action;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve action',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { approveAction, isLoading };
}

export function useRejectAction() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const rejectAction = useCallback(async (actionId: string, reason?: string) => {
    setIsLoading(true);
    try {
      const action = await autopilotApi.rejectAction(actionId, reason);
      toast({
        title: 'Action Rejected',
        description: 'The autopilot action has been rejected',
      });
      return action;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject action',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { rejectAction, isLoading };
}

export function useAutopilotStats() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AutopilotStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await autopilotApi.getStats();
      setStats(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch stats',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { stats, isLoading, fetchStats };
}

export function useAutopilotWeeklyData() {
  const { toast } = useToast();
  const [data, setData] = useState<AutopilotWeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWeeklyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await autopilotApi.getWeeklyData();
      setData(result);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch weekly data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { data, isLoading, fetchWeeklyData };
}

export function useAutopilotSummary(date: string) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = useCallback(async (customDate?: string) => {
    setIsLoading(true);
    try {
      const data = await autopilotApi.getSummary(customDate || date);
      setSummary(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch summary',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [date, toast]);

  return { summary, isLoading, fetchSummary };
}

export function useEnableAutopilot() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const enable = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = await autopilotApi.enableAutopilot();
      toast({
        title: 'Autopilot Enabled',
        description: 'AI Autopilot is now active and monitoring your business',
      });
      return config;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to enable autopilot',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { enable, isLoading };
}

export function useDisableAutopilot() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const disable = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = await autopilotApi.disableAutopilot();
      toast({
        title: 'Autopilot Disabled',
        description: 'AI Autopilot has been turned off',
      });
      return config;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to disable autopilot',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { disable, isLoading };
}
