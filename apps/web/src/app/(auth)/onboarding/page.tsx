import { Metadata } from 'next';

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const metadata: Metadata = {
  title: 'Welcome to Operate | Setup Your Account',
  description: 'Complete your account setup to get started with Operate',
};

export default function OnboardingPage() {
  return (
    <div className="container mx-auto px-4 py-8 relative z-10">
      <OnboardingWizard />
    </div>
  );
}
