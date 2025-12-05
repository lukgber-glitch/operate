'use client';

import { useState, useCallback } from 'react';

interface MfaSetupResponse {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

interface MfaVerifyResponse {
  success: boolean;
  message: string;
}

interface MfaState {
  isLoading: boolean;
  error: string | null;
}

export function useMfa() {
  const [state, setState] = useState<MfaState>({
    isLoading: false,
    error: null,
  });

  const setupMfa = useCallback(async (): Promise<MfaSetupResponse> => {
    setState({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Failed to setup MFA',
        }));
        throw new Error(error.message);
      }

      const data = await response.json();
      setState({ isLoading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to setup MFA';
      setState({ isLoading: false, error: message });
      throw error;
    }
  }, []);

  const verifyMfaSetup = useCallback(async (code: string): Promise<MfaVerifyResponse> => {
    setState({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/auth/mfa/setup/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Invalid verification code',
        }));
        throw new Error(error.message);
      }

      const data = await response.json();
      setState({ isLoading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify MFA code';
      setState({ isLoading: false, error: message });
      throw error;
    }
  }, []);

  const disableMfa = useCallback(async (code: string): Promise<{ success: boolean }> => {
    setState({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Failed to disable MFA',
        }));
        throw new Error(error.message);
      }

      const data = await response.json();
      setState({ isLoading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disable MFA';
      setState({ isLoading: false, error: message });
      throw error;
    }
  }, []);

  const generateBackupCodes = useCallback(async (code: string): Promise<{ backupCodes: string[] }> => {
    setState({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/auth/mfa/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Failed to generate backup codes',
        }));
        throw new Error(error.message);
      }

      const data = await response.json();
      setState({ isLoading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate backup codes';
      setState({ isLoading: false, error: message });
      throw error;
    }
  }, []);

  const verifyBackupCode = useCallback(async (code: string): Promise<{ success: boolean; remainingCodes: number }> => {
    setState({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/auth/mfa/backup-codes/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Invalid backup code',
        }));
        throw new Error(error.message);
      }

      const data = await response.json();
      setState({ isLoading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify backup code';
      setState({ isLoading: false, error: message });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    setupMfa,
    verifyMfaSetup,
    disableMfa,
    generateBackupCodes,
    verifyBackupCode,
    clearError,
  };
}
