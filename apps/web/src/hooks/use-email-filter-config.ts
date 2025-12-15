import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface EmailFilterConfig {
  id: string;
  orgId: string;
  personalDomainBlocklist: string[];
  serviceProviderWhitelist: string[];
  customDomainBlacklist: string[];
  customDomainWhitelist: string[];
  blockedEmailPatterns: string[];
  skipAutoReplies: boolean;
  skipBulkMail: boolean;
  skipMarketingMail: boolean;
  minEntityConfidence: number;
  minClassificationConfidence: number;
  autoCreateCustomers: boolean;
  autoCreateVendors: boolean;
  requireManualReview: boolean;
  reviewLowConfidence: boolean;
  lowConfidenceThreshold: number;
}

export function useEmailFilterConfig() {
  const [config, setConfig] = useState<EmailFilterConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/email-intelligence/filter-config', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch config');
      const data = await response.json();
      setConfig(data);
      return data;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load filter configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateConfig = useCallback(async (updates: Partial<EmailFilterConfig>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/email-intelligence/filter-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update config');
      const data = await response.json();
      setConfig(data);
      toast({
        title: 'Settings Saved',
        description: 'Email filter configuration updated successfully',
      });
      return data;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const addToBlacklist = useCallback(async (domain: string) => {
    if (!config) return;
    const updated = [...(config.customDomainBlacklist || []), domain.toLowerCase()];
    await updateConfig({ customDomainBlacklist: updated });
  }, [config, updateConfig]);

  const removeFromBlacklist = useCallback(async (domain: string) => {
    if (!config) return;
    const updated = config.customDomainBlacklist.filter(d => d !== domain);
    await updateConfig({ customDomainBlacklist: updated });
  }, [config, updateConfig]);

  const addToWhitelist = useCallback(async (domain: string) => {
    if (!config) return;
    const updated = [...(config.customDomainWhitelist || []), domain.toLowerCase()];
    await updateConfig({ customDomainWhitelist: updated });
  }, [config, updateConfig]);

  const removeFromWhitelist = useCallback(async (domain: string) => {
    if (!config) return;
    const updated = config.customDomainWhitelist.filter(d => d !== domain);
    await updateConfig({ customDomainWhitelist: updated });
  }, [config, updateConfig]);

  const addBlockedPattern = useCallback(async (pattern: string) => {
    if (!config) return;
    const updated = [...(config.blockedEmailPatterns || []), pattern];
    await updateConfig({ blockedEmailPatterns: updated });
  }, [config, updateConfig]);

  const removeBlockedPattern = useCallback(async (pattern: string) => {
    if (!config) return;
    const updated = config.blockedEmailPatterns.filter(p => p !== pattern);
    await updateConfig({ blockedEmailPatterns: updated });
  }, [config, updateConfig]);

  return {
    config,
    loading,
    saving,
    fetchConfig,
    updateConfig,
    addToBlacklist,
    removeFromBlacklist,
    addToWhitelist,
    removeFromWhitelist,
    addBlockedPattern,
    removeBlockedPattern,
  };
}
