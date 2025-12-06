'use client';

import { useTranslations } from 'next-intl';

import { PasswordResetRequestForm } from '@/components/auth/password-reset-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from '@/components/auth/language-selector';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{t('forgotPasswordTitle') || 'Reset password'}</CardTitle>
          <LanguageSelector />
        </div>
        <CardDescription>
          {t('forgotPasswordDescription') || "Enter your email address and we'll send you a link to reset your password"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PasswordResetRequestForm />
      </CardContent>
    </Card>
  );
}
