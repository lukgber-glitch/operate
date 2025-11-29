'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Contract } from '@/lib/api/employees';

const contractSchema = z.object({
  contractTypeId: z.string().min(1, 'Contract type is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  probationEndDate: z.string().optional(),
  salaryAmount: z.number().min(0, 'Salary must be positive'),
  salaryCurrency: z.string().min(1, 'Currency is required'),
  salaryPeriod: z.enum(['HOURLY', 'MONTHLY', 'YEARLY']),
  weeklyHours: z.number().min(0).max(168, 'Weekly hours must be between 0 and 168'),
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
});

type ContractFormData = z.infer<typeof contractSchema>;

interface ContractFormProps {
  contract?: Contract;
  employeeId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

export function ContractForm({ contract, employeeId, onSubmit, onCancel, isLoading }: ContractFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: contract
      ? {
          contractTypeId: contract.contractTypeId,
          jobTitle: contract.jobTitle,
          department: contract.department || '',
          startDate: contract.startDate,
          endDate: contract.endDate || '',
          probationEndDate: contract.probationEndDate || '',
          salaryAmount: contract.salaryAmount,
          salaryCurrency: contract.salaryCurrency,
          salaryPeriod: contract.salaryPeriod,
          weeklyHours: contract.weeklyHours,
          workingDays: contract.workingDays,
        }
      : {
          salaryCurrency: 'EUR',
          salaryPeriod: 'MONTHLY',
          weeklyHours: 40,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          startDate: new Date().toISOString().split('T')[0],
        },
  });

  const workingDays = watch('workingDays') || [];

  const toggleWorkingDay = (day: string) => {
    const current = workingDays || [];
    if (current.includes(day)) {
      setValue('workingDays', current.filter((d) => d !== day));
    } else {
      setValue('workingDays', [...current, day]);
    }
  };

  const handleFormSubmit = (data: ContractFormData) => {
    const payload = {
      employeeId,
      contractTypeId: data.contractTypeId,
      jobTitle: data.jobTitle,
      department: data.department || undefined,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      probationEndDate: data.probationEndDate || undefined,
      salaryAmount: data.salaryAmount,
      salaryCurrency: data.salaryCurrency,
      salaryPeriod: data.salaryPeriod,
      weeklyHours: data.weeklyHours,
      workingDays: data.workingDays,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contractTypeId">
            Contract Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watch('contractTypeId') || ''}
            onValueChange={(value) => setValue('contractTypeId', value)}
          >
            <SelectTrigger id="contractTypeId">
              <SelectValue placeholder="Select contract type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ct-1">Full-time Permanent</SelectItem>
              <SelectItem value="ct-2">Part-time Permanent</SelectItem>
              <SelectItem value="ct-3">Fixed-term</SelectItem>
              <SelectItem value="ct-4">Internship</SelectItem>
              <SelectItem value="ct-5">Freelance</SelectItem>
            </SelectContent>
          </Select>
          {errors.contractTypeId && (
            <p className="text-sm text-destructive">{errors.contractTypeId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobTitle">
            Job Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="jobTitle"
            {...register('jobTitle')}
            placeholder="Senior Software Engineer"
          />
          {errors.jobTitle && (
            <p className="text-sm text-destructive">{errors.jobTitle.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          {...register('department')}
          placeholder="Engineering"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate')}
          />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            {...register('endDate')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="probationEndDate">Probation End Date</Label>
          <Input
            id="probationEndDate"
            type="date"
            {...register('probationEndDate')}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="salaryAmount">
            Salary Amount <span className="text-destructive">*</span>
          </Label>
          <Input
            id="salaryAmount"
            type="number"
            step="0.01"
            {...register('salaryAmount', { valueAsNumber: true })}
            placeholder="50000"
          />
          {errors.salaryAmount && (
            <p className="text-sm text-destructive">{errors.salaryAmount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="salaryCurrency">Currency</Label>
          <Select
            value={watch('salaryCurrency')}
            onValueChange={(value) => setValue('salaryCurrency', value)}
          >
            <SelectTrigger id="salaryCurrency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salaryPeriod">Period</Label>
          <Select
            value={watch('salaryPeriod')}
            onValueChange={(value) => setValue('salaryPeriod', value as any)}
          >
            <SelectTrigger id="salaryPeriod">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HOURLY">Hourly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weeklyHours">
          Weekly Hours <span className="text-destructive">*</span>
        </Label>
        <Input
          id="weeklyHours"
          type="number"
          step="0.5"
          {...register('weeklyHours', { valueAsNumber: true })}
          placeholder="40"
        />
        {errors.weeklyHours && (
          <p className="text-sm text-destructive">{errors.weeklyHours.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          Working Days <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                id={day.value}
                checked={workingDays.includes(day.value)}
                onCheckedChange={() => toggleWorkingDay(day.value)}
              />
              <Label htmlFor={day.value} className="cursor-pointer font-normal">
                {day.label}
              </Label>
            </div>
          ))}
        </div>
        {errors.workingDays && (
          <p className="text-sm text-destructive">{errors.workingDays.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
        </Button>
      </div>
    </form>
  );
}
