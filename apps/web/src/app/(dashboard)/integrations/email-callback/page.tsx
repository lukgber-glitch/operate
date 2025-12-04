'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Email OAuth Callback Handler
 *
 * Handles OAuth callbacks from Gmail and Outlook integrations.
 * After successful authentication, this page:
 * 1. Extracts connection details from URL params
 * 2. Notifies the parent window (if opened in popup)
 * 3. Redirects back to the appropriate page
 */
export default function EmailCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your email...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for OAuth callback parameters
        const statusParam = searchParams.get('status');
        const email = searchParams.get('email');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        // Determine provider from URL path or referrer
        const provider = searchParams.get('provider') ||
                        (window.location.pathname.includes('gmail') ? 'gmail' : 'outlook');

        if (statusParam === 'connected' && email) {
          // Success
          setStatus('success');
          setMessage(`Successfully connected ${email}`);

          // If opened in popup, notify parent window
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'EMAIL_CONNECTION_SUCCESS',
                provider,
                email,
              },
              window.location.origin
            );

            // Close popup after 2 seconds
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            // If not in popup, redirect to settings or onboarding
            setTimeout(() => {
              const returnUrl = searchParams.get('returnUrl') || '/settings/integrations';
              router.push(returnUrl);
            }, 2000);
          }
        } else if (statusParam === 'error' || error) {
          // Error
          const errorMsg = errorMessage || error || 'Failed to connect email';
          setStatus('error');
          setMessage(errorMsg);

          // If opened in popup, notify parent window
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'EMAIL_CONNECTION_ERROR',
                provider,
                error: errorMsg,
              },
              window.location.origin
            );

            // Close popup after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          }
        } else {
          // Invalid callback - missing required parameters
          setStatus('error');
          setMessage('Invalid callback - missing required parameters');
        }
      } catch (err) {
        console.error('Callback handling error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                Connecting Email
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Email Connected
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-5 h-5 text-destructive" />
                Connection Failed
              </>
            )}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we connect your email...'}
            {status === 'success' && 'Your email has been successfully connected!'}
            {status === 'error' && 'There was a problem connecting your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-center">{message}</p>
          </div>

          {status === 'success' && (
            <div className="text-sm text-muted-foreground text-center">
              {window.opener
                ? 'This window will close automatically...'
                : 'Redirecting you back...'}
            </div>
          )}

          {status === 'error' && !window.opener && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push('/settings/integrations')}
              >
                Go to Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
