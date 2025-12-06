'use client';

import { useTranslations } from 'next-intl';

import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from '@/components/auth/language-selector';

export default function RegisterPage() {
  const t = useTranslations('auth');

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{t('registerTitle') || 'Create an account'}</CardTitle>
          <LanguageSelector />
        </div>
        <CardDescription>
          {t('registerDescription') || 'Enter your information to get started with Operate'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
