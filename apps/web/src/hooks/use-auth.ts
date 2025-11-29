'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi, type LoginRequest, type RegisterRequest, type MfaVerifyRequest } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
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

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get current user - cookies are sent automatically
        const user = await authApi.getCurrentUser();
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

      // Tokens are now in HTTP-only cookies, no need to store in localStorage

      setState({
        user: response.user,
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

      // Tokens are now in HTTP-only cookies, no need to store in localStorage

      setState({
        user: response.user,
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
      console.error('Logout error:', error);
    } finally {
      // Cookies are cleared by the server, no need to remove from localStorage
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

  return {
    ...state,
    login,
    register,
    logout,
    verifyMfa,
    clearError,
  };
}
