/**
 * Secure Storage Service Tests
 */

import { Capacitor } from '@capacitor/core';
import {
  isSecureStorageAvailable,
  setSecureCredentials,
  getSecureCredentials,
  deleteSecureCredentials,
  setSecureToken,
  getSecureToken,
  deleteSecureToken,
} from '../secure-storage.service';

// Mock Capacitor
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

// Mock the native biometric plugin
const mockNativeBiometric = {
  setCredentials: jest.fn(),
  getCredentials: jest.fn(),
  deleteCredentials: jest.fn(),
};

jest.mock('@capgo/capacitor-native-biometric', () => ({
  NativeBiometric: mockNativeBiometric,
}));

describe('Secure Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('isSecureStorageAvailable', () => {
    it('should return true on native platform', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      expect(isSecureStorageAvailable()).toBe(true);
    });

    it('should return false on web platform', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      expect(isSecureStorageAvailable()).toBe(false);
    });
  });

  describe('Native Platform Storage', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    });

    describe('setSecureCredentials', () => {
      it('should store credentials using NativeBiometric on native', async () => {
        mockNativeBiometric.setCredentials.mockResolvedValue(undefined);

        const result = await setSecureCredentials('user@example.com', 'password123');

        expect(result).toBe(true);
        expect(mockNativeBiometric.setCredentials).toHaveBeenCalledWith({
          username: 'user@example.com',
          password: 'password123',
          server: 'operate.guru',
        });
      });

      it('should use custom server option', async () => {
        mockNativeBiometric.setCredentials.mockResolvedValue(undefined);

        await setSecureCredentials('user@example.com', 'password123', {
          server: 'custom.server.com',
        });

        expect(mockNativeBiometric.setCredentials).toHaveBeenCalledWith({
          username: 'user@example.com',
          password: 'password123',
          server: 'custom.server.com',
        });
      });

      it('should return false on error', async () => {
        mockNativeBiometric.setCredentials.mockRejectedValue(new Error('Storage error'));

        const result = await setSecureCredentials('user@example.com', 'password123');

        expect(result).toBe(false);
      });
    });

    describe('getSecureCredentials', () => {
      it('should retrieve credentials using NativeBiometric on native', async () => {
        mockNativeBiometric.getCredentials.mockResolvedValue({
          username: 'user@example.com',
          password: 'password123',
        });

        const result = await getSecureCredentials();

        expect(result).toEqual({
          username: 'user@example.com',
          password: 'password123',
        });
        expect(mockNativeBiometric.getCredentials).toHaveBeenCalledWith({
          server: 'operate.guru',
        });
      });

      it('should return null on error', async () => {
        mockNativeBiometric.getCredentials.mockRejectedValue(new Error('Not found'));

        const result = await getSecureCredentials();

        expect(result).toBeNull();
      });
    });

    describe('deleteSecureCredentials', () => {
      it('should delete credentials using NativeBiometric on native', async () => {
        mockNativeBiometric.deleteCredentials.mockResolvedValue(undefined);

        const result = await deleteSecureCredentials();

        expect(result).toBe(true);
        expect(mockNativeBiometric.deleteCredentials).toHaveBeenCalledWith({
          server: 'operate.guru',
        });
      });

      it('should return false on error', async () => {
        mockNativeBiometric.deleteCredentials.mockRejectedValue(new Error('Delete error'));

        const result = await deleteSecureCredentials();

        expect(result).toBe(false);
      });
    });
  });

  describe('Web Platform Storage (Fallback)', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    });

    describe('setSecureCredentials', () => {
      it('should store credentials in localStorage on web', async () => {
        const result = await setSecureCredentials('user@example.com', 'password123');

        expect(result).toBe(true);

        const stored = localStorage.getItem('secure_operate.guru');
        expect(stored).toBeTruthy();

        const decoded = JSON.parse(atob(stored!));
        expect(decoded).toEqual({
          username: 'user@example.com',
          password: 'password123',
        });
      });

      it('should use custom server option', async () => {
        await setSecureCredentials('user@example.com', 'password123', {
          server: 'custom.server.com',
        });

        const stored = localStorage.getItem('secure_custom.server.com');
        expect(stored).toBeTruthy();
      });

      it('should return false on localStorage error', async () => {
        // Mock localStorage.setItem to throw
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = jest.fn(() => {
          throw new Error('Quota exceeded');
        });

        const result = await setSecureCredentials('user@example.com', 'password123');

        expect(result).toBe(false);

        // Restore
        Storage.prototype.setItem = originalSetItem;
      });
    });

    describe('getSecureCredentials', () => {
      it('should retrieve credentials from localStorage on web', async () => {
        const credentials = { username: 'user@example.com', password: 'password123' };
        const encoded = btoa(JSON.stringify(credentials));
        localStorage.setItem('secure_operate.guru', encoded);

        const result = await getSecureCredentials();

        expect(result).toEqual(credentials);
      });

      it('should return null if not found', async () => {
        const result = await getSecureCredentials();

        expect(result).toBeNull();
      });

      it('should return null on parse error', async () => {
        localStorage.setItem('secure_operate.guru', 'invalid-base64!!!');

        const result = await getSecureCredentials();

        expect(result).toBeNull();
      });
    });

    describe('deleteSecureCredentials', () => {
      it('should delete credentials from localStorage on web', async () => {
        localStorage.setItem('secure_operate.guru', 'some-data');

        const result = await deleteSecureCredentials();

        expect(result).toBe(true);
        expect(localStorage.getItem('secure_operate.guru')).toBeNull();
      });

      it('should return false on error', async () => {
        // Mock localStorage.removeItem to throw
        const originalRemoveItem = Storage.prototype.removeItem;
        Storage.prototype.removeItem = jest.fn(() => {
          throw new Error('Storage error');
        });

        const result = await deleteSecureCredentials();

        expect(result).toBe(false);

        // Restore
        Storage.prototype.removeItem = originalRemoveItem;
      });
    });
  });

  describe('Token Storage Helpers', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    });

    describe('setSecureToken', () => {
      it('should store token with prefixed server name', async () => {
        const result = await setSecureToken('access_token', 'abc123');

        expect(result).toBe(true);

        const stored = localStorage.getItem('secure_token.access_token');
        expect(stored).toBeTruthy();

        const decoded = JSON.parse(atob(stored!));
        expect(decoded.password).toBe('abc123');
      });
    });

    describe('getSecureToken', () => {
      it('should retrieve token from storage', async () => {
        await setSecureToken('access_token', 'abc123');

        const result = await getSecureToken('access_token');

        expect(result).toBe('abc123');
      });

      it('should return null if token not found', async () => {
        const result = await getSecureToken('nonexistent_token');

        expect(result).toBeNull();
      });
    });

    describe('deleteSecureToken', () => {
      it('should delete token from storage', async () => {
        await setSecureToken('access_token', 'abc123');

        const result = await deleteSecureToken('access_token');

        expect(result).toBe(true);

        const token = await getSecureToken('access_token');
        expect(token).toBeNull();
      });
    });
  });
});
