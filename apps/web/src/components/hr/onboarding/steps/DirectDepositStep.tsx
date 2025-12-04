'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { directDepositSchema, type DirectDepositFormData } from '@/lib/validations/employee-onboarding';
import type { DirectDeposit } from '@/types/employee-onboarding';

interface DirectDepositStepProps {
  data?: DirectDeposit;
  onNext: (data: DirectDeposit) => void;
  onBack: () => void;
  onSaveDraft?: () => void;
}

export function DirectDepositStep({ data, onNext, onBack, onSaveDraft }: DirectDepositStepProps) {
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmNumber, setShowConfirmNumber] = useState(false);

  const form = useForm<DirectDepositFormData>({
    resolver: zodResolver(directDepositSchema),
    defaultValues: data || {
      accountType: 'checking',
      routingNumber: '',
      accountNumber: '',
      accountNumberConfirm: '',
      bankName: '',
    },
  });

  const onSubmit = (formData: DirectDepositFormData) => {
    onNext(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Direct deposit ensures your paycheck is deposited directly into your bank account on payday. All information is encrypted and secure.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Direct Deposit Information</CardTitle>
            <CardDescription>
              Bank account details for payroll deposits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Bank Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Chase Bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="routingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Routing Number <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123456789"
                      maxLength={9}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    9-digit number at the bottom left of your check
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account Number <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showAccountNumber ? 'text' : 'password'}
                        placeholder="Enter account number"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                    >
                      {showAccountNumber ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormDescription>
                    Account number from your check or bank statement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumberConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confirm Account Number <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmNumber ? 'text' : 'password'}
                        placeholder="Re-enter account number"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmNumber(!showConfirmNumber)}
                    >
                      {showConfirmNumber ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Finding your routing and account numbers:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Check the bottom of a personal check</li>
                <li>Log into your online banking</li>
                <li>Contact your bank directly</li>
              </ul>
            </div>
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
