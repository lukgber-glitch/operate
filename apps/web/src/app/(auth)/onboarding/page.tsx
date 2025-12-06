import { Metadata } from 'next';

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const metadata: Metadata = {
  title: 'Welcome to Operate | Setup Your Account',
  description: 'Complete your account setup to get started with Operate',
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <OnboardingWizard />
      </div>
    </div>
  );
}
