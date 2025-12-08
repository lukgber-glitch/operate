'use client';

import { useTranslations } from 'next-intl';

import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageSelector } from '@/components/auth/language-selector';

export default function RegisterPage() {
  const t = useTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('registerTitle') || 'Create an account'}</h1>
          <p className="text-muted-foreground">{t('registerDescription') || 'Enter your information to get started with Operate'}</p>
        </div>
        <LanguageSelector />
      </div>
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <div className="space-y-6">
            <RegisterForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
