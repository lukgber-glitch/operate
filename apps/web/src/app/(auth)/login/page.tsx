'use client';

import { useTranslations } from 'next-intl';

import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from '@/components/auth/language-selector';

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{t('welcomeTitle') || 'Welcome to Operate'}</CardTitle>
          <LanguageSelector />
        </div>
        <CardDescription>
          {t('signInDescription') || 'Sign in to your CoachOS account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
