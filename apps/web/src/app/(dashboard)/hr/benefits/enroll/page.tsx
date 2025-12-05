'use client';

import { BenefitsEnrollmentWizard } from '@/components/hr/benefits/BenefitsEnrollmentWizard';

export default function BenefitsEnrollPage() {
  // In a real app, you would get the employee ID from auth context
  const employeeId = 'emp-123';
  const annualSalary = 75000; // Would come from employee data

  return <BenefitsEnrollmentWizard employeeId={employeeId} annualSalary={annualSalary} />;
}
