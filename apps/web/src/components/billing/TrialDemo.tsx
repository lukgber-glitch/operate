'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrialBanner } from './TrialBanner';
import { TrialCountdown } from './TrialCountdown';
import { TrialEndModal } from './TrialEndModal';
import { TrialWelcome } from './TrialWelcome';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * Demo component to preview all trial components
 * REMOVE THIS FILE IN PRODUCTION - for development only
 *
 * Usage: Import in a test page to see all components
 */
export function TrialDemo() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(7);

  return (
    <div className="space-y-8 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Trial Components Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowWelcome(true)}>
              Show Welcome
            </Button>
            <Button onClick={() => setShowEndModal(true)}>
              Show End Modal
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setDaysRemaining(14)}>14 Days</Button>
            <Button onClick={() => setDaysRemaining(7)}>7 Days</Button>
            <Button onClick={() => setDaysRemaining(3)}>3 Days (Urgent)</Button>
            <Button onClick={() => setDaysRemaining(1)}>1 Day (Urgent)</Button>
          </div>
        </CardContent>
      </Card>

      {/* Banner Demo */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Trial Banner</h3>
        <TrialBanner
          daysRemaining={daysRemaining}
          isUrgent={daysRemaining <= 3}
          onDismiss={() => alert('Banner dismissed')}
        />
      </div>

      {/* Countdown Demo */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Trial Countdown</h3>
        <div className="flex gap-4">
          <TrialCountdown daysRemaining={7} />
          <TrialCountdown daysRemaining={2} isUrgent />
        </div>
      </div>

      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <TrialWelcome onGetStarted={() => setShowWelcome(false)} />
        </DialogContent>
      </Dialog>

      {/* End Modal */}
      <TrialEndModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onUpgrade={() => alert('Upgrade clicked')}
      />
    </div>
  );
}
