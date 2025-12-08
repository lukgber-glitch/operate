'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VerificationStatusCard } from '@/components/verification/VerificationStatusCard';
import { VerificationTimeline } from '@/components/verification/VerificationTimeline';
import { VerificationRequirements } from '@/components/verification/VerificationRequirements';
import { KycDecisionAlert } from '@/components/verification/KycDecisionAlert';
import { VerificationDetailsModal } from '@/components/verification/VerificationDetailsModal';
import { useVerification } from '@/hooks/use-verification';
import { useKycRequirements } from '@/hooks/use-kyc-requirements';
import { VerificationStatus } from '@/types/verification';
import { Card, CardContent } from '@/components/ui/card';
import { Info, RefreshCw } from 'lucide-react';

export default function VerificationPage() {
  const router = useRouter();
  const { verification, isLoading, refetch } = useVerification();
  const { requirements, isLoading: requirementsLoading } = useKycRequirements(
    verification?.level
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleStartVerification = () => {
    router.push('/settings/verification/start');
  };

  const handleRetryVerification = () => {
    router.push('/settings/verification/start');
  };

  const handleRenewVerification = () => {
    router.push('/settings/verification/start');
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KYC Verification</h1>
          <p className="text-muted-foreground">Manage your identity verification and compliance status</p>
        </div>
        <div className="flex gap-2">
          {verification && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsOpen(true)}
            >
              <Info className="w-4 h-4 mr-2" />
              Details
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Decision Alert */}
      {verification?.decision && (
        <KycDecisionAlert
          decision={verification.decision}
          onRetry={handleRetryVerification}
          onRenew={handleRenewVerification}
        />
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <VerificationStatusCard
            verification={verification}
            onStartVerification={handleStartVerification}
            onRetryVerification={handleRetryVerification}
          />

          {/* Requirements - only show if verification is in progress */}
          {verification &&
            verification.status !== VerificationStatus.NOT_STARTED &&
            verification.status !== VerificationStatus.VERIFIED && (
              <VerificationRequirements
                requirements={requirements}
                className="lg:hidden"
              />
            )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Requirements - desktop */}
          {verification &&
            verification.status !== VerificationStatus.NOT_STARTED &&
            verification.status !== VerificationStatus.VERIFIED && (
              <VerificationRequirements
                requirements={requirements}
                className="hidden lg:block"
              />
            )}

          {/* Timeline */}
          {verification && verification.history && verification.history.length > 0 && (
            <VerificationTimeline history={verification.history} />
          )}
        </div>
      </div>

      {/* Details Modal */}
      <VerificationDetailsModal
        verification={verification}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
