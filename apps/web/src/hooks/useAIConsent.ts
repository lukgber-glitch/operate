'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSecureStorage } from './useSecureStorage';
import { useAuth } from './use-auth';

/**
 * AI Consent Management Hook
 *
 * Manages user consent for AI data processing in compliance with:
 * - GDPR (EU)
 * - App Store guidelines (iOS/Android)
 * - Data protection regulations
 *
 * Features:
 * - Database persistence (primary)
 * - LocalStorage cache (for quick access)
 * - Timestamp tracking
 * - Easy opt-in/opt-out
 * - Syncs across browsers/devices via database
 *
 * CRITICAL: This hook handles SSR hydration carefully to prevent
 * the consent dialog from flashing. We start with isLoading=true
 * and only set it to false after checking the backend.
 */

const CONSENT_KEY = 'ai_consent_data';
const CONSENT_VERSION = '1.0'; // Increment when consent terms change

export interface AIConsentData {
  hasConsent: boolean;
  timestamp: string;
  version: string;
  ip?: string; // Optional for audit trail
}

// Helper to get consent data synchronously from localStorage (cache only)
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

// Helper to get token from cookie
function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const parts = cookie.trim().split('=');
      const name = parts[0];
      const value = parts.slice(1).join('='); // Handle values with '=' in them
      if (name === 'op_auth' && value) {
        const decoded = decodeURIComponent(value);
        const authData = JSON.parse(decoded);
        return authData.a || null; // 'a' is the access token
      }
    }
  } catch (error) {
    console.error('[useAIConsent] Failed to get token from cookie:', error);
  }
  return null;
}

export function useAIConsent() {
  // CRITICAL: Start with isLoading=true ALWAYS to prevent flash during SSR hydration
  const [consentData, setConsentData] = useState<AIConsentData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // ALWAYS start as true
  const hasInitialized = useRef(false);
  const { storeToken, retrieveToken, removeToken, isNativeSecure } = useSecureStorage();
  const { isAuthenticated } = useAuth();

  // Fetch consent status from backend API
  const fetchConsentFromBackend = useCallback(async (): Promise<AIConsentData | null> => {
    const token = getTokenFromCookie();
    if (!token) return null;

    try {
      const response = await fetch('/api/v1/users/me/ai-consent', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasConsent) {
          return {
            hasConsent: true,
            timestamp: data.consentedAt,
            version: CONSENT_VERSION,
          };
        }
      }
    } catch (error) {
      console.error('[useAIConsent] Failed to fetch from backend:', error);
    }
    return null;
  }, []);

  // Save consent to backend API
  const saveConsentToBackend = useCallback(async (): Promise<boolean> => {
    const token = getTokenFromCookie();
    if (!token) return false;

    try {
      const response = await fetch('/api/v1/users/me/ai-consent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      console.error('[useAIConsent] Failed to save to backend:', error);
      return false;
    }
  }, []);

  // CRITICAL: Sync from localStorage IMMEDIATELY on client mount, then check backend
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Immediately sync from localStorage (synchronous cache)
    const localData = getConsentFromLocalStorage();
    if (localData) {
      setConsentData(localData);
      console.log('[useAIConsent] Loaded from localStorage cache:', localData.hasConsent);
    }

    // Then check backend for authoritative state
    loadConsentDataAsync();
  }, []);

  // Re-check backend when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadConsentDataAsync();
    }
  }, [isAuthenticated]);

  const loadConsentDataAsync = async () => {
    try {
      // First priority: Check backend (authoritative source)
      const token = getTokenFromCookie();
      if (token) {
        const backendData = await fetchConsentFromBackend();
        if (backendData) {
          setConsentData(backendData);
          // Update localStorage cache
          localStorage.setItem(CONSENT_KEY, JSON.stringify(backendData));
          console.log('[useAIConsent] Loaded from backend:', backendData.hasConsent);
          setIsLoading(false);
          return;
        }
      }

      // Fallback: Check secure storage (for native apps)
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

      // Save to backend (primary persistence)
      const backendSuccess = await saveConsentToBackend();
      if (backendSuccess) {
        console.log('[useAIConsent] Consent saved to backend');
      } else {
        console.warn('[useAIConsent] Could not save to backend');
      }

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
  }, [storeToken, saveConsentToBackend]);

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
