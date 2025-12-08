'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

export interface TrialStatus {
  isOnTrial: boolean;
  daysRemaining: number | null;
  trialEndDate: Date | null;
  isExpired: boolean;
  isUrgent: boolean; // <= 3 days remaining
  tier: string | null;
}

/**
 * Hook to get trial status for the current organization
 * Returns trial information including days remaining and urgency state
 */
export function useTrialStatus(): TrialStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    isOnTrial: false,
    daysRemaining: null,
    trialEndDate: null,
    isExpired: false,
    isUrgent: false,
    tier: null,
  });

  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!user?.orgId) {
        setStatus({
          isOnTrial: false,
          daysRemaining: null,
          trialEndDate: null,
          isExpired: false,
          isUrgent: false,
          tier: null,
        });
        return;
      }

      try {
        // Fetch subscription data from API
        const response = await fetch(`/api/subscription/${user.orgId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }

        const subscription = await response.json();

        // Check if on trial
        const isOnTrial = subscription.status === 'TRIALING' && subscription.trialEnd;
        const trialEndDate = subscription.trialEnd ? new Date(subscription.trialEnd) : null;

        let daysRemaining = null;
        let isExpired = false;
        let isUrgent = false;

        if (trialEndDate) {
          const now = new Date();
          const diffTime = trialEndDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          daysRemaining = diffDays;
          isExpired = diffDays <= 0;
          isUrgent = diffDays > 0 && diffDays <= 3;
        }

        setStatus({
          isOnTrial,
          daysRemaining,
          trialEndDate,
          isExpired,
          isUrgent,
          tier: subscription.tier || null,
        });
      } catch (error) {        // On error, assume no trial
        setStatus({
          isOnTrial: false,
          daysRemaining: null,
          trialEndDate: null,
          isExpired: false,
          isUrgent: false,
          tier: null,
        });
      }
    };

    fetchTrialStatus();
    // Poll every 5 minutes to keep status fresh
    const interval = setInterval(fetchTrialStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.orgId]);

  return status;
}
