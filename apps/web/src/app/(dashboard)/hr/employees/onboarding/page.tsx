'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
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
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Employee Onboarding</h1>
          <p className="text-white/70">Add a new employee to your organization with Gusto payroll integration</p>
        </div>
      </div>

      <GlassCard className="p-6">
          <OnboardingWizard />
      </GlassCard>
    </div>
  );
}
