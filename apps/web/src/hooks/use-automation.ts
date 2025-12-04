'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';

interface AutomationFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface AutomationSettings {
  expenseClassification: AutomationFeature;
  deductionSuggestions: AutomationFeature;
  vatCalculation: AutomationFeature;
  receiptOcr: AutomationFeature;
  fraudDetection: AutomationFeature;
  taxDeadlineReminders: AutomationFeature;
  autoBackup: AutomationFeature;
}

interface AutomationHistory {
  id: string;
  feature: string;
  action: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  details?: string;
}

interface UseAutomationSettingsOptions {
  autoFetch?: boolean;
}

export function useAutomationSettings(options: UseAutomationSettingsOptions = {}) {
  const { autoFetch = true } = options;
  const [settings, setSettings] = useState<Partial<AutomationSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/automation/settings', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch automation settings');
      }

      const data = await response.json();
      setSettings(data.data || {});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load automation settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateSetting = async (feature: string, data: Partial<AutomationFeature>) => {
    try {
      const response = await fetch(`/api/v1/automation/settings/${feature}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update automation setting');
      }

      toast({
        title: 'Success',
        description: 'Automation setting updated successfully',
      });

      await fetchSettings();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update automation setting',
        variant: 'destructive',
      });
    }
  };

  const toggleFeature = async (feature: string, enabled: boolean) => {
    await updateSetting(feature, { enabled });
  };

  const updateConfig = async (feature: string, config: Record<string, any>) => {
    await updateSetting(feature, { config });
  };

  const resetToDefaults = async () => {
    try {
      const response = await fetch('/api/v1/automation/settings/reset', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset settings');
      }

      toast({
        title: 'Success',
        description: 'Settings reset to defaults',
      });

      await fetchSettings();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchSettings();
    }
  }, [fetchSettings, autoFetch]);

  return {
    settings,
    isLoading,
    error,
    refetch: fetchSettings,
    updateSetting,
    toggleFeature,
    updateConfig,
    resetToDefaults,
  };
}

interface UseAutomationHistoryOptions {
  autoFetch?: boolean;
  limit?: number;
}

export function useAutomationHistory(options: UseAutomationHistoryOptions = {}) {
  const { autoFetch = true, limit = 50 } = options;
  const [history, setHistory] = useState<AutomationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(
        `/api/v1/automation/history?${params.toString()}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch automation history');
      }

      const data = await response.json();
      setHistory(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load automation history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [fetchHistory, autoFetch]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    type: 'EXPENSE_CREATED' | 'INVOICE_RECEIVED' | 'DOCUMENT_UPLOADED' | 'SCHEDULED';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: string;
    params: Record<string, any>;
  }>;
}

interface UseAutomationRulesOptions {
  autoFetch?: boolean;
}

export function useAutomationRules(options: UseAutomationRulesOptions = {}) {
  const { autoFetch = true } = options;
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/automation/rules', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch automation rules');
      }

      const data = await response.json();
      setRules(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load automation rules',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createRule = async (rule: Omit<AutomationRule, 'id'>) => {
    try {
      const response = await fetch('/api/v1/automation/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        throw new Error('Failed to create automation rule');
      }

      toast({
        title: 'Success',
        description: 'Automation rule created successfully',
      });

      await fetchRules();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create automation rule',
        variant: 'destructive',
      });
    }
  };

  const updateRule = async (ruleId: string, updates: Partial<AutomationRule>) => {
    try {
      const response = await fetch(`/api/v1/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update automation rule');
      }

      toast({
        title: 'Success',
        description: 'Automation rule updated successfully',
      });

      await fetchRules();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update automation rule',
        variant: 'destructive',
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/v1/automation/rules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete automation rule');
      }

      toast({
        title: 'Success',
        description: 'Automation rule deleted successfully',
      });

      await fetchRules();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete automation rule',
        variant: 'destructive',
      });
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    await updateRule(ruleId, { enabled });
  };

  useEffect(() => {
    if (autoFetch) {
      fetchRules();
    }
  }, [fetchRules, autoFetch]);

  return {
    rules,
    isLoading,
    error,
    refetch: fetchRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}
