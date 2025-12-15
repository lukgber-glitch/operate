'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Palmtree,
  Thermometer,
  User,
  MoreHorizontal,
  CalendarDays,
  Sun,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { WizardPanelProps, WizardStep, LeaveRequestFormData, CreatedLeaveRequest } from './types';

interface LeaveRequestPanelProps extends WizardPanelProps<CreatedLeaveRequest> {
  availableBalance?: {
    vacation: number;
    sick: number;
    personal: number;
  };
}

const STEPS: WizardStep[] = [
  { id: 'type', title: 'Leave Type', description: 'Select type of leave' },
  { id: 'dates', title: 'Dates', description: 'Choose your dates' },
  { id: 'review', title: 'Review', description: 'Submit request' },
];

const LEAVE_TYPES = [
  {
    value: 'vacation' as const,
    label: 'Vacation',
    description: 'Annual leave, holiday time',
    icon: Palmtree,
    color: 'emerald',
  },
  {
    value: 'sick' as const,
    label: 'Sick Leave',
    description: 'Health-related absence',
    icon: Thermometer,
    color: 'red',
  },
  {
    value: 'personal' as const,
    label: 'Personal',
    description: 'Personal matters, appointments',
    icon: User,
    color: 'blue',
  },
  {
    value: 'other' as const,
    label: 'Other',
    description: 'Other leave types',
    icon: MoreHorizontal,
    color: 'zinc',
  },
];

export function LeaveRequestPanel({
  onComplete,
  onCancel,
  onStepChange,
  availableBalance = { vacation: 15, sick: 10, personal: 3 },
}: LeaveRequestPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<LeaveRequestFormData>({
    leaveType: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
  });

  const updateFormData = useCallback((updates: Partial<LeaveRequestFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    onStepChange?.(step, STEPS[step]?.title ?? '');
  }, [onStepChange]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      handleStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const createdRequest: CreatedLeaveRequest = {
      ...formData,
      id: `leave_${Date.now()}`,
      status: 'pending',
    };

    onComplete(createdRequest);
  };

  // Calculate number of days
  const numberOfDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return formData.halfDay ? 0.5 : diffDays;
  }, [formData.startDate, formData.endDate, formData.halfDay]);

  // Get balance for selected leave type
  const currentBalance = useMemo(() => {
    const type = formData.leaveType;
    if (type === 'vacation') return availableBalance.vacation;
    if (type === 'sick') return availableBalance.sick;
    if (type === 'personal') return availableBalance.personal;
    return 0;
  }, [formData.leaveType, availableBalance]);

  const remainingBalance = currentBalance - numberOfDays;
  const hasEnoughBalance = remainingBalance >= 0;

  // Validation
  const isStep1Valid = formData.leaveType !== undefined;
  const isStep2Valid = formData.startDate !== '' && formData.endDate !== '' && hasEnoughBalance;
  const canSubmit = isStep1Valid && isStep2Valid;

  const getLeaveTypeConfig = (type: string) => {
    return LEAVE_TYPES.find((t) => t.value === type) || LEAVE_TYPES[0]!;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress Steps */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => index < currentStep && handleStepChange(index)}
              disabled={index > currentStep}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors',
                index === currentStep && 'text-white',
                index < currentStep && 'text-emerald-400 cursor-pointer hover:text-emerald-300',
                index > currentStep && 'text-zinc-500 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  index === currentStep && 'bg-emerald-500 text-white',
                  index < currentStep && 'bg-emerald-500/20 text-emerald-400',
                  index > currentStep && 'bg-zinc-800 text-zinc-500'
                )}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mx-2',
                  index < currentStep ? 'bg-emerald-500' : 'bg-zinc-800'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Step 1: Leave Type */}
            {currentStep === 0 && (
              <>
                <div className="text-center mb-6">
                  <Calendar className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">Request Leave</h3>
                  <p className="text-sm text-zinc-400">What type of leave do you need?</p>
                </div>

                {/* Leave Type Selection */}
                <div className="space-y-3">
                  {LEAVE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.leaveType === type.value;
                    const balance =
                      type.value === 'vacation'
                        ? availableBalance.vacation
                        : type.value === 'sick'
                        ? availableBalance.sick
                        : type.value === 'personal'
                        ? availableBalance.personal
                        : null;

                    return (
                      <button
                        key={type.value}
                        onClick={() => updateFormData({ leaveType: type.value })}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            isSelected
                              ? `bg-${type.color}-500/20`
                              : 'bg-zinc-800'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-5 h-5',
                              isSelected ? `text-${type.color}-400` : 'text-zinc-500'
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              'font-medium',
                              isSelected ? 'text-white' : 'text-zinc-300'
                            )}
                          >
                            {type.label}
                          </p>
                          <p className="text-sm text-zinc-500">{type.description}</p>
                        </div>
                        {balance !== null && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'border-zinc-700',
                              balance > 0 ? 'text-emerald-400' : 'text-red-400'
                            )}
                          >
                            {balance} days
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Balance Overview */}
                <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-3">Your Leave Balance</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">
                        {availableBalance.vacation}
                      </p>
                      <p className="text-xs text-zinc-500">Vacation</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-400">
                        {availableBalance.sick}
                      </p>
                      <p className="text-xs text-zinc-500">Sick</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">
                        {availableBalance.personal}
                      </p>
                      <p className="text-xs text-zinc-500">Personal</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Dates */}
            {currentStep === 1 && (
              <>
                <div className="text-center mb-6">
                  <CalendarDays className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">Select Dates</h3>
                  <p className="text-sm text-zinc-400">When do you need time off?</p>
                </div>

                {/* Half Day Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-amber-400" />
                    <div>
                      <Label>Half Day</Label>
                      <p className="text-xs text-zinc-500">Request only half a day</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.halfDay}
                    onCheckedChange={(checked) => {
                      updateFormData({ halfDay: checked });
                      if (checked && formData.startDate) {
                        updateFormData({ endDate: formData.startDate });
                      }
                    }}
                  />
                </div>

                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{formData.halfDay ? 'Date' : 'Start Date'} *</Label>
                    <input
                      type="date"
                      value={formData.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        updateFormData({ startDate: e.target.value });
                        if (formData.halfDay || !formData.endDate || e.target.value > formData.endDate) {
                          updateFormData({ endDate: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                  {!formData.halfDay && (
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <input
                        type="date"
                        value={formData.endDate}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => updateFormData({ endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Duration Display */}
                {formData.startDate && formData.endDate && (
                  <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">Duration</p>
                        <p className="text-2xl font-bold text-white">
                          {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-400">Remaining Balance</p>
                        <p
                          className={cn(
                            'text-2xl font-bold',
                            hasEnoughBalance ? 'text-emerald-400' : 'text-red-400'
                          )}
                        >
                          {remainingBalance} days
                        </p>
                      </div>
                    </div>
                    {!hasEnoughBalance && (
                      <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Insufficient balance for this request</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason (Optional) */}
                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes for your manager..."
                    value={formData.reason || ''}
                    onChange={(e) => updateFormData({ reason: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 min-h-[80px]"
                  />
                </div>
              </>
            )}

            {/* Step 3: Review */}
            {currentStep === 2 && (
              <>
                <div className="text-center mb-6">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">Review Request</h3>
                  <p className="text-sm text-zinc-400">Confirm and submit</p>
                </div>

                {/* Summary Card */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const config = getLeaveTypeConfig(formData.leaveType);
                        const Icon = config.icon;
                        return (
                          <>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{config.label}</p>
                              <p className="text-sm text-zinc-400">{config.description}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    {/* Dates */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">
                        {formData.halfDay ? 'Date' : 'From'}
                      </span>
                      <span className="text-white">{formatDate(formData.startDate)}</span>
                    </div>
                    {!formData.halfDay && formData.startDate !== formData.endDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">To</span>
                        <span className="text-white">{formatDate(formData.endDate)}</span>
                      </div>
                    )}

                    {/* Duration */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Duration</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                        {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'}
                        {formData.halfDay && ' (half day)'}
                      </Badge>
                    </div>

                    {/* Balance Impact */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-800">
                      <span className="text-zinc-400">Current Balance</span>
                      <span className="text-white">{currentBalance} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">After Request</span>
                      <span className="text-emerald-400">{remainingBalance} days</span>
                    </div>

                    {/* Reason */}
                    {formData.reason && (
                      <div className="pt-2 border-t border-zinc-800">
                        <p className="text-sm text-zinc-400 mb-1">Note</p>
                        <p className="text-sm text-white">{formData.reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="p-4 bg-amber-500/5 border-t border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Request will be sent to your manager for approval</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex justify-between">
          {currentStep > 0 ? (
            <Button variant="outline" onClick={handleBack} className="border-zinc-800">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onCancel} className="border-zinc-800">
              Cancel
            </Button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={(currentStep === 0 && !isStep1Valid) || (currentStep === 1 && !isStep2Valid)}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
