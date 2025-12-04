'use client';

import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBankConnections } from '@/hooks/use-bank-connections';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeConnection } = useBankConnections();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        setStatus('error');
        setErrorMessage(
          errorDescription || error || 'Authorization failed. Please try again.'
        );
        return;
      }

      // Check for required parameters
      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Invalid callback parameters. Please try again.');
        return;
      }

      try {
        // Complete the connection with the authorization code
        await completeConnection({ code, state });
        setStatus('success');

        // Redirect to bank accounts page after 2 seconds
        setTimeout(() => {
          router.push('/finance/bank-accounts');
        }, 2000);
      } catch (error) {
        setStatus('error');
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Failed to connect bank account. Please try again.'
        );
      }
    };

    handleCallback();
  }, [searchParams, completeConnection, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Connecting Bank Account'}
            {status === 'success' && 'Connection Successful'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-center text-muted-foreground">
                Please wait while we connect your bank account...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-2">
                  Your bank account has been connected successfully!
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to your bank accounts...
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
                <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-2">Failed to connect bank account</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {errorMessage}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/finance/bank-accounts')}
                >
                  Back to Bank Accounts
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BankAccountCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 p-8">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
