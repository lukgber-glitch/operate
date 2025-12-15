'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVerification } from '@/hooks/use-verification';
import { VerificationLevel } from '@/types/verification';
import { Shield, Check, ArrowRight, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const verificationLevels = [
  {
    value: VerificationLevel.BASIC,
    label: 'Basic Verification',
    description: 'Quick verification with basic identity documents',
    features: [
      'Photo ID verification',
      'Basic transaction limits',
      'Access to core features',
    ],
    timeEstimate: '5-10 minutes',
    limits: {
      transactions: '$10,000/month',
      withdrawals: '$5,000/month',
    },
  },
  {
    value: VerificationLevel.ENHANCED,
    label: 'Enhanced Verification',
    description: 'Additional verification for increased limits',
    features: [
      'Everything in Basic',
      'Proof of address required',
      'Higher transaction limits',
      'Priority support',
    ],
    timeEstimate: '10-15 minutes',
    limits: {
      transactions: '$50,000/month',
      withdrawals: '$25,000/month',
    },
    recommended: true,
  },
  {
    value: VerificationLevel.FULL,
    label: 'Full Verification',
    description: 'Complete verification for enterprise users',
    features: [
      'Everything in Enhanced',
      'Business documents required',
      'Unlimited transactions',
      'Dedicated account manager',
    ],
    timeEstimate: '15-20 minutes',
    limits: {
      transactions: 'Unlimited',
      withdrawals: 'Unlimited',
    },
  },
];

export default function StartVerificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { startVerification } = useVerification();
  const [selectedLevel, setSelectedLevel] = useState<VerificationLevel>(
    VerificationLevel.ENHANCED
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartVerification = async () => {
    try {
      setIsSubmitting(true);
      await startVerification(selectedLevel);

      toast({
        title: 'Verification started',
        description: 'Redirecting to document upload...',
      });

      router.push('/settings/verification/documents');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start verification',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="container max-w-4xl mx-auto py-8 space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Start KYC Verification</h1>
          <p className="text-muted-foreground">
            Choose your verification level and begin the process
          </p>
        </div>
      </motion.div>

      {/* Info Alert */}
      <motion.div variants={fadeUp}>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Have your identification documents ready. The process is secure and your
            information is encrypted. Verification typically takes 1-2 business days.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Verification Levels */}
      <motion.div variants={fadeUp}>
        <Card>
        <CardHeader>
          <CardTitle>Choose Verification Level</CardTitle>
          <CardDescription>
            Select the level that best suits your needs. You can upgrade later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as VerificationLevel)}>
            <div className="space-y-4">
              {verificationLevels.map((level) => (
                <div
                  key={level.value}
                  className="relative"
                >
                  <div
                    className={`
                      border-2 rounded-lg p-5 cursor-pointer transition-all
                      ${selectedLevel === level.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                      ${level.recommended ? 'ring-2 ring-primary/20' : ''}
                    `}
                    onClick={() => setSelectedLevel(level.value)}
                  >
                    {level.recommended && (
                      <div className="absolute -top-3 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                        Recommended
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <RadioGroupItem value={level.value} id={level.value} />
                      <div className="flex-1">
                        <Label
                          htmlFor={level.value}
                          className="text-base font-semibold cursor-pointer"
                        >
                          {level.label}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {level.description}
                        </p>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Features */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                              Features
                            </h4>
                            <ul className="space-y-1">
                              {level.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <Check className="w-3 h-3 text-primary" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Limits */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                              Limits
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Transactions:</span>
                                <span className="font-medium">{level.limits.transactions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Withdrawals:</span>
                                <span className="font-medium">{level.limits.withdrawals}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-muted-foreground">
                          Estimated time: {level.timeEstimate}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div variants={fadeUp} className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/settings/verification')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleStartVerification}
          disabled={isSubmitting}
          size="lg"
          className="gap-2"
        >
          {isSubmitting ? 'Starting...' : 'Continue to Documents'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
