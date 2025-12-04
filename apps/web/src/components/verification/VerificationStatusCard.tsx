'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VerificationBadge } from './VerificationBadge';
import { VerificationStatus, VerificationLevel, type VerificationData } from '@/types/verification';
import { Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface VerificationStatusCardProps {
  verification: VerificationData | null;
  onStartVerification?: () => void;
  onRetryVerification?: () => void;
}

export function VerificationStatusCard({
  verification,
  onStartVerification,
  onRetryVerification,
}: VerificationStatusCardProps) {
  const levelLabels = {
    [VerificationLevel.BASIC]: 'Basic',
    [VerificationLevel.ENHANCED]: 'Enhanced',
    [VerificationLevel.FULL]: 'Full',
  };

  const renderContent = () => {
    if (!verification || verification.status === VerificationStatus.NOT_STARTED) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Shield className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Verification Not Started</h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
            Complete KYC verification to unlock all features and increase your account limits.
          </p>
          <Button onClick={onStartVerification} size="lg">
            Start Verification
          </Button>
        </div>
      );
    }

    if (verification.status === VerificationStatus.VERIFIED) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Verification Complete</h3>
                <p className="text-sm text-muted-foreground">
                  Level: {levelLabels[verification.level]}
                </p>
              </div>
            </div>
            <VerificationBadge status={verification.status} />
          </div>

          {verification.completedAt && (
            <div className="text-sm text-muted-foreground">
              Verified on {format(new Date(verification.completedAt), 'PPP')}
            </div>
          )}

          {verification.expiresAt && (
            <div className="text-sm text-muted-foreground">
              Expires on {format(new Date(verification.expiresAt), 'PPP')}
            </div>
          )}
        </div>
      );
    }

    if (verification.status === VerificationStatus.REJECTED) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Verification Rejected</h3>
                <p className="text-sm text-muted-foreground">
                  Please review and resubmit
                </p>
              </div>
            </div>
            <VerificationBadge status={verification.status} />
          </div>

          {verification.decision?.reason && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                Rejection Reason
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {verification.decision.reason}
              </p>
            </div>
          )}

          <Button onClick={onRetryVerification} variant="default" className="w-full">
            Retry Verification
          </Button>
        </div>
      );
    }

    if (verification.status === VerificationStatus.UNDER_REVIEW) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Under Review</h3>
                <p className="text-sm text-muted-foreground">
                  Your verification is being reviewed
                </p>
              </div>
            </div>
            <VerificationBadge status={verification.status} />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              We are reviewing your documents. This usually takes 1-2 business days.
              You will be notified once the review is complete.
            </p>
          </div>

          {verification.submittedAt && (
            <div className="text-sm text-muted-foreground">
              Submitted on {format(new Date(verification.submittedAt), 'PPP')}
            </div>
          )}
        </div>
      );
    }

    // PENDING status
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Verification In Progress</h3>
              <p className="text-sm text-muted-foreground">
                Complete the required steps
              </p>
            </div>
          </div>
          <VerificationBadge status={verification.status} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {verification.currentStep} / {verification.totalSteps} steps
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(verification.currentStep / verification.totalSteps) * 100}%`,
              }}
            />
          </div>
        </div>

        <Link href="/settings/verification/documents">
          <Button className="w-full">Continue Verification</Button>
        </Link>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          KYC Verification Status
        </CardTitle>
        <CardDescription>
          Verify your identity to access all platform features
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
