'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employmentDetailsSchema, type EmploymentDetailsFormData } from '@/lib/validations/employee-onboarding';
import type { EmploymentDetails } from '@/types/employee-onboarding';

interface EmploymentDetailsStepProps {
  data?: EmploymentDetails;
  onNext: (data: EmploymentDetails) => void;
  onBack: () => void;
  onSaveDraft?: () => void;
}

export function EmploymentDetailsStep({ data, onNext, onBack, onSaveDraft }: EmploymentDetailsStepProps) {
  const form = useForm<EmploymentDetailsFormData>({
    resolver: zodResolver(employmentDetailsSchema),
    defaultValues: data || {
      jobTitle: '',
      department: '',
      startDate: '',
      employmentType: 'full-time',
      compensationType: 'salary',
      compensationAmount: 0,
      paymentUnit: 'Year',
      flsaStatus: 'Exempt',
      workLocationId: '',
    },
  });

  const compensationType = form.watch('compensationType');

  const onSubmit = (formData: EmploymentDetailsFormData) => {
    onNext(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
            <CardDescription>
              Job title, department, and employment terms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Job Title <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Department <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Start Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Employment Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Full-Time</SelectItem>
                        <SelectItem value="part-time">Part-Time</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
            <CardDescription>
              Salary or hourly rate information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="compensationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Compensation Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="compensationAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {compensationType === 'hourly' ? 'Hourly Rate' : 'Annual Salary'}{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={compensationType === 'hourly' ? '25.00' : '75000'}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {compensationType === 'hourly' ? 'Hourly rate in USD' : 'Annual salary in USD'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Payment Unit <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={compensationType === 'hourly'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hour">Per Hour</SelectItem>
                        <SelectItem value="Week">Per Week</SelectItem>
                        <SelectItem value="Month">Per Month</SelectItem>
                        <SelectItem value="Year">Per Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="flsaStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    FLSA Status <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Exempt">Exempt (Salaried, not eligible for overtime)</SelectItem>
                      <SelectItem value="Nonexempt">Non-Exempt (Eligible for overtime)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Fair Labor Standards Act classification determines overtime eligibility
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <div className="flex gap-4">
            {onSaveDraft && (
              <Button type="button" variant="outline" onClick={onSaveDraft}>
                Save Draft
              </Button>
            )}
            <Button type="submit">Next</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
