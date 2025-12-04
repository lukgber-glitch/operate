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
import { taxInfoSchema, type TaxInfoFormData } from '@/lib/validations/employee-onboarding';
import type { TaxInfo } from '@/types/employee-onboarding';

interface TaxInfoStepProps {
  data?: TaxInfo;
  onNext: (data: TaxInfo) => void;
  onBack: () => void;
  onSaveDraft?: () => void;
}

export function TaxInfoStep({ data, onNext, onBack, onSaveDraft }: TaxInfoStepProps) {
  const form = useForm<TaxInfoFormData>({
    resolver: zodResolver(taxInfoSchema),
    defaultValues: data || {
      filingStatus: 'single',
      multipleJobs: false,
      dependentsAmount: 0,
      otherIncome: 0,
      deductions: 0,
      extraWithholding: 0,
      claimExemption: false,
    },
  });

  const claimExemption = form.watch('claimExemption');

  const onSubmit = (formData: TaxInfoFormData) => {
    onNext(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This information is used to complete IRS Form W-4 for federal tax withholding. The employee can update this at any time.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Tax Withholding - Form W-4</CardTitle>
            <CardDescription>
              Federal tax withholding information based on IRS Form W-4.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="filingStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Filing Status <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select filing status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">Single or Married Filing Separately</SelectItem>
                      <SelectItem value="married_filing_jointly">Married Filing Jointly</SelectItem>
                      <SelectItem value="married_filing_separately">Married Filing Separately</SelectItem>
                      <SelectItem value="head_of_household">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the filing status that will be used on your tax return
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="multipleJobs"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Multiple Jobs or Spouse Works</FormLabel>
                    <FormDescription>
                      Check if you hold more than one job at a time, or if you're married filing jointly and your spouse also works
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dependentsAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dependent Credit Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    $2,000 for each qualifying child under 17, $500 for each other dependent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Income (not from jobs)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Interest, dividends, retirement income, etc. This increases withholding.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deductions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deductions (other than standard deduction)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Itemized deductions, student loan interest, etc. This reduces withholding.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="extraWithholding"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Extra Withholding</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional amount to withhold from each paycheck
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="claimExemption"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Claim Exemption from Withholding</FormLabel>
                    <FormDescription>
                      Check only if you had no federal tax liability last year and expect none this year
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {claimExemption && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  By claiming exemption, no federal income tax will be withheld from your paycheck. You should only claim exemption if you meet the IRS requirements.
                </AlertDescription>
              </Alert>
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
