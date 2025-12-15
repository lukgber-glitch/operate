'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download, RefreshCw } from 'lucide-react';
import { PaymentList } from '@/components/payments/PaymentList';
import { WizardPanelContainer } from '@/components/panels/wizards/WizardPanelContainer';
import { useChatWizardPanel } from '@/hooks/useChatWizardPanel';
import { useToast } from '@/components/ui/use-toast';
import type { Payment } from '@/hooks/use-payments';

export default function PaymentsPage() {
  const { toast } = useToast();
  const {
    panelState,
    isOpen,
    openPanel,
    closePanel,
    onStepChange,
    onPanelComplete,
    getPanelTitle,
  } = useChatWizardPanel();

  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewPayment = () => {
    openPanel('payment', {
      title: 'New Payment',
      size: 'md',
    });
  };

  const handlePaymentComplete = (payment: Payment) => {
    toast({
      title: 'Payment initiated',
      description: `Payment of ${payment.amount} ${payment.currency} has been created.`,
    });
    onPanelComplete(payment);
    setRefreshKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Payments</h1>
            <p className="text-zinc-400">
              Manage and track your payments via TrueLayer Payment Initiation Service
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleNewPayment}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Payment
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-sm text-blue-400 font-medium mb-1">
                Secure Bank Payments with TrueLayer
              </p>
              <p className="text-sm text-blue-400/80">
                Make instant payments directly from your bank account. All payments are secured with
                Strong Customer Authentication (SCA) and processed through regulated banking infrastructure.
              </p>
            </div>
          </div>
        </Card>

        {/* Payments List */}
        <PaymentList key={refreshKey} />
      </div>

      {/* Payment Wizard Panel */}
      <WizardPanelContainer
        type={panelState.type}
        isOpen={isOpen}
        onClose={closePanel}
        onComplete={handlePaymentComplete}
        onStepChange={onStepChange}
        title={getPanelTitle()}
        size={panelState.size}
        initialData={panelState.initialData}
      />
    </div>
  );
}
