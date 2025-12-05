'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SubscriptionDetailCard } from '@/components/admin/subscriptions/SubscriptionDetailCard';
import {
  useSubscriptionDetail,
  useCancelSubscription,
  useUpdateSubscriptionTier,
  useExtendTrial,
} from '@/hooks/use-subscription-analytics';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subscriptionId = params.id as string;

  const { data: subscription, isLoading, error } = useSubscriptionDetail(subscriptionId);
  const cancelMutation = useCancelSubscription();
  const updateTierMutation = useUpdateSubscriptionTier();
  const extendTrialMutation = useExtendTrial();

  const handleCancel = async (immediate: boolean) => {
    try {
      await cancelMutation.mutateAsync({
        subscriptionId,
        immediate,
        reason: 'Admin action',
      });
      router.push('/admin/subscriptions');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const handleUpdateTier = async (newTier: string) => {
    try {
      await updateTierMutation.mutateAsync({
        subscriptionId,
        newTier,
      });
    } catch (error) {
      console.error('Failed to update tier:', error);
    }
  };

  const handleExtendTrial = async (days: number) => {
    try {
      await extendTrialMutation.mutateAsync({
        subscriptionId,
        days,
      });
    } catch (error) {
      console.error('Failed to extend trial:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/subscriptions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Subscriptions
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load subscription details'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/subscriptions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Subscriptions
            </Link>
          </Button>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Subscription not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/subscriptions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subscriptions
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Details</h1>
        <p className="text-muted-foreground">
          Manage subscription for {subscription.customerName}
        </p>
      </div>

      {/* Subscription Detail Card */}
      <SubscriptionDetailCard
        subscription={subscription}
        onCancel={handleCancel}
        onUpdateTier={handleUpdateTier}
        onExtendTrial={handleExtendTrial}
      />
    </div>
  );
}
