'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSecureStorage } from './useSecureStorage';

/**
 * AI Consent Management Hook
 *
 * Manages user consent for AI data processing in compliance with:
 * - GDPR (EU)
 * - App Store guidelines (iOS/Android)
 * - Data protection regulations
 *
 * Features:
 * - Secure consent storage
 * - Timestamp tracking
 * - Easy opt-in/opt-out
 * - Offline support with localStorage fallback
 */

const CONSENT_KEY = 'ai_consent_data';
const CONSENT_VERSION = '1.0'; // Increment when consent terms change

export interface AIConsentData {
  hasConsent: boolean;
  timestamp: string;
  version: string;
  ip?: string; // Optional for audit trail
}

// Helper to get initial consent data synchronously from localStorage
function getInitialConsentData(): AIConsentData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AIConsentData;
      // Validate the data structure
      if (typeof parsed.hasConsent === 'boolean' && parsed.version) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('[useAIConsent] Failed to parse initial consent data:', error);
  }
  return null;
}

export function useAIConsent() {
  // Initialize synchronously from localStorage to prevent flash of consent dialog
  const [consentData, setConsentData] = useState<AIConsentData | null>(() => getInitialConsentData());
  const [isLoading, setIsLoading] = useState(false); // Start as false since we loaded sync
  const { storeToken, retrieveToken, removeToken, isNativeSecure } = useSecureStorage();

  // Also check secure storage on mount (may have newer data)
  useEffect(() => {
    loadConsentData();
  }, []);

  const loadConsentData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try secure storage first
      const stored = await retrieveToken(CONSENT_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as AIConsentData;
        setConsentData(parsed);
      } else {
        // Fallback to localStorage for web
        const localStored = localStorage.getItem(CONSENT_KEY);
        if (localStored) {
          const parsed = JSON.parse(localStored) as AIConsentData;
          setConsentData(parsed);
        } else {
          setConsentData(null);
        }
      }
    } catch (error) {
      console.error('Failed to load AI consent data:', error);
      setConsentData(null);
    } finally {
      setIsLoading(false);
    }
  }, [retrieveToken]);

  const giveConsent = useCallback(async () => {
    const newConsentData: AIConsentData = {
      hasConsent: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };

    try {
      const serialized = JSON.stringify(newConsentData);

      // Store in secure storage
      await storeToken(CONSENT_KEY, serialized);

      // Also store in localStorage as backup
      localStorage.setItem(CONSENT_KEY, serialized);

      setConsentData(newConsentData);
      return true;
    } catch (error) {
      console.error('Failed to store AI consent:', error);
      return false;
    }
  }, [storeToken]);

  const revokeConsent = useCallback(async () => {
    const revokedData: AIConsentData = {
      hasConsent: false,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };

    try {
      // Remove from secure storage
      await removeToken(CONSENT_KEY);

      // Store revocation in localStorage for audit
      const serialized = JSON.stringify(revokedData);
      localStorage.setItem(CONSENT_KEY, serialized);

      setConsentData(revokedData);
      return true;
    } catch (error) {
      console.error('Failed to revoke AI consent:', error);
      return false;
    }
  }, [removeToken]);

  const needsConsent = useCallback(() => {
    // User needs to consent if:
    // 1. No consent data exists
    // 2. Consent was revoked
    // 3. Consent version is outdated
    if (!consentData) return true;
    if (!consentData.hasConsent) return true;
    if (consentData.version !== CONSENT_VERSION) return true;
    return false;
  }, [consentData]);

  return {
    // State
    hasConsent: consentData?.hasConsent ?? false,
    consentData,
    isLoading,
    needsConsent: needsConsent(),
    isNativeSecure,

    // Actions
    giveConsent,
    revokeConsent,
    refreshConsent: loadConsentData,
  };
}
