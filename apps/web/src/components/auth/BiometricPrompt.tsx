'use client';

import React, { useEffect, useState } from 'react';
import { useBiometric } from '@/hooks/useBiometric';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BiometricPromptProps {
  /** Whether the prompt is open */
  open: boolean;

  /** Callback when prompt is closed */
  onClose: () => void;

  /** Callback when authentication succeeds */
  onSuccess: () => void;

  /** Callback when authentication fails */
  onError?: (error: string) => void;

  /** Custom message to show user */
  message?: string;

  /** Custom title for the prompt */
  title?: string;

  /** Whether to allow skipping biometric auth */
  allowSkip?: boolean;
}

/**
 * BiometricPrompt Component
 *
 * A modal dialog that prompts the user to authenticate using biometrics.
 * Falls back gracefully if biometrics are not available.
 *
 * @example
 * ```tsx
 * const [showPrompt, setShowPrompt] = useState(false);
 *
 * <BiometricPrompt
 *   open={showPrompt}
 *   onClose={() => setShowPrompt(false)}
 *   onSuccess={() => {
 * *     setShowPrompt(false);
 *   }}
 *   message="Unlock to access your account"
 *   allowSkip={true}
 * />
 * ```
 */
export function BiometricPrompt({
  open,
  onClose,
  onSuccess,
  onError,
  message = 'Verify your identity to continue',
  title = 'Biometric Authentication',
  allowSkip = true,
}: BiometricPromptProps) {
  const { isAvailable, biometricLabel, authenticate, isAuthenticating } = useBiometric();
  const [error, setError] = useState<string | null>(null);

  // Auto-trigger authentication when prompt opens (if biometric is available)
  useEffect(() => {
    if (open && isAvailable && !isAuthenticating) {
      handleAuthenticate();
    }
  }, [open, isAvailable]);

  /**
   * Handle biometric authentication
   */
  const handleAuthenticate = async () => {
    setError(null);

    const result = await authenticate(message);

    if (result.success) {
      onSuccess();
    } else {
      const errorMsg = result.error || 'Authentication failed';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  /**
   * Handle skip action
   */
  const handleSkip = () => {
    setError(null);
    onClose();
  };

  // If biometrics not available, show fallback message
  if (!isAvailable) {
    return (
      <AlertDialog open={open} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biometric Authentication Unavailable</AlertDialogTitle>
            <AlertDialogDescription>
              Biometric authentication is not available on this device. Please use your password instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={onClose}>OK</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <AlertDialogFooter className="flex gap-2">
          {allowSkip && (
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isAuthenticating}
            >
              Skip
            </Button>
          )}

          <Button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? 'Authenticating...' : `Use ${biometricLabel}`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
