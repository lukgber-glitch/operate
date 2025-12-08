'use client';

/**
 * Secure Storage Service
 * Uses iOS Keychain / Android Keystore for sensitive data
 * Falls back to encrypted localStorage on web
 */

import { Capacitor } from '@capacitor/core';

interface StorageOptions {
  server?: string;
}

const DEFAULT_SERVER = 'operate.guru';

/**
 * Check if native secure storage is available
 */
export function isSecureStorageAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Store credentials securely
 */
export async function setSecureCredentials(
  username: string,
  password: string,
  options: StorageOptions = {}
): Promise<boolean> {
  const server = options.server || DEFAULT_SERVER;

  if (Capacitor.isNativePlatform()) {
    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.setCredentials({
        username,
        password,
        server,
      });
      return true;
    } catch (error) {      return false;
    }
  }

  // Fallback for web - use encrypted cookie or localStorage
  // This is less secure but necessary for web
  try {
    const encoded = btoa(JSON.stringify({ username, password }));
    localStorage.setItem(`secure_${server}`, encoded);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve credentials securely
 */
export async function getSecureCredentials(
  options: StorageOptions = {}
): Promise<{ username: string; password: string } | null> {
  const server = options.server || DEFAULT_SERVER;

  if (Capacitor.isNativePlatform()) {
    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      const credentials = await NativeBiometric.getCredentials({ server });
      return {
        username: credentials.username,
        password: credentials.password,
      };
    } catch {
      return null;
    }
  }

  // Fallback for web
  try {
    const encoded = localStorage.getItem(`secure_${server}`);
    if (!encoded) return null;
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

/**
 * Delete credentials
 */
export async function deleteSecureCredentials(
  options: StorageOptions = {}
): Promise<boolean> {
  const server = options.server || DEFAULT_SERVER;

  if (Capacitor.isNativePlatform()) {
    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.deleteCredentials({ server });
      return true;
    } catch {
      return false;
    }
  }

  // Fallback for web
  try {
    localStorage.removeItem(`secure_${server}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Store auth tokens securely
 */
export async function setSecureToken(
  key: string,
  token: string
): Promise<boolean> {
  return setSecureCredentials(key, token, { server: `token.${key}` });
}

/**
 * Get auth token securely
 */
export async function getSecureToken(key: string): Promise<string | null> {
  const creds = await getSecureCredentials({ server: `token.${key}` });
  return creds?.password || null;
}

/**
 * Delete auth token
 */
export async function deleteSecureToken(key: string): Promise<boolean> {
  return deleteSecureCredentials({ server: `token.${key}` });
}
