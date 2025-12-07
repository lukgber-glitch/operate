'use client';

/**
 * Biometric Authentication Service
 * Provides Face ID / Touch ID / Fingerprint authentication for mobile devices
 *
 * This service wraps the Capacitor Native Biometric plugin to provide:
 * - Face ID on iOS devices
 * - Touch ID on iOS devices
 * - Fingerprint authentication on Android devices
 *
 * @module BiometricService
 */

import { Capacitor } from '@capacitor/core';

// Types for biometric authentication
export interface BiometricOptions {
  /** Message shown to user explaining why authentication is needed */
  reason?: string;
  /** Title of the authentication dialog */
  title?: string;
  /** Subtitle of the authentication dialog */
  subtitle?: string;
  /** Additional description text */
  description?: string;
  /** Text for the cancel/negative button */
  negativeButtonText?: string;
  /** Whether to allow fallback to device passcode */
  fallbackToPasscode?: boolean;
}

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

export interface BiometricResult {
  /** Whether authentication was successful */
  success: boolean;
  /** Error message if authentication failed */
  error?: string;
  /** Type of biometric authentication available on device */
  biometricType?: BiometricType;
}

/**
 * Check if biometric authentication is available on the current device
 *
 * @returns Promise<boolean> - True if biometric auth is available
 *
 * @example
 * ```typescript
 * const canUseBiometric = await isBiometricAvailable();
 * if (canUseBiometric) {
 *   // Show biometric option to user
 * }
 * ```
 */
export async function isBiometricAvailable(): Promise<boolean> {
  // Biometrics only work on native mobile platforms
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch (error) {
    console.warn('Biometric availability check failed:', error);
    return false;
  }
}

/**
 * Authenticate user using biometric authentication (Face ID, Touch ID, or Fingerprint)
 *
 * @param options - Configuration options for the authentication prompt
 * @returns Promise<BiometricResult> - Result of authentication attempt
 *
 * @example
 * ```typescript
 * const result = await authenticateWithBiometric({
 *   reason: 'Unlock your account',
 *   title: 'Biometric Authentication'
 * });
 *
 * if (result.success) {
 *   // User authenticated successfully
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function authenticateWithBiometric(
  options: BiometricOptions = {}
): Promise<BiometricResult> {
  // Biometrics only work on native mobile platforms
  if (!Capacitor.isNativePlatform()) {
    return {
      success: false,
      error: 'Biometric authentication is only available on mobile devices'
    };
  }

  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');

    // Verify identity using biometric authentication
    await NativeBiometric.verifyIdentity({
      reason: options.reason || 'Verify your identity',
      title: options.title || 'Authentication',
      subtitle: options.subtitle,
      description: options.description,
      negativeButtonText: options.negativeButtonText || 'Cancel',
      useFallback: options.fallbackToPasscode ?? true,
    });

    return { success: true };
  } catch (error) {
    // Handle authentication errors
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';

    // Don't log user cancellation as an error
    if (errorMessage.includes('cancel') || errorMessage.includes('user')) {
      return {
        success: false,
        error: 'Authentication cancelled by user',
      };
    }

    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get the type of biometric authentication available on the current device
 *
 * @returns Promise<BiometricType> - The type of biometric auth ('face', 'fingerprint', 'iris', or 'none')
 *
 * @example
 * ```typescript
 * const type = await getBiometricType();
 * if (type === 'face') {
 *   console.log('Face ID is available');
 * } else if (type === 'fingerprint') {
 *   console.log('Fingerprint is available');
 * }
 * ```
 */
export async function getBiometricType(): Promise<BiometricType> {
  // Biometrics only work on native mobile platforms
  if (!Capacitor.isNativePlatform()) {
    return 'none';
  }

  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
    const result = await NativeBiometric.isAvailable();

    // Map biometry type codes to friendly names
    // 1 = Fingerprint, 2 = Face, 3 = Iris
    if (result.biometryType === 1) return 'fingerprint';
    if (result.biometryType === 2) return 'face';
    if (result.biometryType === 3) return 'iris';

    return 'none';
  } catch (error) {
    console.warn('Failed to get biometric type:', error);
    return 'none';
  }
}

/**
 * Get a user-friendly label for the biometric type
 *
 * @param type - The biometric type
 * @returns A user-friendly label
 *
 * @example
 * ```typescript
 * const label = getBiometricLabel('face'); // Returns "Face ID"
 * ```
 */
export function getBiometricLabel(type: BiometricType): string {
  switch (type) {
    case 'face':
      return 'Face ID';
    case 'fingerprint':
      return 'Fingerprint';
    case 'iris':
      return 'Iris';
    default:
      return 'Biometric';
  }
}
