'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { benefitsSchema, type BenefitsFormData } from '@/lib/validations/employee-onboarding';
import type { Benefits } from '@/types/employee-onboarding';

interface BenefitsStepProps {
  data?: Benefits;
  onNext: (data: Benefits) => void;
  onBack: () => void;
  onSaveDraft?: () => void;
}

// Mock health plans - would come from API in production
const HEALTH_PLANS = [
  { id: 'plan-basic', name: 'Basic PPO Plan', description: '$50/month employee contribution' },
  { id: 'plan-standard', name: 'Standard HMO Plan', description: '$100/month employee contribution' },
  { id: 'plan-premium', name: 'Premium PPO Plan', description: '$150/month employee contribution' },
];

export function BenefitsStep({ data, onNext, onBack, onSaveDraft }: BenefitsStepProps) {
  const form = useForm<BenefitsFormData>({
    resolver: zodResolver(benefitsSchema),
    defaultValues: data || {
      enrollInHealthInsurance: false,
      healthPlanId: undefined,
      dependentsCovered: 0,
      enrollIn401k: false,
      contributionPercentage: undefined,
      contributionAmount: undefined,
    },
  });

  const enrollInHealthInsurance = form.watch('enrollInHealthInsurance');
  const enrollIn401k = form.watch('enrollIn401k');

  const onSubmit = (formData: BenefitsFormData) => {
    onNext(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This step is optional. You can enroll in benefits now or skip and enroll later during your benefits enrollment period.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Health Insurance</CardTitle>
            <CardDescription>
              Medical, dental, and vision coverage options.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enrollInHealthInsurance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enroll in Health Insurance</FormLabel>
                    <FormDescription>
                      Check to enroll in company health insurance plan
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {enrollInHealthInsurance && (
              <>
                <FormField
                  control={form.control}
                  name="healthPlanId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Select Health Plan <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HEALTH_PLANS.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              <div>
                                <div className="font-medium">{plan.name}</div>
                                <div className="text-xs text-muted-foreground">{plan.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dependentsCovered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Dependents</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of family members to cover (spouse, children)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>401(k) Retirement Plan</CardTitle>
            <CardDescription>
              Company-sponsored retirement savings plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enrollIn401k"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enroll in 401(k) Plan</FormLabel>
                    <FormDescription>
                      Start saving for retirement with company matching
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {enrollIn401k && (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Company matches up to 4% of your contribution. Consider contributing at least 4% to maximize your benefits!
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contributionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contribution Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            placeholder="6"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === '' ? undefined : parseFloat(val));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          % of your salary per paycheck
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contributionAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Or Fixed Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="100.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === '' ? undefined : parseFloat(val));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Fixed dollar amount per paycheck
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  You can choose either a percentage or a fixed amount. Percentage is recommended for automatic adjustment with salary changes.
                </p>
              </>
            )}
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
