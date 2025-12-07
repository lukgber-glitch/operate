'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from '@/components/auth/language-selector';
import { LogoEntrance, LogoMorph } from '@/components/animation';
import { useLogoAnimation } from '@/hooks/useLogoAnimation';

export function LoginPageWithAnimation() {
  const t = useTranslations('auth');
  const { shouldShowIntro, markIntroSeen, isLoading } = useLogoAnimation();
  const [showEntrance, setShowEntrance] = useState(shouldShowIntro);

  const handleEntranceComplete = () => {
    setShowEntrance(false);
    markIntroSeen();
  };

  // Don't render anything while checking localStorage
  if (isLoading) {
    return null;
  }

  // Show entrance animation for first-time visitors
  if (showEntrance) {
    return <LogoEntrance onComplete={handleEntranceComplete} skipEnabled />;
  }

  // Show login card with morph animation
  return (
    <LogoMorph>
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
    </LogoMorph>
  );
}
