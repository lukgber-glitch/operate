import { Metadata } from 'next';

import { OnboardingPageClient } from './OnboardingPageClient';

export const metadata: Metadata = {
  title: 'Welcome to Operate | Setup Your Account',
  description: 'Complete your account setup to get started with Operate',
};

export default function OnboardingPage() {
  return <OnboardingPageClient />;
}
