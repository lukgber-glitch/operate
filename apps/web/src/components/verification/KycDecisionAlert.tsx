'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { KycDecision } from '@/types/verification';
import { VerificationStatus } from '@/types/verification';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface KycDecisionAlertProps {
  decision: KycDecision;
  onRetry?: () => void;
  onRenew?: () => void;
}

export function KycDecisionAlert({ decision, onRetry, onRenew }: KycDecisionAlertProps) {
  if (decision.status === VerificationStatus.VERIFIED) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Verification Approved
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          <div className="space-y-2">
            <p>
              Your identity has been successfully verified. You now have access to all
              platform features.
            </p>
            <div className="flex gap-4 text-sm">
              <span>
                <strong>Verified:</strong>{' '}
                {format(new Date(decision.decidedAt), 'PPP')}
              </span>
              {decision.expiresAt && (
                <span>
                  <strong>Expires:</strong>{' '}
                  {format(new Date(decision.expiresAt), 'PPP')}
                </span>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (decision.status === VerificationStatus.REJECTED) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle className="text-red-900 dark:text-red-100">
          Verification Rejected
        </AlertTitle>
        <AlertDescription className="text-red-800 dark:text-red-200">
          <div className="space-y-3">
            <p>
              Your verification was rejected. Please review the reason below and
              resubmit with the correct information.
            </p>
            {decision.reason && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-md">
                <p className="font-semibold mb-1">Rejection Reason:</p>
                <p>{decision.reason}</p>
              </div>
            )}
            {decision.notes && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-md">
                <p className="font-semibold mb-1">Additional Notes:</p>
                <p>{decision.notes}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {onRetry && (
                <Button onClick={onRetry} variant="default" size="sm">
                  Retry Verification
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (decision.status === VerificationStatus.UNDER_REVIEW) {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">
          Under Review
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="space-y-2">
            <p>
              Your verification is currently being reviewed by our team. This typically
              takes 1-2 business days.
            </p>
            <p className="text-sm">
              <strong>Submitted:</strong>{' '}
              {format(new Date(decision.decidedAt), 'PPP')}
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (decision.status === VerificationStatus.EXPIRED) {
    return (
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertTitle className="text-orange-900 dark:text-orange-100">
          Verification Expired
        </AlertTitle>
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <div className="space-y-3">
            <p>
              Your verification has expired and needs to be renewed to maintain access
              to all features.
            </p>
            {decision.expiresAt && (
              <p className="text-sm">
                <strong>Expired on:</strong>{' '}
                {format(new Date(decision.expiresAt), 'PPP')}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              {onRenew && (
                <Button onClick={onRenew} variant="default" size="sm">
                  Renew Verification
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
