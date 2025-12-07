'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

import { EmployeeForm } from '@/components/hr/employee-form';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useEmployee } from '@/hooks/use-employees';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const { employee, isLoading, error, fetchEmployee, updateEmployee } = useEmployee(id);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleSubmit = async (data: any) => {
    try {
      await updateEmployee(data);
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });
      router.push(`/hr/employees/${id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update employee',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    router.push(`/hr/employees/${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Employee not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/hr/employees/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <HeadlineOutside subtitle={`Update ${employee.firstName} ${employee.lastName}'s information`}>
          Edit Employee
        </HeadlineOutside>
      </div>

      <AnimatedCard variant="elevated" padding="lg">
        <EmployeeForm
          employee={employee}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </AnimatedCard>
    </div>
  );
}
