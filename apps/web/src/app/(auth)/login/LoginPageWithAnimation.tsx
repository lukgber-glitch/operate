'use client';

import { useTranslations } from 'next-intl';

import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageSelector } from '@/components/auth/language-selector';

export function LoginPageWithAnimation() {
  const t = useTranslations('auth');

  return (
    <div className="w-full">
      {/* Headline */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('welcomeTitle') || 'Welcome to Operate'}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t('signInDescription') || 'Sign in to your CoachOS account'}
        </p>
        <div className="mt-4">
          <LanguageSelector />
        </div>
      </div>

      {/* Card */}
      <Card className="w-full rounded-[24px]">
        <CardContent className="p-6 lg:p-8">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
