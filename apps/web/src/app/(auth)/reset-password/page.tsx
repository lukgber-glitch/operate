'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { PasswordResetForm } from '@/components/auth/password-reset-form';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { Skeleton } from '@/components/ui/skeleton';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="space-y-6">
        <HeadlineOutside subtitle="This password reset link is invalid or has expired. Please request a new one.">
          Invalid Reset Link
        </HeadlineOutside>
        <AnimatedCard variant="elevated" padding="lg">
          <div className="space-y-6">
            <p className="text-destructive text-sm">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeadlineOutside subtitle="Enter your new password below">
        Set new password
      </HeadlineOutside>
      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-6">
          <PasswordResetForm token={token} />
        </div>
      </AnimatedCard>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
