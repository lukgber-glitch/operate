/**
 * useSecureStorage Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useSecureStorage } from '../useSecureStorage';
import * as secureStorageService from '@/lib/security/secure-storage.service';

// Mock the secure storage service
jest.mock('@/lib/security/secure-storage.service');

describe('useSecureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct defaults', () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useSecureStorage());

      expect(result.current.isNativeSecure).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.storeToken).toBe('function');
      expect(typeof result.current.retrieveToken).toBe('function');
      expect(typeof result.current.removeToken).toBe('function');
    });

    it('should detect non-native platform', () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useSecureStorage());

      expect(result.current.isNativeSecure).toBe(false);
    });
  });

  describe('storeToken', () => {
    it('should store token successfully', async () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);
      (secureStorageService.setSecureToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useSecureStorage());

      let storeResult: boolean | undefined;
      await act(async () => {
        storeResult = await result.current.storeToken('access_token', 'abc123');
      });

      expect(storeResult).toBe(true);
      expect(secureStorageService.setSecureToken).toHaveBeenCalledWith('access_token', 'abc123');
    });

    it('should set loading state during storage', async () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);
      (secureStorageService.setSecureToken as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
      );

      const { result } = renderHook(() => useSecureStorage());

      expect(result.current.isLoading).toBe(false);

      const storePromise = act(async () => {
        await result.current.storeToken('access_token', 'abc123');
      });

      // Should be loading during the operation
      expect(result.current.isLoading).toBe(true);

      await storePromise;

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle storage errors', async () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);
      (secureStorageService.setSecureToken as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useSecureStorage());

      let storeResult: boolean | undefined;
      await act(async () => {
        storeResult = await result.current.storeToken('access_token', 'abc123');
      });

      expect(storeResult).toBe(false);
    });
  });

  describe('retrieveToken', () => {
    it('should retrieve token successfully', async () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);
      (secureStorageService.getSecureToken as jest.Mock).mockResolvedValue('abc123');

      const { result } = renderHook(() => useSecureStorage());

      let token: string | null | undefined;
      await act(async () => {
        token = await result.current.retrieveToken('access_token');
      });

      expect(token).toBe('abc123');
      expect(secureStorageService.getSecureToken).toHaveBeenCalledWith('access_token');
    });

    it('should set loading state during retrieval', async () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);
      (secureStorageService.getSecureToken as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('abc123'), 100))
      );

      const { result } = renderHook(() => useSecureStorage());

      expect(result.current.isLoading).toBe(false);

      const retrievePromise = act(async () => {
        await result.current.retrieveToken('access_token');
      });

      // Should be loading during the operation
      expect(result.current.isLoading).toBe(true);

      await retrievePromise;

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false);
    });

    it('should return null if token not found', async () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);
      (secureStorageService.getSecureToken as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useSecureStorage());

      let token: string | null | undefined;
      await act(async () => {
        token = await result.current.retrieveToken('nonexistent_token');
      });

      expect(token).toBeNull();
    });
  });

  describe('removeToken', () => {
    it('should remove token successfully', async () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);
      (secureStorageService.deleteSecureToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useSecureStorage());

      let removeResult: boolean | undefined;
      await act(async () => {
        removeResult = await result.current.removeToken('access_token');
      });

      expect(removeResult).toBe(true);
      expect(secureStorageService.deleteSecureToken).toHaveBeenCalledWith('access_token');
    });

    it('should set loading state during removal', async () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);
      (secureStorageService.deleteSecureToken as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
      );

      const { result } = renderHook(() => useSecureStorage());

      expect(result.current.isLoading).toBe(false);

      const removePromise = act(async () => {
        await result.current.removeToken('access_token');
      });

      // Should be loading during the operation
      expect(result.current.isLoading).toBe(true);

      await removePromise;

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle removal errors', async () => {
      (secureStorageService.isSecureStorageAvailable as jest.Mock).mockReturnValue(true);
      (secureStorageService.deleteSecureToken as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useSecureStorage());

      let removeResult: boolean | undefined;
      await act(async () => {
        removeResult = await result.current.removeToken('access_token');
      });

      expect(removeResult).toBe(false);
    });
  });
});
