'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { MfaInput } from '@/components/auth/mfa-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useMfa } from '@/hooks/use-mfa';

export function MfaSetup() {
  const router = useRouter();
  const { setupMfa, verifyMfaSetup, isLoading, error } = useMfa();
  const [step, setStep] = useState<'loading' | 'setup' | 'verify'>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const initSetup = async () => {
      try {
        const data = await setupMfa();
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes);
        setStep('setup');
      } catch (err) {
        console.error('Failed to initialize MFA setup:', err);
        setStep('setup');
      }
    };

    initSetup();
  }, [setupMfa]);

  const handleVerifyCode = async (code: string) => {
    setVerifyError(null);
    try {
      await verifyMfaSetup(code);
      setStep('verify');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid verification code';
      setVerifyError(message);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  if (step === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-64 mx-auto" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 p-4 rounded-md border border-green-200 dark:border-green-800">
          <p className="font-medium mb-2">Two-factor authentication enabled!</p>
          <p className="text-sm">Your account is now protected with 2FA.</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Backup Codes</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Save these codes in a secure place. You can use them to access your account if you lose your authenticator device.
            </p>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-md font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-background rounded">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => {
              // Download backup codes as text file
              const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'operate-backup-codes.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
            variant="outline"
            className="w-full"
          >
            Download Backup Codes
          </Button>

          <Button onClick={handleComplete} className="w-full">
            Continue to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Step 1: Scan QR Code</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Use an authenticator app like Google Authenticator, Authy, or 1Password to scan this QR code.
          </p>
          {qrCodeUrl ? (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img src={qrCodeUrl} alt="MFA QR Code" className="w-64 h-64" />
            </div>
          ) : (
            <Skeleton className="h-64 w-64 mx-auto" />
          )}
        </div>

        <div>
          <Label className="text-base font-semibold">Step 2: Enter Secret Key (Optional)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            If you can&apos;t scan the QR code, enter this secret key manually:
          </p>
          <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
            {secret || 'Loading...'}
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold">Step 3: Verify Code</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>

          {verifyError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 mb-4">
              {verifyError}
            </div>
          )}

          <MfaInput
            length={6}
            onComplete={handleVerifyCode}
            onError={setVerifyError}
            disabled={isLoading}
            autoSubmit={true}
          />
        </div>
      </div>

      <div className="text-center text-sm">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-muted-foreground hover:underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
