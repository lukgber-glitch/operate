'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
 *
 * CRITICAL: This hook handles SSR hydration carefully to prevent
 * the consent dialog from flashing. We start with isLoading=true
 * and only set it to false after checking localStorage on the client.
 */

const CONSENT_KEY = 'ai_consent_data';
const CONSENT_VERSION = '1.0'; // Increment when consent terms change

export interface AIConsentData {
  hasConsent: boolean;
  timestamp: string;
  version: string;
  ip?: string; // Optional for audit trail
}

// Helper to get consent data synchronously from localStorage
function getConsentFromLocalStorage(): AIConsentData | null {
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
    console.error('[useAIConsent] Failed to parse consent data:', error);
  }
  return null;
}

export function useAIConsent() {
  // CRITICAL: Start with isLoading=true ALWAYS to prevent flash during SSR hydration
  // During SSR: window is undefined, so we can't read localStorage
  // During hydration: React keeps the server state (null consent, loading=true)
  // After hydration: useEffect runs and syncs from localStorage
  const [consentData, setConsentData] = useState<AIConsentData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // ALWAYS start as true
  const hasInitialized = useRef(false);
  const { storeToken, retrieveToken, removeToken, isNativeSecure } = useSecureStorage();

  // CRITICAL: Sync from localStorage IMMEDIATELY on client mount
  // This runs synchronously before any async operations
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Immediately sync from localStorage (synchronous)
    const localData = getConsentFromLocalStorage();
    if (localData) {
      setConsentData(localData);
      setIsLoading(false);
      console.log('[useAIConsent] Loaded from localStorage:', localData.hasConsent);
      return; // Don't need async load if we found data
    }

    // Only do async load if localStorage didn't have data
    loadConsentDataAsync();
  }, []);

  const loadConsentDataAsync = async () => {
    try {
      // Try secure storage (for native apps)
      const stored = await retrieveToken(CONSENT_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as AIConsentData;
        setConsentData(parsed);
        console.log('[useAIConsent] Loaded from secure storage:', parsed.hasConsent);
      } else {
        // Check localStorage one more time
        const localStored = localStorage.getItem(CONSENT_KEY);
        if (localStored) {
          const parsed = JSON.parse(localStored) as AIConsentData;
          setConsentData(parsed);
          console.log('[useAIConsent] Loaded from localStorage (fallback):', parsed.hasConsent);
        } else {
          setConsentData(null);
          console.log('[useAIConsent] No consent data found');
        }
      }
    } catch (error) {
      console.error('[useAIConsent] Failed to load consent data:', error);
      setConsentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const giveConsent = useCallback(async () => {
    const newConsentData: AIConsentData = {
      hasConsent: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };

    try {
      const serialized = JSON.stringify(newConsentData);

      // Store in localStorage FIRST (synchronous, reliable)
      localStorage.setItem(CONSENT_KEY, serialized);
      console.log('[useAIConsent] Consent saved to localStorage');

      // Then try secure storage (async, may fail)
      try {
        await storeToken(CONSENT_KEY, serialized);
        console.log('[useAIConsent] Consent saved to secure storage');
      } catch (secureError) {
        console.warn('[useAIConsent] Could not save to secure storage:', secureError);
      }

      setConsentData(newConsentData);
      return true;
    } catch (error) {
      console.error('[useAIConsent] Failed to store AI consent:', error);
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
      console.error('[useAIConsent] Failed to revoke AI consent:', error);
      return false;
    }
  }, [removeToken]);

  // Compute needsConsent based on current state
  const needsConsent = (() => {
    // User needs to consent if:
    // 1. No consent data exists
    // 2. Consent was revoked
    // 3. Consent version is outdated
    if (!consentData) return true;
    if (!consentData.hasConsent) return true;
    if (consentData.version !== CONSENT_VERSION) return true;
    return false;
  })();

  return {
    // State
    hasConsent: consentData?.hasConsent ?? false,
    consentData,
    isLoading,
    needsConsent,
    isNativeSecure,

    // Actions
    giveConsent,
    revokeConsent,
    refreshConsent: loadConsentDataAsync,
  };
}
