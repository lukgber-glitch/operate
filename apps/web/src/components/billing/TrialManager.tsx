'use client';

import { useState, useEffect } from 'react';
import { useTrialStatus } from '@/hooks/use-trial-status';
import { TrialBanner } from './TrialBanner';
import { TrialEndModal } from './TrialEndModal';
import { TrialWelcome } from './TrialWelcome';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * Central manager for trial-related UI components
 * Handles showing/hiding banners, modals, and welcome screens
 * Uses localStorage to track what user has seen
 */
export function TrialManager() {
  const trialStatus = useTrialStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  useEffect(() => {
    // Check localStorage for what user has seen
    const hasSeenWelcome = localStorage.getItem('hasSeenTrialWelcome') === 'true';
    const hasSeenEndModal = localStorage.getItem('hasSeenTrialEnd') === 'true';
    const bannerDismissed = localStorage.getItem('trialBannerDismissed') === 'true';

    // Show welcome on first trial login
    if (trialStatus.isOnTrial && !hasSeenWelcome) {
      setShowWelcome(true);
      return; // Don't show banner while welcome is showing
    }

    // Show trial end modal on first visit after expiration
    if (trialStatus.isExpired && !hasSeenEndModal && trialStatus.tier === 'FREE') {
      setShowEndModal(true);
      localStorage.setItem('hasSeenTrialEnd', 'true');
      return;
    }

    // Show banner if on trial and not dismissed
    if (trialStatus.isOnTrial && !bannerDismissed && trialStatus.daysRemaining !== null) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [trialStatus]);

  const handleWelcomeComplete = () => {
    localStorage.setItem('hasSeenTrialWelcome', 'true');
    setShowWelcome(false);
  };

  const handleBannerDismiss = () => {
    localStorage.setItem('trialBannerDismissed', 'true');
    setShowBanner(false);
  };

  const handleUpgrade = () => {
    // This will be handled by navigation in the modals/banners
    console.log('Upgrade initiated');
  };

  return (
    <>
      {/* Trial Banner */}
      {showBanner && trialStatus.daysRemaining !== null && (
        <TrialBanner
          daysRemaining={trialStatus.daysRemaining}
          isUrgent={trialStatus.isUrgent}
          onDismiss={handleBannerDismiss}
        />
      )}

      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={(open) => !open && handleWelcomeComplete()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <TrialWelcome onGetStarted={handleWelcomeComplete} />
        </DialogContent>
      </Dialog>

      {/* Trial End Modal */}
      <TrialEndModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onUpgrade={handleUpgrade}
      />
    </>
  );
}
