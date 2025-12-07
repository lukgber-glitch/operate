'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { OnboardingWizard } from '@/components/hr/onboarding/OnboardingWizard';

export default function EmployeeOnboardingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hr/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <HeadlineOutside subtitle="Add a new employee to your organization with Gusto payroll integration">
          Employee Onboarding
        </HeadlineOutside>
      </div>

      <AnimatedCard variant="elevated" padding="lg">
        <OnboardingWizard />
      </AnimatedCard>
    </div>
  );
}
