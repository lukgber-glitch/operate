'use client';

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { PageTransition } from '@/components/animation/PageTransition';

export function OnboardingPageClient() {
  return (
    <PageTransition>
      <div className="w-full py-8">
        <OnboardingWizard />
      </div>
    </PageTransition>
  );
}
