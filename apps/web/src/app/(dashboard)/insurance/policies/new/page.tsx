'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { useInsurancePolicies, CreateInsurancePolicyRequest, InsuranceType, PaymentFrequency } from '@/hooks/use-insurance';
import { getInsuranceTypeLabel } from '@/components/insurance';

export default function NewInsurancePolicyPage() {
  const router = useRouter();
  const { createPolicy } = useInsurancePolicies();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateInsurancePolicyRequest>({
    defaultValues: {
      autoRenew: false,
      reminderDays: 30,
      paymentFrequency: 'ANNUAL',
      type: 'LIABILITY',
    },
  });

  const onSubmit = async (data: CreateInsurancePolicyRequest) => {
    setIsSubmitting(true);
    try {
      await createPolicy(data);
      router.push('/insurance/policies');
    } catch (error) {
      console.error('Failed to create policy:', error);
      setIsSubmitting(false);
    }
  };

  const insuranceTypes: InsuranceType[] = [
    'LIABILITY',
    'PROFESSIONAL_INDEMNITY',
    'PROPERTY',
    'HEALTH',
    'CYBER',
    'VEHICLE',
    'DIRECTORS_OFFICERS',
    'WORKERS_COMPENSATION',
    'OTHER',
  ];

  const paymentFrequencies: PaymentFrequency[] = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/insurance/policies">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Add Insurance Policy</h1>
          <p className="text-gray-400">Create a new insurance policy</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">
                    Policy Name *
                  </Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Policy name is required' })}
                    placeholder="e.g., Professional Liability Insurance"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-white">
                      Type *
                    </Label>
                    <Select
                      onValueChange={(value) => setValue('type', value as InsuranceType)}
                      defaultValue="LIABILITY"
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {getInsuranceTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="provider" className="text-white">
                      Provider *
                    </Label>
                    <Input
                      id="provider"
                      {...register('provider', { required: 'Provider is required' })}
                      placeholder="e.g., Allianz"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                    {errors.provider && (
                      <p className="text-red-400 text-sm mt-1">{errors.provider.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="policyNumber" className="text-white">
                    Policy Number *
                  </Label>
                  <Input
                    id="policyNumber"
                    {...register('policyNumber', { required: 'Policy number is required' })}
                    placeholder="e.g., PI-2024-001"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                  {errors.policyNumber && (
                    <p className="text-red-400 text-sm mt-1">{errors.policyNumber.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Coverage Details */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Coverage Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coverageAmount" className="text-white">
                      Coverage Amount (EUR) *
                    </Label>
                    <Input
                      id="coverageAmount"
                      type="number"
                      step="0.01"
                      {...register('coverageAmount', {
                        required: 'Coverage amount is required',
                        valueAsNumber: true,
                      })}
                      placeholder="e.g., 1000000"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                    {errors.coverageAmount && (
                      <p className="text-red-400 text-sm mt-1">{errors.coverageAmount.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="deductible" className="text-white">
                      Deductible (EUR) *
                    </Label>
                    <Input
                      id="deductible"
                      type="number"
                      step="0.01"
                      {...register('deductible', {
                        required: 'Deductible is required',
                        valueAsNumber: true,
                      })}
                      placeholder="e.g., 5000"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                    {errors.deductible && (
                      <p className="text-red-400 text-sm mt-1">{errors.deductible.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Information */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Premium Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="premiumAmount" className="text-white">
                      Premium Amount (EUR) *
                    </Label>
                    <Input
                      id="premiumAmount"
                      type="number"
                      step="0.01"
                      {...register('premiumAmount', {
                        required: 'Premium amount is required',
                        valueAsNumber: true,
                      })}
                      placeholder="e.g., 1200"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                    {errors.premiumAmount && (
                      <p className="text-red-400 text-sm mt-1">{errors.premiumAmount.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="paymentFrequency" className="text-white">
                      Payment Frequency *
                    </Label>
                    <Select
                      onValueChange={(value) => setValue('paymentFrequency', value as PaymentFrequency)}
                      defaultValue="ANNUAL"
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentFrequencies.map(freq => (
                          <SelectItem key={freq} value={freq}>
                            {freq.toLowerCase().replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contactName" className="text-white">
                    Contact Name
                  </Label>
                  <Input
                    id="contactName"
                    {...register('contactName')}
                    placeholder="e.g., John Smith"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPhone" className="text-white">
                      Contact Phone
                    </Label>
                    <Input
                      id="contactPhone"
                      {...register('contactPhone')}
                      placeholder="e.g., +43 1 234567"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail" className="text-white">
                      Contact Email
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...register('contactEmail')}
                      placeholder="e.g., contact@provider.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('notes')}
                  placeholder="Add any additional notes or details about this policy..."
                  rows={4}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Coverage Period */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Coverage Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="startDate" className="text-white">
                    Start Date *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate', { required: 'Start date is required' })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  {errors.startDate && (
                    <p className="text-red-400 text-sm mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endDate" className="text-white">
                    End Date *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register('endDate', { required: 'End date is required' })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  {errors.endDate && (
                    <p className="text-red-400 text-sm mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Policy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoRenew" className="text-white">
                    Auto-Renew
                  </Label>
                  <Switch
                    id="autoRenew"
                    onCheckedChange={(checked) => setValue('autoRenew', checked)}
                    defaultChecked={false}
                  />
                </div>

                <div>
                  <Label htmlFor="reminderDays" className="text-white">
                    Reminder (days before expiry)
                  </Label>
                  <Input
                    id="reminderDays"
                    type="number"
                    {...register('reminderDays', {
                      required: 'Reminder days is required',
                      valueAsNumber: true,
                    })}
                    defaultValue={30}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  {errors.reminderDays && (
                    <p className="text-red-400 text-sm mt-1">{errors.reminderDays.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-blue-900 hover:bg-gray-100"
              >
                {isSubmitting ? 'Creating...' : 'Create Policy'}
              </Button>
              <Link href="/insurance/policies" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-white border-white/20 hover:bg-white/10"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
