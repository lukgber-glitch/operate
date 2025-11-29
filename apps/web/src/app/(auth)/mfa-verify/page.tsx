'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MfaInput } from '@/components/auth/mfa-input';
import { useAuth } from '@/hooks/use-auth';

export default function MfaVerifyPage() {
  const router = useRouter();
  const { verifyMfa } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(false);

  const handleMfaComplete = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await verifyMfa({ code, rememberDevice });
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid verification code';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaError = (error: string) => {
    setError(error);
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Two-factor authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <MfaInput
            length={6}
            onComplete={handleMfaComplete}
            onError={handleMfaError}
            disabled={isLoading}
            autoSubmit={!rememberDevice}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberDevice"
              checked={rememberDevice}
              onCheckedChange={(checked: boolean) => setRememberDevice(checked)}
              disabled={isLoading}
            />
            <Label
              htmlFor="rememberDevice"
              className="text-sm font-normal cursor-pointer"
            >
              Remember this device for 30 days
            </Label>
          </div>

          {rememberDevice && (
            <Button
              onClick={() => {
                const code = Array.from({ length: 6 }, (_, i) => {
                  const input = document.querySelector(`input[aria-label="Digit ${i + 1}"]`) as HTMLInputElement;
                  return input?.value || '';
                }).join('');
                if (code.length === 6) {
                  handleMfaComplete(code);
                }
              }}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          )}
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Lost access to your device? </span>
          <button className="text-primary hover:underline font-medium">
            Use backup code
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
