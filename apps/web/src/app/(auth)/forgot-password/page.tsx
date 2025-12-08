'use client';

import { useTranslations } from 'next-intl';

import { PasswordResetRequestForm } from '@/components/auth/password-reset-form';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageSelector } from '@/components/auth/language-selector';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('forgotPasswordTitle') || 'Reset password'}</h1>
          <p className="text-muted-foreground">{t('forgotPasswordDescription') || "Enter your email address and we'll send you a link to reset your password"}</p>
        </div>
        <LanguageSelector />
      </div>
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <div className="space-y-6">
            <PasswordResetRequestForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
