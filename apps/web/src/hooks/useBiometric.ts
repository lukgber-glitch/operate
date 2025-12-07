'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isBiometricAvailable,
  authenticateWithBiometric,
  getBiometricType,
  getBiometricLabel,
  type BiometricType,
  type BiometricResult,
} from '@/lib/security/biometric.service';

/**
 * React Hook for Biometric Authentication
 *
 * Provides easy access to biometric authentication features in React components.
 * Automatically checks device capabilities on mount and provides authentication methods.
 *
 * @returns Object containing biometric state and authentication methods
 *
 * @example
 * ```typescript
 * function LoginScreen() {
 *   const { isAvailable, biometricType, authenticate } = useBiometric();
 *
 *   const handleBiometricLogin = async () => {
 *     const result = await authenticate('Log in to your account');
 *     if (result.success) {
 *       // Proceed with login
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {isAvailable && (
 *         <button onClick={handleBiometricLogin}>
 *           Login with {biometricType}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBiometric() {
  // State for tracking biometric availability
  const [isAvailable, setIsAvailable] = useState(false);

  // State for the type of biometric (face, fingerprint, iris, none)
  const [biometricType, setBiometricType] = useState<BiometricType>('none');

  // State for tracking ongoing authentication
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check device capabilities on mount
  useEffect(() => {
    checkAvailability();
  }, []);

  /**
   * Check if biometric authentication is available and what type
   */
  const checkAvailability = async () => {
    const available = await isBiometricAvailable();
    setIsAvailable(available);

    if (available) {
      const type = await getBiometricType();
      setBiometricType(type || 'none');
    }
  };

  /**
   * Authenticate the user with biometrics
   *
   * @param reason - Message to show user explaining why authentication is needed
   * @returns Promise with authentication result
   */
  const authenticate = useCallback(async (reason?: string): Promise<BiometricResult> => {
    setIsAuthenticating(true);
    try {
      const result = await authenticateWithBiometric({
        reason: reason || 'Verify your identity',
        title: 'Authentication',
        negativeButtonText: 'Cancel',
        fallbackToPasscode: true,
      });
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  /**
   * Get a user-friendly label for the biometric type
   * e.g., "Face ID", "Fingerprint", "Biometric"
   */
  const label = getBiometricLabel(biometricType);

  return {
    /** Whether biometric authentication is available on this device */
    isAvailable,

    /** The type of biometric authentication ('face', 'fingerprint', 'iris', 'none') */
    biometricType,

    /** User-friendly label for the biometric type (e.g., "Face ID") */
    biometricLabel: label,

    /** Whether an authentication is currently in progress */
    isAuthenticating,

    /** Function to trigger biometric authentication */
    authenticate,

    /** Function to manually re-check biometric availability */
    checkAvailability,
  };
}
