'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { VerificationProgress } from '@/components/verification/VerificationProgress';
import { useVerification } from '@/hooks/use-verification';
import { useKycRequirements } from '@/hooks/use-kyc-requirements';
import { VerificationStatus, VerificationLevel } from '@/types/verification';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  Shield,
  Info,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const verificationSteps = [
  { id: 'start', title: 'Start', description: 'Choose verification level' },
  { id: 'documents', title: 'Documents', description: 'Upload required documents' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

const levelLabels = {
  [VerificationLevel.BASIC]: 'Basic',
  [VerificationLevel.ENHANCED]: 'Enhanced',
  [VerificationLevel.FULL]: 'Full',
};

export default function ReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { verification, isLoading, submitVerification } = useVerification();
  const { requirements } = useKycRequirements(verification?.level);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if verification not started
    if (!isLoading && (!verification || verification.status === VerificationStatus.NOT_STARTED)) {
      router.push('/settings/verification/start');
    }
  }, [verification, isLoading, router]);

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      toast({
        title: 'Agreement required',
        description: 'Please agree to the terms and conditions before submitting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitVerification();

      toast({
        title: 'Verification submitted',
        description: 'Your verification has been submitted for review.',
      });

      router.push('/settings/verification');
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Failed to submit verification',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/settings/verification/documents');
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  const requiredDocs = requirements.filter(r => r.required);
  const completedRequired = requiredDocs.filter(r => r.completed).length;
  const allRequiredComplete = completedRequired === requiredDocs.length;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="container max-w-4xl mx-auto py-8 space-y-6"
    >
      {/* Progress */}
      <motion.div variants={fadeUp}>
        <VerificationProgress
          steps={verificationSteps}
          currentStep={2}
          completedSteps={new Set([0, 1])}
        />
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold mb-2">Review & Submit</h1>
        <p className="text-muted-foreground">
          Please review your information before submitting for verification
        </p>
      </motion.div>

      {/* Warning if not all required docs uploaded */}
      {!allRequiredComplete && (
        <motion.div variants={fadeUp}>
          <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Missing Required Documents</AlertTitle>
          <AlertDescription>
            You have not uploaded all required documents. Please go back and complete
            the document upload before submitting.
          </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Verification Summary */}
      <motion.div variants={fadeUp}>
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verification Summary
          </CardTitle>
          <CardDescription>Review your verification details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Verification Level</p>
              <Badge variant="secondary">{levelLabels[verification.level]}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Started On</p>
              <p className="font-medium">
                {verification.startedAt
                  ? format(new Date(verification.startedAt), 'PPP')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
        </Card>
      </motion.div>

      {/* Documents Summary */}
      <motion.div variants={fadeUp}>
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Uploaded Documents
          </CardTitle>
          <CardDescription>
            {completedRequired} of {requiredDocs.length} required documents uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requirements.map((req) => (
              <div
                key={req.type}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      req.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}
                  >
                    {req.completed && <CheckCircle className="w-3 h-3" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{req.label}</p>
                    {!req.required && (
                      <p className="text-xs text-muted-foreground">Optional</p>
                    )}
                  </div>
                </div>
                <Badge variant={req.completed ? 'default' : 'secondary'}>
                  {req.completed ? 'Uploaded' : 'Missing'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
        </Card>
      </motion.div>

      {/* Important Information */}
      <motion.div variants={fadeUp}>
        <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What happens next?</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Your documents will be reviewed by our compliance team</li>
            <li>Verification typically takes 1-2 business days</li>
            <li>You will be notified via email when the review is complete</li>
            <li>You can check the status anytime in your verification dashboard</li>
          </ul>
        </AlertDescription>
        </Alert>
      </motion.div>

      {/* Terms Agreement */}
      <motion.div variants={fadeUp}>
        <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <div>
              <Label htmlFor="terms" className="text-sm cursor-pointer">
                I confirm that all the information and documents provided are accurate and
                authentic. I agree to the{' '}
                <a href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </Label>
            </div>
          </div>
        </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <motion.div variants={fadeUp} className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!allRequiredComplete || !agreedToTerms || isSubmitting}
          size="lg"
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
