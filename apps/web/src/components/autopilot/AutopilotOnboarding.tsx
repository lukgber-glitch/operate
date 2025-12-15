'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AutopilotConfig } from '@/hooks/use-autopilot';

interface AutopilotOnboardingProps {
  onComplete: (config: Partial<AutopilotConfig>) => void;
  onSkip: () => void;
}

const STEPS = [
  {
    title: 'Welcome to Autopilot',
    description: 'Let AI handle routine bookkeeping tasks while you focus on growing your business.',
  },
  {
    title: 'Choose Your Features',
    description: 'Select which tasks you want AI to handle automatically.',
  },
  {
    title: 'Set Your Preferences',
    description: 'Configure safety settings and thresholds.',
  },
];

export function AutopilotOnboarding({ onComplete, onSkip }: AutopilotOnboardingProps) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<Partial<AutopilotConfig>>({
    enabled: true,
    features: {
      autoCategorizeTransactions: true,
      autoCreateInvoices: false,
      autoSendReminders: true,
      autoReconcile: false,
      autoExtractReceipts: true,
      autoPayBills: false,
      autoFileExpenses: true,
    },
    confidenceThreshold: 85,
    maxAutoPayAmount: 100,
    dailySummary: {
      enabled: true,
      time: '09:00',
    },
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(config);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const updateFeature = (feature: string, value: boolean) => {
    setConfig({
      ...config,
      features: {
        ...config.features,
        [feature]: value,
      } as any,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm">
        <div className="p-8">
          {/* Progress indicator */}
          <div className="mb-8 flex items-center justify-between">
            {STEPS.map((_, index) => (
              <div key={index} className="flex items-center flex-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    index <= step
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-white/20 text-gray-500'
                  }`}
                >
                  {index < step ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      index < step ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {STEPS[step]?.title ?? ''}
                </h2>
                <p className="text-gray-400">{STEPS[step]?.description ?? ''}</p>
              </div>

              {/* Step content */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-6">
                    <div className="flex items-start gap-4">
                      <Sparkles className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-white mb-2">What is Autopilot?</h3>
                        <p className="text-sm text-gray-300">
                          Autopilot uses AI to automate repetitive bookkeeping tasks like categorizing
                          transactions, creating invoices, and sending reminders. You always have final
                          approval on important actions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="text-2xl font-bold text-white">95%</div>
                      <div className="text-xs text-gray-400">Accuracy</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="text-2xl font-bold text-white">5hrs</div>
                      <div className="text-xs text-gray-400">Saved/Week</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="text-2xl font-bold text-white">100%</div>
                      <div className="text-xs text-gray-400">Your Control</div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  {[
                    { key: 'autoCategorizeTransactions', label: 'Auto-categorize transactions', desc: 'Assign categories to bank transactions' },
                    { key: 'autoCreateInvoices', label: 'Auto-create invoices', desc: 'Convert approved quotes to invoices' },
                    { key: 'autoSendReminders', label: 'Auto-send payment reminders', desc: 'Remind clients about overdue invoices' },
                    { key: 'autoReconcile', label: 'Auto-reconcile transactions', desc: 'Match bank transactions to invoices' },
                    { key: 'autoExtractReceipts', label: 'Auto-extract receipts', desc: 'Extract data from receipt photos' },
                    { key: 'autoFileExpenses', label: 'Auto-file expenses', desc: 'Categorize and file recurring expenses' },
                  ].map((feature) => (
                    <div
                      key={feature.key}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-white">{feature.label}</div>
                        <div className="text-xs text-gray-400">{feature.desc}</div>
                      </div>
                      <Switch
                        checked={(config.features as any)?.[feature.key]}
                        onCheckedChange={(value) => updateFeature(feature.key, value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-white mb-4 block">
                      Confidence Threshold: {config.confidenceThreshold}%
                    </Label>
                    <p className="text-xs text-gray-400 mb-4">
                      AI will only take action when at least this confident
                    </p>
                    <Slider
                      value={[config.confidenceThreshold || 85]}
                      onValueChange={(value) =>
                        setConfig({ ...config, confidenceThreshold: value[0] })
                      }
                      min={70}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-4 block">
                      Daily Summary Email
                    </Label>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                      <div className="text-sm text-gray-300">
                        Receive a daily summary of autopilot actions
                      </div>
                      <Switch
                        checked={config.dailySummary?.enabled}
                        onCheckedChange={(value) =>
                          setConfig({
                            ...config,
                            dailySummary: { ...config.dailySummary!, enabled: value },
                          })
                        }
                      />
                    </div>
                    {config.dailySummary?.enabled && (
                      <div className="mt-4">
                        <Label className="text-white mb-2 block">Time</Label>
                        <Input
                          type="time"
                          value={config.dailySummary.time}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              dailySummary: { ...config.dailySummary!, time: e.target.value },
                            })
                          }
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={step === 0 ? onSkip : handleBack}
              className="text-gray-400"
            >
              {step === 0 ? (
                'Skip for now'
              ) : (
                <>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </>
              )}
            </Button>
            <Button onClick={handleNext} className="bg-blue-500 hover:bg-blue-600">
              {step === STEPS.length - 1 ? (
                'Enable Autopilot'
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
