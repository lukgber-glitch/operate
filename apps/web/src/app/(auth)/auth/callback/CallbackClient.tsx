'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

// Helper to store tokens in cookies (secure, httpOnly should be set by API ideally)
// WAF/proxy only allows ONE Set-Cookie, so we combine both tokens into a JSON cookie
function setAuthCookies(accessToken: string, refreshToken?: string) {
  const authData = JSON.stringify({
    a: accessToken, // access token
    r: refreshToken || '', // refresh token
  });
  document.cookie = `op_auth=${encodeURIComponent(authData)};path=/;max-age=604800;SameSite=Lax`;
}

// Get cookie value by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export default function CallbackClient() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const processedRef = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process the OAuth callback
  const processCallback = useCallback(() => {
    // Prevent double execution
    if (processedRef.current) {
      console.log('[Auth Callback] Already processed, skipping');
      return;
    }
    processedRef.current = true;

    console.log('[Auth Callback] Processing callback...');
    console.log('[Auth Callback] URL:', window.location.href);

    // Parse URL parameters directly
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const error = params.get('error');

    console.log('[Auth Callback] Params:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasError: !!error,
      accessTokenLength: accessToken?.length || 0,
    });

    // Handle error from OAuth provider
    if (error) {
      console.error('[Auth Callback] OAuth error:', error);
      setStatus('error');
      setErrorMessage(
        error === 'oauth_failed'
          ? 'OAuth authentication failed. Please try again.'
          : decodeURIComponent(error)
      );
      return;
    }

    // Handle missing token
    if (!accessToken) {
      console.error('[Auth Callback] No access token in URL');
      setStatus('error');
      setErrorMessage('No authentication token received. Please try again.');
      return;
    }

    try {
      // Store tokens in cookies
      console.log('[Auth Callback] Storing tokens in cookies...');
      setAuthCookies(accessToken, refreshToken || undefined);

      // Verify cookie was set
      const storedToken = getCookie('access_token');
      if (!storedToken) {
        console.error('[Auth Callback] Failed to set cookie');
        setStatus('error');
        setErrorMessage('Failed to save authentication. Please enable cookies and try again.');
        return;
      }

      console.log('[Auth Callback] Tokens stored successfully');
      setStatus('success');

      // Clear any existing timeout
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }

      // Redirect to dashboard after brief delay for UX
      console.log('[Auth Callback] Redirecting to dashboard...');
      redirectTimeoutRef.current = setTimeout(() => {
        // Use window.location for full page navigation to ensure cookies are sent
        window.location.href = '/dashboard';
      }, 1000);

    } catch (err) {
      console.error('[Auth Callback] Error processing callback:', err);
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  }, []);

  // Run on mount
  useEffect(() => {
    console.log('[Auth Callback] Component mounted, processing...');
    processCallback();

    // Cleanup on unmount
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [processCallback]);

  // Fallback: If still processing after 3 seconds, try again
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (status === 'processing' && !processedRef.current) {
        console.log('[Auth Callback] Fallback trigger - retrying processing');
        processedRef.current = false;
        processCallback();
      }
    }, 3000);

    return () => clearTimeout(fallbackTimeout);
  }, [status, processCallback]);

  const getTitle = () => {
    if (status === 'processing') return 'Processing...';
    if (status === 'success') return 'Success!';
    return 'Authentication Failed';
  };

  const getSubtitle = () => {
    if (status === 'processing') return 'Completing your sign in...';
    if (status === 'success') return 'Redirecting to dashboard...';
    return errorMessage;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{getTitle()}</h1>
        <p className="text-muted-foreground">{getSubtitle()}</p>
      </div>
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
        <div className="flex justify-center py-8">
          {status === 'processing' && (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          )}
          {status === 'success' && (
            <div className="text-green-500">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4 text-center">
              <div className="text-destructive">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="text-primary hover:underline font-medium"
              >
                Return to login
              </button>
            </div>
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
