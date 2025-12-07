'use client';

import { useState, useCallback } from 'react';
import {
  isSecureStorageAvailable,
  setSecureToken,
  getSecureToken,
  deleteSecureToken,
} from '@/lib/security/secure-storage.service';

export function useSecureStorage() {
  const [isLoading, setIsLoading] = useState(false);
  const isNativeSecure = isSecureStorageAvailable();

  const storeToken = useCallback(async (key: string, token: string) => {
    setIsLoading(true);
    try {
      return await setSecureToken(key, token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retrieveToken = useCallback(async (key: string) => {
    setIsLoading(true);
    try {
      return await getSecureToken(key);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeToken = useCallback(async (key: string) => {
    setIsLoading(true);
    try {
      return await deleteSecureToken(key);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isNativeSecure,
    isLoading,
    storeToken,
    retrieveToken,
    removeToken,
  };
}
