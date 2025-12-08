'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageSelector } from '@/components/auth/language-selector';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { LogoEntrance, LogoMorph } from '@/components/animation';
import { useLogoAnimation } from '@/hooks/useLogoAnimation';

export function LoginPageWithAnimation() {
  const t = useTranslations('auth');
  const { shouldShowIntro, markIntroSeen, isLoading } = useLogoAnimation();
  const [showEntrance, setShowEntrance] = useState(true); // Start with true, sync from hook

  // Sync showEntrance with shouldShowIntro when hook finishes loading
  useEffect(() => {
    if (!isLoading) {
      setShowEntrance(shouldShowIntro);
    }
  }, [isLoading, shouldShowIntro]);

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
    <div className="w-full">
      {/* Headline OUTSIDE the card per design spec */}
      <HeadlineOutside
        align="center"
        subtitle={t('signInDescription') || 'Sign in to your CoachOS account'}
        actions={<LanguageSelector />}
      >
        {t('welcomeTitle') || 'Welcome to Operate'}
      </HeadlineOutside>

      {/* Card with LogoMorph animation */}
      <LogoMorph>
        <Card className="w-full rounded-[24px]">
          <CardContent className="p-6 lg:p-8">
            <LoginForm />
          </CardContent>
        </Card>
      </LogoMorph>
    </div>
  );
}
