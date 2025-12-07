'use client';

import { useTranslations } from 'next-intl';

import { PasswordResetRequestForm } from '@/components/auth/password-reset-form';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { LanguageSelector } from '@/components/auth/language-selector';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <HeadlineOutside subtitle={t('forgotPasswordDescription') || "Enter your email address and we'll send you a link to reset your password"}>
          {t('forgotPasswordTitle') || 'Reset password'}
        </HeadlineOutside>
        <LanguageSelector />
      </div>
      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-6">
          <PasswordResetRequestForm />
        </div>
      </AnimatedCard>
    </div>
  );
}
