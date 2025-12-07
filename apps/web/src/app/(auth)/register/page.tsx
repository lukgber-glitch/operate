'use client';

import { useTranslations } from 'next-intl';

import { RegisterForm } from '@/components/auth/register-form';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { LanguageSelector } from '@/components/auth/language-selector';

export default function RegisterPage() {
  const t = useTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <HeadlineOutside subtitle={t('registerDescription') || 'Enter your information to get started with Operate'}>
          {t('registerTitle') || 'Create an account'}
        </HeadlineOutside>
        <LanguageSelector />
      </div>
      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-6">
          <RegisterForm />
        </div>
      </AnimatedCard>
    </div>
  );
}
