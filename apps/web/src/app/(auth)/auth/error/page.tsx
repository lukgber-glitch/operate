'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { Button } from '@/components/ui/button';

const errorMessages: Record<string, string> = {
  oauth_failed: 'OAuth authentication failed. Please try again.',
  access_denied: 'Access was denied. You may have cancelled the login.',
  invalid_request: 'Invalid authentication request. Please try again.',
  server_error: 'A server error occurred. Please try again later.',
  temporarily_unavailable: 'The authentication service is temporarily unavailable.',
  default: 'An authentication error occurred. Please try again.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'default';
  const errorDescription = searchParams.get('error_description');

  const displayMessage = errorMessages[error] || errorMessages.default;

  return (
    <div className="space-y-6">
      <HeadlineOutside subtitle={displayMessage}>
        Authentication Error
      </HeadlineOutside>
      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-4">
          {errorDescription && (
            <p className="text-sm text-muted-foreground">
              {errorDescription}
            </p>
          )}
          <div className="flex justify-center py-4">
            <div className="text-destructive">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/login">
                Try Again
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                Go to Home
              </Link>
            </Button>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}
