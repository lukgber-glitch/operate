'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '@/lib/auth';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }

      try {
        const response = await authApi.verifyEmail({ token });
        setStatus('success');
        setMessage(response.message || 'Your email has been verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Email verification failed. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token]);

  const getTitle = () => {
    if (status === 'loading') return 'Verifying your email...';
    if (status === 'success') return 'Email verified!';
    return 'Verification failed';
  };

  const getSubtitle = () => {
    if (status === 'loading') return 'Please wait while we verify your email address';
    return message;
  };

  return (
    <div className="space-y-6">
      <HeadlineOutside subtitle={getSubtitle()}>
        {getTitle()}
      </HeadlineOutside>
      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-4">
          {status === 'loading' && (
            <div className="flex justify-center py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-center py-4">
                <svg
                  className="h-16 w-16 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Continue to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center py-4">
                <svg
                  className="h-16 w-16 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  variant="outline"
                  className="w-full"
                >
                  Create New Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </AnimatedCard>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <AnimatedCard variant="elevated" padding="lg">
          <Skeleton className="h-40 w-full" />
        </AnimatedCard>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
