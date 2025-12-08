'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';

export type AutomationMode = 'FULL_AUTO' | 'SEMI_AUTO' | 'MANUAL';

export interface AutomationFeatureConfig {
  enabled: boolean;
  mode: AutomationMode;
  confidenceThreshold: number; // 0-1 (0-100%)
  maxAutoApproveAmount?: number; // Optional amount limit in cents
}

export interface AutomationSettingsData {
  invoiceCreation: AutomationFeatureConfig;
  expenseApproval: AutomationFeatureConfig;
  bankReconciliation: AutomationFeatureConfig;
  taxClassification: AutomationFeatureConfig;
  paymentReminders: AutomationFeatureConfig;
}

export interface AIAccuracyStats {
  invoiceAccuracy: number;
  expenseAccuracy: number;
  taxClassificationAccuracy: number;
  overallAccuracy: number;
  totalProcessed: number;
  lastUpdated: string;
}

const defaultSettings: AutomationSettingsData = {
  invoiceCreation: {
    enabled: false,
    mode: 'MANUAL',
    confidenceThreshold: 0.95,
    maxAutoApproveAmount: 1000000, // 10,000 EUR in cents
  },
  expenseApproval: {
    enabled: true,
    mode: 'SEMI_AUTO',
    confidenceThreshold: 0.85,
    maxAutoApproveAmount: 50000, // 500 EUR in cents
  },
  bankReconciliation: {
    enabled: true,
    mode: 'SEMI_AUTO',
    confidenceThreshold: 0.9,
    maxAutoApproveAmount: 500000, // 5,000 EUR in cents
  },
  taxClassification: {
    enabled: true,
    mode: 'SEMI_AUTO',
    confidenceThreshold: 0.9,
    maxAutoApproveAmount: 500000, // 5,000 EUR in cents
  },
  paymentReminders: {
    enabled: true,
    mode: 'FULL_AUTO',
    confidenceThreshold: 0.8,
  },
};

export function useAutomationSettings() {
  const [settings, setSettings] = useState<AutomationSettingsData>(defaultSettings);
  const [accuracyStats, setAccuracyStats] = useState<AIAccuracyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

      // Merge with defaults to ensure all fields exist
      const mergedSettings = {
        ...defaultSettings,
        ...data.data,
      };

      setSettings(mergedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      // Use default settings on error
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchAccuracyStats = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/automation/accuracy-stats', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAccuracyStats(data.data);
      }
    } catch (err) {
      // Stats are optional, don't show error
    }
  }, []);

  const saveSettings = async (updatedSettings: AutomationSettingsData): Promise<boolean> => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/automation/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save automation settings');
      }

      const data = await response.json();
      setSettings(data.data);

      toast({
        title: 'Settings saved',
        description: 'Your automation preferences have been updated successfully.',
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Error saving settings',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateFeature = (
    feature: keyof AutomationSettingsData,
    updates: Partial<AutomationFeatureConfig>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        ...updates,
      },
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    toast({
      title: 'Settings reset',
      description: 'Automation settings have been reset to defaults.',
    });
  };

  useEffect(() => {
    fetchSettings();
    fetchAccuracyStats();
  }, [fetchSettings, fetchAccuracyStats]);

  return {
    settings,
    accuracyStats,
    isLoading,
    isSaving,
    error,
    updateFeature,
    saveSettings,
    resetToDefaults,
    refetch: fetchSettings,
  };
}
