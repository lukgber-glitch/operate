'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
          <h1 className="text-2xl font-semibold tracking-tight">Employee Onboarding</h1>
          <p className="text-muted-foreground">Add a new employee to your organization with Gusto payroll integration</p>
        </div>
      </div>

      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <OnboardingWizard />
        </CardContent>
      </Card>
    </div>
  );
}
