'use client';

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export function OnboardingPageClient() {
  // Remove wrapper - OnboardingWizard handles its own spacing
  return <OnboardingWizard />;
}
