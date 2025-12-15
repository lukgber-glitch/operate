'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { authApi, type LoginRequest, type RegisterRequest, type MfaVerifyRequest } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  orgId?: string;
}

// Helper to store tokens in cookies
// WAF/proxy only allows ONE Set-Cookie, so we combine both tokens into a JSON cookie
function setAuthCookies(accessToken: string, refreshToken?: string) {
  const authData = JSON.stringify({
    a: accessToken, // access token
    r: refreshToken || '', // refresh token
  });
  document.cookie = `op_auth=${encodeURIComponent(authData)};path=/;max-age=604800;SameSite=Lax`;
}

// Helper to clear auth cookies
function clearAuthCookies() {
  document.cookie = 'op_auth=;path=/;max-age=0';
  document.cookie = 'onboarding_complete=;path=/;max-age=0';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresMfa: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    requiresMfa: false,
    error: null,
  });

  // Expose orgId directly from user state
  const orgId = state.user?.orgId || null;

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get current user - cookies are sent automatically
        const user = await authApi.getCurrentUser();

        // Set orgId in window for API clients to use
        if (typeof window !== 'undefined' && user.orgId) {
          (window as any).__orgId = user.orgId;
        }

        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          requiresMfa: false,
          error: null,
        });
      } catch (error) {
        // No valid session - user is not authenticated
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          requiresMfa: false,
          error: null,
        });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.login(data);

      if (response.requiresMfa) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          requiresMfa: true,
          error: null,
        });
        return { requiresMfa: true };
      }

      // Store tokens in cookies for middleware to check
      if (response.accessToken) {
        setAuthCookies(response.accessToken, response.refreshToken);
      }

      // API returns tokens, not user info - fetch user separately
      let user: User | null = null;
      try {
        user = await authApi.getCurrentUser();
      } catch {
        // If we can't get user info, create minimal user from login response
        user = {
          id: '',
          email: data.email,
          firstName: '',
          lastName: '',
          role: 'user',
        };
      }

      // Set orgId in window for API clients to use
      if (typeof window !== 'undefined' && user?.orgId) {
        (window as any).__orgId = user.orgId;
      }

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        requiresMfa: false,
        error: null,
      });

      return { requiresMfa: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.register(data);

      // Store tokens in cookies for middleware to check
      if (response.accessToken) {
        setAuthCookies(response.accessToken, response.refreshToken);
      }

      // API returns tokens, not user info - fetch user separately or use registration data
      let user: User | null = null;
      try {
        user = await authApi.getCurrentUser();
      } catch {
        // If we can't get user info, create user from registration data
        user = {
          id: '',
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'user',
        };
      }

      // Set orgId in window for API clients to use
      if (typeof window !== 'undefined' && user?.orgId) {
        (window as any).__orgId = user.orgId;
      }

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        requiresMfa: false,
        error: null,
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with local logout even if API fails
    } finally {
      // Clear auth cookies
      clearAuthCookies();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        requiresMfa: false,
        error: null,
      });
    }
  }, []);

  const verifyMfa = useCallback(async (data: MfaVerifyRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.verifyMfa(data);

      // Tokens are now in HTTP-only cookies, no need to store in localStorage

      // Set orgId in window for API clients to use
      if (typeof window !== 'undefined' && response.user.orgId) {
        (window as any).__orgId = response.user.orgId;
      }

      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
        requiresMfa: false,
        error: null,
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MFA verification failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Memoize the return object to prevent unnecessary re-renders in consumers
  // This ensures stable references for all callbacks and derived values
  return useMemo(() => ({
    ...state,
    orgId,
    login,
    register,
    logout,
    verifyMfa,
    clearError,
  }), [state, orgId, login, register, logout, verifyMfa, clearError]);
}
