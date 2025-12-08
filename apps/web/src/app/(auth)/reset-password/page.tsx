'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { PasswordResetForm } from '@/components/auth/password-reset-form';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invalid Reset Link</h1>
          <p className="text-muted-foreground">This password reset link is invalid or has expired. Please request a new one.</p>
        </div>
        <Card className="rounded-[24px]">
          <CardContent className="p-6">
            <div className="space-y-6">
              <p className="text-destructive text-sm">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
        <p className="text-muted-foreground">Enter your new password below</p>
      </div>
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <div className="space-y-6">
            <PasswordResetForm token={token} />
          </div>
        </CardContent>
      </Card>
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
        <Card className="rounded-[24px]">
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
