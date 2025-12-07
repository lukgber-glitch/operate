'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { EmployeeForm } from '@/components/hr/employee-form';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { useToast } from '@/components/ui/use-toast';
import { useEmployees } from '@/hooks/use-employees';

export default function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createEmployee, isLoading } = useEmployees();

  const handleSubmit = async (data: any) => {
    try {
      await createEmployee(data);
      toast({
        title: 'Success',
        description: 'Employee created successfully',
      });
      router.push('/hr/employees');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create employee',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    router.push('/hr/employees');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hr/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <HeadlineOutside subtitle="Create a new employee record">
          Add Employee
        </HeadlineOutside>
      </div>

      <AnimatedCard variant="elevated" padding="lg">
        <EmployeeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </AnimatedCard>
    </div>
  );
}
