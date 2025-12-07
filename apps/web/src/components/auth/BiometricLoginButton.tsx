'use client';

import React, { useState, useEffect } from 'react';
import { useBiometric } from '@/hooks/useBiometric';
import { Button } from '@/components/ui/button';
import { Fingerprint } from 'lucide-react';

interface BiometricLoginButtonProps {
  /** Callback when biometric authentication succeeds */
  onSuccess: () => void;

  /** Callback when authentication fails */
  onError?: (error: string) => void;

  /** Whether the button should be disabled */
  disabled?: boolean;

  /** Custom class name */
  className?: string;
}

/**
 * BiometricLoginButton Component
 *
 * A button that triggers biometric authentication for login.
 * Only shows if biometric authentication is available on the device.
 *
 * @example
 * ```tsx
 * <BiometricLoginButton
 *   onSuccess={() => {
 *     // Complete login flow
 *     router.push('/dashboard');
 *   }}
 *   onError={(error) => {
 *     toast.error(error);
 *   }}
 * />
 * ```
 */
export function BiometricLoginButton({
  onSuccess,
  onError,
  disabled = false,
  className,
}: BiometricLoginButtonProps) {
  const { isAvailable, biometricLabel, authenticate, isAuthenticating } = useBiometric();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted (avoid SSR issues)
  if (!mounted) {
    return null;
  }

  // Don't show button if biometric is not available
  if (!isAvailable) {
    return null;
  }

  const handleClick = async () => {
    const result = await authenticate('Log in to your account');

    if (result.success) {
      onSuccess();
    } else if (onError && result.error) {
      onError(result.error);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || isAuthenticating}
      className={className}
    >
      <Fingerprint className="mr-2 h-4 w-4" />
      {isAuthenticating ? 'Authenticating...' : `Login with ${biometricLabel}`}
    </Button>
  );
}
